import Bun from "bun";

let stick_state_default = {
    ls: {
        x: 0,
        y: 0,
    },
    rs: {
        x: 0,
        y: 0,
    },
    gcr: 0,
    gcl: 0,
    buttons: [],
    gc: false,
};
const InputKind ={
    0x0: "attack",
    0x1: "special",
    0x2: "jump",
    0x3: "guard",
    0x4: "grab",
    0x5: "smash_attack",
    0xA: null, // "AppealHi",
    0xB: null, // "AppealS",
    0xC: null, // "AppealLw",
    0xD: null, // "Unset",
}

let map_default = {
    x: null,
    a: null,
    b: null,
    y: null,
    l: null,
    r: null,
    zl: null,
    zr: null
}
let stick_states = new Array(8).fill().map(()=>({...stick_state_default}));
let maps = new Array(8).fill().map(()=>({...map_default}));
export function start_tcp_listener(socket_handler) {
    Bun.connect({
        hostname: "127.0.0.1",
        port: 7878,

        socket: {
            data(socket, data) {
                console.log(data);
                let n = data[0];
                if (data[0] > 7) {
                    if (data != "\n") console.log(data.toString().trim().replace("el()", "e\nl()"));
                    return;
                }
                let lx = data[1];
                if (lx > 127) lx -= 256;
                let ly = data[2];
                if (ly > 127) ly -= 256;
                let rx = data[3];
                if (rx > 127) rx -= 256;
                let ry = data[4];
                if (ry > 127) ry -= 256;

                stick_states[n].ls = { x: lx, y: ly };
                stick_states[n].rs = { x: rx, y: ry };
                stick_states[n].gcl = data[5];
                stick_states[n].gcr = data[6];
                stick_states[n].buttons = ["a", "b", "x", "y", "zl", "zr", "l", "r"].filter(
                    (_, i) => ((data[7] + data[8] * 256) >> [5, 6, 4, 7, 10, 11, 8, 9][i]) & 1
                );

                // console.log(data);
                stick_states[n].gc = data[11] == 1;

                // 02 00 01 02 02 04 03 03 0a
                // 02 00 01 02 00 04 03 03

                maps[n] = {
                    x: InputKind[data[12]],
                    a: InputKind[data[13]],
                    b: InputKind[data[14]],
                    y: InputKind[data[15]],
                    l: InputKind[data[16]],
                    r: InputKind[data[17]],
                    zl: InputKind[data[18]],
                    zr: InputKind[data[19]],
                };
                if(n == 1) console.log(maps[1], data[17])
                // console.log(maps[n], n)
                socket_handler.send_all({
                    type: "inputs",
                    data: {
                        inputs: stick_states,
                        maps: maps,
                    },
                });
            },
        },
    });
}
