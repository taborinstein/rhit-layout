import Bun from "bun";
import fs from "fs";
import babel from "@babel/core";
import * as sass from "sass";
import Path from "path";

import {start_tcp_listener} from "./tcp_listener.js"

import fetch_seeds from "./sgg.js";
let auth = {};

//verbose out
let vo = function () {
    let args = [...arguments];
    let type = +args.shift();
    let fmt = [
        "" /* normal */,
        "\x1b[32;1m[!]\x1b[0m" /* info */,
        "\x1b[33;1m[!]\x1b[0m" /* warning */,
        "\x1b[31;1m[!]\x1b[0m" /* error */,
    ][type];
    if (process.argv.includes("-v")) {
        process.stdout.write(fmt + " ");
        console.log(...args, "\x1b[0m");
    }
};

if (!fs.existsSync("./auth.json")) {
    console.log("[!] Please create an auth.json file");
    process.exit();
}
// format: { "token": "startggtoken" }
auth = JSON.parse(fs.readFileSync("./auth.json").toString());

const PORT = 3000;
let sockets = {
    store: [],
    // this is bad but will work for what we need it to do
    send_all: function (message) {
        let payload = {
            from: "server",
            data: message.data,
            type: message.type,
        };
        this.store.forEach(ws => ws.send(JSON.stringify(payload)));
    },
}; // hacky but it works

// collapse the next 3 bits
const compile_map = {
    jsx: "js",
    scss: "css",
};
function is_already_built(path, new_path) {
    return fs.existsSync(new_path) && fs.lstatSync(path).mtimeMs < fs.lstatSync(new_path).mtimeMs;
}
function compile(path) {
    if(!path.startsWith(__dirname)) path = Path.join(__dirname, path);
    let ext = path.split(".").pop();

    // get path relative to dirname
    let relative_path = Path.relative(__dirname, path);

    let new_path = Path.join(__dirname, ".cache", relative_path).replace(new RegExp(ext + "$"), compile_map[ext]);
    if (ext == "scss") {
        // handle @use so saving a sheet that isn't directly linked works
        let sass = fs.readFileSync(path).toString();
        let parent = Path.basename(Path.dirname(path));
        let uses = sass
            .split(";")
            .map(x => x.trim())
            .filter(x => x.startsWith("@use"))
            .map(x => x.split(" ")[1].slice(1, -1));
        for (let use of uses)
            if (!is_already_built(Path.join(parent, use), new_path)) {
                try {
                    fs.unlinkSync(new_path);
                } catch (_) {
                    // this is stupid
                }
                break;
            }
    }
    if (!fs.existsSync(".cache")) fs.mkdirSync(".cache");
    if (is_already_built(path, new_path)) return new_path;
    vo(1, `Compiling ${path} => ${new_path}`);
    let dir = Path.basename(Path.dirname(new_path));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    switch (ext) {
        case "jsx":
            fs.writeFileSync(
                new_path,
                babel.transformFileSync(path, { presets: ["@babel/preset-react"] }).code
            );
            break;
        case "scss":
            fs.writeFileSync(new_path, sass.compile(path).css);
        default:
            break;
    }
    return new_path;
}
start_tcp_listener(sockets);
Bun.serve({
    port: PORT,

    fetch(req, serv) {
        if (serv.upgrade(req)) return; // no clue what this does but it makes the websocket work

        let path = req.url.replace(/https?:\/\/[^\/]+/, "");

        // handle special files
        if (path.endsWith(".jsx") || path.endsWith(".scss")) {
            path = Path.join("./", path);
            return new Response(Bun.file(compile(path)));
        }

        // custom paths
        if (path == "/") return new Response(Bun.file("index.html"));
        if (path == "/inputs") return new Response(Bun.file("inputs.html"));
        if (path == "/control") return new Response(Bun.file("control.html"));
        if (path == "/comms") return new Response(Bun.file("comms.html"));

        // default
        return new Response(Bun.file(Path.join("./", path)));
    },
    websocket: {
        open: ws => {
            vo(1, "New socket connection");
            sockets.store.push(ws);
        },
        message: async (ws, message) => {
            let json = JSON.parse(message);
            if (json.from == "server") return;
            let data = json.data;
            vo(
                2,
                `Recieved message: \x1b[34m${json.type}\x1b[0m` +
                    (data ? `:\x1b[35m${JSON.stringify(data)}\x1b[0m` : "")
            );
            switch (json.type) {
                case "update":
                case "update_comms":
                case "fetch_current_resp":
                    sockets.send_all(json);
                    break;
                case "fetch_seeds":
                    sockets.send_all({
                        type: "fetch_seeds",
                        data: await fetch_seeds(data.url, auth.token),
                    });
                    break;
                case "fetch_players":
                    sockets.send_all({
                        type: "fetch_players",
                        data: JSON.parse(fs.readFileSync("./players.json").toString()),
                    });
                    break;
                case "fetch_current":
                    sockets.send_all({
                        type: "fetch_current",
                    });
                    break;
            }
        },
    },
});
