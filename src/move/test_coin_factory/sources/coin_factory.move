#[test_only]
module yellow_heart_market_address::coin_factory {
    struct Emojicoin {}
    struct EmojicoinLP {}
    struct BadType {}
}

#[test_only]
module yellow_heart_market_address::bad_coin_factory {
    struct Emojicoin {}
    struct EmojicoinLP {}
}
