import { Wallet, HDNodeWallet, ethers } from "ethers";
import { NETWORKS } from "./networks.js";
import inquirer from "inquirer";
import { secureStorage } from "./storage.js";
import type { StoredWallet, TransactionRecord } from "./storage.js";
import * as crypto from "crypto";

let currentMnemonic = "";
let currentWalletId: string | null = null;

export async function createWallet() {
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
}

export async function importWallet() {
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
       }
   ]);

   const mnemonic = answer.mnemonic.trim();
   currentMnemonic = mnemonic;
   
   try {
       // create a Mnemonic object from the phrase 
       const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
       const wallet = HDNodeWallet.fromMnemonic(mnemonicObj);
       
       console.log("\nWallet imported successfully!");
       console.log("-------------------------");
       console.log("Address:\n", wallet.address);
       console.log("Public Key:\n", wallet.publicKey);
       console.log("Private Key:\n", wallet.privateKey);
       console.log("-------------------------\n");

       return wallet;
   } catch (error) {
       console.log("\nInvalid mnemonic phrase. Please check and try again.");
       console.error("Error:", error);
       return null;
   }
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

     try{
        const balance = await provider.getBalance(address);
        const balanceInEther = ethers.formatEther(balance);

        console.log("\nBalance for address:", address);
        console.log("Network:", networkName);
        console.log("Balance:", balanceInEther, "ETH\n");

     } catch (error){
        console.log("\nError checking balance:", error);
        return null;
     }

}


export async function sendTransaction() {
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

    try {
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
        console.log("Error sending transaction:");
        console.error(error);
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
        
        console.log("\nWallet Details:");
        console.log("-------------------------");
        console.log("Name:", storedWallet.name);
        console.log("Address:", storedWallet.address);
        console.log("Public Key:", storedWallet.publicKey);
        console.log("Private Key:", privateKey);
        console.log("Mnemonic:", mnemonic);
        console.log("Network:", storedWallet.network);
        console.log("Created:", new Date(storedWallet.createdAt).toLocaleString());
        console.log("Last Used:", new Date(storedWallet.lastUsed).toLocaleString());
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

Address: ${storedWallet.address}
Public Key: ${storedWallet.publicKey}
Private Key: ${privateKey}
Mnemonic: ${mnemonic}
Network: ${storedWallet.network}

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

        console.log("\nWallet Information:");
        console.log("-------------------------");
        console.log("Name:", storedWallet.name);
        console.log("Address:", storedWallet.address);
        console.log("Public Key:", storedWallet.publicKey);
        console.log("Network:", storedWallet.network);
        console.log("Created:", new Date(storedWallet.createdAt).toLocaleString());
        console.log("Last Used:", new Date(storedWallet.lastUsed).toLocaleString());
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
    console.log("\n=== Transaction History ===");
    
    if (!currentWalletId) {
        console.log("No wallet loaded. Please create or import a wallet first.");
        return;
    }

    try {
        const transactions = await secureStorage.loadTransactions(currentWalletId);
        
        if (transactions.length === 0) {
            console.log("No transaction history found.");
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

        let filteredTransactions = transactions;
        
        switch (answer.filter) {
            case "send":
                filteredTransactions = transactions.filter(tx => tx.type === 'send');
                break;
            case "receive":
                filteredTransactions = transactions.filter(tx => tx.type === 'receive');
                break;
            case "recent":
                filteredTransactions = transactions
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

        const choices = wallets.map(wallet => ({
            name: `${wallet.name} (${wallet.address}) - ${wallet.network}`,
            value: wallet.id
        }));

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

        const actionAnswer = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: `What would you like to do with ${selectedWallet.name}?`,
                choices: [
                    { name: "Load this wallet", value: "load" },
                    { name: "View details", value: "view" },
                    { name: "Delete wallet", value: "delete" },
                    { name: "Back", value: "back" }
                ]
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
                console.log("\nWallet Details:");
                console.log("-------------------------");
                console.log("Name:", selectedWallet.name);
                console.log("Address:", selectedWallet.address);
                console.log("Public Key:", selectedWallet.publicKey);
                console.log("Network:", selectedWallet.network);
                console.log("Created:", new Date(selectedWallet.createdAt).toLocaleString());
                console.log("Last Used:", new Date(selectedWallet.lastUsed).toLocaleString());
                console.log("-------------------------\n");
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

