function table2d(_this) {
    let longest = Math.max(..._this.map(x => x[0].length));
    return _this
        .map(row => `${row[0]} ${"-".repeat(longest - row[0].length)}- ${row[1]}`)
        .join("\n");
}
export default async function fetch_seeds(url, tok) {
    // https://www.start.gg/tournament/rhit-reverse-mains-tournament/event/ssbu-singles/brackets/1845867/2721899
    if (
        !/https:\/\/www.start.gg\/tournament\/[a-z\d\-]+\/events?\/[a-z\d\-]+\/brackets\/\d+(\/\d+)?\/?$/.test(
            url
        )
    )
        return { error: "invalid url; it should end with brackets/xxxxxxx/xxxxxxx" };
    const query =
        "query PhaseSeeds($phaseId: ID!, $page: Int!, $perPage: Int!) {\nphase(id: $phaseId) {\nid\nseeds(query: { page: $page, perPage: $perPage }) {\npageInfo {\ntotal\ntotalPages\n}\nnodes {\nid\nseedNum\nplayers {id\nprefix}\nentrant {\nid\nparticipants {\nid\ngamerTag\n}\n}\n}\n}\n}\n}";
    let phase = url.split("/")[8];
    let resp = await (
        await fetch("https://api.start.gg/gql/alpha", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + tok,
            },
            body: JSON.stringify({
                query: query,
                variables: { phaseId: phase, page: "0", perPage: "100" },
            }),
        })
    ).json();
    if (!resp.data.phase.seeds) return { error: "request returned no data" };
    // this next line is EVIL
    let ret = resp.data.phase.seeds.nodes.map(x => ({
        seed: x.seedNum,
        id: x.players[0].id,
        prefix: x.players[0].prefix,
        user: x.entrant.participants[0].gamerTag,
    }));
    console.log(table2d(ret.map(x => [x.user, x.id])));
    return ret;
}
if (process.argv[1] === import.meta.filename) {
    console.log(
        await fetch_seeds(
            "https://www.start.gg/tournament/smash-rose-29/event/ssbu-singles/brackets/2063700/3018931",
            JSON.parse((await import("fs")).readFileSync("auth.json").toString()).token
        )
    );
}
