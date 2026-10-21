# Security hardening investigation

Investigated October 21, 2026. Scope: repository review only; no application behavior changed and no live headers, scans, or penetration tests were run against the deployed site.

## Recommendation

Do not try to make the public site uninspectable or screenshot-proof. A browser has to receive the HTML, CSS, JavaScript, and image bytes to display them, so anything a visitor can see they can also save. Blocking right-click, F12, or DevTools is defeated in seconds (browser menu, `view-source:`, disabling JavaScript, `curl`, a phone camera) and mainly hurts the people a developer portfolio is for: recruiters and engineers who open DevTools to judge the work, keyboard and screen-reader users, and anyone on a browser we didn't test.

Instead, raise the cost of reusing images (watermarks, capped resolution, hotlink protection, metadata stripping) and put the real security effort where the risk is: the admin content studio, the session cookie, rate limiting that works across instances, and response headers. Those are the ways the site could actually be defaced or abused.

## Current posture

What is already in good shape:

- **CSP** (`config/initializers/content_security_policy.rb`): `default-src 'self'`, nonce-based `script-src`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`. Clickjacking is already blocked.
- **Transport:** `force_ssl` and `assume_ssl` in production, which sends HSTS and secure cookies.
- **Admin auth:** `has_secure_password`, a 12-character password minimum, `authenticate_by` (timing-safe), `reset_session` on login, a signed `httponly` cookie with `same_site: :lax`, and a 14-day session expiry check. `Admin::BaseController` sets `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
- **Media** (`MediaController`): images are served only as re-encoded WebP variants through signed, purpose-scoped tokens. Originals in S3 are never exposed. Draft project media requires a session and is sent `no-store`. `X-Content-Type-Options: nosniff` is set.
- **Uploads** (`ImageUploads`): allowlisted to JPEG/PNG/WebP, 10 MB maximum. Active Storage's default routes are disabled (`draw_routes = false`), so the unauthenticated direct-upload and blob-redirect endpoints don't exist.
- **Mass assignment:** `record_params` permits fields per resource and filters `gallery_details` to attachment IDs the record already owns.
- **XSS:** content is rendered with `simple_format` (which sanitizes) and ERB escaping. The two `html_safe` calls use static strings.
- **Supply chain:** CI runs Brakeman, bundler-audit, and `importmap audit`.

Gaps found:

1. **Login rate limiting is per instance.** `SessionsController` uses `rate_limit`, which stores counts in `Rails.cache`. Production sets no `cache_store`, so each container keeps its own file cache. On Vercel or Railway with several or recycled instances, an attacker gets 10 attempts per 3 minutes *per instance*, and counters reset on every deploy.
2. **No second factor on admin.** A leaked or reused password is enough to rewrite the whole portfolio.
3. **Sessions are never cleaned up or revocable.** Expired `Session` rows remain, there's no "sign out other devices" option, and the 14-day expiry is absolute rather than sliding from last use.
4. **Image metadata may survive.** Variants are produced with libvips, which keeps EXIF by default. A phone photo uploaded as a portrait or cover could publish GPS coordinates and device details.
5. **No image deterrents.** Covers serve up to 1600 px and the portrait up to 900×1600, with no watermark. Static Veloce screenshots in `app/assets/images/veloce/` are served at 1800 px through Propshaft. Any site can hotlink `/media/:token`.
6. **CSP allows `'unsafe-inline'` styles** and has no violation reporting, so we'd never learn about an injection attempt or a policy that broke something.
7. **Some headers are left at defaults.** No `Permissions-Policy`, `Cross-Origin-Opener-Policy`, or `Cross-Origin-Resource-Policy`. HSTS isn't set up for preload.
8. **`/media` has no rate limit.** The first request for each variant runs libvips; tokens are fixed per attachment, so this is mostly bandwidth, but nothing slows a scraper down.
9. **Contact details are in plain markup.** The email address appears in every page header and on Contact, which feeds spam harvesters. `public/airl-joriz-janoplo-resume.pdf` is publicly crawlable; check what personal data it contains.
10. **`public/legacy/` is still deployed.** It's old code that's still reachable even though `robots.txt` disallows it. Remove it if nothing links there.

## About "uninspectable" and "no screenshots"

