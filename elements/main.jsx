import Side from "./side.jsx";
import SAR from "./sar.jsx";
import Center from "./center.jsx";
window.onload = () => {
    ReactDOM.render(
        <>
        <div className="floating">
            <SAR num={13}/>
            <div className="link">
                <img src="icons/internal/twitch.svg" />/rhitssb
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
        pronoun: "he/him",
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
    socket.init(socket_handler);
};
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
    switch(type) {
        case "update":
            console.log(message)
            update_player(0, message.p1);
            update_player(1, message.p2);
            document.querySelector("[data-identifier=game_bar]").innerText = message.layout.game_bar;
            break;
        case "fetch_current":
            socket.transmit("fetch_current_resp", {
                p1: JSON.parse(document.querySelectorAll(".side")[0].dataset.store),
                p2: JSON.parse(document.querySelectorAll(".side")[1].dataset.store),
                layout: {
                    game_bar: document.querySelector("[data-identifier=game_bar]").innerText
                }
            })

    }
}