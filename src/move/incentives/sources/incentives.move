module incentives::incentives {

    use aptos_framework::aptos_account;
    use aptos_framework::event;
    use std::signer;

    #[test_only] use aptos_framework::account::{create_signer_for_test as get_signer};
    #[test_only] use aptos_framework::aptos_coin::AptosCoin;
    #[test_only] use aptos_framework::coin;
    #[test_only] use emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to;

    /// Signer is not admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Signer is not sender.
    const E_NOT_SENDER: u64 = 1;

    struct Roles has key {
        admin: address,
        sender: address
    }

    #[event]
    struct Send has copy, drop, store {
        sender: address,
        recipient: address,
        amount: u64
    }

    public entry fun send(sender: &signer, recipient: address, amount: u64) acquires Roles {
        let manifest_ref = borrow_global<Roles>(@incentives);
        let sender_address = signer::address_of(sender);
        assert!(sender_address == manifest_ref.sender, E_NOT_SENDER);
        aptos_account::transfer(sender, recipient, amount);
        event::emit(Send { sender: sender_address, recipient, amount });
    }

    public entry fun set_admin(admin: &signer, new_admin: address) acquires Roles {
        let manifest_ref_mut = borrow_global_mut<Roles>(@incentives);
        assert!(signer::address_of(admin) == manifest_ref_mut.admin, E_NOT_ADMIN);
        manifest_ref_mut.admin = new_admin;
    }

    public entry fun set_sender(admin: &signer, new_sender: address) acquires Roles {
        let manifest_ref_mut = borrow_global_mut<Roles>(@incentives);
        assert!(signer::address_of(admin) == manifest_ref_mut.admin, E_NOT_ADMIN);
        manifest_ref_mut.sender = new_sender;
    }

    fun init_module(publisher: &signer) {
        let publisher_address = signer::address_of(publisher);
        move_to(publisher, Roles {
            admin: publisher_address,
            sender: publisher_address
        });
    }

    #[test] fun test_end_to_end() acquires Roles {
        // Declare addresses, signers.
        let new_admin_address = @0xabc;
        let new_sender_address = @0xdef;
        let recipient_0 = @0x123;
        let recipient_1 = @0x234;
        let recipient_2 = @0x345;
        let publisher = get_signer(@incentives);
        let new_admin = get_signer(new_admin_address);
        let new_sender = get_signer(new_sender_address);

        // Declare send amounts.
        let send_amount_0 = 123;
        let send_amount_1 = 234;
        let send_amount_2 = 345;

        // Init module, send to recipient.
        init_module(&publisher);
        mint_aptos_coin_to(@incentives, send_amount_0);
        send(&publisher, recipient_0, send_amount_0);

        // Change admin, do another send.
        set_admin(&publisher, new_admin_address);
        mint_aptos_coin_to(@incentives, send_amount_1);
        send(&publisher, recipient_1, send_amount_1);

        // Change sender, do another send.
        set_sender(&new_admin, new_sender_address);
        mint_aptos_coin_to(new_sender_address, send_amount_2);
        send(&new_sender, recipient_2, send_amount_2);

        // Check balances, events.
        assert!(coin::balance<AptosCoin>(recipient_0) == send_amount_0, 0);
        assert!(coin::balance<AptosCoin>(recipient_1) == send_amount_1, 0);
        assert!(coin::balance<AptosCoin>(recipient_2) == send_amount_2, 0);
        assert!(event::emitted_events<Send>() == vector[
            Send {
                sender: @incentives,
                recipient: recipient_0,
                amount: send_amount_0
            },
            Send {
                sender: @incentives,
                recipient: recipient_1,
                amount: send_amount_1
            },
            Send {
                sender: new_sender_address,
                recipient: recipient_2,
                amount: send_amount_2
            },
        ], 0);
    }

    #[test, expected_failure(
        abort_code = E_NOT_SENDER
    )] fun test_send_not_sender() acquires Roles {
        init_module(&get_signer(@incentives));
        let impostor = @0x13245678;
        send(&get_signer(impostor), impostor, 10000000000);
    }

    #[test, expected_failure(
        abort_code = E_NOT_ADMIN
    )] fun test_set_admin_not_admin() acquires Roles {
        init_module(&get_signer(@incentives));
        let impostor = @0x13245678;
        set_admin(&get_signer(impostor), impostor);
    }

    #[test, expected_failure(
        abort_code = E_NOT_ADMIN
    )] fun test_set_sender_not_admin() acquires Roles {
        init_module(&get_signer(@incentives));
        let impostor = @0x13245678;
        set_sender(&get_signer(impostor), impostor);
    }

}
