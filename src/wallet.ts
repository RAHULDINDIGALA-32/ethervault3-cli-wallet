import { Wallet, HDNodeWallet, ethers } from "ethers";
import { NETWORKS } from "./networks.js";
import inquirer from "inquirer";
import { secureStorage } from "./storage.js";
import type { StoredWallet, TransactionRecord, WalletAccount } from "./storage.js";
import * as crypto from "crypto";

let currentMnemonic = "";
let currentWalletId: string | null = null;

// Error handling utilities
function handleWalletError(error: any, context: string): void {
    console.log(`\n❌ Error in ${context}:`);
    console.log(error.message || error);
    console.log("\n🔄 Returning to main menu...\n");
}

async function safeWalletExecute<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        handleWalletError(error, context);
        return null;
    }
}

export async function createWallet() {
    try {
        console.log("\n=== Create New Wallet ===");
        
        const wallet = HDNodeWallet.createRandom();
        currentMnemonic = wallet.mnemonic?.phrase.trim() || "";

        console.log("\nWallet created successfully!");
        console.log("-------------------------");
        console.log("Mnemonic Phrase:\n", wallet.mnemonic?.phrase);
        console.log("Address:\n", wallet.address);
        console.log("Public Key:\n", wallet.publicKey);
        console.log("Private Key:\n", wallet.privateKey);
        console.log("-------------------------\n");

        // Ask if user wants to save the wallet
        const saveAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "save",
                message: "Do you want to save this wallet securely?",
                default: true
            }
        ]);

        if (saveAnswer.save) {
            const nameAnswer = await inquirer.prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Enter a name for this wallet:",
                    validate: (input: string) => {
                        if (!input || input.trim().length === 0) {
                            return "Please enter a wallet name.";
                        }
                        return true;
                    }
                }
            ]);

            try {
                currentWalletId = await secureStorage.saveWallet(wallet, nameAnswer.name.trim());
                console.log("✅ Wallet saved securely!");
            } catch (error) {
                console.log("❌ Failed to save wallet:", error);
            }
        }

        return wallet;
    } catch (error) {
        handleWalletError(error, "Create Wallet");
        return null;
    }
}

export async function importWallet() {
    try {
        console.log("\n=== Import Wallet from Mnemonic ===");

        const answer = await inquirer.prompt([
            {
                type: "input",
                name: "mnemonic",
                message: "Enter your 12/24 mnemonic phrase:",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Please enter a mnemonic phrase.";
                    }
                    
                    const words = input.trim().split(/\s+/);
                    if (words.length !== 12 && words.length !== 24) {
                        return "Mnemonic must be 12 or 24 words.";
                    }
                    
                    return true;
                }
            },
            {
                type: "list",
                name: "network",
                message: "Select the network to check for existing accounts:",
                choices: Object.keys(NETWORKS)
            }
        ]);

        const mnemonic = answer.mnemonic.trim();
        const network = answer.network;
        
        // Create Mnemonic object from the phrase 
        const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
        const provider = new ethers.JsonRpcProvider(NETWORKS[network]);
        
        console.log("\n🔍 Discovering existing accounts...");
        console.log("This may take a moment as we check for account activity...\n");
        
        // Discover existing accounts
        const existingAccounts = await discoverExistingAccounts(mnemonicObj, provider, network);
        
        if (existingAccounts.length === 0) {
            console.log("No existing accounts found. Creating default account (index 0).");
            const defaultWallet = HDNodeWallet.fromMnemonic(mnemonicObj);
            currentMnemonic = mnemonic;
            
            console.log("\nDefault Account:");
            console.log("-------------------------");
            console.log("Address:", defaultWallet.address);
            console.log("Public Key:", defaultWallet.publicKey);
            console.log("Private Key:", defaultWallet.privateKey);
            console.log("-------------------------\n");
            
            return defaultWallet;
        }
        
        console.log(`✅ Found ${existingAccounts.length} existing account(s):\n`);
        
        // Display discovered accounts
        existingAccounts.forEach((account, index) => {
            console.log(`Account ${index + 1} (Index ${account.index}):`);
            console.log(`Address: ${account.wallet.address}`);
            console.log(`Balance: ${account.balance} ETH`);
            console.log(`Transactions: ${account.txCount}`);
            console.log("-------------------------");
        });
        
        // Ask if user wants to save all accounts
        const saveAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "saveAll",
                message: `Do you want to save all ${existingAccounts.length} accounts?`,
                default: true
            }
        ]);
        
        if (saveAnswer.saveAll) {
            const walletNameAnswer = await inquirer.prompt([
                {
                    type: "input",
                    name: "baseName",
                    message: "Enter a name for this wallet (e.g., 'MetaMask'):",
                    default: "Imported Wallet",
                    validate: (input: string) => {
                        if (!input || input.trim().length === 0) {
                            return "Please enter a wallet name.";
                        }
                        return true;
                    }
                }
            ]);
            
            console.log("\n💾 Saving multi-account wallet...");
            
            try {
                // Save all accounts as a single wallet
                const walletId = await secureStorage.saveMultiAccountWallet(
                    existingAccounts,
                    walletNameAnswer.baseName.trim(),
                    network
                );
                
                currentWalletId = walletId;
                currentMnemonic = mnemonic;
                
                console.log(`✅ Saved wallet: ${walletNameAnswer.baseName.trim()}`);
                console.log(`📊 Contains ${existingAccounts.length} account(s)`);
                console.log(`🔑 Current active account: ${existingAccounts[0]?.wallet.address || 'Unknown'}`);
                
            } catch (error) {
                console.log(`❌ Failed to save wallet:`, error);
            }
        } else {
            // User chose not to save, just set the first account as current
            currentMnemonic = mnemonic;
            console.log("\n✅ Wallet imported (not saved). You can save it later from the main menu.");
        }
        
        return existingAccounts[0]?.wallet || null;
        
    } catch (error) {
        handleWalletError(error, "Import Wallet");
        return null;
    }
}

