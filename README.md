# 🚀 EtherVault3 CLI

```
    ███████╗████████╗██╗  ██╗███████╗██████╗ ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗██████╗ 
    ██╔════╝╚══██╔══╝██║  ██║██╔════╝██╔══██╗██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝╚════██╗
    █████╗     ██║   ███████║█████╗  ██████╔╝██║   ██║███████║██║   ██║██║     ██║    █████╔╝
    ██╔══╝     ██║   ██╔══██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║    ╚═══██╗
    ███████╗   ██║   ██║  ██║███████╗██║  ██║ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   ██████╔╝
    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═════╝ 
```

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A **secure**, **feature-rich**, and **user-friendly** Ethereum-only command-line wallet. Built with TypeScript and powered by ethers.js, EtherVault3 provides enterprise-grade security with an intuitive CLI experience.

## ✨ Features

### 🔐 **Security First**
- **AES-256-GCM Encryption**: Military-grade encryption for all stored data
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-512 for master password
- **Secure Storage**: All sensitive data encrypted at rest
- **Master Password Protection**: Single password protects all wallets
- **Memory-Only Keys**: Private keys never stored in plaintext

### 🏦 **HD Wallet Support**
- **Hierarchical Deterministic**: Generate unlimited accounts from single seed
- **BIP44 Standard**: Industry-standard derivation paths (`m/44'/60'/0'/0/n`)
- **Multi-Account Management**: Create and manage multiple accounts per wallet
- **Mnemonic Import/Export**: Support for 12/24 word seed phrases

### 💰 **Transaction Management**
- **Send Transactions**: Native ETH transfers with gas optimization
- **Balance Checking**: Real-time balance queries across networks
- **Transaction History**: Complete transaction tracking and analytics
- **Gas Estimation**: Automatic gas price optimization
- **Multi-Network Support**: Ethereum, Sepolia, Goerli testnets

### 🎁 **Advanced Features**
- **Airdrop Tokens**: Bulk token distribution to multiple addresses
- **Account Discovery**: Automatic detection of existing accounts from mnemonic
- **Transaction Analytics**: Success rates, gas usage, and performance metrics
- **Wallet Management**: Create, import, delete, and organize wallets
- **Secrets Management**: Secure viewing of private keys and mnemonics

### 🌐 **Network Support**
- **Ethereum Mainnet**: Production-ready mainnet support
- **Sepolia Testnet**: Latest Ethereum testnet
- **Goerli Testnet**: Legacy testnet support
- **Custom RPC**: Support for custom network configurations

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher
- **Git** (for cloning)

### Installation

```bash
# Clone the repository
git clone https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet.git

# Navigate to project directory
cd ethervault3-cli-wallet

# Install dependencies
npm install

# Build the project
npm run build

# Start the wallet
npm start
```

### First Time Setup

1. **Run the application**:
   ```bash
   npm start
   ```

2. **Create your profile**:
   - Enter a username
   - Set a strong master password (minimum 8 characters)
   - Confirm your password

3. **Create or import a wallet**:
   - **Create New**: Generate a new HD wallet with mnemonic
   - **Import Existing**: Import using 12/24 word mnemonic phrase

4. **Start using your wallet**:
   - Check balances
   - Send transactions
   - Manage multiple accounts
   - Use advanced features like airdrops

## 📖 Usage Guide

### Main Menu Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Available Options                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 🆕 Create New Wallet                                                    │
│ 2. 📥 Import Wallet from Mnemonic                                          │
│ 3. 🗂️  Manage Wallet                                                       │
│ 4. 💰 Check Balance                                                        │
│ 5. 📤 Send Transaction                                                     │
│ 6. 📋 Transaction History                                                  │
│ 7. ⚙️  Settings                                                            │
│ 8. ❌ Exit Application                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Wallet Management

#### Creating a New Wallet
1. Select **"Create New Wallet"** from main menu
2. Choose a network (Sepolia, Goerli, Mainnet)
3. Wallet generates with:
   - 12/24 word mnemonic phrase
   - First account (index 0)
   - Private/public key pair
4. **Save the wallet** for future use

