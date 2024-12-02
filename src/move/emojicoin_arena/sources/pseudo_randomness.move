module arena::pseudo_randomness {

    use aptos_framework::transaction_context;
    use std::bcs;

    /// Pseudo-random proxy for `aptos_framework::randomness::next_32_bytes`.
    inline fun next_32_bytes(): vector<u8> {
        bcs::to_bytes(transaction_context::generate_auid_address())
    }

}