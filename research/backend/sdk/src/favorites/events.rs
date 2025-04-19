use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Favorite {
    pub user: String,
    pub market: String,
    pub is_favorite: bool,
}
