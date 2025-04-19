use std::collections::HashMap;

use async_trait::async_trait;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sdk::{
    Event,
    arena::events::{ArenaEvent, Melee},
    emojicoin::events::{EmojicoinEvent, Swap},
};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Change {
    emojicoin_0_locked: BigDecimal,
    emojicoin_0_price: BigDecimal,
    emojicoin_1_locked: BigDecimal,
    emojicoin_1_price: BigDecimal,
    volume: BigDecimal,
    rewards_remaining: BigDecimal,
}

struct Builder {
    melee: Option<Melee>,
    change: Option<Change>,
}

/// Pipeline that updates the melee table.
pub struct MeleePipeline {
    builders: HashMap<BigDecimal, Builder>,
}

impl MeleePipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for MeleePipeline {
    fn name(&self) -> &'static str {
        "melee"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        let mut last_two_swaps: Vec<Option<&Swap>> = vec![None, None];
        for event in &transaction.events {
            match event {
                Event::Emojicoin(EmojicoinEvent::Swap(swap)) => {
                    last_two_swaps.remove(1);
                    last_two_swaps.insert(0, Some(swap));
                }
                Event::Arena(ArenaEvent::Melee(melee)) => {
                    self.builders.insert(
                        BigDecimal::from(melee.melee_id),
                        Builder {
                            melee: Some(melee.clone()),
                            change: None,
                        },
                    );
                }
                Event::Arena(ArenaEvent::Enter(enter)) => {
                    self.builders
                        .entry(BigDecimal::from(enter.melee_id))
                        .and_modify(|e| {
                            if let Some(c) = e.change.as_mut() {
                                c.emojicoin_0_locked +=
                                    BigDecimal::from(enter.emojicoin_0_proceeds);
                                c.emojicoin_0_price = enter.emojicoin_0_exchange_rate.price();
                                c.emojicoin_1_locked +=
                                    BigDecimal::from(enter.emojicoin_1_proceeds);
                                c.emojicoin_1_price = enter.emojicoin_1_exchange_rate.price();
                                c.volume += BigDecimal::from(enter.quote_volume);
                                c.rewards_remaining -= BigDecimal::from(enter.match_amount);
                            } else {
                                e.change = Some(Change {
                                    emojicoin_0_locked: BigDecimal::from(
                                        enter.emojicoin_0_proceeds,
                                    ),
                                    emojicoin_0_price: enter.emojicoin_0_exchange_rate.price(),
                                    emojicoin_1_locked: BigDecimal::from(
                                        enter.emojicoin_1_proceeds,
                                    ),
                                    emojicoin_1_price: enter.emojicoin_1_exchange_rate.price(),
                                    volume: BigDecimal::from(enter.quote_volume),
                                    rewards_remaining: BigDecimal::from(enter.match_amount),
                                });
                            }
                        });
                }
                Event::Arena(ArenaEvent::Swap(swap)) => {
                    let (first_swap, second_swap) = (
                        last_two_swaps.first().unwrap().unwrap(),
                        last_two_swaps.get(1).unwrap().unwrap(),
                    );
                    let (emojicoin_0_swap, emojicoin_1_swap) = if swap.emojicoin_0_proceeds == 0 {
                        (first_swap, second_swap)
                    } else {
                        (second_swap, first_swap)
                    };
                    let emojicoin_0_real_proceeds = if emojicoin_0_swap.is_sell {
                        BigDecimal::from(emojicoin_0_swap.input_amount) * -1i32
                    } else {
                        BigDecimal::from(emojicoin_0_swap.net_proceeds)
                    };
                    let emojicoin_1_real_proceeds = if emojicoin_1_swap.is_sell {
                        BigDecimal::from(emojicoin_1_swap.input_amount) * -1i32
                    } else {
                        BigDecimal::from(emojicoin_1_swap.net_proceeds)
                    };
                    self.builders
                        .entry(BigDecimal::from(swap.melee_id))
                        .and_modify(|e| {
                            if let Some(c) = e.change.as_mut() {
                                c.emojicoin_0_locked += emojicoin_0_real_proceeds;
                                c.emojicoin_0_price = swap.emojicoin_0_exchange_rate.price();
                                c.emojicoin_1_locked += emojicoin_1_real_proceeds;
                                c.emojicoin_1_price = swap.emojicoin_1_exchange_rate.price();
                                c.volume += BigDecimal::from(swap.quote_volume);
                            } else {
                                e.change = Some(Change {
                                    emojicoin_0_locked: emojicoin_0_real_proceeds,
                                    emojicoin_0_price: swap.emojicoin_0_exchange_rate.price(),
                                    emojicoin_1_locked: emojicoin_1_real_proceeds,
                                    emojicoin_1_price: swap.emojicoin_1_exchange_rate.price(),
                                    volume: BigDecimal::from(swap.quote_volume),
                                    rewards_remaining: BigDecimal::from(0),
                                });
                            }
                        });
                }
                Event::Arena(ArenaEvent::Exit(exit)) => {
                    self.builders
                        .entry(BigDecimal::from(exit.melee_id))
                        .and_modify(|e| {
                            if let Some(c) = e.change.as_mut() {
                                c.emojicoin_0_locked -= BigDecimal::from(exit.emojicoin_0_proceeds);
                                c.emojicoin_1_locked -= BigDecimal::from(exit.emojicoin_1_proceeds);
                                c.rewards_remaining += BigDecimal::from(exit.tap_out_fee);
                            } else {
                                e.change = Some(Change {
                                    emojicoin_0_locked: BigDecimal::from(exit.emojicoin_0_proceeds),
                                    emojicoin_0_price: exit.emojicoin_0_exchange_rate.price(),
                                    emojicoin_1_locked: BigDecimal::from(exit.emojicoin_1_proceeds),
                                    emojicoin_1_price: exit.emojicoin_1_exchange_rate.price(),
                                    volume: BigDecimal::from(0),
                                    rewards_remaining: BigDecimal::from(exit.tap_out_fee),
                                });
                            }
                        });
                }
                _ => {}
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders = HashMap::new();
        std::mem::swap(&mut builders, &mut self.builders);
        for (melee_id, builder) in builders.into_iter() {
            if let Some(melee) = builder.melee {
                let start = DateTime::<Utc>::from_timestamp(
                    (melee.start_time / 1_000_000) as i64,
                    (melee.start_time % 1_000_000) as u32,
                )
                .unwrap();
                query!(
                    r#"
                        WITH
                            market_0 AS (SELECT codepoints, price FROM market WHERE address = $2),
                            market_1 AS (SELECT codepoints, price FROM market WHERE address = $3)
                        INSERT INTO melee (
                            melee_id,
                            emojicoin_0_codepoints,
                            emojicoin_0_price,
                            emojicoin_1_codepoints,
                            emojicoin_1_price,
                            rewards_remaining,
                            start,
                            duration,
                            max_match_amount,
                            max_match_percentage
                        )
                        SELECT
                            $1,
                            (SELECT codepoints FROM market_0),
                            (SELECT price FROM market_0),
                            (SELECT codepoints FROM market_1),
                            (SELECT price FROM market_1),
                            $4,
                            $5,
                            $6,
                            $7,
                            $8
                        FROM market_0, market_1
                    "#,
                    BigDecimal::from(melee.melee_id),
                    melee.emojicoin_0_market_address,
                    melee.emojicoin_0_market_address,
                    BigDecimal::from(melee.available_rewards),
                    start,
                    BigDecimal::from(melee.duration),
                    BigDecimal::from(melee.max_match_amount),
                    BigDecimal::from(melee.max_match_percentage),
                )
                .execute(&mut **db_tx)
                .await?;
            }
            if let Some(change) = builder.change {
                query!(
                    r#"
                    UPDATE melee
                    SET
                        emojicoin_0_locked = melee.emojicoin_0_locked + $2,
                        emojicoin_0_price = $3,
                        emojicoin_1_locked = melee.emojicoin_1_locked + $4,
                        emojicoin_1_price = $5,
                        volume = melee.volume + $6,
                        rewards_remaining = melee.rewards_remaining - $7
                    WHERE melee.melee_id = $1
                "#,
                    melee_id,
                    change.emojicoin_0_locked,
                    change.emojicoin_0_price,
                    change.emojicoin_1_locked,
                    change.emojicoin_1_price,
                    change.volume,
                    change.rewards_remaining,
                )
                .execute(&mut **db_tx)
                .await?;
            }
        }
        Ok(())
    }
}
