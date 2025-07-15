use skyline::{self, nn::diag::GetAllModuleInfo};
use std::io::Write;
use std::net::TcpStream;
use smash::app::{lua_bind::{CameraModule::get_player_no, *}, BattleObjectModuleAccessor};
use ninput;
mod fim;
use fim::*;

#[derive(Copy, Clone)]
struct PlayerInput {
    is_modified: bool,
    lx: i8,
    ly: i8,
    rx: i8,
    ry: i8,
    lt: i8,
    rt: i8,
    bb0: u8, 
    bb1: u8, 
    bb2: u8, 
    bb3: u8,
    style: u8,
}
impl PlayerInput {
    pub fn new() -> Self {
        PlayerInput { 
            is_modified: false, 
            lx: 0,
            ly: 0,
            rx: 0,
            ry: 0,
            lt: 0,
            rt: 0,
            bb0: 0, 
            bb1: 0, 
            bb2: 0, 
            bb3: 0,
            style: 0 // 1 for gc, >1 for etc
        }
    }
}
struct Store {
    tcp: Option<TcpStream>,
    inputs: [PlayerInput; 8],
}
impl Store {
    pub fn new() -> Self {
        Store { tcp: None, inputs: [PlayerInput::new(); 8] }
    }
    pub fn open(&mut self) {
        self.tcp = Some(TcpStream::connect("127.0.0.1:7878").unwrap());
        self.tcp.as_mut().unwrap().set_nonblocking(true);
        
    }
    pub fn update_controller(&mut self, 
        n: usize, 
        raw_lx: f32, raw_ly: f32,
        raw_rx: f32, raw_ry: f32,
        raw_lt: f32, raw_rt: f32,
        bb0: u8, bb1: u8, bb2: u8, bb3: u8,
        style: u8
    ) {
        let lx: i8 = (raw_lx * 128.0) as i8;
        let ly: i8 = (raw_ly * 128.0) as i8;
        if self.inputs[n].lx != lx {
            self.inputs[n].lx = lx;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].ly != ly {
            self.inputs[n].ly = ly;
            self.inputs[n].is_modified = true;
        }
        
        let rx: i8 = (raw_rx * 128.0) as i8;
        let ry: i8 = (raw_ry * 128.0) as i8;
        if self.inputs[n].rx != rx {
            self.inputs[n].rx = rx;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].ry != ry {
            self.inputs[n].ry = ry;
            self.inputs[n].is_modified = true;
        }

        let lt: i8 = (raw_lt * 128.0) as i8;
        let rt: i8 = (raw_rt * 128.0) as i8;
        if self.inputs[n].lt != lt {
            self.inputs[n].lt = lt;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].rt != rt {
            self.inputs[n].rt = rt;
            self.inputs[n].is_modified = true;
        }

        if self.inputs[n].bb0 != bb0 {
            self.inputs[n].bb0 = bb0;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].bb1 != bb1 {
            self.inputs[n].bb1 = bb1;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].bb2 != bb2 {
            self.inputs[n].bb2 = bb2;
            self.inputs[n].is_modified = true;
        }
        if self.inputs[n].bb3 != bb3 {
            self.inputs[n].bb3 = bb3;
            self.inputs[n].is_modified = true;
        }
        
        let cstyle = if style == 0x7 { 1 } else { 0 };
        self.inputs[n].style = cstyle;
        

    }
    pub fn write(&mut self, s: &str) {
        self.tcp.as_mut().unwrap().write_all(s.as_bytes());
    }
    pub fn try_write(&mut self) {
        if let Some(tcp_w) = self.tcp.as_mut() {
            // if tcp_w.is
            for i in 0..8 {
                if self.inputs[i].is_modified {
                    tcp_w.write_all(&[
                        i as u8, 
                        self.inputs[i].lx as u8,
                        self.inputs[i].ly as u8,
                        self.inputs[i].rx as u8,
                        self.inputs[i].ry as u8,
                        self.inputs[i].lt as u8,
                        self.inputs[i].rt as u8,
                        self.inputs[i].bb0,
                        self.inputs[i].bb1,
                        self.inputs[i].bb2,
                        self.inputs[i].bb3,
                        self.inputs[i].style,
                        10
                    ]);
                    // tcp_w.write_all(format!("test {}\n", self.inputs[i].lx as u8).as_bytes());
                    self.inputs[i].is_modified = false;
                }
            }
        }
    }

}
static mut STORE: Option<Store> = None;
#[skyline::main(name = "sar")]
pub fn main() {
    // ninput::init();
    unsafe { 
        STORE = Some(Store::new());
        if let Some(store) = STORE.as_mut() {
            store.open();
            store.write("HI\n");
        }
    }
    skyline::install_hook!(handle_final_input_mapping);
}


