#[test_only] module emojicoin_dot_fun::tests {

    use aptos_framework::account;
    use aptos_framework::timestamp;
    use emojicoin_dot_fun::emojicoin_dot_fun;

    public fun init_package() {
        let framework_signer = account::create_signer_for_test(@aptos_framework);
        let emojicoin_dot_fun_signer = account::create_signer_for_test(@emojicoin_dot_fun);
        timestamp::set_time_has_started_for_testing(&framework_signer);
        emojicoin_dot_fun::init_module_for_testing(&emojicoin_dot_fun_signer);
    }

}