export { };
// import fetch from 'node-fetch'; // Using native fetch

const BASE_URL = 'http://localhost:8081';

const TEST_USER_ID = 'test-verifier-user-local';
const STORE_ID = 'test-store-001';
const QR_TOKEN = 'test-qr-token-123';

async function verifyPointsFlow() {
    console.log(`Verifying Points Flow on ${BASE_URL}...`);

    // 1. Ensure User Exists (by checking in)
    console.log(`\n1. Creating/Checking User ${TEST_USER_ID}...`);

    const checkinRes = await fetch(`${BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lineUid: TEST_USER_ID,
            displayName: 'Local Verifier User'
        })
    });

    if (!checkinRes.ok) {
        console.error('Failed to create user via checkin:', await checkinRes.text());
        return;
    }
    console.log('User created/checked-in successfully.');

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

    const earnData = await earnRes.json() as any;
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
    const statusRes = await fetch(`${BASE_URL}/api/points/status/${TEST_USER_ID}`);
    const statusData = await statusRes.json() as any;
    console.log('Status Response:', JSON.stringify(statusData, null, 2));

    if (statusData.currentPoints !== undefined) {
        console.log(`Current Points: ${statusData.currentPoints}`);
    }
}

verifyPointsFlow();
