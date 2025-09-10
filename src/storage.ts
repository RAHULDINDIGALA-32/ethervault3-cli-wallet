import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { HDNodeWallet } from 'ethers';

// Storage configuration
const STORAGE_DIR = path.join(process.cwd(), '.wallet-storage');
const WALLETS_FILE = path.join(STORAGE_DIR, 'wallets.enc');
const TRANSACTIONS_FILE = path.join(STORAGE_DIR, 'transactions.enc');
const CONFIG_FILE = path.join(STORAGE_DIR, 'config.json');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

export interface WalletAccount {
    index: number;
    address: string;
    publicKey: string;
    encryptedPrivateKey: string;
    derivationPath: string; // BIP44 path like "m/44'/60'/0'/0/0"
    balance?: string; // Current balance in ETH
    txCount?: number; // Transaction count
}

export interface StoredWallet {
    id: string;
    name: string;
    encryptedMnemonic: string;
    createdAt: string;
    lastUsed: string;
    network: string;
    accounts: WalletAccount[]; // Array of all accounts in this wallet
    currentAccountIndex: number; // Index of currently active account (default: 0)
}

export interface TransactionRecord {
    id: string;
    walletId: string;
    type: 'send' | 'receive';
    hash: string;
    from: string;
    to: string;
    amount: string;
    network: string;
    gasUsed: string;
    gasPrice: string;
    blockNumber: number;
    timestamp: string;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletConfig {
    defaultNetwork: string;
    autoSave: boolean;
    encryptionEnabled: boolean;
}

class SecureStorage {
    private masterKey: Buffer | null = null;
    private config: WalletConfig;

    constructor() {
        this.ensureStorageDirectory();
        this.config = this.loadConfig();
    }

