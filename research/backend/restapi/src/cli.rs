use std::net::IpAddr;

use clap::Parser;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    /// Database URL
    #[arg(short, long, env)]
    pub database_url: String,

    /// IP to bind to
    #[arg(short, long, env = "BIND_TO_IP", default_value_t = IpAddr::V4("0.0.0.0".parse().unwrap()))]
    pub ip: IpAddr,

    /// Port to listen on
    #[arg(short, long, env, default_value_t = 6666)]
    pub port: u16,

    /// Maximum number of concurent connections in the database pool
    #[arg(short, long, env, default_value_t = 5)]
    pub max_db_connections: u32,

    /// Maximum number of items stored in cache at once
    #[arg(short, long, env, default_value_t = 100_000)]
    pub cache_size: u64,
}
