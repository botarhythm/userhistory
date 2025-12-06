import { execSync } from 'child_process';

const BASE_URL = 'https://userhistory-production.up.railway.app';
const MAX_RETRIES = 30; // 5 minutes (10s interval)
const RETRY_INTERVAL = 10000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCurrentCommitSha(): Promise<string> {
    try {
        return execSync('git rev-parse HEAD').toString().trim();
    } catch (error) {
        console.error('Failed to get current git commit SHA');
        process.exit(1);
    }
}

async function checkHealth(targetSha: string): Promise<boolean> {
    try {
        const res = await fetch(`${BASE_URL}/health`);
        if (!res.ok) return false;

        const data = await res.json() as any;
        const remoteSha = data.gitCommit;

        console.log(`Remote Commit: ${remoteSha} | Target: ${targetSha}`);

        // Check if remote SHA starts with target SHA (short hash vs long hash)
        // or exact match
        if (remoteSha && (remoteSha.startsWith(targetSha) || targetSha.startsWith(remoteSha))) {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

async function main() {
    const targetSha = await getCurrentCommitSha();
    console.log(`🚀 Starting deployment verification for commit: ${targetSha}`);
    console.log(`Waiting for production to reflect this commit...`);

    for (let i = 0; i < MAX_RETRIES; i++) {
        const isDeployed = await checkHealth(targetSha);
        if (isDeployed) {
            console.log(`\n✅ Deployment Verified! Remote is running commit ${targetSha}`);
            process.exit(0);
        }

        process.stdout.write('.');
        await sleep(RETRY_INTERVAL);
    }

    console.error(`\n❌ Verification Timeout. Deployment did not update to ${targetSha} within ${MAX_RETRIES * RETRY_INTERVAL / 1000} seconds.`);
    process.exit(1);
}

main();
