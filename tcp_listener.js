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
let stick_states = new Array(8).fill().map(()=>({...stick_state_default}));
export function start_tcp_listener(socket_handler) {
    Bun.connect({
        hostname: "127.0.0.1",
        port: 7878,

        socket: {
            data(socket, data) {
                console.log(data)
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
                socket_handler.send_all({
                    type: "inputs", 
                    data: stick_states
                });
            },
        },
    });
}
