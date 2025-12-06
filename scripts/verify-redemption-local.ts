
const BASE_URL = 'http://localhost:8087';
const TEST_USER_ID = 'test-verifier-user-local';

async function verifyRedemption() {
    console.log(`Verifying Redemption Flow on ${BASE_URL}...`);

    // 1. Checkin (Ensure User)
    await fetch(`${BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUid: TEST_USER_ID, displayName: 'Local Verifier' })
    });
    console.log('Checkin complete. Waiting 3s for Notion consistency...');
    await new Promise(r => setTimeout(r, 3000));

    // 2. Earn 10 Points (to get 1 Ticket)
    console.log('Earning 10 points...');
    for (let i = 0; i < 11; i++) { // 11 to be safe
        await fetch(`${BASE_URL}/api/points/earn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineUserId: TEST_USER_ID,
                storeId: 'store_001', // Prod Store
                latitude: 34.96068108513542, // Exact Botarhythm location
                longitude: 139.95781847924133,
                qrToken: 'bota-prod-token-2024'
            })
        });
        process.stdout.write('.');
    }
    console.log('\nPoints earned.');

    // 3. Check Status
    const statusRes = await fetch(`${BASE_URL}/api/points/status/${TEST_USER_ID}`);
    const status = await statusRes.json();
    console.log('User Status:', JSON.stringify(status, null, 2));

    // 4. Redeem
    console.log('\nAttempting Redeem (coffee)...');
    const redeemRes = await fetch(`${BASE_URL}/api/points/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lineUserId: TEST_USER_ID,
            rewardType: 'reward_coffee'
        })
    });

    const redeemData = await redeemRes.json();
    console.log('Redeem Response:', JSON.stringify(redeemData, null, 2));
}

verifyRedemption();
