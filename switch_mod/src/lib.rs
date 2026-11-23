// #![allow(unused_parens)]
use skyline;
use std::sync::RwLock;
use std::{io::Write, net::TcpListener};
use std::{net::TcpStream, sync::LazyLock};
mod fim;
use fim::*;

static POOL: LazyLock<RwLock<Vec<TcpStream>>> = LazyLock::new(|| RwLock::new(Vec::new()));
static mut LAST_PAYLOAD: [[u8; 22]; 8] = [[0; 22]; 8];

fn stream_handler(stream: TcpStream) {
    stream.set_nonblocking(true).expect("could not unblock");
    let mut guard = POOL.write().unwrap();
    (*guard).push(stream);
}

#[skyline::main(name = "sar")]
pub fn main() {
    // TcpStream::connect("192.168.4.72:1111")
    //     .unwrap()
    //     .write("init :3\n".as_bytes())
    //     .unwrap();
    println!("[::] plugin start");
    std::thread::spawn(move || {
        loop {
            let listener = TcpListener::bind("0.0.0.0:5580").unwrap();
            println!("[::] pre new message");
            for stream in listener.incoming() {
                match stream {
                    Ok(s) => stream_handler(s),
                    Err(e) => {
                        break;
                        // println!("[::] todo: restart server here {}", e)
                    }
                };
                println!("[::] new message");
            }
        }
    });

    skyline::install_hook!(handle_final_input_mapping);
}

