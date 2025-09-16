import * as dotenv from "dotenv";


dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID as string;

export const NETWORKS: { [key: string]: string } = {
    sepolia: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
    goerli: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
    mainnet: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
};

// add custom providers & networks here as required

