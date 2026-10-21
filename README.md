# Au — Rails Portfolio

A public portfolio with a dark cinematic hero and light editorial pages, with a private content studio for Airl Joriz R. Janoplo. Built with Rails 8.1.4, Ruby 3.4.11, PostgreSQL, ERB, Turbo, Stimulus, Propshaft, and Active Storage.

Review the [desktop design](docs/screenshots/overview-1440.png) and [mobile design](docs/screenshots/overview-375.png).

## Local setup

Install Ruby 3.4.11, PostgreSQL 16+, and libvips. On macOS:

```sh
brew install ruby@3.4 postgresql@16 vips
export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"
brew services start postgresql@16
bundle install
bin/rails db:prepare
bin/rails owner:setup
bin/dev
```

Open <http://localhost:3000>. Owner sign-in is at `/session/new`; the content studio is at `/admin`. The setup task securely prompts for the email and password; it can also replace forgotten credentials and revokes existing sessions. No default password or public registration exists.

The first sign-in asks you to set up two-factor authentication: scan the QR code with an authenticator app, enter a code, and store the ten recovery codes it shows once. From then on, sign-in needs the password and a code. **Security** in the studio lists signed-in sessions (with sign-out buttons) and makes new recovery codes; **Activity** shows sign-ins and content changes. If the phone and recovery codes are both lost, run `bin/rails owner:reset_two_factor` on the server, then sign in and set it up again.

If the macOS SDK reports an `arm64e.x1` linker error while installing gems, select an installed compatible SDK for that command, for example `SDKROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk bundle install`.

`.env.example` documents environment variables; Rails does not automatically load that file. PostgreSQL defaults to local `airl_portfolio_development` and `airl_portfolio_test` databases. Set `DATABASE_URL` or `TEST_DATABASE_URL` to override them separately.

## Content studio

- Edit profile, portrait, availability, biography, focus, and credentials.
- Manage projects, case-study text, technology labels, source/demo URLs, cover/gallery images, and alternative text.
- Projects default to drafts. Preview privately, then enable **Published**. Development status is independent of visibility.
- **Featured** selects overview candidates; the lowest position number wins. Lower position numbers also appear first in lists. Project slugs cannot change after creation.
- Edit skills and experience, including display order.
- Upload JPEG, PNG, or WebP images up to 10MB each. Gallery images initially display in upload order; each image has editable alternative text and position. Replacement covers and image removal are supported.
- Private editorial notes hold verification questions and never appear publicly. Contact uses email and social links.
- **Watermark images** (on by default for projects, off for the portrait) adds a small "au · portfolio" mark to images on the public site. Served images are capped at 1200px (portrait 900×1600) and stripped of EXIF/GPS metadata. Originals in storage are unchanged.

The seed imports the supplied resume from `db/content/resume.json` and six curated projects. It never overwrites existing records. To explicitly apply this resume update to an existing database after migrating, run `bin/rails content:update_from_resume`. This updates the profile, replaces the superseded imported work history, adds resume skills, and corrects Sentisphere's role, dates, and contribution. Other projects, custom experience entries, and credentials are preserved. The supplied PDF is available from Contact as a resume download. Phone, website, and education remain editable in the profile studio.

GitHub is used as an editorial source, not a visitor-time API. Project notes distinguish repository evidence from owner-supplied descriptions. Deployment links and dates are omitted when unverified. Typographic covers intentionally stand in for missing genuine screenshots.

The Veloce cover is a genuine capture of its public Vercel homepage, verified October 16, 2026. Sentisphere's repository-listed Railway URL returned 404 on that date, so it has no public demo link.

## Checks

Public pages use Turbo navigation progress, filter submission feedback, and image
loading/failure states. Page navigation fades the outgoing content and lifts the
next page into place, with an animated Au badge when a visit takes over 240ms.
The sidebar stays anchored, history restoration keeps its scroll position, and
reduced motion disables the page and badge animations.
Overview and Projects reveal cards as they enter view;
Veloce uses a sticky screenshot story on desktop and inline images on mobile.
The new reveals and story transitions respect reduced motion and remain readable
without JavaScript. Motion controllers clean up when Turbo caches or replaces a page.

```sh
bin/rails test
bin/rails zeitwerk:check
bin/brakeman --no-pager
bin/bundler-audit
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile
```

For browser and accessibility checks:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

