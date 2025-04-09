#[macro_use]
extern crate diesel;

pub mod db;
pub mod processor;

pub use db::postgres::schema;

pub mod emojicoin_dot_fun {
    pub use crate::db::common::models::emojicoin_models::enums::{
        EmojicoinDbEvent, EmojicoinDbEventType, EmojicoinEvent, EmojicoinEventType, Period,
    };
}
