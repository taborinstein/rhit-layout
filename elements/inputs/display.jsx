// console.log("hi")
const input_svg = {
    gamecube: (
        // <svg width="800" height="320" viewBox="30 20 400 160">
        <svg width="400" height="160" viewBox="30 20 400 160">
            <g transform="translate(0 10)">
                <polygon points="100.000,150.000 135.355,135.355 150.000,100.000 135.355,64.645 100.000,50.000 64.645,64.645 50.000,100.000 64.645,135.355" />
                <ellipse cx="100" cy="100" rx="28" data-stick="l" />
                <rect x="60" y="22" width="80" height="14" rx="8" data-button="l" />
            </g>
            <g transform="translate(-10 10)">
                <polygon points="230.000,140.000 258.284,128.284 270.000,100.000 258.284,71.716 230.000,60.000 201.716,71.716 190.000,100.000 201.716,128.284" />
                <rect x="190" y="22" width="80" height="16" rx="8" data-button="r" />
                <ellipse cx="230" cy="100" rx="20" data-stick="r" />
            </g>
            <g transform="translate(-30)">
                <ellipse cx="360" cy="100" rx="30" data-button="a" />
                <ellipse cx="320" cy="145" rx="16" data-button="b" />
                <path
                    opacity="1.000000"
                    className="stroke-5"
                    transform="translate(360 35) scale(0.8)"
                    d="M60.464218,95.780533 C55.062977,91.793633 53.045448,86.558693 53.033195,80.41389 C53.018360,72.971901 51.649094,65.904045 47.548405,59.538792 C44.670418,55.071472 44.097191,50.145332 45.596169,45.205902 C48.826958,34.559814 63.519680,32.075062 72.180443,40.808949 C79.901527,48.595215 83.076332,58.622482 83.741203,69.192406 C84.128235,75.345230 83.640755,81.921989 81.809753,87.763542 C78.644516,97.861740 70.431694,100.618996 60.464218,95.780533 z"
                    data-button="x"
                />
                <path
                    opacity="1.000000"
                    className="stroke-5"
                    transform="translate(295 -2) scale(0.8)"
                    d="M71.967735,46.986744 C76.046448,47.422363 79.780357,47.394730 83.221642,48.384518  C91.923637,50.887413 95.878319,56.743538 94.966782,64.883324  C94.227959,71.480797 87.782898,77.604729 79.980995,77.769333  C70.622650,77.966766 62.105598,79.995522 53.926895,84.682907  C47.665676,88.271362 39.085197,85.899605 35.074436,80.492355  C31.294487,75.396278 32.073421,64.988266 37.052116,59.671932  C44.973209,51.213646 55.457268,48.389141 66.504265,47.086536  C68.147148,46.892811 69.826965,47.012211 71.967735,46.986744 M70.698860,53.077805 z"
                    data-button="y"
                />
                <rect
                    transform="translate(395 22) rotate(30 0 0)"
                    x="0"
                    y="0"
                    width="40"
                    height="16"
                    rx="8"
                    data-button="zr"
                />
            </g>
        </svg>
    ),
    procon: (
        // <svg width="800" height="320" viewBox="30 20 400 160">
        <svg width="400" height="160" viewBox="30 20 400 160">
            <g transform="translate(0 10)">
                <ellipse cx="100" cy="100" rx="50" />
                <ellipse cx="100" cy="100" rx="28" data-stick="l" />
                <rect x="60" y="22" width="80" height="16" rx="8" data-button="l" />
                <rect x="150" y="22" width="40" height="16" rx="8" data-button="zl" />
            </g>
            <g transform="translate(-10 10)">
                <ellipse cx="230" cy="100" rx="40" />
                <ellipse cx="230" cy="100" rx="20" data-stick="r" />
                <rect x="305" y="22" width="80" height="16" rx="8" data-button="r" />
                <rect x="255" y="22" width="40" height="16" rx="8" data-button="zr" />
            </g>
            <g transform="translate(10 0)">
                <ellipse cx="320" cy="80" rx="16" data-button="x" />
                <ellipse cx="290" cy="110" rx="16" data-button="y" />
                <ellipse cx="350" cy="110" rx="16" data-button="a" />
                <ellipse cx="320" cy="140" rx="16" data-button="b" />
            </g>
        </svg>
    ),
};
export default function Display(props) {
    let [is_gc, setGC] = React.useState(true);
    if(props.update_array.findIndex(x => x.player == props.player) < 0) 
        props.update_array.push({
        player: props.player,
        func: _data => {
    
            let data = _data.inputs[props.player];
            let map = _data.maps[props.player];
            for(let button of ["a", "b", "x", "y", "zl", "zr", "l", "r"]) {
                let db = document.querySelectorAll(`[data-button=${button}]`)[props.player];
                if(!db) {
                    continue
                }
                db.removeAttribute("class");
                // console.log()
                if(map[button]) db.classList.add("input_kind_" + map[button]);
                // console.log(data.rs.y)
                if(data.buttons.includes(db.dataset.button)) db.classList.add("filled");
                // else db.classList.remove("filled");
            }
            document.querySelectorAll('[data-stick=l]')[props.player].setAttribute("transform", `translate(${data.ls.x / 4}, ${data.ls.y / -4})`)
            document.querySelectorAll('[data-stick=r]')[props.player].setAttribute("transform", `translate(${data.rs.x / 4}, ${data.rs.y / -4})`)
            setGC(data.gc);
        },
    });

    return <>{is_gc ? input_svg.gamecube : input_svg.procon}</>;
}
