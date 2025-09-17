#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const args = process.argv.slice(2);
const force = args.includes('--yes');
const storageDir = path.join(process.cwd(), '.wallet-storage');

console.log(chalk.bold.cyan('\nEtherVault3 CLI Reset Tool'));
console.log(chalk.cyan('============================\n'));

if (!fs.existsSync(storageDir)) {
    console.log(chalk.yellow('📁 No storage directory found - already clean!'));
    console.log(chalk.white('You can run the program: npm start'));
    process.exit(0);
}

console.log(chalk.white('📁 Found storage directory: '), chalk.white(storageDir));

if (!force) {
    console.log(chalk.yellow('\n⚠️  This will permanently delete:'));
    console.log(chalk.yellow('   • All wallet data'));
    console.log(chalk.yellow('   • All transaction history'));
    console.log(chalk.yellow('   • All settings'));
    console.log(chalk.yellow('   • User profile'));
    console.log(chalk.yellow('   • Master password'));

    console.log(chalk.cyan('\nTo proceed, re-run with the --yes flag:'));
    console.log(chalk.white('   node scripts/reset.js --yes'));
    process.exit(1);
}

try {
    // Delete all files in storage directory
    const files = fs.readdirSync(storageDir);
    for (const file of files) {
        const filePath = path.join(storageDir, file);
        fs.unlinkSync(filePath);
        console.log(chalk.green(`   ✅ Deleted: ${file}`));
    }

    // Remove the directory
    fs.rmdirSync(storageDir);
    console.log(chalk.green('   ✅ Deleted storage directory'));

    console.log(chalk.green('\n🎉 Reset completed successfully!'));
    console.log(chalk.white('You can now run the program fresh: npm start'));
} catch (error) {
    console.log(chalk.red('❌ Error during reset:'), error.message || error);
    console.log(chalk.yellow('Try manually deleting the .wallet-storage folder'));
    process.exit(1);
}


