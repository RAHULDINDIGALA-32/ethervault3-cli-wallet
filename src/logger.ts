/**
 * Centralized Logging Utility for Web3-CLI-HD-Wallet
 * Provides consistent, user-friendly logging across the application
 */

import chalk from 'chalk';
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export enum LogCategory {
    AUTH = 'AUTH',
    WALLET = 'WALLET',
    TRANSACTION = 'TRANSACTION',
    STORAGE = 'STORAGE',
    NETWORK = 'NETWORK',
    UI = 'UI',
    SECURITY = 'SECURITY',
    SYSTEM = 'SYSTEM'
}

interface LogConfig {
    level: LogLevel;
    showTimestamp: boolean;
    showCategory: boolean;
    showEmojis: boolean;
}

class Logger {
    private config: LogConfig;

    constructor() {
        this.config = {
            level: LogLevel.INFO,
            showTimestamp: false,
            showCategory: false,
            showEmojis: true
        };
    }

    private formatMessage(level: LogLevel, category: LogCategory, message: string, emoji?: string): string {
        let formatted = '';
        
        if (this.config.showTimestamp) {
            const timestamp = new Date().toISOString();
            formatted += chalk.white(`[${timestamp}] `);
        }
        
        if (this.config.showCategory) {
            formatted += chalk.white(`[${category}] `);
        }
        
        if (this.config.showEmojis && emoji) {
            formatted += `${emoji} `;
        }
        
        switch (level) {
            case LogLevel.ERROR:
                formatted += chalk.red(message); // Error: Red
                break;
            case LogLevel.WARN:
                formatted += chalk.yellow(message); // Warning: Yellow
                break;
            case LogLevel.INFO:
                formatted += chalk.cyan(message); // Info: Cyan
                break;
            case LogLevel.DEBUG:
            default:
                formatted += chalk.white(message);
        }
        return formatted;
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.config.level;
    }

