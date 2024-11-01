module rewards::emojicoin_dot_fun_access_code {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::event;

    /// Resource account address seed for the access code vault, uses a different seed from base
    /// rewards to prevent a seed collision.
    const VAULT: vector<u8> = b"AccessCodeVault";

    const OCTAS_PER_APT: u64 = 100_000_000;
    const APT_PER_REDEMPTION: u64 = 5;

    struct Vault has key {
        signer_capability: SignerCapability
    }

    #[event]
    struct EmojicoinDotFunAccessCodeRedemption has copy, drop, store {
        claimant: address
    }
}
