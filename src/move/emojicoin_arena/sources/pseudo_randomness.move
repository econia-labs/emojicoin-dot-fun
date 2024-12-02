module arena::pseudo_randomness {

    use aptos_framework::transaction_context;
    use std::bcs;
    use std::vector;

    friend arena::emojicoin_arena;

    /// Pseudo-random proxy for `aptos_framework::randomness::u64_range`.
    public(friend) inline fun u64_range(min_incl: u64, max_excl: u64): u64 {
        let range = ((max_excl - min_incl) as u256);
        let sample = ((u256_integer() % range) as u64);

        min_incl + sample
    }

    /// Pseudo-random proxy for `aptos_framework::randomness::next_32_bytes`.
    inline fun next_32_bytes(): vector<u8> {
        bcs::to_bytes(&transaction_context::generate_auid_address())
    }

    /// Pseudo-random proxy for `aptos_framework::randomness::u256_integer`.
    inline fun u256_integer(): u256 {
        let raw = next_32_bytes();
        let i = 0;
        let ret: u256 = 0;
        while (i < 32) {
            ret = ret * 256 + (vector::pop_back(&mut raw) as u256);
            i = i + 1;
        };
        ret
    }
}