    debug(category: LogCategory, message: string, data?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const formatted = this.formatMessage(LogLevel.DEBUG, category, message, '🔍');
            console.log(formatted);
            if (data) console.log(data);
        }
    }

    info(category: LogCategory, message: string, data?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const formatted = this.formatMessage(LogLevel.INFO, category, message, 'ℹ️');
            console.log(formatted);
            if (data) console.log(data);
        }
    }

    success(category: LogCategory, message: string, data?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const formatted = this.formatMessage(LogLevel.INFO, category, message, '✅');
            console.log(chalk.green(formatted)); // Success: Green
            if (data) console.log(data);
        }
    }

    warn(category: LogCategory, message: string, data?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const formatted = this.formatMessage(LogLevel.WARN, category, message, '⚠️');
            console.log(formatted);
            if (data) console.log(data);
        }
    }

    error(category: LogCategory, message: string, error?: any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const formatted = this.formatMessage(LogLevel.ERROR, category, message, '❌');
            console.log(formatted);
            if (error) {
                if (error instanceof Error) {
                    console.log(chalk.red(`   Error: ${error.message}`));
                    if (process.env.NODE_ENV === 'development') {
                        console.log(chalk.red(`   Stack: ${error.stack}`));
                    }
                } else {
                    console.log(chalk.red(`   Details: ${error}`));
                }
            }
        }
    }

    // User-friendly error messages
    userError(context: string, userMessage: string, technicalError?: any): void {
        console.log(`\n${chalk.red('❌ ' + context)}`);
        console.log(chalk.red(`   ${userMessage}`));
        
        if (technicalError && process.env.NODE_ENV === 'development') {
            console.log(chalk.red(`   Technical details: ${technicalError.message || technicalError}`));
        }
        
        console.log(chalk.cyan("\n🔄 Returning to main menu...\n"));
    }

    // Progress indicators
    progress(message: string, current?: number, total?: number): void {
        if (current !== undefined && total !== undefined) {
            const percentage = Math.round((current / total) * 100);
            console.log(`\n${chalk.cyan('🔄 ' + message)} ${chalk.white(`(${current}/${total} - ${percentage}%)`)}`);
        } else {
            console.log(`\n${chalk.cyan('🔄 ' + message)}`);
        }
    }

    // Transaction status
    transactionStatus(status: 'pending' | 'confirmed' | 'failed', hash: string, details?: string): void {
        const emoji = status === 'confirmed' ? '✅' : status === 'failed' ? '❌' : '⏳';
        const statusText = status === 'confirmed' ? chalk.green('Confirmed') : status === 'failed' ? chalk.red('Failed') : chalk.cyan('Pending');
        
        console.log(`${emoji} ${chalk.white('Transaction')} ${statusText}`);
        console.log(chalk.white(`   Hash: ${hash}`));
        if (details) {
            console.log(chalk.white(`   ${details}`));
        }
    }

    // Security warnings
    securityWarning(message: string): void {
        console.log(`\n${chalk.yellow('🔒 SECURITY WARNING:')} ${chalk.yellow(message)}`);
    }

    // Success messages with context
    operationSuccess(operation: string, details?: string): void {
        console.log(`\n${chalk.green('✅ ' + operation + ' completed successfully!')}`);
        if (details) {
            console.log(chalk.white(`   ${details}`));
        }
    }

    // Configuration methods
    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    setShowTimestamp(show: boolean): void {
        this.config.showTimestamp = show;
    }

    setShowCategory(show: boolean): void {
        this.config.showCategory = show;
    }

    setShowEmojis(show: boolean): void {
        this.config.showEmojis = show;
    }

    // Specialized logging methods for common scenarios
    authSuccess(username: string): void {
        this.success(LogCategory.AUTH, `Authentication successful for user: ${username}`);
    }

    authFailed(attempt: number, maxAttempts: number): void {
        this.warn(LogCategory.AUTH, `Authentication failed. Attempt ${attempt}/${maxAttempts}`);
    }

    walletCreated(name: string, address: string): void {
        this.success(LogCategory.WALLET, `Wallet "${name}" created successfully`);
        this.info(LogCategory.WALLET, `Address: ${address}`);
    }

    walletImported(name: string, accounts: number): void {
        this.success(LogCategory.WALLET, `Wallet "${name}" imported successfully`);
        this.info(LogCategory.WALLET, `Found ${accounts} account(s)`);
    }

    transactionSent(hash: string, to: string, amount: string): void {
        this.success(LogCategory.TRANSACTION, `Transaction sent successfully`);
        this.info(LogCategory.TRANSACTION, `Hash: ${hash}`);
        this.info(LogCategory.TRANSACTION, `To: ${to}, Amount: ${amount} ETH`);
    }

    transactionConfirmed(hash: string, blockNumber: number, gasUsed: string): void {
        this.success(LogCategory.TRANSACTION, `Transaction confirmed`);
        this.info(LogCategory.TRANSACTION, `Hash: ${hash}`);
        this.info(LogCategory.TRANSACTION, `Block: ${blockNumber}, Gas Used: ${gasUsed}`);
    }

    airdropProgress(current: number, total: number, recipient: string): void {
        this.progress(`Airdrop Progress`, current, total);
        this.info(LogCategory.TRANSACTION, `Sending to: ${recipient}`);
    }

    airdropComplete(successful: number, failed: number, total: number): void {
        const successRate = ((successful / total) * 100).toFixed(1);
        this.success(LogCategory.TRANSACTION, `Airdrop completed`);
        this.info(LogCategory.TRANSACTION, `Successful: ${successful}/${total} (${successRate}%)`);
        if (failed > 0) {
            this.warn(LogCategory.TRANSACTION, `Failed: ${failed} transactions`);
        }
    }

    balanceChecked(address: string, balance: string, network: string): void {
        this.info(LogCategory.WALLET, `Balance checked for ${address}`);
        this.info(LogCategory.WALLET, `Network: ${network}, Balance: ${balance} ETH`);
    }

    storageError(operation: string, error: any): void {
        this.error(LogCategory.STORAGE, `Storage operation failed: ${operation}`, error);
    }

    networkError(operation: string, network: string, error: any): void {
        this.error(LogCategory.NETWORK, `Network operation failed: ${operation} on ${network}`, error);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const log = {
    debug: (category: LogCategory, message: string, data?: any) => logger.debug(category, message, data),
    info: (category: LogCategory, message: string, data?: any) => logger.info(category, message, data),
    success: (category: LogCategory, message: string, data?: any) => logger.success(category, message, data),
    warn: (category: LogCategory, message: string, data?: any) => logger.warn(category, message, data),
    error: (category: LogCategory, message: string, error?: any) => logger.error(category, message, error),
    userError: (context: string, userMessage: string, technicalError?: any) => logger.userError(context, userMessage, technicalError),
    progress: (message: string, current?: number, total?: number) => logger.progress(message, current, total),
    transactionStatus: (status: 'pending' | 'confirmed' | 'failed', hash: string, details?: string) => logger.transactionStatus(status, hash, details),
    securityWarning: (message: string) => logger.securityWarning(message),
    operationSuccess: (operation: string, details?: string) => logger.operationSuccess(operation, details),
    
    // Specialized methods
    authSuccess: (username: string) => logger.authSuccess(username),
    authFailed: (attempt: number, maxAttempts: number) => logger.authFailed(attempt, maxAttempts),
    walletCreated: (name: string, address: string) => logger.walletCreated(name, address),
    walletImported: (name: string, accounts: number) => logger.walletImported(name, accounts),
    transactionSent: (hash: string, to: string, amount: string) => logger.transactionSent(hash, to, amount),
    transactionConfirmed: (hash: string, blockNumber: number, gasUsed: string) => logger.transactionConfirmed(hash, blockNumber, gasUsed),
    airdropProgress: (current: number, total: number, recipient: string) => logger.airdropProgress(current, total, recipient),
    airdropComplete: (successful: number, failed: number, total: number) => logger.airdropComplete(successful, failed, total),
    balanceChecked: (address: string, balance: string, network: string) => logger.balanceChecked(address, balance, network),
    storageError: (operation: string, error: any) => logger.storageError(operation, error),
    networkError: (operation: string, network: string, error: any) => logger.networkError(operation, network, error)
};
