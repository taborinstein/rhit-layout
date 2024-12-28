let socket = {
    sock: null,
    init: function (recv) {
        let sock_path = window.location.toString().replace(/https?/, "ws");
        this.sock = new WebSocket(sock_path);
        this.sock.addEventListener("message", resp => {
            let json = JSON.parse(resp.data);
            recv(json.type, json.data);
        });
    },
    transmit: function message(type, data) {
        this.sock.send(
            JSON.stringify({
                type: type,
                data: data,
            })
        );
    },
    
};
