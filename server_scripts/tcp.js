import net from "node:net";
import { EventEmitter } from "node:events";
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
const InputKind = {
    0x0: "attack",
    0x1: "special",
    0x2: "jump",
    0x3: "guard",
    0x4: "grab",
    0x5: "smash_attack",
    0xa: null, // "AppealHi",
    0xb: null, // "AppealS",
    0xc: null, // "AppealLw",
    0xd: null, // "Unset",
};

let map_default = {
    x: null,
    a: null,
    b: null,
    y: null,
    l: null,
    r: null,
    zl: null,
    zr: null,
    cstick: null,
    tapjump: false,
};

class InputSocket extends EventEmitter {
    stick_states = new Array(8).fill().map(() => ({ ...stick_state_default }));
    maps = new Array(8).fill().map(() => ({ ...map_default }));
    constructor() {
        super();
        this.client = new net.Socket();
    }
    close() {
        // this.client.
    }
    open(ip = "0.0.0.0") {
        this.client.connect(5580, ip, () => {
            console.log("open", this.client.readyState, this.client.write(":3"));
        });
        this.client.on("data", data => {
            console.log(data);
            let n = data[0];
            if (data[0] > 7) {
                if (data != "\n") console.log(data.toString().trim().replace("el()", "e\nl()"));
                return;
            }
            let lx = data[1] - 128;
            // if (lx > 0x80) lx -= 256;
            let ly = data[2] - 128;
            // if (ly > 127) ly -= 256;
            let rx = data[3] - 128;
            let ry = data[4] - 128;
            this.stick_states[n].ls = { x: lx, y: ly };
            this.stick_states[n].rs = { x: rx, y: ry };
            this.stick_states[n].gcl = data[5];
            this.stick_states[n].gcr = data[6];
            this.stick_states[n].buttons = ["a", "b", "x", "y", "zl", "zr", "l", "r"].filter(
                (_, i) => ((data[7] + data[8] * 256) >> [5, 6, 4, 7, 10, 11, 8, 9][i]) & 1,
            );

            // console.log(data);
            this.stick_states[n].gc = data[11] == 1;

            // 02 00 01 02 02 04 03 03 0a
            // 02 00 01 02 00 04 03 03

            this.maps[n] = {
                x: InputKind[data[12]],
                a: InputKind[data[13]],
                b: InputKind[data[14]],
                y: InputKind[data[15]],
                l: InputKind[data[16]],
                r: InputKind[data[17]],
                zl: InputKind[data[18]],
                zr: InputKind[data[19]],
                cstick: InputKind[data[20]],
                tapjump: !!data[21],
            };

            // if(n == 1) console.log(maps[1], data[17])
            // console.log(maps[n], n)
            this.emit("data", {
                type: "inputs",
                data: {
                    inputs: this.stick_states,
                    maps: this.maps,
                },
            });
        });
    }
}
export default InputSocket;
