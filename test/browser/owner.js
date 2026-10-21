const crypto = require("crypto");
const { expect } = require("@playwright/test");

// Must match script/browser_setup.rb. Test-only; never used outside the isolated browser database.
const OTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
let lastStep = -1;

function base32Decode(text) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of text.replace(/=+$/, "")) bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  return Buffer.from(bits.match(/.{8}/g).map((byte) => parseInt(byte, 2)));
}

function totp(step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", base32Decode(OTP_SECRET)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

// The server accepts each code once, so a second sign-in waits for the next 30-second step.
async function signIn(page) {
  await page.goto("/session/new");
  await page.getByLabel("Email address").fill("browser-test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("browser-test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/session\/two_factor\/new$/);
  let step = Math.floor(Date.now() / 30000);
  if (step <= lastStep) {
    await page.waitForTimeout((lastStep + 1) * 30000 - Date.now() + 250);
    step = Math.floor(Date.now() / 30000);
  }
  lastStep = step;
  await page.getByLabel("Code", { exact: true }).fill(totp(step));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

// Collects Content-Security-Policy violations reported by the browser console.
function watchCsp(page) {
  const violations = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  return violations;
}

module.exports = { signIn, watchCsp };
