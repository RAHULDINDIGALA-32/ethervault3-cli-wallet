import inquirer from "inquirer";
import { createWallet, importWallet, checkBalance, sendTransaction, showTransactionHistory, manageWallets, checkAccountBalance, sendAccountTransaction, getAccountTransactionHistory, getAccountSecrets } from "./wallet.js";
import { secureStorage } from "./storage.js";
import * as fs from 'fs';
import * as path from 'path';
import { HDNodeWallet, ethers } from "ethers";

// Global user data
let currentUser: { username: string; isFirstTime: boolean } | null = null;

// Error handling utilities
function handleError(error: any, context: string): void {
    console.log(`\n❌ Error in ${context}:`);
    console.log(error.message || error);
    console.log("\n🔄 Returning to main menu...\n");
}

async function safeExecute<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        handleError(error, context);
        return null;
    }
}

function safeExecuteSync<T>(operation: () => T, context: string): T | null {
    try {
        return operation();
    } catch (error) {
        handleError(error, context);
        return null;
    }
}

function displayTitleScreen() {
    console.clear();
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
    console.log("║                                                                                ║");
    console.log("║  ██████╗██╗     ██╗    ██╗    ██╗ █████╗ ██╗     ██╗████████╗███████╗███████╗  ║");
    console.log("║ ██╔════╝██║     ██║    ██║    ██║██╔══██╗██║     ██║╚══██╔══╝██╔════╝██╔════╝  ║");
    console.log("║ ██║     ██║     ██║    ██║ █╗ ██║███████║██║     ██║   ██║   █████╗  ███████╗  ║");
    console.log("║ ██║     ██║     ██║    ██║███╗██║██╔══██║██║     ██║   ██║   ██╔══╝  ╚════██║  ║");
    console.log("║ ╚██████╗███████╗██║    ╚███╔███╔╝██║  ██║███████╗██║   ██║   ███████╗███████║  ║");
    console.log("║  ╚═════╝╚══════╝╚═╝     ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝   ╚══════╝╚══════╝  ║");
    console.log("║                                                                                ║");
    console.log("║                              CLI HD WALLET                                     ║");
    console.log("║                                                                                 ║");
    console.log("║  ██████╗ ██╗     ██╗    ██╗    ██╗ █████╗ ██╗     ██╗████████╗███████╗███████╗  ║");
    console.log("║ ██╔════╝ ██║     ██║    ██║    ██║██╔══██╗██║     ██║╚══██╔══╝██╔════╝██╔════╝  ║");
    console.log("║ ██║  ███╗██║     ██║    ██║ █╗ ██║███████║██║     ██║   ██║   █████╗  ███████╗  ║");
    console.log("║ ██║   ██║██║     ██║    ██║███╗██║██╔══██║██║     ██║   ██║   ██╔══╝  ╚════██║  ║");
    console.log("║ ╚██████╔╝███████╗██║    ╚███╔███╔╝██║  ██║███████╗██║   ██║   ███████╗███████║  ║");
    console.log("║  ╚═════╝ ╚══════╝╚═╝     ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝   ╚══════╝╚══════╝  ║");
    console.log("║                                                                              ║");
    console.log("║  ██╗   ██╗ █████╗ ██╗     ██╗     ███████╗████████╗███████╗███████╗███████╗  ║");
    console.log("║  ██║   ██║██╔══██╗██║     ██║     ██╔════╝╚══██╔══╝██╔════╝██╔════╝██╔════╝  ║");
    console.log("║  ██║   ██║███████║██║     ██║     █████╗     ██║   █████╗  ███████╗███████╗  ║");
    console.log("║  ╚██╗ ██╔╝██╔══██║██║     ██║     ██╔══╝     ██║   ██╔══╝  ╚════██║╚════██║  ║");
    console.log("║   ╚████╔╝ ██║  ██║███████╗███████╗███████╗   ██║   ███████╗███████║███████║  ║");
    console.log("║    ╚═══╝  ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝  ║");
    console.log("║                                                                              ║");
    console.log("║                           Version 1.0.0                                      ║");
    console.log("║                           Created by RAHUL DINDIGALA (Web3 Developer)        ║");
    console.log("║                           (https://github.com/RAHULDINDIGALA-32)             ║");
    console.log("║                                                                              ║");
    console.log("║                                                                              ║");
    console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
    console.log("\n");
}

