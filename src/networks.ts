import * as dotenv from "dotenv";

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID as string | undefined;

// Optional custom RPCs from env
const CUSTOM_SEPOLIA_RPC = process.env.CUSTOM_SEPOLIA_RPC as string | undefined;
const CUSTOM_GOERLI_RPC = process.env.CUSTOM_GOERLI_RPC as string | undefined;
const CUSTOM_MAINNET_RPC = process.env.CUSTOM_MAINNET_RPC as string | undefined;

// Public fallback RPCs (no API key required). Note: subject to rate limits and reliability.
const PUBLIC_FALLBACKS = {
    sepolia: "https://rpc.sepolia.org",
    goerli: "https://rpc.ankr.com/eth_goerli",
    mainnet: "https://cloudflare-eth.com"
};

function resolveRpc(network: "sepolia" | "goerli" | "mainnet"): string {
    // 1) Custom RPC from env (highest priority)
    if (network === "sepolia" && CUSTOM_SEPOLIA_RPC) return CUSTOM_SEPOLIA_RPC;
    if (network === "goerli" && CUSTOM_GOERLI_RPC) return CUSTOM_GOERLI_RPC;
    if (network === "mainnet" && CUSTOM_MAINNET_RPC) return CUSTOM_MAINNET_RPC;

    // 2) Infura if project ID is provided
    if (INFURA_PROJECT_ID) {
        const base = network === "mainnet" ? "mainnet" : network;
        return `https://${base}.infura.io/v3/${INFURA_PROJECT_ID}`;
    }

    // 3) Public fallback
    return PUBLIC_FALLBACKS[network];
}

export const NETWORKS: { [key: string]: string } = {
    sepolia: resolveRpc("sepolia"),
    goerli: resolveRpc("goerli"),
    mainnet: resolveRpc("mainnet")
};

// add custom providers & networks here as required

