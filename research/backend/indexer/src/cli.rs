use clap::Parser;
use url::Url;

#[derive(Parser, Debug)]
pub struct Args {
    #[arg(short = 'E', long, env)]
    /// Address of the emojicoin dot fun package.
    pub emojicoin_dot_fun_address: String,
    #[arg(short = 'A', long, env)]
    /// Address of the emojicoin arena package.
    pub emojicoin_arena_address: Option<String>,
    #[arg(short = 'F', long, env)]
    /// Address of the emojicoin favorites package.
    pub emojicoin_favorites_address: Option<String>,
    #[arg(short = 'g', long, env)]
    /// Aptos GRPC URL.
    pub grpc_url: Url,
    #[arg(short = 'G', long, env)]
    /// GRPC authentication token.
    pub grpc_auth: String,
    #[arg(short, long, env, default_value_t = 0)]
    /// Earliest version to index.
    ///
    /// If set and database empty, will start at this point.
    /// If set and database is not empty, this will be ignored.
    /// If not set, start at 0.
    pub start_version: u64,
    #[arg(short, long, env)]
    /// Current transaction version.
    ///
    /// Will use backfilling strategy up until this version, then will transition to normal
    /// processing.
    pub current_version: Option<u64>,
    #[arg(short, long, env, default_value_t = 1)]
    /// How many GRPC streams to start in parallel.
    ///
    /// Only works if end version is set.
    pub jobs: u64,
    #[arg(short, long, env)]
    /// Database URL.
    pub db_url: String,

    #[arg(short, long, env, default_value_t = false)]
    /// Whether to exit after indexing until current.
    pub exit: bool,
}
