use crate::{
    config::Config,
    net::{run_net, ControllerState, NetThreadMsg},
};
use anyhow::Result;
use crossbeam_channel::{unbounded, Sender};
use crossbeam_queue::ArrayQueue;
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tungstenite::{connect, Message, WebSocket, stream::MaybeTlsStream};

use url::Url; 
pub async fn run_viewer(cfg: Config) {
    let (to_net, from_vwr) = unbounded();
    let (to_vwr, _) = unbounded();
    println!("opening ws");
    let (ws, _) = connect(Url::parse("ws://localhost:3002").unwrap())
        .expect("Can't connect");

    let to_net2 = to_net.clone();
    let q = Arc::new(ArrayQueue::new(1));
    let delay = Duration::from_millis(cfg.delay.unwrap_or(0));
    let h = run_net(Arc::clone(&q), to_vwr.clone(), from_vwr.clone(), delay);
        if let Err(e) = window_loop(cfg, Arc::clone(&q), to_net.clone(), ws).await {
            eprintln!("{e:?}");
            to_net.send(NetThreadMsg::Exit).unwrap();
            std::process::exit(1);
        }
    println!("Exiting...");
    let _ = to_net2.send(NetThreadMsg::Exit);
    let _ = h.join();
    
}

pub static FRAME_TIME: Duration = Duration::from_micros(16_667);

async fn window_loop(
    cfg: Config,
    queue: Arc<ArrayQueue<Vec<ControllerState>>>,
    tx: Sender<NetThreadMsg>,
    mut ws: WebSocket<MaybeTlsStream<std::net::TcpStream>>
) -> Result<()> {
    let mut cs = vec![ControllerState::default(); 8];
    let mut no_frames = 0;
   
    let mut timer;
    tx.send(NetThreadMsg::StartCapture(cfg.switch_addr.clone()))
        .unwrap();

    loop {
        timer = Instant::now(); 
        if let Some(frame) = queue.pop() {
            cs = frame;
            no_frames = 0;
            } else {
                no_frames += 1;
            }
            if no_frames == 60 {
                cs = vec![ControllerState::default(); 8];
            }
                    let s: String = cs
                        .iter()
                        .map(|x| serde_json::to_string(x).unwrap())
                        .collect::<Vec<_>>()
                        .join(",");   
                    ws.send(Message::Text(s.into())).unwrap();

        if timer.elapsed() < FRAME_TIME {
            std::thread::sleep(FRAME_TIME - timer.elapsed());
        }
    }
}