// Helper function to discover existing accounts
async function discoverExistingAccounts(
    mnemonicObj: ethers.Mnemonic, 
    provider: ethers.JsonRpcProvider, 
    network: string
): Promise<Array<{
    index: number;
    wallet: HDNodeWallet;
    balance: string;
    txCount: number;
}>> {
    const accounts: Array<{
        index: number;
        wallet: HDNodeWallet;
        balance: string;
        txCount: number;
    }> = [];
    
    let index = 0;
    let consecutiveEmptyAccounts = 0;
    const maxConsecutiveEmpty = 3; // Stop after 3 consecutive empty accounts
    const maxAccountsToCheck = 20; // Safety limit
    
    while (index < maxAccountsToCheck && consecutiveEmptyAccounts < maxConsecutiveEmpty) {
        try {
            const path = `m/44'/60'/0'/0/${index}`;
            const wallet = HDNodeWallet.fromMnemonic(mnemonicObj, path);
            
            // Check balance
            const balance = await provider.getBalance(wallet.address);
            const balanceInEther = ethers.formatEther(balance);
            
            // Check transaction count (this is a rough indicator of activity)
            // Note: This is an approximation - some networks don't support getTransactionCount
            let txCount = 0;
            try {
                txCount = await provider.getTransactionCount(wallet.address);
            } catch (error) {
                // If we can't get transaction count, use balance as indicator
                txCount = parseFloat(balanceInEther) > 0 ? 1 : 0;
            }
            
            // Consider an account "active" if it has:
            // 1. Non-zero balance, OR
            // 2. Has sent/received transactions (txCount > 0)
            const isActive = parseFloat(balanceInEther) > 0 || txCount > 0;
            
            if (isActive) {
                accounts.push({
                    index,
                    wallet,
                    balance: balanceInEther,
                    txCount
                });
                consecutiveEmptyAccounts = 0; // Reset counter
                console.log(`✓ Found active account at index ${index}: ${wallet.address} (${balanceInEther} ETH, ${txCount} txs)`);
            } else {
                consecutiveEmptyAccounts++;
                console.log(`- Checking index ${index}: ${wallet.address} (empty)`);
            }
            
            index++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.log(`Error checking account at index ${index}:`, error);
            consecutiveEmptyAccounts++;
            index++;
        }
    }
    
    return accounts;
}



export async function deriveAccounts() {
     console.log("\n=== Derive Accounts ===");

     if(!currentMnemonic){
        console.log("No wallet imported or created yet.");
        return;
     }

     const answer = await inquirer.prompt([
        {
            type: "input",
            name: "count",
            message: "Enter the number of accounts to derive:",
            validate: (input: string) => {
                const count = parseInt(input);
                if (isNaN(count) || count <= 0) {
                    return "Please enter a valid number greater than 0.";
                }
                if(count>0 && count<=100) return true;
                return "Please enter a number between 1 and 100.";
            }
        }
     ]);

     const count = parseInt(answer.count);
     const Mnemonic = ethers.Mnemonic.fromPhrase(currentMnemonic);

     console.log(`\nDeriving ${count} accounts...\n`);

     for(let i=0; i<count; i++){
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = HDNodeWallet.fromMnemonic(Mnemonic, path);

        console.log(`Account ${i + 1}:`);
        console.log("Address:", wallet.address);
        console.log("Public Key:", wallet.publicKey);
        console.log("Private Key:", wallet.privateKey);
        console.log("-------------------------\n");
     }

}

