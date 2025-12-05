// import fetch from 'node-fetch'; // Using native fetch

const BASE_URL = 'https://userhistory-production.up.railway.app';
// const BASE_URL = 'http://localhost:3000'; // Uncomment for local testing

const TEST_USER_ID = 'test-verifier-user';
const STORE_ID = 'test-store-001';
const QR_TOKEN = 'test-qr-token-123';

async function verifyPointsFlow() {
    console.log(`Verifying Points Flow on ${BASE_URL}...`);

    // 1. Ensure User Exists (by checking in or just checking status)
    // The current API doesn't have a direct "register" endpoint exposed under /api/points, 
    // but /api/points/status might return 404 if not found.
    // However, the system seems to rely on the main app to register users via NotionAPI.findOrCreateCustomer.
    // The /api/points/earn endpoint checks if customer exists.
    // Let's try to "check-in" using the admin API or similar if available, or just hope the user exists from previous tests?
    // Wait, I can use the /api/admin/checkin endpoint if I have the secret? 
    // Or I can use the NotionAPI directly in this script to ensure the user exists in the DB before calling the API.
    // But this script is testing the HTTP API.

    // Let's try to hit /api/points/status first.
    console.log(`\n1. Checking User Status for ${TEST_USER_ID}...`);
    let statusRes = await fetch(`${BASE_URL}/api/points/status/${TEST_USER_ID}`);

    if (statusRes.status === 404) {
        console.log('User not found. Attempting to create user via Admin API (if possible) or skipping...');
        // We don't have a public register endpoint. 
        // But we can use the backend logic to create one if we run this script locally with DB access.
        // Since we are testing PRODUCTION, we can't easily "create" a user unless there's an endpoint.
        // The /api/checkin endpoint (from server.ts) might work?
        // Let's check server.ts for /api/checkin.

        console.log('Trying /api/checkin to create user...');
        const checkinRes = await fetch(`${BASE_URL}/api/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineUid: TEST_USER_ID,
                displayName: 'Verifier User'
            })
        });

        if (!checkinRes.ok) {
            console.error('Failed to create user via checkin:', await checkinRes.text());
            return;
        }
        console.log('User created/checked-in successfully.');
    } else if (!statusRes.ok) {
        console.error('Failed to check status:', await statusRes.text());
        return;
    } else {
        console.log('User exists.');
    }

    // 2. Earn Points
    console.log(`\n2. Attempting to Earn Points...`);
    const earnPayload = {
        lineUserId: TEST_USER_ID,
        storeId: STORE_ID,
        latitude: 35.681236,
        longitude: 139.767125,
        qrToken: QR_TOKEN
    };

    const earnRes = await fetch(`${BASE_URL}/api/points/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(earnPayload)
    });

    const earnData = await earnRes.json();
    console.log('Earn Response:', JSON.stringify(earnData, null, 2));

    if (!earnRes.ok) {
        console.error('Failed to earn points.');
        return;
    }

    if (earnData.success) {
        console.log('✅ Points earned successfully!');
    } else {
        console.error('❌ Failed to earn points (logic error).');
    }

    // 3. Verify Balance Updated
    console.log(`\n3. Verifying New Balance...`);
    statusRes = await fetch(`${BASE_URL}/api/points/status/${TEST_USER_ID}`);
    const statusData = await statusRes.json();
    console.log('Status Response:', JSON.stringify(statusData, null, 2));

    if (statusData.currentPoints !== undefined) {
        console.log(`Current Points: ${statusData.currentPoints}`);
    }
}

verifyPointsFlow();
