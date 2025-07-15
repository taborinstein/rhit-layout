import Bun from "bun";
let listeners = [];
let send = m => {
    listeners = listeners.filter(x => x.readyState != 3);
    listeners.forEach(x => x.write(m));
};
Bun.listen({
    hostname: "127.0.0.1",
    port: 7878,
    socket: {
        data(socket, data) {
            send(data)
        },
        open(socket) {
            console.log("connection made")
            listeners.push(socket)
        }
    },
});
