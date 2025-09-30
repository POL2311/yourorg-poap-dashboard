# Gasless Infrastructure Program

A comprehensive Solana program that enables gasless transactions through a relayer network, allowing users to interact with dApps without holding SOL for transaction fees.

## 🚀 Features

### Core Functionality
- **Protocol Management**: Initialize and manage the gasless infrastructure protocol
- **Service Registration**: Register services that want to offer gasless transactions
- **Relayer Authorization**: Authorize trusted relayers to execute transactions
- **User Permits**: Create signed permits for off-chain transaction authorization
- **Gasless Execution**: Execute user transactions without requiring SOL from users
- **NFT Minting**: Mint NFTs to users without gas fees
- **Treasury Management**: Deposit and withdraw funds for gas coverage
- **Fee Management**: Collect and distribute service and protocol fees

### Security Features
- **Signature Verification**: Validate user signatures on permits
- **Expiry Checks**: Ensure permits haven't expired
- **Authorization Validation**: Verify relayer authorization
- **Program Whitelisting**: Only allow execution of whitelisted programs
- **Fee Validation**: Comprehensive fee parameter validation
- **Access Control**: Owner-only operations for sensitive functions

## 📁 Program Structure

```
programs/gasless_infrastructure/
├── src/
│   ├── lib.rs                 # Main program entry point
│   ├── error.rs              # Custom error definitions
│   ├── constants.rs          # Program constants
│   ├── instructions/         # All instruction handlers
│   │   ├── mod.rs
│   │   ├── initialize_protocol.rs
│   │   ├── register_service.rs
│   │   ├── authorize_relayer.rs
│   │   ├── create_user_permit.rs
│   │   ├── execute_gasless_transaction.rs
│   │   ├── mint_nft_gasless.rs
│   │   ├── deposit_treasury.rs
│   │   ├── withdraw_fees.rs
│   │   └── update_service_config.rs
│   └── state/               # Account state definitions
│       ├── mod.rs
│       ├── gasless_protocol.rs
│       ├── service_provider.rs
│       ├── user_permit.rs
│       ├── relayer_config.rs
│       └── fee_vault.rs
└── tests/                   # Integration tests
    ├── common/
    └── [instruction_tests].rs
```

## 🏗️ Account Architecture

### GaslessProtocol (Singleton)
- **PDA Seeds**: `["gasless_protocol"]`
- **Purpose**: Global protocol configuration
- **Fields**: admin, master_treasury, protocol_fee_bps, total_services, total_transactions, is_active

### ServiceProvider
- **PDA Seeds**: `["service", service_id]`
- **Purpose**: Individual service configuration
- **Fields**: service_id, owner, fee_collector, treasury_vault, service_fee_bps, max_transaction_amount, allowed_programs, is_active

### UserPermit
- **PDA Seeds**: `["permit", user, service, nonce]`
- **Purpose**: User authorization for gasless transactions
- **Fields**: user, service, nonce, instruction_data, target_program, expiry, max_fee, executed, signature

### RelayerConfig
- **PDA Seeds**: `["relayer", relayer_pubkey]`
- **Purpose**: Relayer authorization and statistics
- **Fields**: relayer, is_authorized, total_relayed, last_activity

### FeeVault
- **PDA Seeds**: `["fee_vault", service]`
- **Purpose**: Treasury management for each service
- **Fields**: service, vault_authority, usdc_vault, sol_balance, total_fees_collected, total_gas_reimbursed

## 🔧 Instructions

### 1. initialize_protocol
Initialize the gasless protocol with global configuration.

**Parameters:**
- `master_treasury`: Pubkey - Master treasury wallet
- `protocol_fee_bps`: u16 - Protocol fee in basis points (max 10000)

### 2. register_service
Register a new service to use gasless infrastructure.

**Parameters:**
- `fee_collector`: Pubkey - Fee collector account
- `service_id`: String - Unique service identifier
- `service_fee_bps`: u16 - Service fee in basis points
- `max_transaction_amount`: u64 - Maximum transaction amount
- `allowed_programs`: Vec<Pubkey> - Whitelisted programs

### 3. authorize_relayer
Authorize a relayer to execute gasless transactions.

**Parameters:**
- `relayer`: Pubkey - Relayer to authorize

### 4. create_user_permit
Create a permit record for off-chain signed transaction.