| Technique | What it actually does | Verdict |
| --- | --- | --- |
| Block right-click / `contextmenu` | Hides "Save image as" from casual visitors. Bypassed via the browser menu, drag-to-desktop, or DevTools. Also breaks "open link in new tab" if applied page-wide. | Images only, as a light deterrent. Never page-wide. |
| Block F12 / Ctrl+Shift+I, detect open DevTools | Easy to defeat. DevTools detection relies on timing and size checks that misfire on docked windows and small screens. | Don't. It looks hostile to the engineers you want to impress. |
| Disable text selection | Stops copying the bio and case studies, and hurts accessibility and recruiters who paste into notes. | Don't. (`user-select: none` on the social card deck is fine; it's an interactive control.) |
| `draggable="false"`, `-webkit-touch-callout: none` | Stops dragging images out on desktop and the long-press save sheet on iOS. | Adopt for portfolio images. Cheap, and invisible to normal use. |
| Transparent overlay or CSS background instead of `<img>` | "Save image" grabs the overlay. Hurts alt text and SEO, and the image URL is still in DevTools. | Don't. Watermarking achieves more. |
| Canvas rendering / tiled images | Makes "save" awkward; the bytes still arrive. Breaks lazy loading, alt text, and responsive images. | Don't. |
| Block screenshots | The web has no API for this. OS screenshots, screen recorders, and cameras can't be detected from a page. Only DRM video (EME/Widevine) gets black frames, and only on some platforms. | Not achievable. Use a visible watermark instead. |
| Blur on `visibilitychange` / window blur | Blanks images when the tab loses focus. Annoying, and it doesn't stop a screenshot. | Don't. |
| **Visible watermark baked into served variants** | Any copy, including a screenshot, carries attribution. | **Adopt** for project screenshots, with a toggle per image. |
| **Capped served resolution** | Copies are good enough to view but not to reprint or reuse as a hero image. | **Adopt.** Around 1200 px for covers and galleries. |
| **Hotlink protection** | Other sites can't embed images served from our bandwidth. | **Adopt** via `Cross-Origin-Resource-Policy: same-origin`. |

## Proposed work

### 1. Image protection (what the request asked for)

- **Strip metadata:** pass `saver: { strip: true }` (or `keep: :none` on libvips 8.15+) in `MediaController`'s `variant` call. Changing the variant options produces new variant keys, so the old versions get regenerated.
- **Watermark:** add a `watermark` boolean on `Project` (default on) and composite a small, semi-transparent "au · portfolio" mark in a corner using `ImageProcessing::Vips` `composite`. Exclude the profile portrait, or use a subtler mark there. Pre-render the watermarked Veloce screenshots, or move them into Active Storage so they go through the same pipeline.
- **Resolution:** reduce the `resize_to_limit` values to `[1200, 1200]` for projects, and keep the portrait at its displayed size.
- **Hotlinking:** set `Cross-Origin-Resource-Policy: same-origin` on `/media` responses. Optionally reject requests whose `Sec-Fetch-Site` is `cross-site`, which is more reliable than checking `Referer`.
- **Deterrents:** add `draggable: false` to portfolio `image_tag`s, `-webkit-touch-callout: none` on `.project-art img`, `.hero-portrait`, and the gallery, and a small Stimulus handler that cancels `contextmenu` on those images only.
- **Legal:** add a footer line such as "© 2026 Au. Project imagery may not be reused without permission." Optionally publish a `/.well-known/security.txt`.

### 2. Admin and session hardening (highest real risk)

- **Shared rate limiting:** set `config.cache_store = :solid_cache_store` (Postgres-backed, already our database) so counts are shared across instances and survive deploys. Also rate limit by normalized email, not just by IP, so a distributed attack on one account is still throttled.
- **TOTP second factor:** add `rotp` and `rqrcode`, store an encrypted `otp_secret` on `User` (Active Record encryption) and one-time recovery codes, and require the code before creating a `Session`. Passkeys (WebAuthn) are a good later upgrade.
- **Sessions:** set a sliding expiry on `last_seen_at`, add an idle timeout (for example, 12 hours) on top of the absolute 14 days, add a job or `before_action` that deletes expired rows, add a "Sessions" admin page listing user agent and IP with revoke buttons, and use `same_site: :strict` on the admin cookie.
- **Login notifications:** email on sign-in from a new IP or user agent. This needs a mailer; the app has none yet.
- **Audit log:** an `AuditEvent` row for each admin create, update, destroy, and sign-in, so we can see what changed after a compromise.
- **Optional:** restrict `/admin` and `/session` to an IP allowlist or put them behind Cloudflare Access. That is the strongest single control for a one-person admin.

### 3. Headers and CSP

