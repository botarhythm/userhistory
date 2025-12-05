// import fetch from 'node-fetch'; // Using native fetch in Node 20+

const BASE_URL = 'http://localhost:8080/api';
const LINE_USER_ID = 'test_user_001'; // Mock user
const STORE_ID = 'store_001'; // Mock store
const ADMIN_ID = process.env.ADMIN_LINE_USER_ID || 'admin_user'; // Should match server env

async function runTests() {
    console.log('🧪 Starting Points API Test...\n');

    // 0. Create User (Check-in)
    console.log('0. Creating User (Check-in)...');
    const checkinRes = await fetch(`${BASE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lineUid: LINE_USER_ID,
            displayName: 'Test User',
            timestamp: new Date().toISOString()
        })
    });
    console.log('Checkin Result:', await checkinRes.json());

    // 1. Check Status
    console.log('\n1. Checking Initial Status...');
    const statusRes = await fetch(`${BASE_URL}/points/status/${LINE_USER_ID}`);
    const status = await statusRes.json();
    console.log('Status:', status);

    // 2. Earn Points
    console.log('\n2. Earning Points...');
    const earnRes = await fetch(`${BASE_URL}/points/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lineUserId: LINE_USER_ID,
            storeId: STORE_ID,
            latitude: 35.681236, // Tokyo Station
            longitude: 139.767125,
            qrToken: 'valid_token_123' // Needs to match store in DB
        })
    });
    const earnResult = await earnRes.json();
    console.log('Earn Result:', earnResult);

    // 3. Admin Grant
    console.log('\n3. Admin Granting Points...');
    const grantRes = await fetch(`${BASE_URL}/admin/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-line-user-id': ADMIN_ID
        },
        body: JSON.stringify({
            targetLineUserId: LINE_USER_ID,
            amount: 5,
            reason: 'Test Grant'
        })
    });
    const grantResult = await grantRes.json();
    console.log('Grant Result:', grantResult);

    // 4. Check Updated Status
    console.log('\n4. Checking Updated Status...');
    const statusRes2 = await fetch(`${BASE_URL}/points/status/${LINE_USER_ID}`);
    const status2 = await statusRes2.json();
    console.log('Status:', status2);

    // 5. Get Rewards
    console.log('\n5. Fetching Rewards...');
    const rewardsRes = await fetch(`${BASE_URL}/points/rewards`);
    const rewards = await rewardsRes.json();
    console.log('Rewards:', rewards.rewards);

    // 6. Redeem (if points sufficient)
    if (rewards.rewards && rewards.rewards.length > 0) {
        const reward = rewards.rewards[0];
        console.log(`\n6. Redeeming Reward: ${reward.title} (${reward.pointsRequired} pts)...`);
        const redeemRes = await fetch(`${BASE_URL}/points/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineUserId: LINE_USER_ID,
                rewardId: reward.id
            })
        });
        console.log('Redeem Result:', await redeemRes.json());
    } else {
        console.log('\n6. Skipping Redeem (No rewards found)');
    }
}

runTests().catch(console.error);