export async function checkBalance() {
    try {
        console.log("\n=== Check Balance ===");

        const answer = await inquirer.prompt([
            {
                type: "input",
                name: "address",
                message: "Enter the Ethereum account address:",
                validate: (input: string) => {
                    try{
                        ethers.getAddress(input.trim());
                        return true;
                    }catch{
                        return "Invalid address. Please enter a valid Ethereum address.";
                    }
                }
            },
            {
                type: "list",
                name: "network",
                message: "Select the network:",
                choices: Object.keys(NETWORKS)
            }
        ]);
                
        const address = answer.address.trim();
        const networkName = answer.network;
        const rpcUrl = NETWORKS[networkName];
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        const balance = await provider.getBalance(address);
        const balanceInEther = ethers.formatEther(balance);

        console.log("\nBalance for address:", address);
        console.log("Network:", networkName);
        console.log("Balance:", balanceInEther, "ETH\n");

    } catch (error) {
        handleWalletError(error, "Check Balance");
    }
}


export async function sendTransaction() {
    try {
        console.log("\n=== Send Transaction ===");

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "privateKey",
                message: "Enter your private key:",
                validate: (input: string) => {
                    if (!input || input.trim().length === 0) {
                        return "Please enter a private key.";
                    }
                    try {
                        // Remove '0x' prefix if present for validation
                        const cleanKey = input.trim().startsWith('0x') ? input.trim().slice(2) : input.trim();
                        
                        // Check if it's a valid hex string of correct length (64 characters for 32 bytes)
                        if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
                            return "Invalid private key format. Must be 64 hex characters.";
                        }
                        
                        // Try to create wallet to validate
                        new ethers.Wallet('0x' + cleanKey);
                        return true;
                    } catch {
                        return "Invalid private key. Please enter a valid private key.";
                    }
                }
            },
            {
                type: "input",
                name: "toAddress",
                message: "Enter recipient address:",
                validate: (input: string) => {
                    try {
                        ethers.getAddress(input.trim());
                        return true;
                    } catch {
                        return "Invalid Ethereum address. Please enter a valid address.";
                    }
                }
            },
            {
                type: "input",
                name: "amount",
                message: "Enter amount to send (in ETH):",
                validate: (input: string) => {
                    const amount = parseFloat(input);
                    if (isNaN(amount) || amount <= 0) {
                        return "Please enter a valid amount greater than 0.";
                    }
                    return true;
                }
            },
            {
                type: "list",
                name: "network",
                message: "Select the network:",
                choices: Object.keys(NETWORKS)
            },
            {
                type: "input",
                name: "gasPrice",
                message: "Enter gas price in Gwei (leave empty for automatic):",
                validate: (input: string) => {
                    if (!input || input.trim() === "") {
                        return true;
                    }
                    const gasPrice = parseFloat(input);
                    if (isNaN(gasPrice) || gasPrice <= 0) {
                        return "Please enter a valid gas price greater than 0.";
                    }
                    return true;
                }
            }
        ]);

        // Clean and prepare private key
        const privateKey = answers.privateKey.trim().startsWith('0x') 
            ? answers.privateKey.trim() 
            : '0x' + answers.privateKey.trim();
        
        // Create wallet and provider
        const wallet = new ethers.Wallet(privateKey);
        const provider = new ethers.JsonRpcProvider(NETWORKS[answers.network]);
        const connectedWallet = wallet.connect(provider);

        // Check balance before sending
        const balance = await provider.getBalance(wallet.address);
        const balanceInEther = parseFloat(ethers.formatEther(balance));
        const amountToSend = parseFloat(answers.amount);

        console.log(`\nCurrent balance: ${balanceInEther} ETH`);
        console.log(`Amount to send: ${amountToSend} ETH`);

        if (amountToSend >= balanceInEther) {
            console.log("Insufficient balance to send transaction.");
            return;
        }

        // Prepare transaction
        const toAddress = ethers.getAddress(answers.toAddress.trim());
        const value = ethers.parseEther(answers.amount);

        // Get gas estimate
        const gasEstimate = await provider.estimateGas({
            to: toAddress,
            value: value,
            from: wallet.address
        });

        // Set gas price
        let gasPrice;
        if (answers.gasPrice && answers.gasPrice.trim() !== "") {
            gasPrice = ethers.parseUnits(answers.gasPrice, "gwei");
        } else {
            const feeData = await provider.getFeeData();
            gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei"); // fallback
        }

        const transaction = {
            to: toAddress,
            value: value,
            gasLimit: gasEstimate,
            gasPrice: gasPrice
        };

        // Confirm transaction
        const confirmAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: `Send ${answers.amount} ETH to ${toAddress}?`,
                default: false
            }
        ]);

        if (!confirmAnswer.confirm) {
            console.log("Transaction cancelled.");
            return;
        }

        // Send transaction
        console.log("\nSending transaction...");
        const txnResponse = await connectedWallet.sendTransaction(transaction);
        
        console.log("Transaction sent!");
        console.log("Transaction hash:", txnResponse.hash);
        console.log("Waiting for confirmation...");

        // Wait for confirmation
        const receipt = await txnResponse.wait();
        
        if (receipt) {
            console.log("Transaction confirmed!");
            console.log("Block number:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Transaction hash:", receipt.hash);

            // Save transaction to history
            if (currentWalletId) {
                const transactionRecord: TransactionRecord = {
                    id: crypto.randomUUID(),
                    walletId: currentWalletId,
                    type: 'send',
                    hash: receipt.hash,
                    from: wallet.address,
                    to: toAddress,
                    amount: answers.amount,
                    network: answers.network,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: gasPrice.toString(),
                    blockNumber: receipt.blockNumber,
                    timestamp: new Date().toISOString(),
                    status: 'confirmed'
                };

                try {
                    await secureStorage.saveTransaction(transactionRecord);
                    await secureStorage.updateWalletLastUsed(currentWalletId);
                } catch (error) {
                    console.log("Warning: Failed to save transaction history:", error);
                }
            }
        }

    } catch (error) {
        handleWalletError(error, "Send Transaction");
    }
}