#[skyline::hook(offset = 0x1750f70)]
pub unsafe fn handle_final_input_mapping(
    mappings: *mut ControllerMapping,
    player_idx: i32,
    out: *mut MappedInputs,
    controller_struct: &mut SomeControllerStruct,
    arg: bool,
) {
    
    original!()(mappings, player_idx, out, controller_struct, arg);
    let b_bit_0: u8 = 0 | (controller_struct.controller.current_buttons.dpad_up() as u8) << 0 
        | (controller_struct.controller.current_buttons.dpad_right() as u8) << 1 
        | (controller_struct.controller.current_buttons.dpad_down() as u8) << 2 
        | (controller_struct.controller.current_buttons.dpad_left() as u8) << 3 
        | (controller_struct.controller.current_buttons.x() as u8) << 4 
        | (controller_struct.controller.current_buttons.a() as u8) << 5 
        | (controller_struct.controller.current_buttons.b() as u8) << 6 
        | (controller_struct.controller.current_buttons.y() as u8) << 7;
    let b_bit_1: u8 = 0 | (controller_struct.controller.current_buttons.l() as u8) << 0 
        | (controller_struct.controller.current_buttons.r() as u8) << 1 
        | (controller_struct.controller.current_buttons.zl() as u8) << 2 
        | (controller_struct.controller.current_buttons.zr() as u8) << 3 
        | (controller_struct.controller.current_buttons.left_sl() as u8) << 4 
        | (controller_struct.controller.current_buttons.left_sr() as u8) << 5 
        | (controller_struct.controller.current_buttons.right_sl() as u8) << 6 
        | (controller_struct.controller.current_buttons.right_sr() as u8) << 7;
    let b_bit_2: u8 = 0 | (controller_struct.controller.current_buttons.stick_l() as u8) << 0 
        | (controller_struct.controller.current_buttons.stick_r() as u8) << 1 
        | (controller_struct.controller.current_buttons.plus() as u8) << 2 
        | (controller_struct.controller.current_buttons.minus() as u8) << 3 
        | (controller_struct.controller.current_buttons.l_up() as u8) << 4 
        | (controller_struct.controller.current_buttons.l_right() as u8) << 5 
        | (controller_struct.controller.current_buttons.l_down() as u8) << 6 
        | (controller_struct.controller.current_buttons.l_left() as u8) << 7;
    let b_bit_3: u8 = 0 | (controller_struct.controller.current_buttons.r_up() as u8) << 0 
        | (controller_struct.controller.current_buttons.r_right() as u8) << 1 
        | (controller_struct.controller.current_buttons.r_down() as u8) << 2 
        | (controller_struct.controller.current_buttons.r_left() as u8) << 3 
        | (controller_struct.controller.current_buttons.real_digital_l() as u8) << 4 
        | (controller_struct.controller.current_buttons.real_digital_r() as u8) << 5;

    if let Some(store) = STORE.as_mut() {
        store.update_controller(
            player_idx as usize, 
            controller_struct.controller.left_stick_x, 
            controller_struct.controller.left_stick_y,
            controller_struct.controller.right_stick_x,
            controller_struct.controller.right_stick_y,
            controller_struct.controller.left_trigger,
            controller_struct.controller.right_trigger,
            b_bit_0,
            b_bit_1,
            b_bit_2,
            b_bit_3,
            controller_struct.controller.style as u8
        );
        
        // let ptr = out as *const _ as *const u8;
        // let mut s = String::new();
        // for i in 0..64 {
        //     s.push_str(format!("{:02X} ", *ptr.add(i)).as_str());
        // }
        // store.write(
        //     format!(
        //         "rdr = {} r = {}, ldl = {} l = {}\n", 
        //         controller_struct.controller.current_buttons.real_digital_r(),
        //         controller_struct.controller.current_buttons.r(),
        //         controller_struct.controller.current_buttons.real_digital_l(),
        //         controller_struct.controller.current_buttons.l()
        //     ).as_str());
        // store.write("\n");
        // store.update_triggers(player_idx as usize, controller_struct.controller.left_trigger, controller_struct.controller.right_trigger);
        // controller_struct.controller.current_buttons.a
        store.try_write();
        // store.write(format!("n = {}, x = {}\n", get_player_no(module_accessor, 0), ControlModule::get_stick_x(module_accessor)).as_str());
    }
}
