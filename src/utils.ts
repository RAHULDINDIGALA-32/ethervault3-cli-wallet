import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });

export async function ask(question: string): Promise<string> {
    return rl.question(question);
}

export function close() {
    rl.close();
}
