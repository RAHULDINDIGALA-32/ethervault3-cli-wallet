# Web3 CLI Wallet 🚀

A secure, feature-rich CLI HD wallet for Ethereum testnets with encrypted local storage, transaction history, and developer-friendly tools.

## ✨ Features

### 🔐 **Security First**
- **AES-256-GCM encryption** for all sensitive data
- **Master password protection** with PBKDF2 key derivation
- **Secure local storage** with proper file permissions
- **No database dependencies** - everything stored locally and encrypted

### 💼 **Wallet Management**
- **Create new HD wallets** with BIP39 mnemonic phrases
- **Import existing wallets** from mnemonic phrases
- **Multiple wallet support** with secure storage
- **Account derivation** (BIP44 standard)
- **Wallet export/backup** functionality

### 💰 **Transaction Features**
- **Send transactions** with gas optimization
- **Balance checking** across multiple networks
- **Transaction history** with filtering options
- **Network support** (Sepolia, Goerli, Mainnet)
- **Gas price management** (automatic or manual)

### 🛠 **Developer Tools**
- **Interactive CLI** with intuitive menus
- **Comprehensive error handling**
- **Transaction confirmation** before sending
- **Detailed logging** and status updates
- **Configurable settings**

## 🚀 Installation

### Global Installation (Recommended)
```bash
npm install -g web3-cli-wallet
```

### Local Installation
```bash
npm install web3-cli-wallet
```

### From Source
```bash
git clone https://github.com/RAHULDINDIGALA-32/web3-cli-wallet.git
cd web3-cli-wallet
npm install
npm run build
npm start
```

## 📖 Usage

### Start the CLI
```bash
web3-wallet
# or
cli-wallet
```

### First Time Setup
1. **Set Master Password**: Create a strong master password for encrypting your wallet data
2. **Create or Import Wallet**: Choose to create a new wallet or import an existing one
3. **Start Using**: Access all features through the interactive menu

### Environment Setup
Create a `.env` file in your project directory:
```env
INFURA_PROJECT_ID=your_infura_project_id_here
```

## 🎯 Available Commands

| Command | Description |
|---------|-------------|
| **Create new wallet** | Generate a new HD wallet with mnemonic phrase |
| **Import wallet** | Import existing wallet from mnemonic phrase |
| **Manage wallets** | Load, view, or delete saved wallets |
| **Derive accounts** | Generate multiple accounts from HD wallet |
| **Check balance** | Check ETH balance for any address |
| **Send transaction** | Send ETH with gas optimization |
| **Transaction history** | View and filter transaction history |
| **Export account** | Export wallet details securely |
| **Show accounts** | Display derived accounts |
| **Show wallet info** | Display current wallet information |
| **Settings** | Configure default network and preferences |

## 🔧 Configuration

### Networks Supported
- **Sepolia Testnet** (default)
- **Goerli Testnet**
- **Ethereum Mainnet**

### Settings Available
- Default network selection
- Auto-save preferences
- Encryption settings
- Data management

## 🛡️ Security Features

### Encryption
- **AES-256-GCM** encryption for all sensitive data
- **PBKDF2** key derivation with 100,000 iterations
- **Authentication tags** to prevent tampering
- **Secure file permissions** (600 for files, 700 for directories)

### Best Practices
- **Never share your master password**
- **Backup your mnemonic phrases securely**
- **Use testnets for development**
- **Verify transaction details before confirming**

## 📁 File Structure

```
web3-cli-wallet/
├── src/
│   ├── index.ts          # Main CLI interface
│   ├── wallet.ts         # Wallet operations
│   ├── storage.ts        # Secure storage system
│   ├── networks.ts       # Network configurations
│   └── utils.ts          # Utility functions
├── dist/                 # Compiled JavaScript
├── .wallet-storage/      # Encrypted wallet data (created at runtime)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔍 Example Usage

### Creating a New Wallet
```bash
$ web3-wallet
> 1. Create new wallet
> Enter wallet name: My Test Wallet
> Wallet created successfully!
> Mnemonic: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
> Address: 0x1234...5678
> ✅ Wallet saved securely!
```

### Sending a Transaction
```bash
$ web3-wallet
> 6. Send transaction
> Enter private key: 0x1234...
> Enter recipient: 0x5678...
> Enter amount: 0.1
> Select network: sepolia
> Gas price: 20 (or leave empty for automatic)
> Confirm transaction? Yes
> ✅ Transaction sent! Hash: 0xabcd...
```

## 🚨 Important Notes

### Security Warnings
- **This tool is for development and testing purposes**
- **Never use on mainnet with real funds without thorough testing**
- **Keep your master password and mnemonic phrases secure**
- **The tool stores encrypted data locally - keep your system secure**

### Limitations
- **Testnet focused** - primarily designed for Sepolia/Goerli
- **ETH only** - ERC-20 tokens not supported in current version
- **Local storage only** - no cloud sync or backup features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
git clone https://github.com/RAHULDINDIGALA-32/web3-cli-wallet.git
cd web3-cli-wallet
npm install
npm run dev  # Watch mode for development
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/RAHULDINDIGALA-32/web3-cli-wallet/issues)
- **Documentation**: [GitHub Wiki](https://github.com/RAHULDINDIGALA-32/web3-cli-wallet/wiki)

## 🙏 Acknowledgments

- **Ethers.js** for Ethereum interaction
- **Inquirer.js** for CLI interface
- **Node.js Crypto** for encryption
- **BIP39/BIP44** standards for HD wallets

---

**⚠️ Disclaimer**: This tool is for educational and development purposes. Always verify transactions and use testnets for development. The authors are not responsible for any loss of funds.