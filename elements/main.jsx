import Side from "./side.jsx";
import SAR from "./sar.jsx";
import Center from "./center.jsx";

window.onload = () => {
    ReactDOM.render(
        <>
            <div className="floating">
                <SAR num={29} />
                <div className="link">
                    <img src="icons/internal/twitch.svg" />
                    /rhitssb
                </div>
            </div>
            <div className="exterior">
                <Center />
                <div className="main">
                    <Side reversed />
                    <Side />
                </div>
            </div>
        </>,
        document.querySelector("#root")
    );
    update_player(0, {
        name: "quandale",
        pronoun: "she/her",
        prefix: "ROSE",
        icon: "edge_07",
        flag: "us-in",
        year: "Y1",
        social: null,
    });
    update_player(1, {
        name: "ashush",
        pronoun: "he/him",
        prefix: null,
        icon: "zelda_02",
        flag: "us-nc",
        year: "Y2",
        social: null,
    });
    set_colors(["#550000", "#000044"]);
    socket.init(socket_handler);
};

function set_colors(data) {
    document.documentElement.style.setProperty("--color-l", data[0] + "ee");
    document.documentElement.style.setProperty("--color-r", data[1] + "ee");
}
function update_player(n, data) {
    let side = document.querySelectorAll(".side")[n];
    side.setAttribute("data-store", JSON.stringify(data));
    for (let key in data) {
        let element = side.querySelector(`div[data-identifier=${key}]`);
        if (!data[key] || data[key] == "") element.classList.add("null");
        else element.classList.remove("null");
        switch (key) {
            case "icon":
                element.children[0].src = `icons/chara_2_${data[key]}.png`;
                break;
            case "flag":
                element.children[0].children[0].src = `https://flags.komali.dev/svg/${data[key]}.svg`;
                break;
            default:
                element.innerText = data[key];
        }
    }
}

function socket_handler(type, message) {
    switch (type) {
        case "update":
            if (message.p1) {
                update_player(0, message.p1);
                update_player(1, message.p2);
            }
            if (message.layout) {
                document.querySelector("[data-identifier=game_bar]").innerText =
                    message.layout.game_bar;
                set_colors(message.layout.colors);
                if(message.layout.num) document.querySelector(".sar .num").innerText = message.layout.num;
            }
            break;
        case "fetch_current":
            socket.transmit("fetch_current_resp", {
                p1: JSON.parse(document.querySelectorAll(".side")[0].dataset.store),
                p2: JSON.parse(document.querySelectorAll(".side")[1].dataset.store),
                layout: {
                    num: +document.querySelector(".sar .num").innerText,
                    game_bar: document.querySelector("[data-identifier=game_bar]").innerText,
                    colors: [
                        document.documentElement.style
                            .getPropertyValue("--color-l")
                            .substring(0, 7),
                        document.documentElement.style
                            .getPropertyValue("--color-r")
                            .substring(0, 7),
                    ],
                },
            });
    }
}
