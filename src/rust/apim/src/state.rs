use moka::future::Cache;
use sqlx::{Pool, Postgres};

use crate::routes::Route;

/// Global application state.
pub struct AppState {
    pool: Pool<Postgres>,
    cache: Cache<Route, String>,
}

impl AppState {
    pub fn new(pool: Pool<Postgres>, cache: Cache<Route, String>) -> Self {
        Self { pool, cache }
    }

    pub fn pool(&self) -> &Pool<Postgres> {
        &self.pool
    }

    pub fn cache(&self) -> &Cache<Route, String> {
        &self.cache
    }
}