async function setupUser(): Promise<boolean> {
    try {
        // Check if user data exists
        const userDataFile = path.join(process.cwd(), '.wallet-storage', 'user.json');
        const isFirstTime = !fs.existsSync(userDataFile);
        
        if (isFirstTime) {
            console.log("🔐 First time setup detected!");
            console.log("Please create your user profile and master password.\n");
            
            const userSetup = await inquirer.prompt([
                {
                    type: "input",
                    name: "username",
                    message: "Enter your username:",
                    validate: (input: string) => {
                        if (!input || input.trim().length === 0) {
                            return "Please enter a username.";
                        }
                        if (input.trim().length < 3) {
                            return "Username must be at least 3 characters long.";
                        }
                        return true;
                    }
                },
                {
                    type: "password",
                    name: "password",
                    message: "Create a master password:",
                    mask: "*",
                    validate: (input: string) => {
                        if (!input || input.length < 8) {
                            return "Master password must be at least 8 characters long.";
                        }
                        return true;
                    }
                },
                {
                    type: "password",
                    name: "confirmPassword",
                    message: "Confirm master password:",
                    mask: "*"
                }
            ]);

            if (userSetup.password !== userSetup.confirmPassword) {
                console.log("❌ Passwords do not match. Please try again.");
                return false;
            }

            // Save user data
            const userData = {
                username: userSetup.username.trim(),
                createdAt: new Date().toISOString()
            };
            
            fs.mkdirSync(path.dirname(userDataFile), { recursive: true, mode: 0o700 });
            fs.writeFileSync(userDataFile, JSON.stringify(userData, null, 2), { mode: 0o600 });
            
            currentUser = { username: userData.username, isFirstTime: true };
            
            // Setup master password
            await secureStorage.setMasterPassword(userSetup.password);
            
            console.log("✅ User profile created successfully!");
            console.log("⚠️  IMPORTANT: Remember your master password! You'll need it every time you use the wallet.");
            console.log("⚠️  If you forget it, you'll lose access to all stored wallets.\n");
            
        } else {
            // Load existing user data
            const userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
            currentUser = { username: userData.username, isFirstTime: false };
            
            // Ask for master password
            const passwordAnswer = await inquirer.prompt([
                {
                    type: "password",
                    name: "password",
                    message: "Enter your master password:",
                    mask: "*"
                }
            ]);

            const isValid = await secureStorage.loadMasterPassword(passwordAnswer.password);
            if (!isValid) {
                console.log("❌ Invalid master password. Please try again.");
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.log("❌ Failed to setup user:", error);
        return false;
    }
}

async function setupMasterPassword(): Promise<boolean> {
    try {
        const config = secureStorage.getConfig();
        
        if (config.encryptionEnabled) {
            // Check if master password is already set (salt file exists)
            const saltFile = path.join(process.cwd(), '.wallet-storage', 'salt.enc');
            
            if (fs.existsSync(saltFile)) {
                // Master password exists, ask user to enter it
                const passwordAnswer = await inquirer.prompt([
                    {
                        type: "password",
                        name: "password",
                        message: "Enter your master password:",
                        mask: "*"
                    }
                ]);

                const isValid = await secureStorage.loadMasterPassword(passwordAnswer.password);
                if (!isValid) {
                    console.log("❌ Invalid master password. Please try again.");
                    return false;
                }
                return true;
            } else {
                // First time setup - create new master password
                console.log("\n🔐 First time setup detected!");
                console.log("You need to create a master password to encrypt your wallet data.");
                console.log("This password will protect all your stored wallets and private keys.\n");
                
                const passwordAnswer = await inquirer.prompt([
                    {
                        type: "password",
                        name: "password",
                        message: "Create a master password:",
                        mask: "*",
                        validate: (input: string) => {
                            if (!input || input.length < 8) {
                                return "Master password must be at least 8 characters long.";
                            }
                            return true;
                        }
                    },
                    {
                        type: "password",
                        name: "confirmPassword",
                        message: "Confirm master password:",
                        mask: "*"
                    }
                ]);

                if (passwordAnswer.password !== passwordAnswer.confirmPassword) {
                    console.log("❌ Passwords do not match. Please try again.");
                    return false;
                }

                await secureStorage.setMasterPassword(passwordAnswer.password);
                console.log("✅ Master password created successfully!");
                console.log("⚠️  IMPORTANT: Remember this password! You'll need it every time you use the wallet.");
                console.log("⚠️  If you forget it, you'll lose access to all stored wallets.\n");
                return true;
            }
        }
    } catch (error) {
        console.log("❌ Failed to setup master password:", error);
        return false;
    }
    return true;
}

function displayUserInfo() {
    if (currentUser) {
        console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
        console.log("│                            Account Information                              │");
        console.log("├─────────────────────────────────────────────────────────────────────────────┤");
        console.log(`│ 👤 Username: ${currentUser.username.padEnd(60)} │`);
        console.log("│ ✅ Status: Authenticated                                                    │");
        console.log("└─────────────────────────────────────────────────────────────────────────────┘");
        console.log();
    }
}

async function displayMainMenu(): Promise<string> {
    try {
        console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
        console.log("│                            Available Options                                │");
        console.log("├─────────────────────────────────────────────────────────────────────────────┤");
        console.log("│ 1. 🆕 Create New Wallet                                                    │");
        console.log("│ 2. 📥 Import Wallet from Mnemonic                                          │");
        console.log("│ 3. 🗂️  Manage Wallet                                                       │");
        console.log("│ 4. 💰 Check Balance                                                        │");
        console.log("│ 5. 📤 Send Transaction                                                     │");
        console.log("│ 6. 📋 Transaction History                                                  │");
        console.log("│ 7. ⚙️  Settings                                                            │");
        console.log("│ 8. ❌ Exit Program                                                         │");
        console.log("└─────────────────────────────────────────────────────────────────────────────┘");
        console.log();

        const answer = await inquirer.prompt([
            {
                type: "input",
                name: "choice",
                message: "Please enter your choice (0-8):",
                validate: (input: string) => {
                    const choice = parseInt(input);
                    if (isNaN(choice) || choice < 0 || choice > 8) {
                        return "Please enter a number between 0 and 8.";
                    }
                    return true;
                }
            }
        ]);

        return answer.choice;
    } catch (error) {
        handleError(error, "Main Menu Display");
        return "8"; // Return exit option on error
    }
}

async function manageWalletMenu(): Promise<void> {
    try {
        const wallets = await secureStorage.loadWallets();
        
        if (wallets.length === 0) {
            console.log("\n❌ No saved wallets found.");
            console.log("Please create or import a wallet first.\n");
            return;
        }

        const walletChoices = wallets.map(wallet => {
            const currentAccount = wallet.accounts[wallet.currentAccountIndex];
            const accountCount = wallet.accounts.length;
            const accountInfo = accountCount > 1 
                ? ` [${accountCount} accounts, active: ${currentAccount?.address || 'Unknown'}]` 
                : ` [${currentAccount?.address || 'Unknown'}]`;
            return {
                name: `${wallet.name}${accountInfo} - ${wallet.network}`,
                value: wallet.id
            };
        });

        walletChoices.push({ name: "🔙 Back to Main Menu", value: "back" });

        const walletAnswer = await inquirer.prompt([
            {
                type: "list",
                name: "walletId",
                message: "Select a wallet to manage:",
                choices: walletChoices
            }
        ]);

        if (walletAnswer.walletId === "back") {
            return;
        }

        const selectedWallet = wallets.find(w => w.id === walletAnswer.walletId);
        if (!selectedWallet) {
            console.log("❌ Wallet not found.");
            return;
        }

        // Wallet submenu
        await walletSubMenu(selectedWallet);
        
    } catch (error) {
        handleError(error, "Wallet Management");
    }
}

async function walletSubMenu(wallet: any): Promise<void> {
    try {
        const accountChoices = wallet.accounts.map((account: any, index: number) => ({
            name: `Account ${index}: ${account.address}${index === wallet.currentAccountIndex ? ' (current)' : ''}`,
            value: index
        }));

        const walletChoices = [
            ...accountChoices,
            { name: "➕ Create New Account", value: "create_account" },
            { name: "🔐 Secrets (Show Wallet Mnemonic & All Account Details)", value: "secrets" },
            { name: "🔙 Back (Wallet Selection)", value: "back" },
            { name: "🏠 Back to Main Menu", value: "main" }
        ];

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "choice",
                message: `What would you like to do with ${wallet.name}?`,
                choices: walletChoices
            }
        ]);

        switch (answer.choice) {
            case "create_account":
                await safeExecute(() => createNewAccount(wallet), "Create New Account");
                break;
            case "secrets":
                await safeExecute(() => showWalletSecrets(wallet), "Show Wallet Secrets");
                break;
            case "back":
                await manageWalletMenu();
                break;
            case "main":
                return;
            default:
                // Account selected
                const accountIndex = parseInt(answer.choice);
                await accountSubMenu(wallet, accountIndex);
                break;
        }
    } catch (error) {
        handleError(error, "Wallet Submenu");
    }
}

