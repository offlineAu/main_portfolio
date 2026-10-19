const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "bin/rails db:prepare && bin/rails runner script/browser_setup.rb && bin/rails server -b 127.0.0.1 -p 3101 -P tmp/pids/browser.pid",
    url: "http://127.0.0.1:3101/up",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      RAILS_ENV: "development",
      DATABASE_URL:
        process.env.PORTFOLIO_BROWSER_DATABASE_URL ||
        "postgresql://localhost/airl_portfolio_browser",
      PORTFOLIO_BROWSER_TEST: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || undefined,
      },
    },
  ],
});
