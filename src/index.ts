import inquirer from "inquirer";
import { createWallet, importWallet, deriveAccounts, checkBalance, sendTransaction, exportAccount, changeNetwork, showAccounts, showInfo, showTransactionHistory, manageWallets } from "./wallet.js";
import { secureStorage } from "./storage.js";
import * as fs from 'fs';
import * as path from 'path';

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

async function showSettings() {
    console.log("\n=== Settings ===");
    
    const config = secureStorage.getConfig();
    
    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "setting",
            message: "Select a setting to change:",
            choices: [
                { name: `Default Network: ${config.defaultNetwork}`, value: "network" },
                { name: `Auto Save: ${config.autoSave ? 'Enabled' : 'Disabled'}`, value: "autosave" },
                { name: `Encryption: ${config.encryptionEnabled ? 'Enabled' : 'Disabled'}`, value: "encryption" },
                { name: "Clear all data", value: "clear" },
                { name: "Back to main menu", value: "back" }
            ]
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
            const clearAnswer = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Are you sure you want to clear all stored data? This action cannot be undone.",
                    default: false
                }
            ]);
            
            if (clearAnswer.confirm) {
                await secureStorage.clearAllData();
                console.log("✅ All data cleared successfully.");
            }
            break;
    }
}

async function main() {
    console.clear();
    console.log("\n");
    console.log("===============================");
    console.log("\n");
    console.log("      CLI HD Wallet");
    console.log("\n");
    console.log("===============================");
    console.log("\n");

    // Setup master password
    const passwordSetup = await setupMasterPassword();
    if (!passwordSetup) {
        console.log("Exiting due to authentication failure.");
        return;
    }

    let exit = false;

    while (!exit) {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "choice",
                message: "Select an option:",
                choices: [
                    { name: "1. Create new wallet", value: "1" },
                    { name: "2. Import wallet from mnemonic", value: "2" },
                    { name: "3. Manage saved wallets", value: "3" },
                    { name: "4. Derive accounts", value: "4" },
                    { name: "5. Check balance", value: "5" },
                    { name: "6. Send transaction", value: "6" },
                    { name: "7. Transaction history", value: "7" },
                    { name: "8. Export account details", value: "8" },
                    { name: "9. Show all derived accounts", value: "9" },
                    { name: "10. Show wallet info", value: "10" },
                    { name: "11. Settings", value: "11" },
                    { name: "12. Exit", value: "12" }
                ]
            }
        ]);

        switch (answer.choice) {
            case "1":
                await createWallet();
                break;
            case "2":
                await importWallet();
                break;
            case "3":
                await manageWallets();
                break;
            case "4":
                await deriveAccounts();
                break;
            case "5":
                await checkBalance();
                break;
            case "6":
                await sendTransaction();
                break;
            case "7":
                await showTransactionHistory();
                break;
            case "8":
                await exportAccount();
                break;
            case "9":
                await showAccounts();
                break;
            case "10":
                await showInfo();
                break;
            case "11":
                await showSettings();
                break;
            case "12":
                console.log("Exiting from the CLI wallet...");
                exit = true;
                break;
            default:
                console.log("Invalid option.");
        }
    }
}

main();