//#[skyline::hook(offset = 0x1750dd0)] // 13.0.5
#[skyline::hook(offset = 0x1750f70)] // 13.0.4
pub unsafe fn handle_final_input_mapping(
    _mappings: *mut ControllerMapping,
    player_idx: i32,
    out: *mut MappedInputs,
    controller_struct: &mut SomeControllerStruct,
    arg: bool,
) {
    // println!("[::] hook");
    original!()(_mappings, player_idx, out, controller_struct, arg);
    let mappings = unsafe { *(_mappings.wrapping_add(player_idx as usize)) };

    let b_bit_0: u8 = 0
        | (controller_struct.controller.current_buttons.dpad_up() as u8) << 0
        | (controller_struct.controller.current_buttons.dpad_right() as u8) << 1
        | (controller_struct.controller.current_buttons.dpad_down() as u8) << 2
        | (controller_struct.controller.current_buttons.dpad_left() as u8) << 3
        | (controller_struct.controller.current_buttons.x() as u8) << 4
        | (controller_struct.controller.current_buttons.a() as u8) << 5
        | (controller_struct.controller.current_buttons.b() as u8) << 6
        | (controller_struct.controller.current_buttons.y() as u8) << 7;
    let b_bit_1: u8 = 0
        | (controller_struct.controller.current_buttons.l() as u8) << 0
        | (controller_struct.controller.current_buttons.r() as u8) << 1
        | (controller_struct.controller.current_buttons.zl() as u8) << 2
        | (controller_struct.controller.current_buttons.zr() as u8) << 3
        | (controller_struct.controller.current_buttons.left_sl() as u8) << 4
        | (controller_struct.controller.current_buttons.left_sr() as u8) << 5
        | (controller_struct.controller.current_buttons.right_sl() as u8) << 6
        | (controller_struct.controller.current_buttons.right_sr() as u8) << 7;
    let b_bit_2: u8 = 0
        | (controller_struct.controller.current_buttons.stick_l() as u8) << 0
        | (controller_struct.controller.current_buttons.stick_r() as u8) << 1
        | (controller_struct.controller.current_buttons.plus() as u8) << 2
        | (controller_struct.controller.current_buttons.minus() as u8) << 3
        | (controller_struct.controller.current_buttons.l_up() as u8) << 4
        | (controller_struct.controller.current_buttons.l_right() as u8) << 5
        | (controller_struct.controller.current_buttons.l_down() as u8) << 6
        | (controller_struct.controller.current_buttons.l_left() as u8) << 7;
    let b_bit_3: u8 = 0
        | (controller_struct.controller.current_buttons.r_up() as u8) << 0
        | (controller_struct.controller.current_buttons.r_right() as u8) << 1
        | (controller_struct.controller.current_buttons.r_down() as u8) << 2
        | (controller_struct.controller.current_buttons.r_left() as u8) << 3
        | (controller_struct
            .controller
            .current_buttons
            .real_digital_l() as u8)
            << 4
        | (controller_struct
            .controller
            .current_buttons
            .real_digital_r() as u8)
            << 5;

    let lx = ((controller_struct.controller.left_stick_x + 1.0) * 128.0) as u8;
    let ly = ((controller_struct.controller.left_stick_y + 1.0) * 128.0) as u8;
    let rx = ((controller_struct.controller.right_stick_x + 1.0) * 128.0) as u8;
    let ry = ((controller_struct.controller.right_stick_y + 1.0) * 128.0) as u8;
    let lt = ((controller_struct.controller.left_trigger + 1.0) * 128.0) as u8;
    let rt = ((controller_struct.controller.right_trigger + 1.0) * 128.0) as u8;
    let controller_style = if controller_struct.controller.style as u8 == 0x7 {
        1
    } else {
        0
    } as u8;

    let mut payload: Vec<u8> = vec![
        player_idx as u8,
        lx,
        ly,
        rx,
        ry,
        lt,
        rt,
        b_bit_0,
        b_bit_1,
        b_bit_2,
        b_bit_3,
        controller_style,
    ];

    payload.extend(if controller_style == 1 {
        vec![
            mappings.gc_x as u8,
            mappings.gc_a as u8,
            mappings.gc_b as u8,
            mappings.gc_y as u8,
            mappings.gc_l as u8,
            mappings.gc_r as u8,
            13 as u8,
            mappings.gc_z as u8,
            mappings.gc_cstick as u8,
            mappings.gc_tapjump as u8,
        ]
    } else {
        vec![
            mappings.pro_x as u8,
            mappings.pro_a as u8,
            mappings.pro_b as u8,
            mappings.pro_y as u8,
            mappings.pro_l as u8,
            mappings.pro_r as u8,
            mappings.pro_zl as u8,
            mappings.pro_zr as u8,
            mappings.pro_cstick as u8,
            mappings.pro_tapjump as u8,
        ]
    });

    // let (lock, cv) = &*SIGNAL;
    // let player_num = *cv.wait(lock.lock().unwrap()).unwrap();
    // println!("[::] condvar :D {}", n);
    // n += 1;

    // if vec_check[player_num as usize] != message {
    // vec_check[player_num as usize] = message.clone();

    // let mut guard = POOL.write().unwrap();
    // let guard = POOL.read().unwrap();

    let bytes: [u8; 22] = payload.as_slice().try_into().expect("could not slice");
    if bytes != LAST_PAYLOAD[player_idx as usize] {
        let mut p = POOL.write().unwrap();
        let q = p.len();
        {
            // TcpStream::connect("192.168.4.72:1111")
            //     .unwrap()
            //     .write(format!("attempting to write {} :3\n", p.len()).as_bytes())
            //     .unwrap();
        }
        // println!("[::] attempting write with len {}", );
        p.retain_mut(|stream| {
            println!(":3");
            match stream.write(&bytes) {
                Ok(n) if n == payload.len() => true,
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => true,
                _ => false,
            }
        });
        unsafe {
            LAST_PAYLOAD[player_idx as usize] = bytes;
        }
    }

    // }

    // unsafe {
    //     let bytes: [u8; 22] = payload.as_slice().try_into().expect("could not slice");
    //     PAYLOAD[player_idx as usize] = Some(bytes);
    //     (&*SIGNAL).1.notify_one();
    //     std::thread::yield_now();
    // }
}
