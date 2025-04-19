use std::collections::HashMap;

use async_trait::async_trait;
use bigdecimal::BigDecimal;
use sdk::{
    Event,
    arena::events::ArenaEvent,
    emojicoin::events::{EmojicoinEvent, Swap},
};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    melee_id: BigDecimal,
    account: String,
    open: bool,
    emojicoin_0_balance: BigDecimal,
    emojicoin_1_balance: BigDecimal,
    emojicoin_0_balance_before_last_exit: Option<BigDecimal>,
    emojicoin_1_balance_before_last_exit: Option<BigDecimal>,
    deposits: BigDecimal,
    withdrawals: BigDecimal,
    match_amount: BigDecimal,
}

/// Pipeline that updates the melee position table.
pub struct PositionPipeline {
    builders: HashMap<(BigDecimal, String), Builder>,
}

impl PositionPipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for PositionPipeline {
    fn name(&self) -> &'static str {
        "position"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        let mut last_two_swaps: Vec<Option<&Swap>> = vec![None, None];
        for event in &transaction.events {
            match event {
                Event::Emojicoin(EmojicoinEvent::Swap(swap)) => {
                    last_two_swaps.remove(1);
                    last_two_swaps.insert(0, Some(swap));
                }
                Event::Arena(ArenaEvent::Enter(enter)) => {
                    let melee_id = BigDecimal::from(enter.melee_id);
                    let builder = Builder {
                        melee_id: melee_id.clone(),
                        account: enter.user.clone(),
                        open: true,
                        emojicoin_0_balance: BigDecimal::from(enter.emojicoin_0_proceeds),
                        emojicoin_1_balance: BigDecimal::from(enter.emojicoin_1_proceeds),
                        emojicoin_0_balance_before_last_exit: Some(BigDecimal::from(
                            enter.emojicoin_0_proceeds,
                        )),
                        emojicoin_1_balance_before_last_exit: Some(BigDecimal::from(
                            enter.emojicoin_1_proceeds,
                        )),
                        deposits: BigDecimal::from(enter.input_amount),
                        withdrawals: BigDecimal::from(0),
                        match_amount: BigDecimal::from(enter.match_amount),
                    };
                    self.builders
                        .entry((melee_id, enter.user.clone()))
                        .and_modify(|e| {
                            e.open = true;
                            e.emojicoin_0_balance = builder.emojicoin_0_balance.clone();
                            e.emojicoin_1_balance = builder.emojicoin_1_balance.clone();
                            e.emojicoin_0_balance_before_last_exit =
                                builder.emojicoin_0_balance_before_last_exit.clone();
                            e.emojicoin_1_balance_before_last_exit =
                                builder.emojicoin_1_balance_before_last_exit.clone();
                            e.deposits += builder.deposits.clone();
                            e.match_amount += builder.match_amount.clone();
                        })
                        .or_insert(builder);
                }
                Event::Arena(ArenaEvent::Swap(swap)) => {
                    let melee_id = BigDecimal::from(swap.melee_id);
                    let builder = Builder {
                        melee_id: melee_id.clone(),
                        account: swap.user.clone(),
                        open: true,
                        emojicoin_0_balance: BigDecimal::from(swap.emojicoin_0_proceeds),
                        emojicoin_1_balance: BigDecimal::from(swap.emojicoin_1_proceeds),
                        emojicoin_0_balance_before_last_exit: Some(BigDecimal::from(
                            swap.emojicoin_0_proceeds,
                        )),
                        emojicoin_1_balance_before_last_exit: Some(BigDecimal::from(
                            swap.emojicoin_1_proceeds,
                        )),
                        deposits: BigDecimal::from(0),
                        withdrawals: BigDecimal::from(0),
                        match_amount: BigDecimal::from(0),
                    };
                    self.builders
                        .entry((melee_id, swap.user.clone()))
                        .and_modify(|e| {
                            e.open = true;
                            e.emojicoin_0_balance = builder.emojicoin_0_balance.clone();
                            e.emojicoin_1_balance = builder.emojicoin_1_balance.clone();
                            e.emojicoin_0_balance_before_last_exit =
                                builder.emojicoin_0_balance_before_last_exit.clone();
                            e.emojicoin_1_balance_before_last_exit =
                                builder.emojicoin_1_balance_before_last_exit.clone();
                        })
                        .or_insert(builder);
                }
                Event::Arena(ArenaEvent::Exit(exit)) => {
                    let melee_id = BigDecimal::from(exit.melee_id);
                    let builder = Builder {
                        melee_id: melee_id.clone(),
                        account: exit.user.clone(),
                        open: false,
                        emojicoin_0_balance: BigDecimal::from(0),
                        emojicoin_1_balance: BigDecimal::from(0),
                        emojicoin_0_balance_before_last_exit: None,
                        emojicoin_1_balance_before_last_exit: None,
                        deposits: BigDecimal::from(0),
                        withdrawals: exit.apt_proceeds(),
                        match_amount: BigDecimal::from(exit.tap_out_fee),
                    };
                    self.builders
                        .entry((melee_id, exit.user.clone()))
                        .and_modify(|e| {
                            e.open = false;
                            e.emojicoin_0_balance = builder.emojicoin_0_balance.clone();
                            e.emojicoin_1_balance = builder.emojicoin_1_balance.clone();
                        })
                        .or_insert(builder);
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
        for builder in builders.into_values() {
            query!(
                r#"
                    INSERT INTO melee_position (
                        melee_id,
                        account,
                        open,
                        emojicoin_0_balance,
                        emojicoin_1_balance,
                        emojicoin_0_balance_before_last_exit,
                        emojicoin_1_balance_before_last_exit,
                        deposits,
                        withdrawals,
                        match_amount
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10
                    )
                    ON CONFLICT (melee_id, account) DO UPDATE
                    SET
                        open = $3,
                        emojicoin_0_balance = $4,
                        emojicoin_1_balance = $5,
                        emojicoin_0_balance_before_last_exit = $6,
                        emojicoin_1_balance_before_last_exit = $7,
                        deposits = melee_position.deposits + $8,
                        withdrawals = melee_position.withdrawals + $9,
                        match_amount = melee_position.match_amount + $10
                    WHERE melee_position.melee_id = $1
                    AND melee_position.account = $2
                "#,
                builder.melee_id,
                builder.account,
                builder.open,
                builder.emojicoin_0_balance,
                builder.emojicoin_1_balance,
                builder.emojicoin_0_balance_before_last_exit,
                builder.emojicoin_1_balance_before_last_exit,
                builder.deposits,
                builder.withdrawals,
                builder.match_amount,
            )
            .execute(&mut **db_tx)
            .await?;
        }

        Ok(())
    }
}