    private ensureStorageDirectory(): void {
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { mode: 0o700 }); // Only owner can read/write/execute
        }
    }

    private loadConfig(): WalletConfig {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Failed to load config, using defaults');
        }
        
        return {
            defaultNetwork: 'sepolia',
            autoSave: true,
            encryptionEnabled: true
        };
    }

    private saveConfig(): void {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), { mode: 0o600 });
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }

    private deriveKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
    }

    private generateSalt(): Buffer {
        return crypto.randomBytes(16);
    }

    private encrypt(text: string, key: Buffer): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        cipher.setAAD(Buffer.from('wallet-storage', 'utf8'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        // Combine iv + tag + encrypted data
        return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    }

    private decrypt(encryptedData: string, key: Buffer): string {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0]!, 'hex');
            const tag = Buffer.from(parts[1]!, 'hex');
            const encrypted = parts[2]!;
            
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAAD(Buffer.from('wallet-storage', 'utf8'));
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: Invalid master password or corrupted data');
        }
    }

    async setMasterPassword(password: string): Promise<void> {
        const salt = this.generateSalt();
        this.masterKey = this.deriveKey(password, salt);
        
        // Store salt for future use
        const saltFile = path.join(STORAGE_DIR, 'salt.enc');
        fs.writeFileSync(saltFile, salt.toString('hex'), { mode: 0o600 });
    }

    async loadMasterPassword(password: string): Promise<boolean> {
        try {
            const saltFile = path.join(STORAGE_DIR, 'salt.enc');
            if (!fs.existsSync(saltFile)) {
                return false;
            }
            
            const saltHex = fs.readFileSync(saltFile, 'utf8');
            const salt = Buffer.from(saltHex, 'hex');
            const testKey = this.deriveKey(password, salt);
            
            // Test decryption with a dummy operation to verify the key is correct
            this.encrypt('test', testKey);
            
            // Only set masterKey if the test passed
            this.masterKey = testKey;
            return true;
        } catch (error) {
            // Don't set masterKey if password is wrong
            this.masterKey = null;
            return false;
        }
    }

    async saveWallet(
        wallet: HDNodeWallet, 
        name: string, 
        network: string = 'sepolia'
    ): Promise<string> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        const walletId = crypto.randomUUID();
        const mnemonic = wallet.mnemonic?.phrase || '';
        
        const account: WalletAccount = {
            index: 0,
            address: wallet.address,
            publicKey: wallet.publicKey,
            encryptedPrivateKey: this.encrypt(wallet.privateKey, this.masterKey),
            derivationPath: "m/44'/60'/0'/0/0"
        };
        
        const storedWallet: StoredWallet = {
            id: walletId,
            name,
            encryptedMnemonic: this.encrypt(mnemonic, this.masterKey),
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            network,
            accounts: [account],
            currentAccountIndex: 0
        };

        const wallets = await this.loadWallets();
        wallets.push(storedWallet);
        
        const encryptedWallets = this.encrypt(JSON.stringify(wallets), this.masterKey!);
        fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        
        return walletId;
    }

    async saveMultiAccountWallet(
        accounts: Array<{
            index: number;
            wallet: HDNodeWallet;
            balance?: string;
            txCount?: number;
        }>,
        name: string,
        network: string = 'sepolia'
    ): Promise<string> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        if (accounts.length === 0) {
            throw new Error('No accounts provided');
        }

        const walletId = crypto.randomUUID();
        const mnemonic = accounts[0]?.wallet.mnemonic?.phrase || '';
        
        const walletAccounts: WalletAccount[] = accounts.map(account => ({
            index: account.index,
            address: account.wallet.address,
            publicKey: account.wallet.publicKey,
            encryptedPrivateKey: this.encrypt(account.wallet.privateKey, this.masterKey!),
            derivationPath: `m/44'/60'/0'/0/${account.index}`,
            ...(account.balance && { balance: account.balance }),
            ...(account.txCount !== undefined && { txCount: account.txCount })
        }));
        
        const storedWallet: StoredWallet = {
            id: walletId,
            name,
            encryptedMnemonic: this.encrypt(mnemonic, this.masterKey),
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            network,
            accounts: walletAccounts,
            currentAccountIndex: 0
        };

        const wallets = await this.loadWallets();
        wallets.push(storedWallet);
        
        const encryptedWallets = this.encrypt(JSON.stringify(wallets), this.masterKey!);
        fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        
        return walletId;
    }

    async loadWallets(): Promise<StoredWallet[]> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        try {
            if (!fs.existsSync(WALLETS_FILE)) {
                return [];
            }
            
            const encryptedData = fs.readFileSync(WALLETS_FILE, 'utf8');
            const decryptedData = this.decrypt(encryptedData, this.masterKey);
            return JSON.parse(decryptedData);
        } catch (error) {
            console.error('Failed to load wallets:', error);
            return [];
        }
    }

    async getWallet(walletId: string): Promise<StoredWallet | null> {
        const wallets = await this.loadWallets();
        return wallets.find(w => w.id === walletId) || null;
    }

    async decryptWallet(storedWallet: StoredWallet): Promise<{ mnemonic: string; privateKey: string }> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        const mnemonic = this.decrypt(storedWallet.encryptedMnemonic, this.masterKey);
        const currentAccount = storedWallet.accounts[storedWallet.currentAccountIndex];
        if (!currentAccount) {
            throw new Error('Current account not found');
        }
        const privateKey = this.decrypt(currentAccount.encryptedPrivateKey, this.masterKey);
        
        return { mnemonic, privateKey };
    }

    async getCurrentAccount(storedWallet: StoredWallet): Promise<WalletAccount | null> {
        return storedWallet.accounts[storedWallet.currentAccountIndex] || null;
    }

    async switchAccount(walletId: string, accountIndex: number): Promise<boolean> {
        const wallets = await this.loadWallets();
        const wallet = wallets.find(w => w.id === walletId);
        
        if (!wallet || accountIndex < 0 || accountIndex >= wallet.accounts.length) {
            return false;
        }
        
        wallet.currentAccountIndex = accountIndex;
        wallet.lastUsed = new Date().toISOString();
        
        const encryptedWallets = this.encrypt(JSON.stringify(wallets), this.masterKey!);
        fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        
        return true;
    }

    async updateWalletLastUsed(walletId: string): Promise<void> {
        const wallets = await this.loadWallets();
        const wallet = wallets.find(w => w.id === walletId);
        
        if (wallet) {
            wallet.lastUsed = new Date().toISOString();
            const encryptedWallets = this.encrypt(JSON.stringify(wallets), this.masterKey!);
            fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        }
    }

    async deleteWallet(walletId: string): Promise<boolean> {
        const wallets = await this.loadWallets();
        const filteredWallets = wallets.filter(w => w.id !== walletId);
        
        if (filteredWallets.length === wallets.length) {
            return false; // Wallet not found
        }
        
        const encryptedWallets = this.encrypt(JSON.stringify(filteredWallets), this.masterKey!);
        fs.writeFileSync(WALLETS_FILE, encryptedWallets, { mode: 0o600 });
        return true;
    }

    async saveTransaction(transaction: TransactionRecord): Promise<void> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        const transactions = await this.loadTransactions();
        transactions.push(transaction);
        
        const encryptedTransactions = this.encrypt(JSON.stringify(transactions), this.masterKey);
        fs.writeFileSync(TRANSACTIONS_FILE, encryptedTransactions, { mode: 0o600 });
    }

    async loadTransactions(walletId?: string): Promise<TransactionRecord[]> {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }

        try {
            if (!fs.existsSync(TRANSACTIONS_FILE)) {
                return [];
            }
            
            const encryptedData = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
            const decryptedData = this.decrypt(encryptedData, this.masterKey);
            const transactions: TransactionRecord[] = JSON.parse(decryptedData);
            
            return walletId ? transactions.filter(t => t.walletId === walletId) : transactions;
        } catch (error) {
            console.error('Failed to load transactions:', error);
            return [];
        }
    }

    async clearAllData(): Promise<void> {
        try {
            if (fs.existsSync(WALLETS_FILE)) {
                fs.unlinkSync(WALLETS_FILE);
            }
            if (fs.existsSync(TRANSACTIONS_FILE)) {
                fs.unlinkSync(TRANSACTIONS_FILE);
            }
            const saltFile = path.join(STORAGE_DIR, 'salt.enc');
            if (fs.existsSync(saltFile)) {
                fs.unlinkSync(saltFile);
            }
        } catch (error) {
            console.error('Failed to clear data:', error);
        }
    }

    // Public method to encrypt data
    public encryptData(data: string): string {
        if (!this.masterKey) {
            throw new Error('Master password not set');
        }
        return this.encrypt(data, this.masterKey);
    }

    // Public method to get master key
    public     getMasterKey(): Buffer | null {
        return this.masterKey;
    }

    clearMasterKey(): void {
        this.masterKey = null;
    }

    getConfig(): WalletConfig {
        return this.config;
    }

    updateConfig(updates: Partial<WalletConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
    }
}

export const secureStorage = new SecureStorage();
