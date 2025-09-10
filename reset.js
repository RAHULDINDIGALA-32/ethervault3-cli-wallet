#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

console.log('CLI HD Wallet Reset Tool');
console.log('============================\n');

const storageDir = path.join(process.cwd(), '.wallet-storage');

if (fs.existsSync(storageDir)) {
    console.log('📁 Found storage directory:', storageDir);
    
    try {
        // Delete all files in storage directory
        const files = fs.readdirSync(storageDir);
        files.forEach(file => {
            const filePath = path.join(storageDir, file);
            fs.unlinkSync(filePath);
            console.log(`   ✅ Deleted: ${file}`);
        });
        
        // Remove the directory
        fs.rmdirSync(storageDir);
        console.log('   ✅ Deleted storage directory');
        
        console.log('\n🎉 Reset completed successfully!');
        console.log('You can now run the program fresh: npm start');
        
    } catch (error) {
        console.log('❌ Error during reset:', error.message);
        console.log('Try manually deleting the .wallet-storage folder');
    }
} else {
    console.log('📁 No storage directory found - already clean!');
    console.log('You can run the program: npm start');
}

console.log('\n📋 What was reset:');
console.log('   • All wallet data');
console.log('   • All transaction history');
console.log('   • All settings');
console.log('   • User profile');
console.log('   • Master password');
