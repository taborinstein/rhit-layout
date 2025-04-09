function add_player_input(i) {
    // just a function so we can call 2x
    let div = document.createElement("div");
    ReactDOM.render(
        <div className="player_row">
            <div className="header">Player {i + 1}:</div>
            <div className="player_input">
                <div>
                    <div className="top">
                        <div className="data_name">
                            <input placeholder="Prefix" data-value="prefix" />
                            <input placeholder="Username" data-value="name" />
                        </div>
                        <div className="blocks">
                            <input placeholder="Natl." data-value="flag" />
                            <input placeholder="Pronouns" data-value="pronoun" />
                            <input placeholder="Year" data-value="year" />
                            <input placeholder="Seed" data-value="seed" />
                        </div>
                    </div>
                    <input className="score" min={0} placeholder={0} type="number" data-value="score"/>
                </div>
                <div>
                    <div className="chara_sel">
                        <select onChange={_key => select_onch(_key.target.value)}>
                            {Object.keys(CHARA_DATA).map((k,j) => (
                                <option value={CHARA_DATA[k]} key={j}>{k}</option>
                            ))}
                        </select>
                        <div className="skins">
                            <input
                                onChange={_val => select_icon(i, _val.target.value)}
                                onClick={_val => select_icon(i, _val.target.value)} // i am the most amazing programmer of all time
                                className="icon_num"
                                type="number"
                                placeholder={0}
                                min={0}
                                max={7}
                            />
                            <div className="icons"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        div
    );
    function select_onch(key) {
        let container = document.querySelectorAll(".icons")[i];
        container.innerHTML = "";
        let skin_inp = document.querySelectorAll(".icon_num")[i];
        let num = key.includes("miifighter") ? 2 : key.includes("mii") || key == "random" ? 1 : 8;
        if (skin_inp.value > num - 1) skin_inp.value = num - 1;
        for (let idx = 0; idx < num; idx++) {
            let img = new Image();
            img.src = `/icons/chara_2_${key}_0${idx}.png`;
            img.addEventListener("click", function () {
                select_icon(i, +idx);
            });
            container.appendChild(img);
        }
        select_icon(i, skin_inp.value);
    }
    document.querySelector(".players").appendChild(div);
    select_onch("buddy");
    let imgs = [...document.querySelectorAll(".icons")[i].children];
    for (let idx in imgs)
        imgs[idx].addEventListener("click", function () {
            select_icon(i, +idx);
        });
    select_icon(i, 0);
}
add_player_input(0);
add_player_input(1);

function select_icon(player_i, icon_i) {
    let imgs = [...document.querySelectorAll(".icons")[player_i].children];
    let input = document.querySelectorAll(".icon_num")[player_i];
    if (icon_i == "") input.value = icon_i = 0;
    for (let img of imgs) img.classList.remove("selected");
    imgs[icon_i].classList.add("selected");
    input.value = icon_i;
}
