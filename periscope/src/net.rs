use crate::{skin::ButtonType, viewer::FRAME_TIME};
use crossbeam_channel::{Receiver, Sender};
use crossbeam_queue::ArrayQueue;
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashSet, VecDeque},
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    sync::Arc,
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};

#[derive(Default, Clone, Debug, Serialize)]
pub struct ControllerState {
    pub id: u8,
    pub buttons: HashSet<ButtonType>,
    pub ls: StickState,
    pub rs: StickState,
    pub gcr: u32,
    pub gcl: u32
}

#[derive(Deserialize, Debug)]
struct Message {
    id: u8,
    bs: u32,
    ls: StickState,
    rs: StickState,
    gcr: u32,
    gcl: u32

}

#[derive(Deserialize, Copy, Clone, Default, Debug, Serialize)]
pub struct StickState {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug)]
pub enum NetThreadMsg {
    StartCapture(String),
    Error(String),
    Exit,
}

pub fn run_net(
    out_queue: Arc<ArrayQueue<Vec<ControllerState>>>,
    tx: Sender<NetThreadMsg>,
    rx: Receiver<NetThreadMsg>,
    delay: Duration,
) -> JoinHandle<()> {
    thread::spawn(move || {
        let mut wait_queue: VecDeque<(Instant, Vec<ControllerState>)> = VecDeque::new();
        let mut now;
        let mut stream;
        let mut buf = [0; 810];
        let mut addr = SocketAddr::from(([0, 0, 0, 0], 2579));
        let mut already_capturing = false;
        'outer: loop {
            wait_queue.clear();
            while !already_capturing {
                if let Ok(m) = rx.try_recv() {
                    match m {
                        NetThreadMsg::Exit => break 'outer,
                        NetThreadMsg::StartCapture(s) => {
                            let tmp_addr = format!("{s}:2579").parse();
                            if let Ok(a) = tmp_addr {
                                addr = a;
                                already_capturing = true;
                            } else {
                                tx.send(NetThreadMsg::Error("Invalid IP address!".into()))
                                    .unwrap();
                            }
                        }
                        _ => {}
                    }
                }
            }
            if let Ok(s) = TcpStream::connect_timeout(&addr, Duration::from_secs(10)) {
                stream = s;
            } else {
                tx.send(NetThreadMsg::Error(
                    "Failed to connect to switch! Is the IP address correct/is it on?".into(),
                ))
                .unwrap();
                already_capturing = false;
                continue 'outer;
            }
            stream
                .set_read_timeout(Some(Duration::from_secs_f32(0.5)))
                .unwrap();
            stream
                .set_write_timeout(Some(Duration::from_secs_f32(0.5)))
                .unwrap();
            loop {
                now = Instant::now();
                let e = stream.write(b"1"); // probably have 'commands' for sys side later, for now just Anything
                if let Err(_) = e {
                    // recreate connection if timeout or conn lost
                    continue 'outer;
                }
                let len = stream.read(&mut buf);
                if let Err(_) = len {
                    continue 'outer;
                }
                let len = len.unwrap();
                let message = serde_json::from_slice::<Vec<Message>>(&buf[..len]);
                if let Ok(msg) = message {
                    let cstates = msg
                        .iter()
                        .map(|state| {
                            let map = state_to_map(state.bs);
                            #[cfg(debug_assertions)]
                            println!("{map:?} {:?} {:?}", state.ls, state.rs);
                            let cs = ControllerState {
                                id: state.id,
                                buttons: map,
                                ls: state.ls,
                                rs: state.rs,
                                gcl: state.gcl,
                                gcr: state.gcr
                            };
                            cs
                        })
                        .collect::<Vec<_>>();
                    wait_queue.push_back((now, cstates));
                } else if let Err(e) = message {
                    println!("{}", String::from_utf8_lossy(&buf[..len]));
                    println!("{e:?}");
                }
                buf.fill(0);
                while let Some(v) = wait_queue.front() {
                    if v.0.elapsed() >= delay {
                        out_queue.force_push(wait_queue.pop_front().unwrap().1);
                    } else {
                        break;
                    }
                }
                if let Ok(m) = rx.try_recv() {
                    match m {
                        NetThreadMsg::Exit => break 'outer,
                        _ => {}
                    }
                }
                if now.elapsed() < FRAME_TIME {
                    thread::sleep(FRAME_TIME - now.elapsed());
                }
            }
        }
    })
}

fn state_to_map(state: u32) -> HashSet<ButtonType> {
    use ButtonType::*;
    const BUTTONS_ORDER: [ButtonType; 20] = [
        A, B, X, Y, Ls, Rs, L, R, Zl, Zr, Plus, Minus, Left, Up, Right, Down, Lsl, Lsr, Rsl, Rsr,
    ];
    let mut r = HashSet::new();
    for i in (0..BUTTONS_ORDER.len()).map(|i| if i > 15 { i + 8 } else { i }) {
        if (state & (1 << i)) != 0 {
            r.insert(BUTTONS_ORDER[i]);
        }
    }
    r
}