export async function exportAccount() {
    console.log("\n=== Export Account Details ===");
    
    if (!currentWalletId) {
        console.log("No wallet loaded. Please create or import a wallet first.");
        return;
    }

    try {
        const storedWallet = await secureStorage.getWallet(currentWalletId);
        if (!storedWallet) {
            console.log("Wallet not found in storage.");
            return;
        }

        const { mnemonic, privateKey } = await secureStorage.decryptWallet(storedWallet);
        const currentAccount = storedWallet.accounts[storedWallet.currentAccountIndex];
        
        console.log("\nWallet Details:");
        console.log("-------------------------");
        console.log("Name:", storedWallet.name);
        console.log("Network:", storedWallet.network);
        console.log("Total Accounts:", storedWallet.accounts.length);
        console.log("Current Account Index:", storedWallet.currentAccountIndex);
        console.log("Created:", new Date(storedWallet.createdAt).toLocaleString());
        console.log("Last Used:", new Date(storedWallet.lastUsed).toLocaleString());
        
        console.log("\nCurrent Active Account:");
        console.log("-------------------------");
        console.log("Address:", currentAccount?.address || 'Unknown');
        console.log("Public Key:", currentAccount?.publicKey || 'Unknown');
        console.log("Private Key:", privateKey);
        console.log("Derivation Path:", currentAccount?.derivationPath || 'Unknown');
        console.log("Mnemonic:", mnemonic);
        console.log("-------------------------\n");

        const saveAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "save",
                message: "Do you want to save these details to a file?",
                default: false
            }
        ]);

        if (saveAnswer.save) {
            const filename = `wallet-export-${storedWallet.name}-${Date.now()}.txt`;
            const content = `Wallet Export - ${storedWallet.name}
Generated: ${new Date().toISOString()}

Current Account:
Address: ${currentAccount?.address || 'Unknown'}
Public Key: ${currentAccount?.publicKey || 'Unknown'}
Private Key: ${privateKey}
Derivation Path: ${currentAccount?.derivationPath || 'Unknown'}

Mnemonic: ${mnemonic}
Network: ${storedWallet.network}
Total Accounts: ${storedWallet.accounts.length}

WARNING: Keep this file secure and never share it with anyone!
`;

            require('fs').writeFileSync(filename, content);
            console.log(`✅ Wallet details saved to: ${filename}`);
        }
    } catch (error) {
        console.log("❌ Failed to export wallet:", error);
    }
}

