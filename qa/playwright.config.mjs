import { defineConfig, devices } from '@playwright/test';

const rawLiveBase = (process.env.QA_BASE_URL || '').trim();
const liveBase = rawLiveBase ? rawLiveBase.replace(/\/+$/, '') + '/' : '';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 8000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'qa-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL: liveBase || 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 15'] } }
  ],
  webServer: liveBase ? undefined : {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});