#### Importing Existing Wallet
1. Select **"Import Wallet from Mnemonic"**
2. Enter your 12/24 word mnemonic phrase
3. Choose network for account discovery
4. System automatically finds existing accounts
5. Save all discovered accounts as a single wallet

#### Managing Multiple Accounts
1. Go to **"Manage Wallet"** → Select wallet
2. View all accounts in the wallet
3. **Create New Account**: Generate additional accounts from same mnemonic
4. **Switch Account**: Change active account
5. **View Secrets**: Access private keys and mnemonic (password required)

### Transaction Operations

#### Sending Transactions
1. **From Main Menu**: Option 5 (requires private key input)
2. **From Account**: Option 3 → Select Account → Send Transaction
3. Enter recipient address and amount
4. Set gas price (or use automatic)
5. Confirm transaction details
6. Transaction is automatically recorded in history

#### Airdrop Tokens
1. Go to **"Manage Wallet"** → Select Account → **"Airdrop Tokens"**
2. Enter recipient addresses (comma-separated, max 50)
3. Set amount per recipient
4. Review cost breakdown and gas estimates
5. Confirm and execute
6. Monitor real-time progress
7. View detailed results and transaction hashes

#### Checking Balances
1. **Quick Check**: Main menu option 4 (any address)
2. **Account Balance**: Through wallet management
3. Real-time balance queries across all supported networks

### Security Features

#### Master Password
- **Single Password**: Protects all wallets and sensitive data
- **Strong Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Memory-Only**: Password never stored, only derived key in memory
- **Session Management**: Automatic re-authentication when needed

#### Data Protection
- **Encrypted Storage**: All data encrypted at rest
- **Secure Files**: Restricted file permissions (600)
- **No Plaintext**: Private keys and mnemonics never stored unencrypted
- **Salt Protection**: Unique salt per installation

## 🛠️ Development

### Project Structure

```
ethervault3-cli/
├── src/
│   ├── index.ts          # Main application entry point
│   ├── wallet.ts         # Wallet operations and transactions
│   ├── storage.ts        # Secure storage and encryption
│   ├── networks.ts       # Network configurations
│   ├── logger.ts         # Centralized logging utility
│   └── utils.ts          # Utility functions
├── dist/                 # Compiled JavaScript output
├── .wallet-storage/      # Encrypted user data (created at runtime)
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts

```bash
# Development
npm run build          # Compile TypeScript to JavaScript
npm start             # Build and run the application
npm run dev           # Run in development mode (if configured)

# Type Checking
npx tsc --noEmit      # Check TypeScript without compilation

# Dependencies
npm install           # Install all dependencies
npm update            # Update dependencies
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet.git

# Navigate to project directory
cd ethervault3-cli.git

# Install dependencies
npm install

# Build the project
npm run build

# Run the application
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Infura Project ID (for network access)
INFURA_PROJECT_ID=your_infura_project_id_here

# Optional: Custom RPC URLs
CUSTOM_RPC_URL=https://your-custom-rpc-url.com
```

### Network Configuration

Networks are configured in `src/networks.ts`:

```typescript
export const NETWORKS: { [key: string]: string } = {
    sepolia: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
    goerli: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
    mainnet: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
};
```

## 📝 Logging

This project includes a centralized, industry-grade logging utility to ensure consistent, user-friendly, and structured logs across the CLI.

### Highlights

- Consistent, human-friendly messages
- Structured categories and levels for easy filtering
- No sensitive data is logged (never logs private keys/mnemonics)
- Progress helpers and transaction status helpers

### File

- `src/logger.ts`

### Categories

- AUTH, WALLET, TRANSACTION, STORAGE, NETWORK, UI, SECURITY, SYSTEM

### Levels

- DEBUG, INFO, WARN, ERROR

### Common Helpers

```ts
import { log, LogCategory } from "./logger.js";

// Informational
log.info(LogCategory.WALLET, "Creating new wallet");

// Success
log.operationSuccess("Wallet Creation");

// Warnings and errors
log.warn(LogCategory.AUTH, "1 attempt remaining");
log.error(LogCategory.NETWORK, "RPC request failed", err);

