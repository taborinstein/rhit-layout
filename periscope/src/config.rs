use crate::cli::CommandLine;
use anyhow::Result;
use directories::ProjectDirs;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{fs, io::Write, path::PathBuf};
use toml::from_str;

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct Config {
    pub switch_addr: String,
    pub skin: String,
    pub viewer_only: Option<bool>,
    pub delay: Option<u64>
}

static DIRS: Lazy<ProjectDirs> = Lazy::new(|| {
    ProjectDirs::from("", "periwinkle", "periscope").expect("No valid home directory found!")
});

const DEFCFG: &str = "switch_addr=\"\"\nskin=\"\"\n";

pub fn config_dir() -> PathBuf {
    DIRS.config_dir().to_path_buf()
}

impl Config {
    pub fn open() -> Result<Self> {
        let p = config_dir();
        let config = p.join("config.toml");
        if !config.exists() {
            fs::create_dir_all(&p)?;
            fs::File::create(&config)?;
        }
        if let Ok(c) = from_str(&fs::read_to_string(&config)?) {
            Ok(c)
        } else {
            fs::File::options()
                .write(true)
                .truncate(true)
                .open(config)?
                .write_all(&DEFCFG.as_bytes())?;
            Ok(Self::default())
        }
    }
    pub fn add_cli(&mut self, cli: CommandLine) {
        if cli.switch_addr.is_some() {
            self.switch_addr = cli.switch_addr.unwrap();
        }
        if !cli.skin.is_empty() {
            self.skin = cli.skin;
        }
        if cli.viewer_only {
            self.viewer_only = Some(true);
        }
        if cli.delay.is_some() {
            self.delay = cli.delay;
        }
    }
  
}

