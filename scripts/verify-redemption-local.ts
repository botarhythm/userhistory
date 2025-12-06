
const BASE_URL = 'http://localhost:8082';
const TEST_USER_ID = 'test-verifier-user-local';

async function verifyRedemption() {
    console.log(`Verifying Redemption Flow on ${BASE_URL}...`);

    // 1. Checkin (Ensure User)
    await fetch(`${BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUid: TEST_USER_ID, displayName: 'Local Verifier' })
    });

    // 2. Earn 10 Points (to get 1 Ticket)
    console.log('Earning 10 points...');
    for (let i = 0; i < 11; i++) { // 11 to be safe
        await fetch(`${BASE_URL}/api/points/earn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineUserId: TEST_USER_ID,
                storeId: 'test-store-001',
                latitude: 35.681236,
                longitude: 139.767125,
                qrToken: 'test-qr-token-123'
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
