import contents from "./i.txt"
let wss_2 = [];
let send_2 = (m) => {
    wss_2 = wss_2.filter((x) => x.readyState != 3);
    wss_2.forEach((x) => x.send(m));
};
Bun.serve({
    port: 3002,
    websocket: {
        open(ws) {
            wss_2.push(ws);
        },
        message(ws, m) {
            send_2(m);
        }
    },
    fetch(r, s) {
        if (s.upgrade(r)) return;
        return new Response(
            contents, {
    headers: {
        "Content-Type": "text/html",
    },
}
        );
    },
});
