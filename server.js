const h = {
    headers: {
        "Content-Type": "text/html",
    },
};
let wss = [];
let wss_2 = [];
import fs from "fs";
let send = (m) => {
    wss = wss.filter((x) => x.readyState != 3);
    wss.forEach((x) => x.send(m));
};
Bun.serve({
    port: 3000,
    websocket: {
        open(ws) {
            wss.push(ws);
        },
        message(ws, m) {
            send(m);
        }
    },
    fetch(r, s) {
        if (s.upgrade(r)) return;
        let p = (new URL(r.url)).pathname;
        return p == "/" ? new Response(
            fs.readFileSync("./index.html"), h) : new Response(Bun.file("." + p), { headers: { "Content-Type": p.split(".").pop() } });
    },
    error() {
        return new Response(null, { status: 404 });
    },
});

//fs.watch(import.meta.dir, { recursive: true }, () => send('{"type": "reload"}'));

let send_2 = (m) => {
    wss_2 = wss_2.filter((x) => x.readyState != 3);
    wss_2.forEach((x) => x.send(m));
};
Bun.serve({
    port: 3002,
    websocket: {
        open(ws) {
            console.log("connection")
            wss_2.push(ws);
        },
        message(ws, m) {
            send_2(m);
        }
    },
    fetch(r, s) {
        if (s.upgrade(r)) return;
        return new Response(
            fs.readFileSync("./input.html"), h
        );
    },
});