- Add `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `Cross-Origin-Opener-Policy: same-origin`, and an explicit `Referrer-Policy: strict-origin-when-cross-origin` through `config.action_dispatch.default_headers`.
- HSTS: `config.ssl_options = { hsts: { expires: 2.years, subdomains: true, preload: true } }`, then submit the domain to hstspreload.org once the domain is final. Preload is hard to undo.
- CSP: move inline `style=` attributes into classes (or use `style-src` nonces and hashes) to remove `'unsafe-inline'`, and add `upgrade-insecure-requests`. Add `report-to` pointing at a small `/csp-reports` endpoint that logs violations. Ship it as `Content-Security-Policy-Report-Only` for a week first.

### 4. Abuse and privacy

- `rate_limit` on `MediaController#show` (for example, 300 requests per minute per IP) using the shared cache.
- Obfuscate the email address: render it from a Stimulus controller that assembles it on click, keeping a `<noscript>` fallback, or route contact through a form with a honeypot and rate limit, as the Veloce project already does.
- Review the resume PDF for home address and phone number; consider an "on request" version.
- Delete `public/legacy/` and the `motion-lab.html` redirect if they're no longer needed.

### 5. Continuous checks

- Already in CI: Brakeman, bundler-audit, importmap audit. Dependabot already covers gems and GitHub Actions; add npm, and run `npm audit`.
- Add integration tests: unauthenticated draft `/media` returns 404, admin routes redirect, expected security headers are present, a login lockout persists across cache instances, and a second-factor bypass attempt fails.
- After deploying, check the site with securityheaders.com and Mozilla Observatory, aiming for an A grade.

## Delivery order

1. Shared cache store and login rate limiting, plus EXIF stripping. Small changes that fix real exposures.
2. Headers (Permissions-Policy, COOP, CORP on media) and a Report-Only CSP with reporting.
3. Image protection: watermark, capped resolution, drag and long-press deterrents.
4. TOTP second factor, session management page, audit log.
5. Contact obfuscation, legacy cleanup, then enforce the stricter CSP and HSTS preload.

## Implementation status (October 21, 2026)

Implemented:

- **Rate limiting:** Solid Cache (`solid_cache_entries` in the primary database) is the production cache store. Sign-in is limited per IP (10 per 3 minutes) and per account (20 per hour). There are also limits on the two-factor step, enrolment, `/media` (300 per minute), and `/csp-reports`.
- **Two-factor:** TOTP via `rotp`, with the secret encrypted by Active Record encryption. Each code works once. There are ten HMAC-hashed recovery codes, each usable once. Enrolment is required before any admin page loads. `bin/rails owner:reset_two_factor` is the recovery path.
- **Sessions:** 12-hour idle timeout plus the 14-day absolute limit, `same_site: :strict`, expired rows swept at sign-in (and by `owner:sweep_sessions`), and a Security page listing sessions with revoke buttons.
- **Audit log:** an `audit_events` table recording sign-ins (flagging new devices), failed attempts, sign-outs, revocations, two-factor events, and content create/update/delete with changed field names. Shown on the Activity page.
- **Images:** `strip: true` (a test proves EXIF is removed), 1200 px cap for projects, a watermark composited by libvips (`lib/assets/watermark.png`, toggled per project and for the portrait), `Cross-Origin-Resource-Policy: same-origin`, a 403 for `Sec-Fetch-Site: cross-site`, a version query that busts caches when settings change, `draggable=false`, `-webkit-touch-callout: none`, and a `media-guard` controller that blocks the context menu on images only. Static Veloce screenshots were watermarked in place.
- **Headers/CSP:** `'unsafe-inline'` removed from `style-src` (inline style attributes replaced with classes or CSSOM writes; Turbo uses the nonce), `report-uri /csp-reports`, `upgrade-insecure-requests` in production, Permissions-Policy, COOP, and an explicit Referrer-Policy. The browser suite fails on any CSP console violation, so the stricter policy was enforced immediately instead of first running a week in Report-Only mode.
- **Privacy:** email and phone are base64-encoded in the HTML and decoded by a `contact` controller. Without JavaScript they show a masked version and links fall back to `/contact`. Added `security.txt`, a footer notice, and a robots rule for the resume PDF. `public/legacy/` was removed.
- **CI:** npm added to the existing Dependabot config (bundler and actions were already covered), plus `npm audit --audit-level=high`.

Not implemented, and why:

- **New-device sign-in email:** the app has no mailer or SMTP provider yet. The Activity page flags "(new device)" sign-ins in the meantime.
- **IP allowlist / Cloudflare Access for `/admin`:** infrastructure, not app code. Still the strongest optional control.
- **HSTS preload:** Rails already sends HSTS for 2 years including subdomains. Add `preload` only once the final domain is settled.
- **Passkeys (WebAuthn):** a possible later upgrade from TOTP.
- **Resume PDF:** it contains the phone number and email in plain text. Consider a version without them, or "on request".

Acceptance: anyone can still read, select, and inspect the public site; published images carry a watermark and no EXIF; draft media stays private; admin sign-in requires a second factor and is throttled across instances; header scanners report no missing headers. These are proposed checks; nothing has been implemented or run for this research-only change.