async function accountSubMenu(wallet: any, accountIndex: number): Promise<void> {
    try {
        const account = wallet.accounts[accountIndex];
        
        const choices = [
            { name: "💰 Check Balance", value: "balance" },
            { name: "📤 Send Transaction", value: "send" },
            { name: "📋 Transaction History", value: "history" },
            { name: "🔐 Secrets (Show Account Details)", value: "secrets" },
            { name: "🔙 Back (Account Selection)", value: "back" },
            { name: "🏠 Back to Main Menu", value: "main" }
        ];

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "choice",
                message: `What would you like to do with Account ${accountIndex} (${account.address})?`,
                choices: choices
            }
        ]);

        switch (answer.choice) {
            case "balance":
                await safeExecute(() => checkAccountBalance(wallet, accountIndex), "Check Account Balance");
                break;
            case "send":
                await safeExecute(() => sendAccountTransaction(wallet, accountIndex), "Send Account Transaction");
                break;
            case "history":
                await safeExecute(() => getAccountTransactionHistory(wallet, accountIndex), "Account Transaction History");
                break;
            case "secrets":
                await safeExecute(() => getAccountSecrets(wallet, accountIndex), "Show Account Secrets");
                break;
            case "back":
                await walletSubMenu(wallet);
                break;
            case "main":
                return;
        }
    } catch (error) {
        handleError(error, "Account Submenu");
    }
}