export async function changeNetwork() {
    console.log("Change network selected.");
}

export async function showAccounts() {
    console.log("\n=== Show All Derived Accounts ===");
    
    if (!currentMnemonic) {
        console.log("No wallet loaded. Please create or import a wallet first.");
        return;
    }

    const answer = await inquirer.prompt([
        {
            type: "input",
            name: "count",
            message: "Enter the number of accounts to show:",
            default: "5",
            validate: (input: string) => {
                const count = parseInt(input);
                if (isNaN(count) || count <= 0) {
                    return "Please enter a valid number greater than 0.";
                }
                if (count > 0 && count <= 100) return true;
                return "Please enter a number between 1 and 100.";
            }
        }
    ]);

    const count = parseInt(answer.count);
    const mnemonicObj = ethers.Mnemonic.fromPhrase(currentMnemonic);

    console.log(`\nShowing ${count} derived accounts:\n`);

    for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = HDNodeWallet.fromMnemonic(mnemonicObj, path);

        console.log(`Account ${i + 1} (${path}):`);
        console.log("Address:", wallet.address);
        console.log("Public Key:", wallet.publicKey);
        console.log("Private Key:", wallet.privateKey);
        console.log("-------------------------\n");
    }
}

export async function showInfo() {
    console.log("\n=== Show Wallet Info ===");
    
    if (!currentWalletId) {
        console.log("No wallet loaded. Please create or import a wallet first.");
        return;
    }

    try {
        const storedWallet = await secureStorage.getWallet(currentWalletId);
        if (!storedWallet) {
            console.log("Wallet not found in storage.");
            return;
        }

        const currentAccount = storedWallet.accounts[storedWallet.currentAccountIndex];
        
        console.log("\nWallet Information:");
        console.log("-------------------------");
        console.log("Name:", storedWallet.name);
        console.log("Network:", storedWallet.network);
        console.log("Total Accounts:", storedWallet.accounts.length);
        console.log("Current Account Index:", storedWallet.currentAccountIndex);
        console.log("Created:", new Date(storedWallet.createdAt).toLocaleString());
        console.log("Last Used:", new Date(storedWallet.lastUsed).toLocaleString());
        
        console.log("\nCurrent Active Account:");
        console.log("-------------------------");
        console.log("Address:", currentAccount?.address || 'Unknown');
        console.log("Public Key:", currentAccount?.publicKey || 'Unknown');
        console.log("Derivation Path:", currentAccount?.derivationPath || 'Unknown');
        if (currentAccount?.balance) {
            console.log("Balance:", currentAccount.balance, "ETH");
        }
        console.log("-------------------------\n");

        // Show recent transactions
        const transactions = await secureStorage.loadTransactions(currentWalletId);
        if (transactions.length > 0) {
            console.log("Recent Transactions:");
            console.log("-------------------------");
            const recentTransactions = transactions
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5);

            recentTransactions.forEach((tx, index) => {
                console.log(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ETH`);
                console.log(`   To: ${tx.to}`);
                console.log(`   Hash: ${tx.hash}`);
                console.log(`   Status: ${tx.status}`);
                console.log(`   Date: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log("   -------------------------");
            });
        } else {
            console.log("No transaction history found.");
        }
    } catch (error) {
        console.log("❌ Failed to show wallet info:", error);
    }
}

