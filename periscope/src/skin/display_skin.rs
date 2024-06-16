use serde::{Deserialize, Serialize};
#[derive(PartialEq, Eq, Hash, Deserialize, Clone, Copy, Debug, Serialize)]
pub enum ButtonType {
    A,
    B,
    X,
    Y,
    Plus,
    Minus,
    Zl,
    Zr,
    L,
    R,
    Up,
    Down,
    Left,
    Right,
    Ls,
    Rs,
    Lsl,
    Lsr,
    Rsl,
    Rsr,
}