async function createNewAccount(wallet: any): Promise<void> {
    console.log("\n➕ Create New Account");
    console.log("=".repeat(40));
    console.log(`Wallet: ${wallet.name}`);
    console.log(`Current accounts: ${wallet.accounts.length}`);
    
    try {
        // Get the next account index
        const nextIndex = wallet.accounts.length;
        
        // Ask for network
        const { NETWORKS } = await import("./networks.js");
        const networkAnswer = await inquirer.prompt([
            {
                type: "list",
                name: "network",
                message: "Select network for the new account:",
                choices: Object.keys(NETWORKS)
            }
        ]);
        
        // Get mnemonic and create new account
        const { mnemonic } = await secureStorage.decryptWallet(wallet);
        const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
        const derivationPath = `m/44'/60'/0'/0/${nextIndex}`;
        const newWallet = HDNodeWallet.fromMnemonic(mnemonicObj, derivationPath);
        
        // Create new account object
        const newAccount = {
            index: nextIndex,
            address: newWallet.address,
            publicKey: newWallet.publicKey,
            encryptedPrivateKey: secureStorage.encryptData(newWallet.privateKey),
            derivationPath: derivationPath
        };
        
        // Add account to wallet
        wallet.accounts.push(newAccount);
        
        // Update wallet in storage
        const wallets = await secureStorage.loadWallets();
        const walletIndex = wallets.findIndex(w => w.id === wallet.id);
        if (walletIndex !== -1) {
            wallets[walletIndex] = wallet;
            const encryptedWallets = secureStorage.encryptData(JSON.stringify(wallets));
            const WALLETS_FILE = path.join(process.cwd(), '.wallet-storage', 'wallets.enc');
            fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        }
        
        console.log("\n✅ New account created successfully!");
        console.log(`Account Index: ${nextIndex}`);
        console.log(`Address: ${newWallet.address}`);
        console.log(`Public Key: ${newWallet.publicKey}`);
        console.log(`Derivation Path: ${derivationPath}`);
        console.log(`Network: ${networkAnswer.network}`);
        console.log("=".repeat(40));
        
    } catch (error) {
        console.log("❌ Failed to create new account:", error);
    }
}