// User-friendly error wrapper
log.userError("Send Transaction", "Insufficient balance. Please check your balance and try again.", err);

// Transaction lifecycle
log.transactionSent(tx.hash, toAddress, amount);
log.transactionConfirmed(tx.hash, receipt.blockNumber, receipt.gasUsed.toString());

// Progress and airdrops
log.progress("Sending transaction...");
log.airdropProgress(current, total, recipient);
log.airdropComplete(successful, failed, total);
```

### Configuration

Logging behavior can be tuned via environment variables (optional):

```env
# Set Node environment: production | development
NODE_ENV=production
```

Additional formatting options (timestamps, categories, emojis) can be toggled inside `src/logger.ts` if you want stricter or more verbose output.

### Storage Location

- **Windows**: `\.wallet-storage\`
- **Linux/Mac**: `~/.wallet-storage/`
(`.wallet-storage/` located in the current working directory where you run the application)

**Files:**
- `user.json` - User profile (plaintext)
- `salt.enc` - Encryption salt (hex)
- `wallets.enc` - Encrypted wallet data
- `transactions.enc` - Encrypted transaction history
- `config.json` - Application settings

## 🔒 Security Considerations

### Best Practices

1. **Strong Master Password**:
   - Use at least 12 characters
   - Include uppercase, lowercase, numbers, symbols
   - Never share or write down

2. **Secure Environment**:
   - Run on trusted machines only
   - Keep your system updated
   - Use antivirus software

3. **Backup Strategy**:
   - Save mnemonic phrases securely
   - Test recovery process
   - Store backups in multiple secure locations

4. **Network Security**:
   - Use HTTPS RPC endpoints
   - Verify network connections
   - Be cautious with public WiFi

### Data Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-512, 100,000 iterations
- **Salt**: 16-byte random salt per installation
- **Authentication**: Additional authenticated data (AAD)

## 🐛 Troubleshooting

### Common Issues

#### "Master password not set" Error
- **Cause**: Authentication state lost
- **Solution**: Restart application and re-enter password

#### "Decryption failed" Error
- **Cause**: Wrong master password or corrupted data
- **Solution**: Verify password, check data integrity

#### "Insufficient balance" Error
- **Cause**: Not enough ETH for transaction + gas
- **Solution**: Check balance, reduce amount, or add funds

#### Network Connection Issues
- **Cause**: RPC endpoint problems
- **Solution**: Check internet connection, verify Infura ID

### Getting Help

1. **Check Issues**: [GitHub Issues](https://github.com/RAHULDINDIGALA-32/web3-cli-wallet/issues)
2. **Read Documentation**: This README and code comments
3. **Create Issue**: Provide detailed error information

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add comprehensive error handling
- Include unit tests for new features
- Update documentation
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**RAHUL DINDIGALA**
- GitHub: [@RAHULDINDIGALA-32](https://github.com/RAHULDINDIGALA-32)
- Web3 Developer
- Blockchain Enthusiast

## 🙏 Acknowledgments

- **ethers.js** - Ethereum library
- **inquirer.js** - Interactive CLI prompts
- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **Chalk** - Terminal string styling
- **Web3 Community** - Inspiration and support

## 📊 Project Stats

- **Features**: 15+ major features
- **Security**: Military-grade encryption
- **Networks**: 3+ supported networks
- **Accounts**: Unlimited HD accounts
- **Transactions**: Full history tracking

---

## ⚠️ Disclaimer

This application is provided "as is" without warranty. Users are responsible for:
- Securing their private keys and passwords
- Verifying transaction details before confirmation
- Understanding the risks of cryptocurrency transactions
- Complying with local laws and regulations

**Use at your own risk. The developers are not responsible for any loss of funds.**

---

<div align="center">

**⭐ Star this repository if you found it helpful! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/RAHULDINDIGALA-32/ethervault3-cli-wallet?style=social)](https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet)
[![GitHub forks](https://img.shields.io/github/forks/RAHULDINDIGALA-32/ethervault3-cli-wallet?style=social)](https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet)

**Made with ❤️ by RAHUL DINDIGALA**

</div>