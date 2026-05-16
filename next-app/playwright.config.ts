import { defineConfig } from '@playwright/test';

// Aparte Playwright-config voor next-app/. De legacy config in de root
// draait tegen de Express-server (server.js); deze draait tegen `next dev`.
// Beide gebruiken poort 3001 — niet tegelijk runnen.

export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
        headless: true,
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: {
            NODE_ENV: 'test',
            PORT: '3001',
        },
    },
});
