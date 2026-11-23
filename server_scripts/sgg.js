function table2d(_this) {
    let longest = Math.max(..._this.map(x => x[0].length));
    return _this
        .map(row => `${row[0]} ${"-".repeat(longest - row[0].length)}- ${row[1]}`)
        .join("\n");
}
export default async function fetch_seeds(slug, tok) {
    // https://www.start.gg/tournament/rhit-reverse-mains-tournament/event/ssbu-singles/brackets/1845867/2721899
    // if (
    //     !/https:\/\/www.start.gg\/tournament\/[a-z\d\-]+\/events?\/[a-z\d\-]+\/brackets\/\d+(\/\d+)?\/?$/.test(
    //         url
    //     )
    // )
    //     return { error: "invalid slug; it should be in the bracket url (e.g. start.gg/tournament/<<SLUG>>)" };
    const query =
    `query Standings($slug: String) {
        tournament(slug: $slug) {
            startAt
            name
            numAttendees
            events {
                id
                entrants (query: {
                    page: 1
                    perPage: 100
                }) {
                    nodes {
                        id
                        seeds {
                            groupSeedNum
                        }
                        participants {
                            prefix
                            gamerTag
                            player {
                                id
                            }
                        }
                    
                    }
                }
            }
        }
    }`
        // "query PhaseSeeds($phaseId: ID!, $page: Int!, $perPage: Int!) {\nphase(id: $phaseId) {\nid\nseeds(query: { page: $page, perPage: $perPage }) {\npageInfo {\ntotal\ntotalPages\n}\nnodes {\nid\nseedNum\nplayers {id\nprefix}\nentrant {\nid\nparticipants {\nid\ngamerTag\n}\n}\n}\n}\n}\n}";
    // let phase = url.split("/")[8];
    let resp = await (
        await fetch("https://api.start.gg/gql/alpha", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + tok,
            },
            body: JSON.stringify({
                query: query,
                variables: {slug: slug } //, { phaseId: phase, page: "0", perPage: "100" },
            }),
        })
    ).json();
    // console.log(resp.data.tournament.events[0].entrants.nodes.map(x=>({...x.participants[0], ...x.seeds})))
    if (!resp.data) return { error: "request returned no data" };
    // this next line is EVIL
    let ret = resp.data.tournament.events[0].entrants.nodes.map(x => ({
        seed: x.seeds[0].groupSeedNum,
        id: x.participants[0].player.id,
        prefix: x.participants[0].prefix,
        user: x.participants[0].gamerTag,
    })).sort((a, b) => a.seed - b.seed);
    console.log(table2d(ret.map(x => [x.user, x.id])));
    return ret;
}
if (process.argv[1] === import.meta.filename) {
    console.log(
        await fetch_seeds(
            "smash-rose-29",
            JSON.parse((await import("fs")).readFileSync("auth.json").toString()).token
        )
    );
}
