// this file is a mess, oops
let player_data = [];

window.onload = () => {
    socket.init(socket_handler);
    setTimeout(_ => {
        for (let k in CHARA_DATA)
            for (let i = 0; i < 8; i++)
                if (i < 1 || !k.includes("Mii") || (i < 2 && k.includes("Brawler")))
                    new Image().src = `/icons/chara_2_${CHARA_DATA[k]}_0${i}.png`;
    }, 1000); // preload images after 1s
    let filter = document.querySelector(".player_selector > input");
    filter.value = "";
    filter.addEventListener("input", function () {
        filter_list(this.value);
    });
    document.querySelectorAll(".score").forEach(s => (s.value = 0));
    let load_int = setInterval(() => {
        if (socket.sock.readyState != 1) return;
        socket.transmit("fetch_players");
        socket.transmit("fetch_current");
        clearInterval(load_int);
    });
};

function load_player_data() {
    let data_el = document.querySelector(".player_data");
    player_data.sort(sort_func).forEach(p => {
        let div = document.createElement("div");
        div.className = "entry";
        if (p.guest) div.classList.add("guest");
        // this is lazy and bad
        div.setAttribute("data-data", JSON.stringify(p));
        div.innerHTML =
            `<img class="icon" src="./icons/chara_2_${p.icon}.png">` +
            (p.prefix ? `<div class="prefix">${p.prefix}</div>` : "") +
            `<div class="name">${p.name}</div>` +
            (p.seed ? `<div class="seed">${p.seed}</div>` : "");

        div.addEventListener("click", function () {
            if (!this.classList.contains("selected")) {
                [...data_el.children].forEach(x => x.classList.remove("selected"));
                this.classList.add("selected");
            } else this.classList.remove("selected");
        });
        data_el.appendChild(div);
    });
}

function filter_list(input) {
    document.querySelectorAll(".entry").forEach(e => {
        if (e.querySelector(".name").innerText.toLowerCase().includes(input.toLowerCase()))
            e.classList.remove("null");
        else e.classList.add("null");
    });
}
function load_selected(n) {
    load_from_data(JSON.parse(document.querySelector(".entry.selected").dataset.data), n);
}
function load_from_data(data, n) {
    document.querySelectorAll("[data-value=seed]")[n].value = ""; // clear seed first
    for (let key in data) {
        let e = document.querySelectorAll(`[data-value=${key}`)[n];
        if (e) e.value = data[key];
    }
    let parts = data.icon.split("_");
    document.querySelectorAll("select")[n].value = parts[0];
    document.querySelectorAll(".icon_num")[n].value = +parts[1];
    unstuck_icons();
}

function load_seeds(data) {
    for (let seed of data) {
        let found = player_data.find(x => x.name.toLowerCase() == seed.user.toLowerCase());
        if (found) found.seed = seed.seed;
        else
            player_data.push({
                guest: true,
                seed: seed.seed,
                name: seed.user,
                icon: "random_00",
            });
    }
    document.querySelector(".player_data").innerHTML = "";
    load_player_data();
}

function fetch_seeds() {
    socket.transmit("fetch_seeds", {
        url: document.querySelector(".load_sgg > input").value,
    });
}

function get_player_json(n) {
    let obj = {};
    let datasets = [
        ...document.querySelectorAll(".player_row")[n].querySelectorAll("[data-value]"),
    ];
    for (let set of datasets) //console.log(set.dataset.value)
        obj[set.dataset.value] = set.value || null;
    return obj;
}
function send_to_server(n) {
    let payload = {};
    if (n == 0 || n == -1) {
        payload.p1 = get_player_json(0);
        payload.p2 = get_player_json(1);
        // n -> Seed n
        if (payload.p1.seed) payload.p1.seed = "Seed " + payload.p1.seed;
        if (payload.p2.seed) payload.p2.seed = "Seed " + payload.p2.seed;
        payload.p1.icon = `${document.querySelectorAll("select")[0].value}_0${
            document.querySelectorAll(".icon_num")[0].value
        }`;
        payload.p2.icon = `${document.querySelectorAll("select")[1].value}_0${
            document.querySelectorAll(".icon_num")[1].value
        }`;
    }
    if (n == 1 || n == -1)
        payload.layout = {
            game_bar: document.querySelector("[data-value=game_bar]").value,
            colors: [
                document.querySelector(".color_sel_l").value,
                document.querySelector(".color_sel_r").value,
            ],
        };

    socket.transmit("update", payload);
}

function swap_users() {
    for (let i in document.querySelector(".player_row").querySelectorAll("input")) {
        let lhs = document.querySelectorAll(".player_row")[0].querySelectorAll("input")[i];
        let rhs = document.querySelectorAll(".player_row")[1].querySelectorAll("input")[i];
        [lhs.value, rhs.value] = [rhs.value, lhs.value];
    }
    let lhs = document.querySelectorAll("select")[0];
    let rhs = document.querySelectorAll("select")[1];
    [lhs.value, rhs.value] = [rhs.value, lhs.value];
    unstuck_icons();
}

function submit_comms() {
    // setup comms_msg array to hold comm objects
    const comms_msg = [];

    // loop through the comm inputs, adding each as an object to comms_msg array
    const all_comms = document.querySelectorAll(".comms_block");

    for (const comm of all_comms) {
        // parse out the prefix and tag
        const prefix = comm.querySelector(".comms_prefix").value.trim();
        const tag = comm.querySelector(".comms_tag").value.trim();

        // skip if no tag is provided so it doesn't render a blank comm
        if (tag === "") {
            continue;
        }

        // add the comms object
        comms_msg.push({prefix, tag});
    }

    // send the comms_msg
    socket.transmit("update_comms", {
        comms: comms_msg,
    });
}

function socket_handler(type, message) {
    switch (type) {
        case "fetch_seeds":
            if(message.error) {
                alert("Error when fetching seeds: " + message.error);
                break;
            }
            load_seeds(message);
            break;
        case "fetch_players":
            player_data = message;
            load_player_data();
            break;
        case "fetch_current_resp":
            if (message.p1) {
                // layout message
                load_from_data(message.p1, 0);
                load_from_data(message.p2, 1);
                document.querySelector("[data-value=game_bar]").value = message.layout.game_bar;
                [
                    document.querySelector(".color_sel_l").value,
                    document.querySelector(".color_sel_r").value,
                ] = message.layout.colors;
            }
            if (message.comms) {
                const comms = message.comms;

                // get all comm blocks into an array
                const comms_blocks = document.querySelectorAll(".comms_block");

                // for loop so we can use index to access both comms and comms_blocks at once
                for (let i = 0; i < comms.length; i++) {
                    // fill in prefix
                    comms_blocks[i].querySelector(".comms_prefix").value = comms[i].prefix;

                    // fill in tag
                    comms_blocks[i].querySelector(".comms_tag").value = comms[i].tag;
                }

            }
            break;
    }
}

function unstuck_icons() {
    // stupid and hacky
    document.querySelectorAll("select")[0].dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelectorAll("select")[1].dispatchEvent(new Event("change", { bubbles: true }));
    // stupider and hackier
    document.querySelectorAll(".icon_num")[0].click();
    document.querySelectorAll(".icon_num")[1].click();
}
// user sorting
let sort_func = (a, b) => {
    if (a.seed && !b.seed) return -1;
    if (!a.seed && b.seed) return 1;
    if (a.seed && b.seed) return a.seed - b.seed;
    if (!a.seed && !b.seed) return a.name.localeCompare(b.name);
    return 0; // ???
};