export async function showTransactionHistory() {
    console.log("\n📋 Transaction History (All Accounts)");
    console.log("=".repeat(50));
    
    try {
        // Get all wallets
        const wallets = await secureStorage.loadWallets();
        
        if (wallets.length === 0) {
            console.log("❌ No wallets found. Please create or import a wallet first.");
            return;
        }

        // Collect transactions from all wallets
        let allTransactions: any[] = [];
        for (const wallet of wallets) {
            const walletTransactions = await secureStorage.loadTransactions(wallet.id);
            allTransactions = allTransactions.concat(walletTransactions);
        }
        
        if (allTransactions.length === 0) {
            console.log("No transaction history found across all accounts.");
            return;
        }

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "filter",
                message: "Filter transactions by:",
                choices: [
                    { name: "All transactions", value: "all" },
                    { name: "Sent transactions", value: "send" },
                    { name: "Received transactions", value: "receive" },
                    { name: "Recent (last 10)", value: "recent" }
                ]
            }
        ]);

        let filteredTransactions = allTransactions;
        
        switch (answer.filter) {
            case "send":
                filteredTransactions = allTransactions.filter(tx => tx.type === 'send');
                break;
            case "receive":
                filteredTransactions = allTransactions.filter(tx => tx.type === 'receive');
                break;
            case "recent":
                filteredTransactions = allTransactions
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10);
                break;
        }

        console.log(`\nShowing ${filteredTransactions.length} transactions:\n`);

        filteredTransactions
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .forEach((tx, index) => {
                console.log(`${index + 1}. ${tx.type.toUpperCase()} Transaction`);
                console.log(`   Hash: ${tx.hash}`);
                console.log(`   From: ${tx.from}`);
                console.log(`   To: ${tx.to}`);
                console.log(`   Amount: ${tx.amount} ETH`);
                console.log(`   Network: ${tx.network}`);
                console.log(`   Gas Used: ${tx.gasUsed}`);
                console.log(`   Gas Price: ${tx.gasPrice} wei`);
                console.log(`   Block: ${tx.blockNumber}`);
                console.log(`   Status: ${tx.status}`);
                console.log(`   Date: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log("   -------------------------\n");
            });

    } catch (error) {
        console.log("❌ Failed to load transaction history:", error);
    }
}

export async function manageWallets() {
    console.log("\n=== Wallet Management ===");
    
    try {
        const wallets = await secureStorage.loadWallets();
        
        if (wallets.length === 0) {
            console.log("No saved wallets found.");
            return;
        }

        const choices = wallets.map(wallet => {
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

        choices.push({ name: "Back to main menu", value: "back" });

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "walletId",
                message: "Select a wallet to manage:",
                choices: choices
            }
        ]);

        if (answer.walletId === "back") {
            return;
        }

        const selectedWallet = wallets.find(w => w.id === answer.walletId);
        if (!selectedWallet) {
            console.log("Wallet not found.");
            return;
        }

        const actionChoices = [
            { name: "Load this wallet", value: "load" },
            { name: "View details", value: "view" }
        ];

        // Add account switching option if wallet has multiple accounts
        if (selectedWallet.accounts.length > 1) {
            actionChoices.push({ name: "Switch account", value: "switch" });
        }

        actionChoices.push(
            { name: "Delete wallet", value: "delete" },
            { name: "Back", value: "back" }
        );

        const actionAnswer = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: `What would you like to do with ${selectedWallet.name}?`,
                choices: actionChoices
            }
        ]);

        switch (actionAnswer.action) {
            case "load":
                currentWalletId = selectedWallet.id;
                const { mnemonic } = await secureStorage.decryptWallet(selectedWallet);
                currentMnemonic = mnemonic;
                await secureStorage.updateWalletLastUsed(selectedWallet.id);
                console.log(`✅ Loaded wallet: ${selectedWallet.name}`);
                break;
            case "view":
                const currentAccount = selectedWallet.accounts[selectedWallet.currentAccountIndex];
                console.log("\nWallet Details:");
                console.log("-------------------------");
                console.log("Name:", selectedWallet.name);
                console.log("Network:", selectedWallet.network);
                console.log("Total Accounts:", selectedWallet.accounts.length);
                console.log("Current Account Index:", selectedWallet.currentAccountIndex);
                console.log("Created:", new Date(selectedWallet.createdAt).toLocaleString());
                console.log("Last Used:", new Date(selectedWallet.lastUsed).toLocaleString());
                
                console.log("\nCurrent Active Account:");
                console.log("-------------------------");
                console.log("Address:", currentAccount?.address || 'Unknown');
                console.log("Public Key:", currentAccount?.publicKey || 'Unknown');
                console.log("Derivation Path:", currentAccount?.derivationPath || 'Unknown');
                if (currentAccount?.balance) {
                    console.log("Balance:", currentAccount.balance, "ETH");
                }
                if (currentAccount?.txCount !== undefined) {
                    console.log("Transaction Count:", currentAccount.txCount);
                }
                
                if (selectedWallet.accounts.length > 1) {
                    console.log("\nAll Accounts:");
                    console.log("-------------------------");
                    selectedWallet.accounts.forEach((account, index) => {
                        const isActive = index === selectedWallet.currentAccountIndex;
                        console.log(`${isActive ? '→' : ' '} Account ${index}: ${account.address}`);
                        if (account.balance) {
                            console.log(`   Balance: ${account.balance} ETH`);
                        }
                        if (account.txCount !== undefined) {
                            console.log(`   Transactions: ${account.txCount}`);
                        }
                    });
                }
                console.log("-------------------------\n");
                break;
            case "switch":
                const accountChoices = selectedWallet.accounts.map((account, index) => ({
                    name: `Account ${index}: ${account.address}${index === selectedWallet.currentAccountIndex ? ' (current)' : ''}`,
                    value: index
                }));
                
                const switchAnswer = await inquirer.prompt([
                    {
                        type: "list",
                        name: "accountIndex",
                        message: "Select account to switch to:",
                        choices: accountChoices
                    }
                ]);
                
                const success = await secureStorage.switchAccount(selectedWallet.id, switchAnswer.accountIndex);
                if (success) {
                    const targetAccount = selectedWallet.accounts[switchAnswer.accountIndex];
                    console.log(`✅ Switched to account ${switchAnswer.accountIndex}: ${targetAccount?.address || 'Unknown'}`);
                } else {
                    console.log("❌ Failed to switch account.");
                }
                break;
            case "delete":
                const confirmAnswer = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "confirm",
                        message: `Are you sure you want to delete ${selectedWallet.name}? This action cannot be undone.`,
                        default: false
                    }
                ]);

                if (confirmAnswer.confirm) {
                    const deleted = await secureStorage.deleteWallet(selectedWallet.id);
                    if (deleted) {
                        console.log(`✅ Deleted wallet: ${selectedWallet.name}`);
                        if (currentWalletId === selectedWallet.id) {
                            currentWalletId = null;
                            currentMnemonic = "";
                        }
                    } else {
                        console.log("❌ Failed to delete wallet.");
                    }
                }
                break;
        }
    } catch (error) {
        console.log("❌ Failed to manage wallets:", error);
    }
}

// Account-specific functions
export async function checkAccountBalance(wallet: any, accountIndex: number): Promise<void> {
    console.log("\n💰 Check Account Balance");
    console.log("=".repeat(40));
    
    const account = wallet.accounts[accountIndex];
    console.log(`Account: ${account.address}`);
    console.log(`Network: ${wallet.network}`);
    
    try {
        const { NETWORKS } = await import("./networks.js");
        const provider = new ethers.JsonRpcProvider(NETWORKS[wallet.network]);
        const balance = await provider.getBalance(account.address);
        const balanceInEther = ethers.formatEther(balance);
        
        console.log(`Balance: ${balanceInEther} ETH`);
        console.log("=".repeat(40));
    } catch (error) {
        console.log("❌ Error checking balance:", error);
    }
}

export async function sendAccountTransaction(wallet: any, accountIndex: number): Promise<void> {
    console.log("\n📤 Send Transaction from Account");
    console.log("=".repeat(40));
    
    const account = wallet.accounts[accountIndex];
    console.log(`From Account: ${account.address}`);
    console.log(`Network: ${wallet.network}`);
    
    try {
        const { NETWORKS } = await import("./networks.js");
        const provider = new ethers.JsonRpcProvider(NETWORKS[wallet.network]);
        
        // Get private key for this account
        const { privateKey } = await secureStorage.decryptWallet(wallet);
        const walletInstance = new ethers.Wallet(privateKey, provider);
        
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "toAddress",
                message: "Enter recipient address:",
                validate: (input: string) => {
                    try {
                        ethers.getAddress(input.trim());
                        return true;
                    } catch {
                        return "Invalid Ethereum address. Please enter a valid address.";
                    }
                }
            },
            {
                type: "input",
                name: "amount",
                message: "Enter amount to send (in ETH):",
                validate: (input: string) => {
                    const amount = parseFloat(input);
                    if (isNaN(amount) || amount <= 0) {
                        return "Please enter a valid amount greater than 0.";
                    }
                    return true;
                }
            },
            {
                type: "input",
                name: "gasPrice",
                message: "Enter gas price in Gwei (leave empty for automatic):",
                validate: (input: string) => {
                    if (!input || input.trim() === "") {
                        return true;
                    }
                    const gasPrice = parseFloat(input);
                    if (isNaN(gasPrice) || gasPrice <= 0) {
                        return "Please enter a valid gas price greater than 0.";
                    }
                    return true;
                }
            }
        ]);

        // Check balance
        const balance = await provider.getBalance(account.address);
        const balanceInEther = parseFloat(ethers.formatEther(balance));
        const amountToSend = parseFloat(answers.amount);

        console.log(`\nCurrent balance: ${balanceInEther} ETH`);
        console.log(`Amount to send: ${amountToSend} ETH`);

        if (amountToSend >= balanceInEther) {
            console.log("❌ Insufficient balance to send transaction.");
            return;
        }

        // Prepare transaction
        const toAddress = ethers.getAddress(answers.toAddress.trim());
        const value = ethers.parseEther(answers.amount);

        // Get gas estimate
        const gasEstimate = await provider.estimateGas({
            to: toAddress,
            value: value,
            from: account.address
        });

        // Set gas price
        let gasPrice;
        if (answers.gasPrice && answers.gasPrice.trim() !== "") {
            gasPrice = ethers.parseUnits(answers.gasPrice, "gwei");
        } else {
            const feeData = await provider.getFeeData();
            gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
        }

        const transaction = {
            to: toAddress,
            value: value,
            gasLimit: gasEstimate,
            gasPrice: gasPrice
        };

        // Confirm transaction
        const confirmAnswer = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: `Send ${answers.amount} ETH to ${toAddress}?`,
                default: false
            }
        ]);

        if (!confirmAnswer.confirm) {
            console.log("❌ Transaction cancelled.");
            return;
        }

        // Send transaction
        console.log("\n📤 Sending transaction...");
        const txnResponse = await walletInstance.sendTransaction(transaction);
        
        console.log("✅ Transaction sent!");
        console.log(`Transaction hash: ${txnResponse.hash}`);
        console.log("⏳ Waiting for confirmation...");

        // Wait for confirmation
        const receipt = await txnResponse.wait();
        
        if (receipt) {
            console.log("✅ Transaction confirmed!");
            console.log(`Block number: ${receipt.blockNumber}`);
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`Transaction hash: ${receipt.hash}`);
        }

    } catch (error) {
        console.log("❌ Error sending transaction:", error);
    }
}

export async function getAccountTransactionHistory(wallet: any, accountIndex: number): Promise<void> {
    console.log("\n📋 Account Transaction History");
    console.log("=".repeat(40));
    
    const account = wallet.accounts[accountIndex];
    console.log(`Account: ${account.address}`);
    console.log(`Network: ${wallet.network}`);
    
    try {
        const transactions = await secureStorage.loadTransactions(wallet.id);
        const accountTransactions = transactions.filter(tx => 
            tx.from === account.address || tx.to === account.address
        );
        
        if (accountTransactions.length === 0) {
            console.log("No transaction history found for this account.");
            return;
        }

        console.log(`\nFound ${accountTransactions.length} transactions:\n`);

        accountTransactions
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .forEach((tx, index) => {
                console.log(`${index + 1}. ${tx.type.toUpperCase()} Transaction`);
                console.log(`   Hash: ${tx.hash}`);
                console.log(`   From: ${tx.from}`);
                console.log(`   To: ${tx.to}`);
                console.log(`   Amount: ${tx.amount} ETH`);
                console.log(`   Network: ${tx.network}`);
                console.log(`   Gas Used: ${tx.gasUsed}`);
                console.log(`   Block: ${tx.blockNumber}`);
                console.log(`   Status: ${tx.status}`);
                console.log(`   Date: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log("   " + "-".repeat(40));
            });

    } catch (error) {
        console.log("❌ Failed to load transaction history:", error);
    }
}

