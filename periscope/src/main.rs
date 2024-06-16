#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use anyhow::Result;
use clap::Parser;

mod cli;
mod config;
mod net;
mod skin;
mod viewer;
use config::Config;
use viewer::run_viewer;
#[tokio::main]
async fn main() -> Result<()> {
    let args = cli::CommandLine::parse();
    let mut cfg = Config::open()?;
    cfg.add_cli(args);
    // println!("hi");
    run_viewer(cfg).await;
    Ok(())
}