**Parameters:**
- `user`: Pubkey - User who signed the permit
- `service_id`: String - Service identifier
- `nonce`: u64 - Unique nonce
- `instruction_data`: Vec<u8> - Instruction data to execute
- `target_program`: Pubkey - Target program
- `expiry`: i64 - Permit expiry timestamp
- `max_fee`: u64 - Maximum fee
- `signature`: Vec<u8> - User's signature

### 5. execute_gasless_transaction
Relayer executes gasless transaction and gets reimbursed.

**Parameters:**
- `user`: Pubkey - User who signed permit
- `service_id`: String - Service identifier
- `nonce`: u64 - Permit nonce

### 6. mint_nft_gasless
Mint NFT to user without them paying gas.

**Parameters:**
- `user`: Pubkey - NFT recipient
- `service_id`: String - Service identifier
- `nonce`: u64 - Permit nonce

### 7. deposit_treasury
Deposit funds to service treasury for gas coverage.

**Parameters:**
- `service_id`: String - Service identifier
- `amount`: u64 - Amount to deposit

### 8. withdraw_fees
Withdraw accumulated fees from service vault.

**Parameters:**
- `service_id`: String - Service identifier
- `amount`: u64 - Amount to withdraw

### 9. update_service_config
Update service configuration parameters.

**Parameters:**
- `service_id`: String - Service identifier
- `new_fee_bps`: Option<u16> - New service fee in basis points
- `new_max_amount`: Option<u64> - New maximum transaction amount
- `new_is_active`: Option<bool> - New active status

## 🛡️ Security Considerations

### Access Control
- Protocol admin can only initialize protocol and authorize relayers
- Service owners can only modify their own services
- Relayers must be authorized to execute transactions

### Validation Checks
- Fee parameters cannot exceed 100% (10000 basis points)
- Permits must not be expired or already executed
- Target programs must be whitelisted for the service
- Sufficient treasury funds required for gas reimbursement

### Error Handling
- Comprehensive custom error types for all failure scenarios
- Clear error messages for debugging and user feedback
- Proper constraint validation on all accounts

## 🧪 Testing

The program includes comprehensive integration tests for all instructions:

```bash
# Run all tests
anchor test

# Run specific test
anchor test -- --test initialize_protocol
```

### Test Coverage
- ✅ Protocol initialization
- ✅ Service registration
- ✅ Relayer authorization
- ✅ User permit creation
- ✅ Gasless transaction execution
- ✅ NFT minting
- ✅ Treasury operations
- ✅ Configuration updates

## 🚀 Deployment

### Prerequisites
- Anchor CLI installed
- Solana CLI configured
- Sufficient SOL for deployment

### Build and Deploy
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

### Configuration
Update the program ID in:
- `Anchor.toml`
- `lib.rs` (declare_id! macro)

## 💡 Usage Examples

### For Service Providers
1. Register your service with the protocol
2. Deposit USDC to your treasury vault
3. Configure allowed programs and fee parameters
4. Integrate with the relayer network

### For Users
1. Sign permits off-chain for desired transactions
2. Submit permits to relayers
3. Relayers execute transactions on your behalf
4. Pay fees in USDC instead of SOL

### For Relayers
1. Get authorized by protocol admin
2. Monitor for user permits
3. Execute gasless transactions
4. Get reimbursed for gas costs plus fees

## 🔄 Recent Fixes and Improvements

### ✅ Completed Fixes
1. **Instruction Implementation**: All instruction handlers now have complete business logic
2. **Security Validations**: Added comprehensive permission checks and constraints
3. **Error Handling**: Implemented proper error types and validation
4. **Account Structure**: Fixed PDA seeds and account space calculations
5. **Test Corrections**: Fixed variable naming and test setup issues
6. **Code Organization**: Cleaned up imports and module structure
7. **Fee Management**: Implemented proper fee calculation and distribution
8. **Treasury Operations**: Added USDC token handling for deposits/withdrawals

### 🛠️ Technical Improvements
- Proper CPI context handling for token operations
- Correct signer seed generation for PDAs
- Comprehensive constraint validation
- Optimized account space calculations
- Clean separation of concerns between modules

## 📚 Additional Resources

- [Anchor Framework Documentation](https://anchor-lang.com/)
- [Solana Program Development Guide](https://docs.solana.com/developing/programming-model/overview)
- [SPL Token Program](https://spl.solana.com/token)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This program has been thoroughly tested and all critical issues have been resolved. It's ready for deployment and production use.