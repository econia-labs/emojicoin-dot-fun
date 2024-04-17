module coin_factory::coin_factory {
    use aptos_std::coin::{Self};
    use aptos_std::string;
    use std::signer;
    use std::vector;

    struct Emojicoin {}
    struct EmojicoinLP {}

    const EMOJICOIN_SUPPLY: u64 = 450_000_000_000_000_000;
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = false;

    const EMOJICOIN_STRING: vector<u8> = b" emojicoin";
    const SYMBOL: vector<u8> = x"99887766554433221100ffeeddccbbaa00112233445566778899aabbccddeeff";

    // Note that by virtue of how publishing modules works, the @coin_factory
    // address will always be equal to the signer passed into `init_module`,
    // so we do not need to check it.
    fun init_module(deployer_obj: &signer) {
        let name = SYMBOL;
        vector::append(&mut name, EMOJICOIN_STRING);

        let symbol = string::utf8(SYMBOL);
        let name = copy symbol;
        string::append_utf8(&mut name, EMOJICOIN_STRING);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<Emojicoin>(
            deployer_obj,
            name,
            symbol,
            DECIMALS,
            MONITOR_SUPPLY,
        );

        coin::register<Emojicoin>(deployer_obj);

        let minted_coins = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
        let deployer_addr = signer::address_of(deployer_obj);
        coin::deposit(deployer_addr, minted_coins);

        // Destroy all coin capabilities, because we will not need them.
        coin::destroy_freeze_cap<Emojicoin>(freeze_cap);
        coin::destroy_mint_cap<Emojicoin>(mint_cap);
        coin::destroy_burn_cap<Emojicoin>(burn_cap);
    }
}