export async function getAccountSecrets(wallet: any, accountIndex: number): Promise<void> {
    try {
        // Verify master password
        const passwordAnswer = await inquirer.prompt([
            {
                type: "password",
                name: "password",
                message: "Enter your master password to view account secrets:",
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
        let mnemonic: string, privateKey: string;
        try {
            const result = await secureStorage.decryptWallet(wallet);
            mnemonic = result.mnemonic;
            privateKey = result.privateKey;
        } catch (error) {
            console.log("❌ Invalid master password. Access denied.");
            secureStorage.clearMasterKey();
            return;
        }
        const account = wallet.accounts[accountIndex];
        
        console.log("\n🔐 Account Secrets");
        console.log("=".repeat(60));
        console.log(`Wallet Name: ${wallet.name}`);
        console.log(`Account Index: ${accountIndex}`);
        console.log(`Network: ${wallet.network}`);
        console.log("=".repeat(60));
        console.log(`Address: ${account.address}`);
        console.log(`Public Key: ${account.publicKey}`);
        console.log(`Private Key: ${privateKey}`);
        console.log(`Derivation Path: ${account.derivationPath}`);
        console.log(`Mnemonic: ${mnemonic}`);
        if (account.balance) {
            console.log(`Balance: ${account.balance} ETH`);
        }
        console.log("=".repeat(60));
        console.log("\n⚠️  WARNING: Keep this information secure and never share it!");
        
    } catch (error) {
        handleWalletError(error, "Show Account Secrets");
    }
}