async function showWalletSecrets(wallet: any): Promise<void> {
    try {
        // Verify master password
        const passwordAnswer = await inquirer.prompt([
            {
                type: "password",
                name: "password",
                message: "Enter your master password to view secrets:",
                mask: "*",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Password cannot be empty. Please enter your master password.";
                    }
                    return true;
                }
            }
        ]);

        const isValid = await secureStorage.loadMasterPassword(passwordAnswer.password);
        if (!isValid) {
            console.log("❌ Invalid master password. Access denied.");
            secureStorage.clearMasterKey();
            return;
        }

        // Verify the password works by attempting to decrypt the wallet
        let mnemonic: string;
        try {
            const result = await secureStorage.decryptWallet(wallet);
            mnemonic = result.mnemonic;
        } catch (error) {
            console.log("❌ Invalid master password. Access denied.");
            secureStorage.clearMasterKey();
            return;
        }
        
        console.log("\n🔐 Wallet Secrets");
        console.log("=".repeat(60));
        console.log(`Wallet Name: ${wallet.name}`);
        console.log(`Network: ${wallet.network}`);
        console.log(`Total Accounts: ${wallet.accounts.length}`);
        console.log(`Created: ${new Date(wallet.createdAt).toLocaleString()}`);
        console.log("=".repeat(60));
        console.log(`Mnemonic Phrase: ${mnemonic}`);
        console.log("=".repeat(60));
        
        console.log("\nAll Account Details:");
        console.log("-".repeat(60));
        
        for (let i = 0; i < wallet.accounts.length; i++) {
            const account = wallet.accounts[i];
            const { privateKey } = await secureStorage.decryptWallet(wallet);
            
            console.log(`\nAccount ${i}:`);
            console.log(`  Address: ${account.address}`);
            console.log(`  Public Key: ${account.publicKey}`);
            console.log(`  Private Key: ${privateKey}`);
            console.log(`  Derivation Path: ${account.derivationPath}`);
            if (account.balance) {
                console.log(`  Balance: ${account.balance} ETH`);
            }
            console.log("-".repeat(40));
        }
        
        console.log("\n⚠️  WARNING: Keep this information secure and never share it!");
        
    } catch (error) {
        handleError(error, "Show Wallet Secrets");
    }
}

async function showSettings(): Promise<void> {
    try {
        const config = secureStorage.getConfig();
        
        const choices = [
            { name: `🌐 Default Network: ${config.defaultNetwork}`, value: "network" },
            { name: "🔐 Change Master Password", value: "password" },
            { name: `💾 Auto Save: ${config.autoSave ? 'Enabled' : 'Disabled'}`, value: "autosave" },
            { name: `🔒 Encryption: ${config.encryptionEnabled ? 'Enabled' : 'Disabled'}`, value: "encryption" },
            { name: "🗑️  Clear All Data", value: "clear" },
            { name: "🔙 Back to Main Menu", value: "back" }
        ];

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "setting",
                message: "Select a setting to change:",
                choices: choices
            }
        ]);

        switch (answer.setting) {
            case "network":
                const networkAnswer = await inquirer.prompt([
                    {
                        type: "list",
                        name: "network",
                        message: "Select default network:",
                        choices: ["sepolia", "goerli", "mainnet"]
                    }
                ]);
                secureStorage.updateConfig({ defaultNetwork: networkAnswer.network });
                console.log(`✅ Default network set to: ${networkAnswer.network}`);
                break;
                
            case "password":
                await safeExecute(() => changeMasterPassword(), "Change Master Password");
                break;
                
            case "autosave":
                const autosaveAnswer = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "autosave",
                        message: "Enable auto-save for wallets?",
                        default: config.autoSave
                    }
                ]);
                secureStorage.updateConfig({ autoSave: autosaveAnswer.autosave });
                console.log(`✅ Auto-save ${autosaveAnswer.autosave ? 'enabled' : 'disabled'}`);
                break;
                
            case "encryption":
                const encryptionAnswer = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "encryption",
                        message: "Enable encryption for stored data?",
                        default: config.encryptionEnabled
                    }
                ]);
                secureStorage.updateConfig({ encryptionEnabled: encryptionAnswer.encryption });
                console.log(`✅ Encryption ${encryptionAnswer.encryption ? 'enabled' : 'disabled'}`);
                break;
                
            case "clear":
                await safeExecute(() => clearAllData(), "Clear All Data");
                break;
                
            case "back":
                return;
        }
    } catch (error) {
        handleError(error, "Settings");
    }
}

