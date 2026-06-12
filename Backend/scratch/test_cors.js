import { isOriginAllowed } from '../src/config/env.js';

const runTests = () => {
    const testCases = [
        { origin: 'https://k9rides.onrender.com', expected: true },
        { origin: 'https://k9-rides-frontend.vercel.app', expected: true },
        { origin: 'https://k9rides.vercel.app', expected: true },
        { origin: 'https://k9rides.com', expected: true },
        { origin: 'https://sub.k9rides.com', expected: true },
        { origin: 'http://localhost:3000', expected: true },
        { origin: 'http://127.0.0.1:5173', expected: true },
        { origin: 'https://unauthorized-domain.com', expected: false },
        { origin: null, expected: true }, // mobile/curl
    ];

    let passed = 0;
    for (const { origin, expected } of testCases) {
        const result = isOriginAllowed(origin);
        if (result === expected) {
            console.log(`✅ PASS: origin='${origin}' => ${result}`);
            passed++;
        } else {
            console.log(`❌ FAIL: origin='${origin}' => got ${result}, expected ${expected}`);
        }
    }

    console.log(`\nTest results: ${passed}/${testCases.length} passed.`);
    if (passed === testCases.length) {
        process.exit(0);
    } else {
        process.exit(1);
    }
};

runTests();
