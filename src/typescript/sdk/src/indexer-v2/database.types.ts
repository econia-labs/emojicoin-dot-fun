export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      __diesel_schema_migrations: {
        Row: {
          run_on: string
          version: string
        }
        Insert: {
          run_on?: string
          version: string
        }
        Update: {
          run_on?: string
          version?: string
        }
        Relationships: []
      }
      account_transactions: {
        Row: {
          account_address: string
          inserted_at: string
          transaction_version: number
        }
        Insert: {
          account_address: string
          inserted_at?: string
          transaction_version: number
        }
        Update: {
          account_address?: string
          inserted_at?: string
          transaction_version?: number
        }
        Relationships: []
      }
      ans_lookup: {
        Row: {
          domain: string
          expiration_timestamp: string | null
          inserted_at: string
          is_deleted: boolean
          registered_address: string | null
          subdomain: string
          token_name: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          domain: string
          expiration_timestamp?: string | null
          inserted_at?: string
          is_deleted: boolean
          registered_address?: string | null
          subdomain: string
          token_name: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          domain?: string
          expiration_timestamp?: string | null
          inserted_at?: string
          is_deleted?: boolean
          registered_address?: string | null
          subdomain?: string
          token_name?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      ans_lookup_v2: {
        Row: {
          domain: string
          expiration_timestamp: string | null
          inserted_at: string
          is_deleted: boolean
          registered_address: string | null
          subdomain: string
          subdomain_expiration_policy: number | null
          token_name: string
          token_standard: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          domain: string
          expiration_timestamp?: string | null
          inserted_at?: string
          is_deleted: boolean
          registered_address?: string | null
          subdomain: string
          subdomain_expiration_policy?: number | null
          token_name: string
          token_standard: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          domain?: string
          expiration_timestamp?: string | null
          inserted_at?: string
          is_deleted?: boolean
          registered_address?: string | null
          subdomain?: string
          subdomain_expiration_policy?: number | null
          token_name?: string
          token_standard?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      ans_primary_name: {
        Row: {
          domain: string | null
          inserted_at: string
          is_deleted: boolean
          registered_address: string
          subdomain: string | null
          token_name: string | null
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          domain?: string | null
          inserted_at?: string
          is_deleted: boolean
          registered_address: string
          subdomain?: string | null
          token_name?: string | null
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          domain?: string | null
          inserted_at?: string
          is_deleted?: boolean
          registered_address?: string
          subdomain?: string | null
          token_name?: string | null
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      ans_primary_name_v2: {
        Row: {
          domain: string | null
          inserted_at: string
          is_deleted: boolean
          registered_address: string
          subdomain: string | null
          token_name: string | null
          token_standard: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          domain?: string | null
          inserted_at?: string
          is_deleted: boolean
          registered_address: string
          subdomain?: string | null
          token_name?: string | null
          token_standard: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          domain?: string | null
          inserted_at?: string
          is_deleted?: boolean
          registered_address?: string
          subdomain?: string | null
          token_name?: string | null
          token_standard?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      block_metadata_transactions: {
        Row: {
          block_height: number
          epoch: number
          failed_proposer_indices: Json
          id: string
          inserted_at: string
          previous_block_votes_bitvec: Json
          proposer: string
          round: number
          timestamp: string
          version: number
        }
        Insert: {
          block_height: number
          epoch: number
          failed_proposer_indices: Json
          id: string
          inserted_at?: string
          previous_block_votes_bitvec: Json
          proposer: string
          round: number
          timestamp: string
          version: number
        }
        Update: {
          block_height?: number
          epoch?: number
          failed_proposer_indices?: Json
          id?: string
          inserted_at?: string
          previous_block_votes_bitvec?: Json
          proposer?: string
          round?: number
          timestamp?: string
          version?: number
        }
        Relationships: []
      }
      chat_events: {
        Row: {
          balance_as_fraction_of_circulating_supply_q64: number
          bump_time: string
          circulating_supply: number
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function: string | null
          inserted_at: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          message: string
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          user: string
          user_emojicoin_balance: number
        }
        Insert: {
          balance_as_fraction_of_circulating_supply_q64: number
          bump_time: string
          circulating_supply: number
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function?: string | null
          inserted_at?: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          message: string
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          user: string
          user_emojicoin_balance: number
        }
        Update: {
          balance_as_fraction_of_circulating_supply_q64?: number
          bump_time?: string
          circulating_supply?: number
          clamm_virtual_reserves_base?: number
          clamm_virtual_reserves_quote?: number
          cpamm_real_reserves_base?: number
          cpamm_real_reserves_quote?: number
          cumulative_stats_base_volume?: number
          cumulative_stats_integrator_fees?: number
          cumulative_stats_n_chat_messages?: number
          cumulative_stats_n_swaps?: number
          cumulative_stats_pool_fees_base?: number
          cumulative_stats_pool_fees_quote?: number
          cumulative_stats_quote_volume?: number
          entry_function?: string | null
          inserted_at?: string
          instantaneous_stats_fully_diluted_value?: number
          instantaneous_stats_market_cap?: number
          instantaneous_stats_total_quote_locked?: number
          instantaneous_stats_total_value_locked?: number
          last_swap_avg_execution_price_q64?: number
          last_swap_base_volume?: number
          last_swap_is_sell?: boolean
          last_swap_nonce?: number
          last_swap_quote_volume?: number
          last_swap_time?: string
          lp_coin_supply?: number
          market_id?: number
          market_nonce?: number
          message?: string
          sender?: string
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
          user?: string
          user_emojicoin_balance?: number
        }
        Relationships: []
      }
      coin_activities: {
        Row: {
          activity_type: string
          amount: number
          block_height: number
          coin_type: string
          entry_function_id_str: string | null
          event_account_address: string
          event_creation_number: number
          event_index: number | null
          event_sequence_number: number
          gas_fee_payer_address: string | null
          inserted_at: string
          is_gas_fee: boolean
          is_transaction_success: boolean
          owner_address: string
          storage_refund_amount: number
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          activity_type: string
          amount: number
          block_height: number
          coin_type: string
          entry_function_id_str?: string | null
          event_account_address: string
          event_creation_number: number
          event_index?: number | null
          event_sequence_number: number
          gas_fee_payer_address?: string | null
          inserted_at?: string
          is_gas_fee: boolean
          is_transaction_success: boolean
          owner_address: string
          storage_refund_amount?: number
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          activity_type?: string
          amount?: number
          block_height?: number
          coin_type?: string
          entry_function_id_str?: string | null
          event_account_address?: string
          event_creation_number?: number
          event_index?: number | null
          event_sequence_number?: number
          gas_fee_payer_address?: string | null
          inserted_at?: string
          is_gas_fee?: boolean
          is_transaction_success?: boolean
          owner_address?: string
          storage_refund_amount?: number
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      coin_balances: {
        Row: {
          amount: number
          coin_type: string
          coin_type_hash: string
          inserted_at: string
          owner_address: string
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          amount: number
          coin_type: string
          coin_type_hash: string
          inserted_at?: string
          owner_address: string
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          amount?: number
          coin_type?: string
          coin_type_hash?: string
          inserted_at?: string
          owner_address?: string
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      coin_infos: {
        Row: {
          coin_type: string
          coin_type_hash: string
          creator_address: string
          decimals: number
          inserted_at: string
          name: string
          supply_aggregator_table_handle: string | null
          supply_aggregator_table_key: string | null
          symbol: string
          transaction_created_timestamp: string
          transaction_version_created: number
        }
        Insert: {
          coin_type: string
          coin_type_hash: string
          creator_address: string
          decimals: number
          inserted_at?: string
          name: string
          supply_aggregator_table_handle?: string | null
          supply_aggregator_table_key?: string | null
          symbol: string
          transaction_created_timestamp: string
          transaction_version_created: number
        }
        Update: {
          coin_type?: string
          coin_type_hash?: string
          creator_address?: string
          decimals?: number
          inserted_at?: string
          name?: string
          supply_aggregator_table_handle?: string | null
          supply_aggregator_table_key?: string | null
          symbol?: string
          transaction_created_timestamp?: string
          transaction_version_created?: number
        }
        Relationships: []
      }
      coin_supply: {
        Row: {
          coin_type: string
          coin_type_hash: string
          inserted_at: string
          supply: number
          transaction_epoch: number
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          coin_type: string
          coin_type_hash: string
          inserted_at?: string
          supply: number
          transaction_epoch: number
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          coin_type?: string
          coin_type_hash?: string
          inserted_at?: string
          supply?: number
          transaction_epoch?: number
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      collection_datas: {
        Row: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          description: string
          description_mutable: boolean
          inserted_at: string
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          supply: number
          table_handle: string
          transaction_timestamp: string
          transaction_version: number
          uri_mutable: boolean
        }
        Insert: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          description: string
          description_mutable: boolean
          inserted_at?: string
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          supply: number
          table_handle: string
          transaction_timestamp: string
          transaction_version: number
          uri_mutable: boolean
        }
        Update: {
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          description?: string
          description_mutable?: boolean
          inserted_at?: string
          maximum?: number
          maximum_mutable?: boolean
          metadata_uri?: string
          supply?: number
          table_handle?: string
          transaction_timestamp?: string
          transaction_version?: number
          uri_mutable?: boolean
        }
        Relationships: []
      }
      collections_v2: {
        Row: {
          collection_id: string
          collection_name: string
          collection_properties: Json | null
          creator_address: string
          current_supply: number
          description: string
          inserted_at: string
          max_supply: number | null
          mutable_description: boolean | null
          mutable_uri: boolean | null
          table_handle_v1: string | null
          token_standard: string
          total_minted_v2: number | null
          transaction_timestamp: string
          transaction_version: number
          uri: string
          write_set_change_index: number
        }
        Insert: {
          collection_id: string
          collection_name: string
          collection_properties?: Json | null
          creator_address: string
          current_supply: number
          description: string
          inserted_at?: string
          max_supply?: number | null
          mutable_description?: boolean | null
          mutable_uri?: boolean | null
          table_handle_v1?: string | null
          token_standard: string
          total_minted_v2?: number | null
          transaction_timestamp: string
          transaction_version: number
          uri: string
          write_set_change_index: number
        }
        Update: {
          collection_id?: string
          collection_name?: string
          collection_properties?: Json | null
          creator_address?: string
          current_supply?: number
          description?: string
          inserted_at?: string
          max_supply?: number | null
          mutable_description?: boolean | null
          mutable_uri?: boolean | null
          table_handle_v1?: string | null
          token_standard?: string
          total_minted_v2?: number | null
          transaction_timestamp?: string
          transaction_version?: number
          uri?: string
          write_set_change_index?: number
        }
        Relationships: []
      }
      current_ans_lookup: {
        Row: {
          domain: string
          expiration_timestamp: string
          inserted_at: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string | null
          subdomain: string
          token_name: string
        }
        Insert: {
          domain: string
          expiration_timestamp: string
          inserted_at?: string
          is_deleted?: boolean
          last_transaction_version: number
          registered_address?: string | null
          subdomain: string
          token_name?: string
        }
        Update: {
          domain?: string
          expiration_timestamp?: string
          inserted_at?: string
          is_deleted?: boolean
          last_transaction_version?: number
          registered_address?: string | null
          subdomain?: string
          token_name?: string
        }
        Relationships: []
      }
      current_ans_lookup_v2: {
        Row: {
          domain: string
          expiration_timestamp: string
          inserted_at: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string | null
          subdomain: string
          subdomain_expiration_policy: number | null
          token_name: string | null
          token_standard: string
        }
        Insert: {
          domain: string
          expiration_timestamp: string
          inserted_at?: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address?: string | null
          subdomain: string
          subdomain_expiration_policy?: number | null
          token_name?: string | null
          token_standard: string
        }
        Update: {
          domain?: string
          expiration_timestamp?: string
          inserted_at?: string
          is_deleted?: boolean
          last_transaction_version?: number
          registered_address?: string | null
          subdomain?: string
          subdomain_expiration_policy?: number | null
          token_name?: string | null
          token_standard?: string
        }
        Relationships: []
      }
      current_ans_primary_name: {
        Row: {
          domain: string | null
          inserted_at: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string
          subdomain: string | null
          token_name: string | null
        }
        Insert: {
          domain?: string | null
          inserted_at?: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string
          subdomain?: string | null
          token_name?: string | null
        }
        Update: {
          domain?: string | null
          inserted_at?: string
          is_deleted?: boolean
          last_transaction_version?: number
          registered_address?: string
          subdomain?: string | null
          token_name?: string | null
        }
        Relationships: []
      }
      current_ans_primary_name_v2: {
        Row: {
          domain: string | null
          inserted_at: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string
          subdomain: string | null
          token_name: string | null
          token_standard: string
        }
        Insert: {
          domain?: string | null
          inserted_at?: string
          is_deleted: boolean
          last_transaction_version: number
          registered_address: string
          subdomain?: string | null
          token_name?: string | null
          token_standard: string
        }
        Update: {
          domain?: string | null
          inserted_at?: string
          is_deleted?: boolean
          last_transaction_version?: number
          registered_address?: string
          subdomain?: string | null
          token_name?: string | null
          token_standard?: string
        }
        Relationships: []
      }
      current_coin_balances: {
        Row: {
          amount: number
          coin_type: string
          coin_type_hash: string
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          owner_address: string
        }
        Insert: {
          amount: number
          coin_type: string
          coin_type_hash: string
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          owner_address: string
        }
        Update: {
          amount?: number
          coin_type?: string
          coin_type_hash?: string
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          owner_address?: string
        }
        Relationships: []
      }
      current_collection_datas: {
        Row: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          description: string
          description_mutable: boolean
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          supply: number
          table_handle: string
          uri_mutable: boolean
        }
        Insert: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          description: string
          description_mutable: boolean
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          supply: number
          table_handle: string
          uri_mutable: boolean
        }
        Update: {
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          description?: string
          description_mutable?: boolean
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          maximum?: number
          maximum_mutable?: boolean
          metadata_uri?: string
          supply?: number
          table_handle?: string
          uri_mutable?: boolean
        }
        Relationships: []
      }
      current_collections_v2: {
        Row: {
          collection_id: string
          collection_name: string
          collection_properties: Json | null
          creator_address: string
          current_supply: number
          description: string
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          max_supply: number | null
          mutable_description: boolean | null
          mutable_uri: boolean | null
          table_handle_v1: string | null
          token_standard: string
          total_minted_v2: number | null
          uri: string
        }
        Insert: {
          collection_id: string
          collection_name: string
          collection_properties?: Json | null
          creator_address: string
          current_supply: number
          description: string
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          max_supply?: number | null
          mutable_description?: boolean | null
          mutable_uri?: boolean | null
          table_handle_v1?: string | null
          token_standard: string
          total_minted_v2?: number | null
          uri: string
        }
        Update: {
          collection_id?: string
          collection_name?: string
          collection_properties?: Json | null
          creator_address?: string
          current_supply?: number
          description?: string
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          max_supply?: number | null
          mutable_description?: boolean | null
          mutable_uri?: boolean | null
          table_handle_v1?: string | null
          token_standard?: string
          total_minted_v2?: number | null
          uri?: string
        }
        Relationships: []
      }
      current_delegated_staking_pool_balances: {
        Row: {
          active_table_handle: string
          inactive_table_handle: string
          inserted_at: string
          last_transaction_version: number
          operator_commission_percentage: number
          staking_pool_address: string
          total_coins: number
          total_shares: number
        }
        Insert: {
          active_table_handle: string
          inactive_table_handle: string
          inserted_at?: string
          last_transaction_version: number
          operator_commission_percentage: number
          staking_pool_address: string
          total_coins: number
          total_shares: number
        }
        Update: {
          active_table_handle?: string
          inactive_table_handle?: string
          inserted_at?: string
          last_transaction_version?: number
          operator_commission_percentage?: number
          staking_pool_address?: string
          total_coins?: number
          total_shares?: number
        }
        Relationships: []
      }
      current_delegated_voter: {
        Row: {
          delegation_pool_address: string
          delegator_address: string
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          pending_voter: string | null
          table_handle: string | null
          voter: string | null
        }
        Insert: {
          delegation_pool_address: string
          delegator_address: string
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          pending_voter?: string | null
          table_handle?: string | null
          voter?: string | null
        }
        Update: {
          delegation_pool_address?: string
          delegator_address?: string
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          pending_voter?: string | null
          table_handle?: string | null
          voter?: string | null
        }
        Relationships: []
      }
      current_delegator_balances: {
        Row: {
          delegator_address: string
          inserted_at: string
          last_transaction_version: number
          parent_table_handle: string
          pool_address: string
          pool_type: string
          shares: number
          table_handle: string
        }
        Insert: {
          delegator_address: string
          inserted_at?: string
          last_transaction_version: number
          parent_table_handle: string
          pool_address: string
          pool_type: string
          shares: number
          table_handle: string
        }
        Update: {
          delegator_address?: string
          inserted_at?: string
          last_transaction_version?: number
          parent_table_handle?: string
          pool_address?: string
          pool_type?: string
          shares?: number
          table_handle?: string
        }
        Relationships: []
      }
      current_fungible_asset_balances: {
        Row: {
          amount: number
          asset_type: string
          inserted_at: string
          is_frozen: boolean
          is_primary: boolean
          last_transaction_timestamp: string
          last_transaction_version: number
          owner_address: string
          storage_id: string
          token_standard: string
        }
        Insert: {
          amount: number
          asset_type: string
          inserted_at?: string
          is_frozen: boolean
          is_primary: boolean
          last_transaction_timestamp: string
          last_transaction_version: number
          owner_address: string
          storage_id: string
          token_standard: string
        }
        Update: {
          amount?: number
          asset_type?: string
          inserted_at?: string
          is_frozen?: boolean
          is_primary?: boolean
          last_transaction_timestamp?: string
          last_transaction_version?: number
          owner_address?: string
          storage_id?: string
          token_standard?: string
        }
        Relationships: []
      }
      current_objects: {
        Row: {
          allow_ungated_transfer: boolean
          inserted_at: string
          is_deleted: boolean
          last_guid_creation_num: number
          last_transaction_version: number
          object_address: string
          owner_address: string
          state_key_hash: string
          untransferrable: boolean
        }
        Insert: {
          allow_ungated_transfer: boolean
          inserted_at?: string
          is_deleted: boolean
          last_guid_creation_num: number
          last_transaction_version: number
          object_address: string
          owner_address: string
          state_key_hash: string
          untransferrable?: boolean
        }
        Update: {
          allow_ungated_transfer?: boolean
          inserted_at?: string
          is_deleted?: boolean
          last_guid_creation_num?: number
          last_transaction_version?: number
          object_address?: string
          owner_address?: string
          state_key_hash?: string
          untransferrable?: boolean
        }
        Relationships: []
      }
      current_staking_pool_voter: {
        Row: {
          inserted_at: string
          last_transaction_version: number
          operator_address: string
          staking_pool_address: string
          voter_address: string
        }
        Insert: {
          inserted_at?: string
          last_transaction_version: number
          operator_address: string
          staking_pool_address: string
          voter_address: string
        }
        Update: {
          inserted_at?: string
          last_transaction_version?: number
          operator_address?: string
          staking_pool_address?: string
          voter_address?: string
        }
        Relationships: []
      }
      current_table_items: {
        Row: {
          decoded_key: Json
          decoded_value: Json | null
          inserted_at: string
          is_deleted: boolean
          key: string
          key_hash: string
          last_transaction_version: number
          table_handle: string
        }
        Insert: {
          decoded_key: Json
          decoded_value?: Json | null
          inserted_at?: string
          is_deleted: boolean
          key: string
          key_hash: string
          last_transaction_version: number
          table_handle: string
        }
        Update: {
          decoded_key?: Json
          decoded_value?: Json | null
          inserted_at?: string
          is_deleted?: boolean
          key?: string
          key_hash?: string
          last_transaction_version?: number
          table_handle?: string
        }
        Relationships: []
      }
      current_token_datas: {
        Row: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          default_properties: Json
          description: string
          description_mutable: boolean
          inserted_at: string
          largest_property_version: number
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          name: string
          payee_address: string
          properties_mutable: boolean
          royalty_mutable: boolean
          royalty_points_denominator: number
          royalty_points_numerator: number
          supply: number
          token_data_id_hash: string
          uri_mutable: boolean
        }
        Insert: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          default_properties: Json
          description: string
          description_mutable: boolean
          inserted_at?: string
          largest_property_version: number
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          name: string
          payee_address: string
          properties_mutable: boolean
          royalty_mutable: boolean
          royalty_points_denominator: number
          royalty_points_numerator: number
          supply: number
          token_data_id_hash: string
          uri_mutable: boolean
        }
        Update: {
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          default_properties?: Json
          description?: string
          description_mutable?: boolean
          inserted_at?: string
          largest_property_version?: number
          last_transaction_timestamp?: string
          last_transaction_version?: number
          maximum?: number
          maximum_mutable?: boolean
          metadata_uri?: string
          name?: string
          payee_address?: string
          properties_mutable?: boolean
          royalty_mutable?: boolean
          royalty_points_denominator?: number
          royalty_points_numerator?: number
          supply?: number
          token_data_id_hash?: string
          uri_mutable?: boolean
        }
        Relationships: []
      }
      current_token_datas_v2: {
        Row: {
          collection_id: string
          decimals: number | null
          description: string
          inserted_at: string
          is_deleted_v2: boolean | null
          is_fungible_v2: boolean | null
          largest_property_version_v1: number | null
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum: number | null
          supply: number | null
          token_data_id: string
          token_name: string
          token_properties: Json
          token_standard: string
          token_uri: string
        }
        Insert: {
          collection_id: string
          decimals?: number | null
          description: string
          inserted_at?: string
          is_deleted_v2?: boolean | null
          is_fungible_v2?: boolean | null
          largest_property_version_v1?: number | null
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum?: number | null
          supply?: number | null
          token_data_id: string
          token_name: string
          token_properties: Json
          token_standard: string
          token_uri: string
        }
        Update: {
          collection_id?: string
          decimals?: number | null
          description?: string
          inserted_at?: string
          is_deleted_v2?: boolean | null
          is_fungible_v2?: boolean | null
          largest_property_version_v1?: number | null
          last_transaction_timestamp?: string
          last_transaction_version?: number
          maximum?: number | null
          supply?: number | null
          token_data_id?: string
          token_name?: string
          token_properties?: Json
          token_standard?: string
          token_uri?: string
        }
        Relationships: []
      }
      current_token_ownerships: {
        Row: {
          amount: number
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          name: string
          owner_address: string
          property_version: number
          table_type: string
          token_data_id_hash: string
          token_properties: Json
        }
        Insert: {
          amount: number
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          name: string
          owner_address: string
          property_version: number
          table_type: string
          token_data_id_hash: string
          token_properties: Json
        }
        Update: {
          amount?: number
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          name?: string
          owner_address?: string
          property_version?: number
          table_type?: string
          token_data_id_hash?: string
          token_properties?: Json
        }
        Relationships: []
      }
      current_token_ownerships_v2: {
        Row: {
          amount: number
          inserted_at: string
          is_fungible_v2: boolean | null
          is_soulbound_v2: boolean | null
          last_transaction_timestamp: string
          last_transaction_version: number
          non_transferrable_by_owner: boolean | null
          owner_address: string
          property_version_v1: number
          storage_id: string
          table_type_v1: string | null
          token_data_id: string
          token_properties_mutated_v1: Json | null
          token_standard: string
        }
        Insert: {
          amount: number
          inserted_at?: string
          is_fungible_v2?: boolean | null
          is_soulbound_v2?: boolean | null
          last_transaction_timestamp: string
          last_transaction_version: number
          non_transferrable_by_owner?: boolean | null
          owner_address: string
          property_version_v1: number
          storage_id: string
          table_type_v1?: string | null
          token_data_id: string
          token_properties_mutated_v1?: Json | null
          token_standard: string
        }
        Update: {
          amount?: number
          inserted_at?: string
          is_fungible_v2?: boolean | null
          is_soulbound_v2?: boolean | null
          last_transaction_timestamp?: string
          last_transaction_version?: number
          non_transferrable_by_owner?: boolean | null
          owner_address?: string
          property_version_v1?: number
          storage_id?: string
          table_type_v1?: string | null
          token_data_id?: string
          token_properties_mutated_v1?: Json | null
          token_standard?: string
        }
        Relationships: []
      }
      current_token_pending_claims: {
        Row: {
          amount: number
          collection_data_id_hash: string
          collection_id: string
          collection_name: string
          creator_address: string
          from_address: string
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          name: string
          property_version: number
          table_handle: string
          to_address: string
          token_data_id: string
          token_data_id_hash: string
        }
        Insert: {
          amount: number
          collection_data_id_hash: string
          collection_id?: string
          collection_name: string
          creator_address: string
          from_address: string
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          name: string
          property_version: number
          table_handle: string
          to_address: string
          token_data_id?: string
          token_data_id_hash: string
        }
        Update: {
          amount?: number
          collection_data_id_hash?: string
          collection_id?: string
          collection_name?: string
          creator_address?: string
          from_address?: string
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          name?: string
          property_version?: number
          table_handle?: string
          to_address?: string
          token_data_id?: string
          token_data_id_hash?: string
        }
        Relationships: []
      }
      current_token_royalty_v1: {
        Row: {
          inserted_at: string
          last_transaction_timestamp: string
          last_transaction_version: number
          payee_address: string
          royalty_points_denominator: number
          royalty_points_numerator: number
          token_data_id: string
        }
        Insert: {
          inserted_at?: string
          last_transaction_timestamp: string
          last_transaction_version: number
          payee_address: string
          royalty_points_denominator: number
          royalty_points_numerator: number
          token_data_id: string
        }
        Update: {
          inserted_at?: string
          last_transaction_timestamp?: string
          last_transaction_version?: number
          payee_address?: string
          royalty_points_denominator?: number
          royalty_points_numerator?: number
          token_data_id?: string
        }
        Relationships: []
      }
      current_token_v2_metadata: {
        Row: {
          data: Json
          inserted_at: string
          last_transaction_version: number
          object_address: string
          resource_type: string
          state_key_hash: string
        }
        Insert: {
          data: Json
          inserted_at?: string
          last_transaction_version: number
          object_address: string
          resource_type: string
          state_key_hash: string
        }
        Update: {
          data?: Json
          inserted_at?: string
          last_transaction_version?: number
          object_address?: string
          resource_type?: string
          state_key_hash?: string
        }
        Relationships: []
      }
      current_unified_fungible_asset_balances_to_be_renamed: {
        Row: {
          amount: number | null
          amount_v1: number | null
          amount_v2: number | null
          asset_type: string | null
          asset_type_v1: string | null
          asset_type_v2: string | null
          inserted_at: string
          is_frozen: boolean
          is_primary: boolean | null
          last_transaction_timestamp: string | null
          last_transaction_timestamp_v1: string | null
          last_transaction_timestamp_v2: string | null
          last_transaction_version: number | null
          last_transaction_version_v1: number | null
          last_transaction_version_v2: number | null
          owner_address: string
          storage_id: string
          token_standard: string | null
        }
        Insert: {
          amount?: number | null
          amount_v1?: number | null
          amount_v2?: number | null
          asset_type?: string | null
          asset_type_v1?: string | null
          asset_type_v2?: string | null
          inserted_at?: string
          is_frozen: boolean
          is_primary?: boolean | null
          last_transaction_timestamp?: string | null
          last_transaction_timestamp_v1?: string | null
          last_transaction_timestamp_v2?: string | null
          last_transaction_version?: number | null
          last_transaction_version_v1?: number | null
          last_transaction_version_v2?: number | null
          owner_address: string
          storage_id: string
          token_standard?: string | null
        }
        Update: {
          amount?: number | null
          amount_v1?: number | null
          amount_v2?: number | null
          asset_type?: string | null
          asset_type_v1?: string | null
          asset_type_v2?: string | null
          inserted_at?: string
          is_frozen?: boolean
          is_primary?: boolean | null
          last_transaction_timestamp?: string | null
          last_transaction_timestamp_v1?: string | null
          last_transaction_timestamp_v2?: string | null
          last_transaction_version?: number | null
          last_transaction_version_v1?: number | null
          last_transaction_version_v2?: number | null
          owner_address?: string
          storage_id?: string
          token_standard?: string | null
        }
        Relationships: []
      }
      delegated_staking_activities: {
        Row: {
          amount: number
          delegator_address: string
          event_index: number
          event_type: string
          inserted_at: string
          pool_address: string
          transaction_version: number
        }
        Insert: {
          amount: number
          delegator_address: string
          event_index: number
          event_type: string
          inserted_at?: string
          pool_address: string
          transaction_version: number
        }
        Update: {
          amount?: number
          delegator_address?: string
          event_index?: number
          event_type?: string
          inserted_at?: string
          pool_address?: string
          transaction_version?: number
        }
        Relationships: []
      }
      delegated_staking_pool_balances: {
        Row: {
          active_table_handle: string
          inactive_table_handle: string
          inserted_at: string
          operator_commission_percentage: number
          staking_pool_address: string
          total_coins: number
          total_shares: number
          transaction_version: number
        }
        Insert: {
          active_table_handle: string
          inactive_table_handle: string
          inserted_at?: string
          operator_commission_percentage: number
          staking_pool_address: string
          total_coins: number
          total_shares: number
          transaction_version: number
        }
        Update: {
          active_table_handle?: string
          inactive_table_handle?: string
          inserted_at?: string
          operator_commission_percentage?: number
          staking_pool_address?: string
          total_coins?: number
          total_shares?: number
          transaction_version?: number
        }
        Relationships: []
      }
      delegated_staking_pools: {
        Row: {
          first_transaction_version: number
          inserted_at: string
          staking_pool_address: string
        }
        Insert: {
          first_transaction_version: number
          inserted_at?: string
          staking_pool_address: string
        }
        Update: {
          first_transaction_version?: number
          inserted_at?: string
          staking_pool_address?: string
        }
        Relationships: []
      }
      delegator_balances: {
        Row: {
          delegator_address: string
          inserted_at: string
          parent_table_handle: string
          pool_address: string
          pool_type: string
          shares: number
          table_handle: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          delegator_address: string
          inserted_at?: string
          parent_table_handle: string
          pool_address: string
          pool_type: string
          shares: number
          table_handle: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          delegator_address?: string
          inserted_at?: string
          parent_table_handle?: string
          pool_address?: string
          pool_type?: string
          shares?: number
          table_handle?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      event_size_info: {
        Row: {
          index: number
          inserted_at: string
          total_bytes: number
          transaction_version: number
          type_tag_bytes: number
        }
        Insert: {
          index: number
          inserted_at?: string
          total_bytes: number
          transaction_version: number
          type_tag_bytes: number
        }
        Update: {
          index?: number
          inserted_at?: string
          total_bytes?: number
          transaction_version?: number
          type_tag_bytes?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          account_address: string
          creation_number: number
          data: Json
          event_index: number
          indexed_type: string
          inserted_at: string
          sequence_number: number
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Insert: {
          account_address: string
          creation_number: number
          data: Json
          event_index: number
          indexed_type?: string
          inserted_at?: string
          sequence_number: number
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Update: {
          account_address?: string
          creation_number?: number
          data?: Json
          event_index?: number
          indexed_type?: string
          inserted_at?: string
          sequence_number?: number
          transaction_block_height?: number
          transaction_version?: number
          type?: string
        }
        Relationships: []
      }
      fungible_asset_activities: {
        Row: {
          amount: number | null
          asset_type: string | null
          block_height: number
          entry_function_id_str: string | null
          event_index: number
          gas_fee_payer_address: string | null
          inserted_at: string
          is_frozen: boolean | null
          is_gas_fee: boolean
          is_transaction_success: boolean
          owner_address: string | null
          storage_id: string
          storage_refund_amount: number
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          type: string
        }
        Insert: {
          amount?: number | null
          asset_type?: string | null
          block_height: number
          entry_function_id_str?: string | null
          event_index: number
          gas_fee_payer_address?: string | null
          inserted_at?: string
          is_frozen?: boolean | null
          is_gas_fee: boolean
          is_transaction_success: boolean
          owner_address?: string | null
          storage_id: string
          storage_refund_amount?: number
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          type: string
        }
        Update: {
          amount?: number | null
          asset_type?: string | null
          block_height?: number
          entry_function_id_str?: string | null
          event_index?: number
          gas_fee_payer_address?: string | null
          inserted_at?: string
          is_frozen?: boolean | null
          is_gas_fee?: boolean
          is_transaction_success?: boolean
          owner_address?: string | null
          storage_id?: string
          storage_refund_amount?: number
          token_standard?: string
          transaction_timestamp?: string
          transaction_version?: number
          type?: string
        }
        Relationships: []
      }
      fungible_asset_balances: {
        Row: {
          amount: number
          asset_type: string
          inserted_at: string
          is_frozen: boolean
          is_primary: boolean
          owner_address: string
          storage_id: string
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          amount: number
          asset_type: string
          inserted_at?: string
          is_frozen: boolean
          is_primary: boolean
          owner_address: string
          storage_id: string
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          amount?: number
          asset_type?: string
          inserted_at?: string
          is_frozen?: boolean
          is_primary?: boolean
          owner_address?: string
          storage_id?: string
          token_standard?: string
          transaction_timestamp?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      fungible_asset_metadata: {
        Row: {
          asset_type: string
          creator_address: string
          decimals: number
          icon_uri: string | null
          inserted_at: string
          is_token_v2: boolean | null
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum_v2: number | null
          name: string
          project_uri: string | null
          supply_aggregator_table_handle_v1: string | null
          supply_aggregator_table_key_v1: string | null
          supply_v2: number | null
          symbol: string
          token_standard: string
        }
        Insert: {
          asset_type: string
          creator_address: string
          decimals: number
          icon_uri?: string | null
          inserted_at?: string
          is_token_v2?: boolean | null
          last_transaction_timestamp: string
          last_transaction_version: number
          maximum_v2?: number | null
          name: string
          project_uri?: string | null
          supply_aggregator_table_handle_v1?: string | null
          supply_aggregator_table_key_v1?: string | null
          supply_v2?: number | null
          symbol: string
          token_standard: string
        }
        Update: {
          asset_type?: string
          creator_address?: string
          decimals?: number
          icon_uri?: string | null
          inserted_at?: string
          is_token_v2?: boolean | null
          last_transaction_timestamp?: string
          last_transaction_version?: number
          maximum_v2?: number | null
          name?: string
          project_uri?: string | null
          supply_aggregator_table_handle_v1?: string | null
          supply_aggregator_table_key_v1?: string | null
          supply_v2?: number | null
          symbol?: string
          token_standard?: string
        }
        Relationships: []
      }
      global_state_events: {
        Row: {
          cumulative_chat_messages: number
          cumulative_integrator_fees: number
          cumulative_quote_volume: number
          cumulative_swaps: number
          emit_time: string
          entry_function: string | null
          fully_diluted_value: number
          inserted_at: string
          market_cap: number
          registry_nonce: number
          sender: string
          total_quote_locked: number
          total_value_locked: number
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          cumulative_chat_messages: number
          cumulative_integrator_fees: number
          cumulative_quote_volume: number
          cumulative_swaps: number
          emit_time: string
          entry_function?: string | null
          fully_diluted_value: number
          inserted_at?: string
          market_cap: number
          registry_nonce: number
          sender: string
          total_quote_locked: number
          total_value_locked: number
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          cumulative_chat_messages?: number
          cumulative_integrator_fees?: number
          cumulative_quote_volume?: number
          cumulative_swaps?: number
          emit_time?: string
          entry_function?: string | null
          fully_diluted_value?: number
          inserted_at?: string
          market_cap?: number
          registry_nonce?: number
          sender?: string
          total_quote_locked?: number
          total_value_locked?: number
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: []
      }
      indexer_status: {
        Row: {
          db: string
          inserted_at: string
          is_indexer_up: boolean
        }
        Insert: {
          db: string
          inserted_at?: string
          is_indexer_up: boolean
        }
        Update: {
          db?: string
          inserted_at?: string
          is_indexer_up?: boolean
        }
        Relationships: []
      }
      ledger_infos: {
        Row: {
          chain_id: number
        }
        Insert: {
          chain_id: number
        }
        Update: {
          chain_id?: number
        }
        Relationships: []
      }
      liquidity_events: {
        Row: {
          base_amount: number
          base_donation_claim_amount: number
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function: string | null
          inserted_at: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          liquidity_provided: boolean
          lp_coin_amount: number
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          provider: string
          quote_amount: number
          quote_donation_claim_amount: number
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          base_amount: number
          base_donation_claim_amount: number
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function?: string | null
          inserted_at?: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          liquidity_provided: boolean
          lp_coin_amount: number
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          provider: string
          quote_amount: number
          quote_donation_claim_amount: number
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          base_amount?: number
          base_donation_claim_amount?: number
          bump_time?: string
          clamm_virtual_reserves_base?: number
          clamm_virtual_reserves_quote?: number
          cpamm_real_reserves_base?: number
          cpamm_real_reserves_quote?: number
          cumulative_stats_base_volume?: number
          cumulative_stats_integrator_fees?: number
          cumulative_stats_n_chat_messages?: number
          cumulative_stats_n_swaps?: number
          cumulative_stats_pool_fees_base?: number
          cumulative_stats_pool_fees_quote?: number
          cumulative_stats_quote_volume?: number
          entry_function?: string | null
          inserted_at?: string
          instantaneous_stats_fully_diluted_value?: number
          instantaneous_stats_market_cap?: number
          instantaneous_stats_total_quote_locked?: number
          instantaneous_stats_total_value_locked?: number
          last_swap_avg_execution_price_q64?: number
          last_swap_base_volume?: number
          last_swap_is_sell?: boolean
          last_swap_nonce?: number
          last_swap_quote_volume?: number
          last_swap_time?: string
          liquidity_provided?: boolean
          lp_coin_amount?: number
          lp_coin_supply?: number
          market_id?: number
          market_nonce?: number
          provider?: string
          quote_amount?: number
          quote_donation_claim_amount?: number
          sender?: string
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: []
      }
      market_1m_periods_in_last_day: {
        Row: {
          inserted_at: string
          market_id: number
          nonce: number
          start_time: string
          transaction_version: number
          volume: number
        }
        Insert: {
          inserted_at?: string
          market_id: number
          nonce: number
          start_time: string
          transaction_version: number
          volume: number
        }
        Update: {
          inserted_at?: string
          market_id?: number
          nonce?: number
          start_time?: string
          transaction_version?: number
          volume?: number
        }
        Relationships: []
      }
      market_latest_state_event: {
        Row: {
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          daily_tvl_per_lp_coin_growth_q64: number
          entry_function: string | null
          in_bonding_curve: boolean
          inserted_at: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          volume_in_1m_state_tracker: number
        }
        Insert: {
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          daily_tvl_per_lp_coin_growth_q64: number
          entry_function?: string | null
          in_bonding_curve: boolean
          inserted_at?: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          volume_in_1m_state_tracker: number
        }
        Update: {
          bump_time?: string
          clamm_virtual_reserves_base?: number
          clamm_virtual_reserves_quote?: number
          cpamm_real_reserves_base?: number
          cpamm_real_reserves_quote?: number
          cumulative_stats_base_volume?: number
          cumulative_stats_integrator_fees?: number
          cumulative_stats_n_chat_messages?: number
          cumulative_stats_n_swaps?: number
          cumulative_stats_pool_fees_base?: number
          cumulative_stats_pool_fees_quote?: number
          cumulative_stats_quote_volume?: number
          daily_tvl_per_lp_coin_growth_q64?: number
          entry_function?: string | null
          in_bonding_curve?: boolean
          inserted_at?: string
          instantaneous_stats_fully_diluted_value?: number
          instantaneous_stats_market_cap?: number
          instantaneous_stats_total_quote_locked?: number
          instantaneous_stats_total_value_locked?: number
          last_swap_avg_execution_price_q64?: number
          last_swap_base_volume?: number
          last_swap_is_sell?: boolean
          last_swap_nonce?: number
          last_swap_quote_volume?: number
          last_swap_time?: string
          lp_coin_supply?: number
          market_id?: number
          market_nonce?: number
          sender?: string
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
          volume_in_1m_state_tracker?: number
        }
        Relationships: []
      }
      market_registration_events: {
        Row: {
          bump_time: string
          entry_function: string | null
          inserted_at: string
          integrator: string
          integrator_fee: number
          market_id: number
          market_nonce: number
          registrant: string
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          bump_time: string
          entry_function?: string | null
          inserted_at?: string
          integrator: string
          integrator_fee: number
          market_id: number
          market_nonce: number
          registrant: string
          sender: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          bump_time?: string
          entry_function?: string | null
          inserted_at?: string
          integrator?: string
          integrator_fee?: number
          market_id?: number
          market_nonce?: number
          registrant?: string
          sender?: string
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: []
      }
      move_modules: {
        Row: {
          address: string
          bytecode: string | null
          exposed_functions: Json | null
          friends: Json | null
          inserted_at: string
          is_deleted: boolean
          name: string
          structs: Json | null
          transaction_block_height: number
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          address: string
          bytecode?: string | null
          exposed_functions?: Json | null
          friends?: Json | null
          inserted_at?: string
          is_deleted: boolean
          name: string
          structs?: Json | null
          transaction_block_height: number
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          address?: string
          bytecode?: string | null
          exposed_functions?: Json | null
          friends?: Json | null
          inserted_at?: string
          is_deleted?: boolean
          name?: string
          structs?: Json | null
          transaction_block_height?: number
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      move_resources: {
        Row: {
          address: string
          data: Json | null
          generic_type_params: Json | null
          inserted_at: string
          is_deleted: boolean
          module: string
          name: string
          state_key_hash: string
          transaction_block_height: number
          transaction_version: number
          type: string
          write_set_change_index: number
        }
        Insert: {
          address: string
          data?: Json | null
          generic_type_params?: Json | null
          inserted_at?: string
          is_deleted: boolean
          module: string
          name: string
          state_key_hash?: string
          transaction_block_height: number
          transaction_version: number
          type: string
          write_set_change_index: number
        }
        Update: {
          address?: string
          data?: Json | null
          generic_type_params?: Json | null
          inserted_at?: string
          is_deleted?: boolean
          module?: string
          name?: string
          state_key_hash?: string
          transaction_block_height?: number
          transaction_version?: number
          type?: string
          write_set_change_index?: number
        }
        Relationships: []
      }
      nft_points: {
        Row: {
          amount: number
          inserted_at: string
          owner_address: string
          point_type: string
          token_name: string
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          amount: number
          inserted_at?: string
          owner_address: string
          point_type: string
          token_name: string
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          amount?: number
          inserted_at?: string
          owner_address?: string
          point_type?: string
          token_name?: string
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      objects: {
        Row: {
          allow_ungated_transfer: boolean
          guid_creation_num: number
          inserted_at: string
          is_deleted: boolean
          object_address: string
          owner_address: string
          state_key_hash: string
          transaction_version: number
          untransferrable: boolean
          write_set_change_index: number
        }
        Insert: {
          allow_ungated_transfer: boolean
          guid_creation_num: number
          inserted_at?: string
          is_deleted: boolean
          object_address: string
          owner_address: string
          state_key_hash: string
          transaction_version: number
          untransferrable?: boolean
          write_set_change_index: number
        }
        Update: {
          allow_ungated_transfer?: boolean
          guid_creation_num?: number
          inserted_at?: string
          is_deleted?: boolean
          object_address?: string
          owner_address?: string
          state_key_hash?: string
          transaction_version?: number
          untransferrable?: boolean
          write_set_change_index?: number
        }
        Relationships: []
      }
      periodic_state_events: {
        Row: {
          close_price_q64: number
          emit_time: string
          ends_in_bonding_curve: boolean
          entry_function: string | null
          high_price_q64: number
          inserted_at: string
          integrator_fees: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          low_price_q64: number
          market_id: number
          market_nonce: number
          n_chat_messages: number
          n_swaps: number
          open_price_q64: number
          period: Database["public"]["Enums"]["period_type"]
          pool_fees_base: number
          pool_fees_quote: number
          sender: string
          start_time: string
          starts_in_bonding_curve: boolean
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          tvl_per_lp_coin_growth_q64: number
          volume_base: number
          volume_quote: number
        }
        Insert: {
          close_price_q64: number
          emit_time: string
          ends_in_bonding_curve: boolean
          entry_function?: string | null
          high_price_q64: number
          inserted_at?: string
          integrator_fees: number
          last_swap_avg_execution_price_q64: number
          last_swap_base_volume: number
          last_swap_is_sell: boolean
          last_swap_nonce: number
          last_swap_quote_volume: number
          last_swap_time: string
          low_price_q64: number
          market_id: number
          market_nonce: number
          n_chat_messages: number
          n_swaps: number
          open_price_q64: number
          period: Database["public"]["Enums"]["period_type"]
          pool_fees_base: number
          pool_fees_quote: number
          sender: string
          start_time: string
          starts_in_bonding_curve: boolean
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
          tvl_per_lp_coin_growth_q64: number
          volume_base: number
          volume_quote: number
        }
        Update: {
          close_price_q64?: number
          emit_time?: string
          ends_in_bonding_curve?: boolean
          entry_function?: string | null
          high_price_q64?: number
          inserted_at?: string
          integrator_fees?: number
          last_swap_avg_execution_price_q64?: number
          last_swap_base_volume?: number
          last_swap_is_sell?: boolean
          last_swap_nonce?: number
          last_swap_quote_volume?: number
          last_swap_time?: string
          low_price_q64?: number
          market_id?: number
          market_nonce?: number
          n_chat_messages?: number
          n_swaps?: number
          open_price_q64?: number
          period?: Database["public"]["Enums"]["period_type"]
          pool_fees_base?: number
          pool_fees_quote?: number
          sender?: string
          start_time?: string
          starts_in_bonding_curve?: boolean
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
          tvl_per_lp_coin_growth_q64?: number
          volume_base?: number
          volume_quote?: number
        }
        Relationships: []
      }
      processor_status: {
        Row: {
          last_success_version: number
          last_transaction_timestamp: string | null
          last_updated: string
          processor: string
        }
        Insert: {
          last_success_version: number
          last_transaction_timestamp?: string | null
          last_updated?: string
          processor: string
        }
        Update: {
          last_success_version?: number
          last_transaction_timestamp?: string | null
          last_updated?: string
          processor?: string
        }
        Relationships: []
      }
      proposal_votes: {
        Row: {
          inserted_at: string
          num_votes: number
          proposal_id: number
          should_pass: boolean
          staking_pool_address: string
          transaction_timestamp: string
          transaction_version: number
          voter_address: string
        }
        Insert: {
          inserted_at?: string
          num_votes: number
          proposal_id: number
          should_pass: boolean
          staking_pool_address: string
          transaction_timestamp: string
          transaction_version: number
          voter_address: string
        }
        Update: {
          inserted_at?: string
          num_votes?: number
          proposal_id?: number
          should_pass?: boolean
          staking_pool_address?: string
          transaction_timestamp?: string
          transaction_version?: number
          voter_address?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          inserted_at: string
          is_sender_primary: boolean
          multi_agent_index: number
          multi_sig_index: number
          public_key: string
          public_key_indices: Json
          signature: string
          signer: string
          threshold: number
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Insert: {
          inserted_at?: string
          is_sender_primary: boolean
          multi_agent_index: number
          multi_sig_index: number
          public_key: string
          public_key_indices: Json
          signature: string
          signer: string
          threshold: number
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Update: {
          inserted_at?: string
          is_sender_primary?: boolean
          multi_agent_index?: number
          multi_sig_index?: number
          public_key?: string
          public_key_indices?: Json
          signature?: string
          signer?: string
          threshold?: number
          transaction_block_height?: number
          transaction_version?: number
          type?: string
        }
        Relationships: []
      }
      spam_assets: {
        Row: {
          asset: string
          is_spam: boolean
          last_updated: string
        }
        Insert: {
          asset: string
          is_spam?: boolean
          last_updated?: string
        }
        Update: {
          asset?: string
          is_spam?: boolean
          last_updated?: string
        }
        Relationships: []
      }
      swap_events: {
        Row: {
          avg_execution_price_q64: number
          balance_as_fraction_of_circulating_supply_after_q64: number
          balance_as_fraction_of_circulating_supply_before_q64: number
          base_volume: number
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function: string | null
          input_amount: number
          inserted_at: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          integrator: string
          integrator_fee: number
          integrator_fee_rate_bps: number
          is_sell: boolean
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          net_proceeds: number
          pool_fee: number
          quote_volume: number
          results_in_state_transition: boolean
          sender: string
          starts_in_bonding_curve: boolean
          swapper: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          avg_execution_price_q64: number
          balance_as_fraction_of_circulating_supply_after_q64: number
          balance_as_fraction_of_circulating_supply_before_q64: number
          base_volume: number
          bump_time: string
          clamm_virtual_reserves_base: number
          clamm_virtual_reserves_quote: number
          cpamm_real_reserves_base: number
          cpamm_real_reserves_quote: number
          cumulative_stats_base_volume: number
          cumulative_stats_integrator_fees: number
          cumulative_stats_n_chat_messages: number
          cumulative_stats_n_swaps: number
          cumulative_stats_pool_fees_base: number
          cumulative_stats_pool_fees_quote: number
          cumulative_stats_quote_volume: number
          entry_function?: string | null
          input_amount: number
          inserted_at?: string
          instantaneous_stats_fully_diluted_value: number
          instantaneous_stats_market_cap: number
          instantaneous_stats_total_quote_locked: number
          instantaneous_stats_total_value_locked: number
          integrator: string
          integrator_fee: number
          integrator_fee_rate_bps: number
          is_sell: boolean
          lp_coin_supply: number
          market_id: number
          market_nonce: number
          net_proceeds: number
          pool_fee: number
          quote_volume: number
          results_in_state_transition: boolean
          sender: string
          starts_in_bonding_curve: boolean
          swapper: string
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          avg_execution_price_q64?: number
          balance_as_fraction_of_circulating_supply_after_q64?: number
          balance_as_fraction_of_circulating_supply_before_q64?: number
          base_volume?: number
          bump_time?: string
          clamm_virtual_reserves_base?: number
          clamm_virtual_reserves_quote?: number
          cpamm_real_reserves_base?: number
          cpamm_real_reserves_quote?: number
          cumulative_stats_base_volume?: number
          cumulative_stats_integrator_fees?: number
          cumulative_stats_n_chat_messages?: number
          cumulative_stats_n_swaps?: number
          cumulative_stats_pool_fees_base?: number
          cumulative_stats_pool_fees_quote?: number
          cumulative_stats_quote_volume?: number
          entry_function?: string | null
          input_amount?: number
          inserted_at?: string
          instantaneous_stats_fully_diluted_value?: number
          instantaneous_stats_market_cap?: number
          instantaneous_stats_total_quote_locked?: number
          instantaneous_stats_total_value_locked?: number
          integrator?: string
          integrator_fee?: number
          integrator_fee_rate_bps?: number
          is_sell?: boolean
          lp_coin_supply?: number
          market_id?: number
          market_nonce?: number
          net_proceeds?: number
          pool_fee?: number
          quote_volume?: number
          results_in_state_transition?: boolean
          sender?: string
          starts_in_bonding_curve?: boolean
          swapper?: string
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: []
      }
      table_items: {
        Row: {
          decoded_key: Json
          decoded_value: Json | null
          inserted_at: string
          is_deleted: boolean
          key: string
          table_handle: string
          transaction_block_height: number
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          decoded_key: Json
          decoded_value?: Json | null
          inserted_at?: string
          is_deleted: boolean
          key: string
          table_handle: string
          transaction_block_height: number
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          decoded_key?: Json
          decoded_value?: Json | null
          inserted_at?: string
          is_deleted?: boolean
          key?: string
          table_handle?: string
          transaction_block_height?: number
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      table_metadatas: {
        Row: {
          handle: string
          inserted_at: string
          key_type: string
          value_type: string
        }
        Insert: {
          handle: string
          inserted_at?: string
          key_type: string
          value_type: string
        }
        Update: {
          handle?: string
          inserted_at?: string
          key_type?: string
          value_type?: string
        }
        Relationships: []
      }
      token_activities: {
        Row: {
          coin_amount: number | null
          coin_type: string | null
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          event_account_address: string
          event_creation_number: number
          event_index: number | null
          event_sequence_number: number
          from_address: string | null
          inserted_at: string
          name: string
          property_version: number
          to_address: string | null
          token_amount: number
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
          transfer_type: string
        }
        Insert: {
          coin_amount?: number | null
          coin_type?: string | null
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          event_account_address: string
          event_creation_number: number
          event_index?: number | null
          event_sequence_number: number
          from_address?: string | null
          inserted_at?: string
          name: string
          property_version: number
          to_address?: string | null
          token_amount: number
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
          transfer_type: string
        }
        Update: {
          coin_amount?: number | null
          coin_type?: string | null
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          event_account_address?: string
          event_creation_number?: number
          event_index?: number | null
          event_sequence_number?: number
          from_address?: string | null
          inserted_at?: string
          name?: string
          property_version?: number
          to_address?: string | null
          token_amount?: number
          token_data_id_hash?: string
          transaction_timestamp?: string
          transaction_version?: number
          transfer_type?: string
        }
        Relationships: []
      }
      token_activities_v2: {
        Row: {
          after_value: string | null
          before_value: string | null
          entry_function_id_str: string | null
          event_account_address: string
          event_index: number
          from_address: string | null
          inserted_at: string
          is_fungible_v2: boolean | null
          property_version_v1: number
          to_address: string | null
          token_amount: number
          token_data_id: string
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          type: string
        }
        Insert: {
          after_value?: string | null
          before_value?: string | null
          entry_function_id_str?: string | null
          event_account_address: string
          event_index: number
          from_address?: string | null
          inserted_at?: string
          is_fungible_v2?: boolean | null
          property_version_v1: number
          to_address?: string | null
          token_amount: number
          token_data_id: string
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          type: string
        }
        Update: {
          after_value?: string | null
          before_value?: string | null
          entry_function_id_str?: string | null
          event_account_address?: string
          event_index?: number
          from_address?: string | null
          inserted_at?: string
          is_fungible_v2?: boolean | null
          property_version_v1?: number
          to_address?: string | null
          token_amount?: number
          token_data_id?: string
          token_standard?: string
          transaction_timestamp?: string
          transaction_version?: number
          type?: string
        }
        Relationships: []
      }
      token_datas: {
        Row: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          default_properties: Json
          description: string
          description_mutable: boolean
          inserted_at: string
          largest_property_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          name: string
          payee_address: string
          properties_mutable: boolean
          royalty_mutable: boolean
          royalty_points_denominator: number
          royalty_points_numerator: number
          supply: number
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
          uri_mutable: boolean
        }
        Insert: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          default_properties: Json
          description: string
          description_mutable: boolean
          inserted_at?: string
          largest_property_version: number
          maximum: number
          maximum_mutable: boolean
          metadata_uri: string
          name: string
          payee_address: string
          properties_mutable: boolean
          royalty_mutable: boolean
          royalty_points_denominator: number
          royalty_points_numerator: number
          supply: number
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
          uri_mutable: boolean
        }
        Update: {
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          default_properties?: Json
          description?: string
          description_mutable?: boolean
          inserted_at?: string
          largest_property_version?: number
          maximum?: number
          maximum_mutable?: boolean
          metadata_uri?: string
          name?: string
          payee_address?: string
          properties_mutable?: boolean
          royalty_mutable?: boolean
          royalty_points_denominator?: number
          royalty_points_numerator?: number
          supply?: number
          token_data_id_hash?: string
          transaction_timestamp?: string
          transaction_version?: number
          uri_mutable?: boolean
        }
        Relationships: []
      }
      token_datas_v2: {
        Row: {
          collection_id: string
          decimals: number | null
          description: string
          inserted_at: string
          is_deleted_v2: boolean | null
          is_fungible_v2: boolean | null
          largest_property_version_v1: number | null
          maximum: number | null
          supply: number | null
          token_data_id: string
          token_name: string
          token_properties: Json
          token_standard: string
          token_uri: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          collection_id: string
          decimals?: number | null
          description: string
          inserted_at?: string
          is_deleted_v2?: boolean | null
          is_fungible_v2?: boolean | null
          largest_property_version_v1?: number | null
          maximum?: number | null
          supply?: number | null
          token_data_id: string
          token_name: string
          token_properties: Json
          token_standard: string
          token_uri: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          collection_id?: string
          decimals?: number | null
          description?: string
          inserted_at?: string
          is_deleted_v2?: boolean | null
          is_fungible_v2?: boolean | null
          largest_property_version_v1?: number | null
          maximum?: number | null
          supply?: number | null
          token_data_id?: string
          token_name?: string
          token_properties?: Json
          token_standard?: string
          token_uri?: string
          transaction_timestamp?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      token_ownerships: {
        Row: {
          amount: number
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at: string
          name: string
          owner_address: string | null
          property_version: number
          table_handle: string
          table_type: string | null
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          amount: number
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at?: string
          name: string
          owner_address?: string | null
          property_version: number
          table_handle: string
          table_type?: string | null
          token_data_id_hash: string
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          amount?: number
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          inserted_at?: string
          name?: string
          owner_address?: string | null
          property_version?: number
          table_handle?: string
          table_type?: string | null
          token_data_id_hash?: string
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      token_ownerships_v2: {
        Row: {
          amount: number
          inserted_at: string
          is_fungible_v2: boolean | null
          is_soulbound_v2: boolean | null
          non_transferrable_by_owner: boolean | null
          owner_address: string | null
          property_version_v1: number
          storage_id: string
          table_type_v1: string | null
          token_data_id: string
          token_properties_mutated_v1: Json | null
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Insert: {
          amount: number
          inserted_at?: string
          is_fungible_v2?: boolean | null
          is_soulbound_v2?: boolean | null
          non_transferrable_by_owner?: boolean | null
          owner_address?: string | null
          property_version_v1: number
          storage_id: string
          table_type_v1?: string | null
          token_data_id: string
          token_properties_mutated_v1?: Json | null
          token_standard: string
          transaction_timestamp: string
          transaction_version: number
          write_set_change_index: number
        }
        Update: {
          amount?: number
          inserted_at?: string
          is_fungible_v2?: boolean | null
          is_soulbound_v2?: boolean | null
          non_transferrable_by_owner?: boolean | null
          owner_address?: string | null
          property_version_v1?: number
          storage_id?: string
          table_type_v1?: string | null
          token_data_id?: string
          token_properties_mutated_v1?: Json | null
          token_standard?: string
          transaction_timestamp?: string
          transaction_version?: number
          write_set_change_index?: number
        }
        Relationships: []
      }
      tokens: {
        Row: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at: string
          name: string
          property_version: number
          token_data_id_hash: string
          token_properties: Json
          transaction_timestamp: string
          transaction_version: number
        }
        Insert: {
          collection_data_id_hash: string
          collection_name: string
          creator_address: string
          inserted_at?: string
          name: string
          property_version: number
          token_data_id_hash: string
          token_properties: Json
          transaction_timestamp: string
          transaction_version: number
        }
        Update: {
          collection_data_id_hash?: string
          collection_name?: string
          creator_address?: string
          inserted_at?: string
          name?: string
          property_version?: number
          token_data_id_hash?: string
          token_properties?: Json
          transaction_timestamp?: string
          transaction_version?: number
        }
        Relationships: []
      }
      transaction_size_info: {
        Row: {
          inserted_at: string
          size_bytes: number
          transaction_version: number
        }
        Insert: {
          inserted_at?: string
          size_bytes: number
          transaction_version: number
        }
        Update: {
          inserted_at?: string
          size_bytes?: number
          transaction_version?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          accumulator_root_hash: string
          block_height: number
          epoch: number
          event_root_hash: string
          gas_used: number
          hash: string
          inserted_at: string
          num_events: number
          num_write_set_changes: number
          payload: Json | null
          payload_type: string | null
          state_change_hash: string
          state_checkpoint_hash: string | null
          success: boolean
          type: string
          version: number
          vm_status: string
        }
        Insert: {
          accumulator_root_hash: string
          block_height: number
          epoch: number
          event_root_hash: string
          gas_used: number
          hash: string
          inserted_at?: string
          num_events: number
          num_write_set_changes: number
          payload?: Json | null
          payload_type?: string | null
          state_change_hash: string
          state_checkpoint_hash?: string | null
          success: boolean
          type: string
          version: number
          vm_status: string
        }
        Update: {
          accumulator_root_hash?: string
          block_height?: number
          epoch?: number
          event_root_hash?: string
          gas_used?: number
          hash?: string
          inserted_at?: string
          num_events?: number
          num_write_set_changes?: number
          payload?: Json | null
          payload_type?: string | null
          state_change_hash?: string
          state_checkpoint_hash?: string | null
          success?: boolean
          type?: string
          version?: number
          vm_status?: string
        }
        Relationships: []
      }
      user_liquidity_pools: {
        Row: {
          base_amount: number
          base_donation_claim_amount: number
          bump_time: string
          inserted_at: string
          liquidity_provided: boolean
          lp_coin_amount: number
          market_id: number
          market_nonce: number
          provider: string
          quote_amount: number
          quote_donation_claim_amount: number
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          base_amount: number
          base_donation_claim_amount: number
          bump_time: string
          inserted_at?: string
          liquidity_provided: boolean
          lp_coin_amount: number
          market_id: number
          market_nonce: number
          provider: string
          quote_amount: number
          quote_donation_claim_amount: number
          symbol_bytes: string
          transaction_timestamp: string
          transaction_version: number
          trigger: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          base_amount?: number
          base_donation_claim_amount?: number
          bump_time?: string
          inserted_at?: string
          liquidity_provided?: boolean
          lp_coin_amount?: number
          market_id?: number
          market_nonce?: number
          provider?: string
          quote_amount?: number
          quote_donation_claim_amount?: number
          symbol_bytes?: string
          transaction_timestamp?: string
          transaction_version?: number
          trigger?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: []
      }
      user_transactions: {
        Row: {
          block_height: number
          entry_function_id_str: string
          epoch: number
          expiration_timestamp_secs: string
          gas_unit_price: number
          inserted_at: string
          max_gas_amount: number
          parent_signature_type: string
          sender: string
          sequence_number: number
          timestamp: string
          version: number
        }
        Insert: {
          block_height: number
          entry_function_id_str: string
          epoch: number
          expiration_timestamp_secs: string
          gas_unit_price: number
          inserted_at?: string
          max_gas_amount: number
          parent_signature_type: string
          sender: string
          sequence_number: number
          timestamp: string
          version: number
        }
        Update: {
          block_height?: number
          entry_function_id_str?: string
          epoch?: number
          expiration_timestamp_secs?: string
          gas_unit_price?: number
          inserted_at?: string
          max_gas_amount?: number
          parent_signature_type?: string
          sender?: string
          sequence_number?: number
          timestamp?: string
          version?: number
        }
        Relationships: []
      }
      write_set_changes: {
        Row: {
          address: string
          hash: string
          index: number
          inserted_at: string
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Insert: {
          address: string
          hash: string
          index: number
          inserted_at?: string
          transaction_block_height: number
          transaction_version: number
          type: string
        }
        Update: {
          address?: string
          hash?: string
          index?: number
          inserted_at?: string
          transaction_block_height?: number
          transaction_version?: number
          type?: string
        }
        Relationships: []
      }
      write_set_size_info: {
        Row: {
          index: number
          inserted_at: string
          key_bytes: number
          transaction_version: number
          value_bytes: number
        }
        Insert: {
          index: number
          inserted_at?: string
          key_bytes: number
          transaction_version: number
          value_bytes: number
        }
        Update: {
          index?: number
          inserted_at?: string
          key_bytes?: number
          transaction_version?: number
          value_bytes?: number
        }
        Relationships: []
      }
    }
    Views: {
      address_events_summary: {
        Row: {
          account_address: string | null
          min_block_height: number | null
          num_distinct_versions: number | null
        }
        Relationships: []
      }
      address_version_from_events: {
        Row: {
          account_address: string | null
          transaction_version: number | null
        }
        Relationships: []
      }
      address_version_from_move_resources: {
        Row: {
          address: string | null
          transaction_version: number | null
        }
        Relationships: []
      }
      current_aptos_names: {
        Row: {
          domain: string | null
          domain_expiration_timestamp: string | null
          domain_with_suffix: string | null
          expiration_timestamp: string | null
          is_active: boolean | null
          is_primary: boolean | null
          last_transaction_version: number | null
          owner_address: string | null
          registered_address: string | null
          subdomain: string | null
          subdomain_expiration_policy: number | null
          token_data_id: string | null
          token_name: string | null
          token_standard: string | null
        }
        Relationships: []
      }
      current_collection_ownership_v2_view: {
        Row: {
          collection_id: string | null
          collection_name: string | null
          collection_uri: string | null
          creator_address: string | null
          distinct_tokens: number | null
          last_transaction_version: number | null
          owner_address: string | null
          single_token_uri: string | null
        }
        Relationships: []
      }
      current_collection_ownership_view: {
        Row: {
          collection_data_id_hash: string | null
          collection_name: string | null
          creator_address: string | null
          distinct_tokens: number | null
          last_transaction_version: number | null
          owner_address: string | null
        }
        Relationships: []
      }
      current_table_items_view: {
        Row: {
          inserted_at: string | null
          is_deleted: boolean | null
          json_decoded_key: string | null
          json_decoded_value: string | null
          key: string | null
          key_hash: string | null
          last_transaction_version: number | null
          table_handle: string | null
        }
        Insert: {
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_decoded_key?: never
          json_decoded_value?: never
          key?: string | null
          key_hash?: string | null
          last_transaction_version?: number | null
          table_handle?: string | null
        }
        Update: {
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_decoded_key?: never
          json_decoded_value?: never
          key?: string | null
          key_hash?: string | null
          last_transaction_version?: number | null
          table_handle?: string | null
        }
        Relationships: []
      }
      delegator_distinct_pool: {
        Row: {
          delegator_address: string | null
          pool_address: string | null
        }
        Relationships: []
      }
      events_view: {
        Row: {
          account_address: string | null
          creation_number: number | null
          inserted_at: string | null
          json_data: string | null
          sequence_number: number | null
          transaction_block_height: number | null
          transaction_version: number | null
          type: string | null
        }
        Insert: {
          account_address?: string | null
          creation_number?: number | null
          inserted_at?: string | null
          json_data?: never
          sequence_number?: number | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          type?: string | null
        }
        Update: {
          account_address?: string | null
          creation_number?: number | null
          inserted_at?: string | null
          json_data?: never
          sequence_number?: number | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          type?: string | null
        }
        Relationships: []
      }
      market_daily_volume: {
        Row: {
          daily_volume: number | null
          market_id: number | null
        }
        Relationships: []
      }
      move_resources_view: {
        Row: {
          address: string | null
          generic_type_params: Json | null
          inserted_at: string | null
          is_deleted: boolean | null
          json_data: string | null
          module: string | null
          name: string | null
          transaction_block_height: number | null
          transaction_version: number | null
          type: string | null
          write_set_change_index: number | null
        }
        Insert: {
          address?: string | null
          generic_type_params?: Json | null
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_data?: never
          module?: string | null
          name?: string | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          type?: string | null
          write_set_change_index?: number | null
        }
        Update: {
          address?: string | null
          generic_type_params?: Json | null
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_data?: never
          module?: string | null
          name?: string | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          type?: string | null
          write_set_change_index?: number | null
        }
        Relationships: []
      }
      num_active_delegator_per_pool: {
        Row: {
          num_active_delegator: number | null
          pool_address: string | null
        }
        Relationships: []
      }
      table_items_view: {
        Row: {
          inserted_at: string | null
          is_deleted: boolean | null
          json_decoded_key: string | null
          json_decoded_value: string | null
          key: string | null
          table_handle: string | null
          transaction_block_height: number | null
          transaction_version: number | null
          write_set_change_index: number | null
        }
        Insert: {
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_decoded_key?: never
          json_decoded_value?: never
          key?: string | null
          table_handle?: string | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          write_set_change_index?: number | null
        }
        Update: {
          inserted_at?: string | null
          is_deleted?: boolean | null
          json_decoded_key?: never
          json_decoded_value?: never
          key?: string | null
          table_handle?: string | null
          transaction_block_height?: number | null
          transaction_version?: number | null
          write_set_change_index?: number | null
        }
        Relationships: []
      }
      transactions_view: {
        Row: {
          accumulator_root_hash: string | null
          block_height: number | null
          event_root_hash: string | null
          gas_used: number | null
          hash: string | null
          inserted_at: string | null
          json_payload: string | null
          num_events: number | null
          num_write_set_changes: number | null
          state_change_hash: string | null
          state_checkpoint_hash: string | null
          success: boolean | null
          type: string | null
          version: number | null
          vm_status: string | null
        }
        Insert: {
          accumulator_root_hash?: string | null
          block_height?: number | null
          event_root_hash?: string | null
          gas_used?: number | null
          hash?: string | null
          inserted_at?: string | null
          json_payload?: never
          num_events?: number | null
          num_write_set_changes?: number | null
          state_change_hash?: string | null
          state_checkpoint_hash?: string | null
          success?: boolean | null
          type?: string | null
          version?: number | null
          vm_status?: string | null
        }
        Update: {
          accumulator_root_hash?: string | null
          block_height?: number | null
          event_root_hash?: string | null
          gas_used?: number | null
          hash?: string | null
          inserted_at?: string | null
          json_payload?: never
          num_events?: number | null
          num_write_set_changes?: number | null
          state_change_hash?: string | null
          state_checkpoint_hash?: string | null
          success?: boolean | null
          type?: string | null
          version?: number | null
          vm_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      diesel_manage_updated_at: {
        Args: {
          _tbl: unknown
        }
        Returns: undefined
      }
    }
    Enums: {
      period_type:
        | "period_1m"
        | "period_5m"
        | "period_15m"
        | "period_30m"
        | "period_1h"
        | "period_4h"
        | "period_1d"
      trigger_type:
        | "package_publication"
        | "market_registration"
        | "swap_buy"
        | "swap_sell"
        | "provide_liquidity"
        | "remove_liquidity"
        | "chat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