async function changeMasterPassword(): Promise<void> {
    try {
        const currentPasswordAnswer = await inquirer.prompt([
            {
                type: "password",
                name: "currentPassword",
                message: "Enter current master password:",
                mask: "*",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Password cannot be empty. Please enter your current master password.";
                    }
                    return true;
                }
            }
        ]);

        const isValid = await secureStorage.loadMasterPassword(currentPasswordAnswer.currentPassword);
        if (!isValid) {
            console.log("❌ Invalid current password.");
            secureStorage.clearMasterKey();
            return;
        }

        const newPasswordAnswer = await inquirer.prompt([
            {
                type: "password",
                name: "newPassword",
                message: "Enter new master password:",
                mask: "*",
                validate: (input: string) => {
                    if (!input || input.length < 8) {
                        return "Master password must be at least 8 characters long.";
                    }
                    return true;
                }
            },
            {
                type: "password",
                name: "confirmPassword",
                message: "Confirm new master password:",
                mask: "*",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Password confirmation cannot be empty.";
                    }
                    return true;
                }
            }
        ]);

        if (newPasswordAnswer.newPassword !== newPasswordAnswer.confirmPassword) {
            console.log("❌ Passwords do not match.");
            return;
        }

        await secureStorage.setMasterPassword(newPasswordAnswer.newPassword);
        console.log("✅ Master password changed successfully!");
    } catch (error) {
        handleError(error, "Change Master Password");
    }
}

async function clearAllData(): Promise<void> {
    try {
        const passwordAnswer = await inquirer.prompt([
            {
                type: "password",
                name: "password",
                message: "Enter your master password to confirm:",
                mask: "*",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Password cannot be empty. Please enter your master password.";
                    }
                    return true;
                }
            }
        ]);

        const isValid = await secureStorage.loadMasterPassword(passwordAnswer.password);
        if (!isValid) {
            console.log("❌ Invalid master password. Access denied.");
            secureStorage.clearMasterKey();
            return;
        }

        const confirmAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: "⚠️  WARNING: This will permanently delete ALL wallet data, transactions, and settings. Are you absolutely sure?",
                default: false
            }
        ]);
        
        if (confirmAnswer.confirm) {
            const finalConfirm = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "finalConfirm",
                    message: "🚨 FINAL WARNING: This action cannot be undone. Type 'yes' to confirm deletion:",
                    default: false
                }
            ]);
            
            if (finalConfirm.finalConfirm) {
                await secureStorage.clearAllData();
                console.log("✅ All data cleared successfully.");
                console.log("🔄 Please restart the application to complete the reset.");
            } else {
                console.log("❌ Data deletion cancelled.");
            }
        } else {
            console.log("❌ Data deletion cancelled.");
        }
    } catch (error) {
        handleError(error, "Clear All Data");
    }
}

async function main() {
    // Display title screen
    displayTitleScreen();
    
    // Setup user and master password
    const userSetup = await setupUser();
    if (!userSetup) {
        console.log("❌ Exiting due to authentication failure.");
        return;
    }

    let exit = false;

    while (!exit) {
        // Display user info
        displayUserInfo();
        
        // Display main menu and get choice
        const choice = await displayMainMenu();

        switch (choice) {
            case "0":
            case "8":
                console.log("\n🚀 Thank you for using CLI HD Wallet!");
                console.log("👋 Goodbye!");
                exit = true;
                break;
            case "1":
                await safeExecute(() => createWallet(), "Create Wallet");
                break;
            case "2":
                await safeExecute(() => importWallet(), "Import Wallet");
                break;
            case "3":
                await safeExecute(() => manageWalletMenu(), "Manage Wallet");
                break;
            case "4":
                await safeExecute(() => checkBalance(), "Check Balance");
                break;
            case "5":
                await safeExecute(() => sendTransaction(), "Send Transaction");
                break;
            case "6":
                await safeExecute(() => showTransactionHistory(), "Transaction History");
                break;
            case "7":
                await safeExecute(() => showSettings(), "Settings");
                break;
            default:
                console.log("❌ Invalid option.");
        }
        
        if (!exit) {
            console.log("\nPress Enter to continue...");
            await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
        }
    }
}

main();