The browser suite uses a separate `airl_portfolio_browser` database and a test-only owner, checks six public pages at four viewport sizes with axe, and exercises the real publishing and upload flow. If Chrome is already installed, `PLAYWRIGHT_CHROME_CHANNEL=chrome npm run test:browser` uses it. Screenshots and failure traces are written under ignored `test-results/`.

Tests use a separate database and cover public routes and filters, owner access, two-factor sign-in, rate limits, session expiry, the activity log, security headers, image metadata stripping and watermarks, editing, draft previews, publication, image access/removal, validation, stable slugs, and repeatable seeding. Production boot can be checked locally using `ACTIVE_STORAGE_SERVICE=local`, a development-machine database URL, and a temporary `SECRET_KEY_BASE`; production normally uses the bucket configuration below.

## Vercel deployment

`vercel.json` explicitly routes all requests to the `portfolio` container service,
built from `Dockerfile.vercel`. `.vercelignore` excludes local secrets, uploads,
logs, and development caches from the deployment upload.

1. Link the existing project with `vercel link --project portfolio-au`.
2. Configure `RAILS_ENV=production`, `PORT=3000`, `APP_URL` (the deployment's HTTPS
   origin), `SECRET_KEY_BASE` (generate with `bin/rails secret`), and `DATABASE_URL`
   for an externally accessible PostgreSQL database.
3. Configure a private S3-compatible bucket using `ACTIVE_STORAGE_SERVICE=amazon`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT`, and
   `S3_REGION`. Use separate database and storage resources for previews.
4. In a trusted terminal with the production variables loaded, run
   `RAILS_ENV=production bin/rails db:prepare` and then
   `RAILS_ENV=production bin/rails owner:setup`. Sign in right away and finish two-factor setup. Run database migrations separately
   for later releases too; Vercel does not execute `railway.json` pre-deploy hooks.
5. Run `vercel deploy` for a preview. Verify `/up`, public pages, sign-in, and
   uploads before running `vercel deploy --prod`.

Vercel's container runtime is in beta. The Dockerfile precompiles Rails assets;
the legacy npm and Composer build commands are not used by the container service.

## Railway deployment

The repository includes a production Dockerfile and `railway.json`. Deployment has not been performed automatically.

1. Create a Railway project with a Rails service sourced from this repository, a PostgreSQL service, and a private S3-compatible storage bucket.
2. Set `RAILS_ENV=production`, `DATABASE_URL` from the PostgreSQL service, `APP_URL` to the public HTTPS origin, and `SECRET_KEY_BASE` from `bin/rails secret`.
3. Set `ACTIVE_STORAGE_SERVICE=amazon`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT`, and `S3_REGION` from the bucket's connection values. Keep the bucket private. Do not use container disk for production uploads.
4. Railway builds the Dockerfile, runs `bin/rails db:prepare` before deployment, starts Puma on `$PORT`, and checks `/up`. First preparation seeds content. Run `bin/rails owner:setup` through an interactive Railway service shell to provision the owner.
5. Verify public pages, sign-in, draft-to-publish flow, uploaded images, and restart persistence at the preview URL before changing any domain or public links.

Logs go to stdout. Use Railway health checks and deployment logs to monitor boot and failures. Enable PostgreSQL backups and retain bucket data; the database contains attachment references. Roll back code with the previous Railway deployment, retaining the database and uploads. Migrations in this version are additive; never reset a production database to roll back presentation changes.

The former Vercel static configuration has been removed. Its currently deployed site remains available until you change it. The original portfolio source and the old motion-lab experiment are retained in Git history.

## Public interface

`/` · `/projects?technology=Flutter` · `/projects/:slug` · `/about` · `/experience` · `/contact` · `/sitemap.xml` · `/robots.txt` · `/.well-known/security.txt` · `/up`

Security notes: see `docs/security-investigation.md`. Rate-limit counters live in PostgreSQL through Solid Cache, so they are shared by every instance. The two-factor secret is encrypted at rest. By default the keys are derived from `SECRET_KEY_BASE`, so rotating it means running `owner:reset_two_factor` afterwards; to avoid that, set `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY`, `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY`, and `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT` (generate them with `bin/rails db:encryption:init`) before setting up two-factor. Content Security Policy violations are logged as `[CSP violation]` lines. `/.well-known/security.txt` points to the contact page.

Project and profile images use controlled `/media/:signed_attachment_id` endpoints. Default Active Storage download routes are disabled so unpublishing a project also removes anonymous access to its images. Media is served through the app with private cache headers; unauthorized and unknown records return 404.
