# Loading and scroll motion investigation

Investigated October 20, 2026. Scope: repository and published documentation/source review; no application behavior changed and no live performance measurements taken. Existing uncommitted application work was left untouched.

## Recommendation

Keep Rails, ERB, Turbo, Stimulus, and the existing CSS system. Add a small motion layer using IntersectionObserver and CSS/Web Animations. Consider GSAP with ScrollTrigger only if we choose a coordinated, scroll-scrubbed sequence beyond what sticky layout and section activation can deliver.

The intended feel: the dark hero introduces the person; the light page introduces their practice; project cards land with a little spring; case studies explain the work as the reader scrolls. Treat “card popups” as cards revealing in the page. Opening a modal automatically on scroll would interrupt reading and keyboard navigation.

## Current implementation

- `config/importmap.rb` loads Turbo and Stimulus. `package.json` contains browser testing dependencies; there is no React application or Tailwind build.
- `app/views/portfolio/overview.html.erb` already has useful story beats: hero, introduction and statistics, selected work, experience, current focus.
- `app/views/shared/_project_card.html.erb` centralizes cards across Overview and Projects. The current hover zoom is on the inner `.project-art`, so reveal transforms can live on the outer card without competing with it.
- `app/views/projects/show.html.erb` provides the narrative: overview, problem, contribution, implementation, and optional gallery. This is the strongest place for scrollytelling.
- `verse_controller.js` already implements a social card deck with staggered transforms, reduced motion, focus management, and Turbo cache cleanup. `marquee_controller.js` pauses animation off screen and in hidden tabs.
- Project covers are lazy loaded through `_project_art.html.erb`; the hero portrait has explicit dimensions and high fetch priority. Gallery images are lazy loaded but have no dimensions in the template.
- `public/legacy/src/motion-lab.js` contains reveal and skeleton experiments. Its timed curtain and simulated skeleton delays are demo behavior; production states should track actual work.
- `site.css` has a sticky topbar and reduced-motion rules. The checked-in desktop screenshot supports restrained motion against the existing cinematic/editorial design; it is a reference image, not a fresh browser capture.

## What the linked libraries offer

| Reference | Useful lesson | Fit here |
| --- | --- | --- |
| [MUI X Data Grid](https://mui.com/x/react-data-grid/) | React table with sorting, filtering, editing, and virtualization. Community is MIT; advanced tiers are commercial. | Consider separately for a future complex admin table. Adding React and a grid does not solve public portfolio motion. |
| [MUI loading overlays](https://mui.com/x/react-data-grid/overlays/) | Skeletons for absent data; linear progress while existing rows remain visible; separate empty and filtered-empty states. | Adopt the state model in our own markup. |
| [Vengeance Image Scatter](https://www.vengenceui.com/components/image-scatter) | Scattered image composition and animated transitions. | Visual inspiration, with implementation caveats below. |
| [Vengeance Gooey Text Reveal](https://www.vengenceui.com/components/gooey-text-reveal) | Immediate, scroll-triggered, and scrubbed text modes. | An optional accent for one short heading; basic fades are enough for body copy. |
| [Vengeance Verse Cards](https://www.vengenceui.com/components/verse-cards) | Fan/deal card interaction. | Our current social deck already follows this visual family. Reuse its motion vocabulary. |
| [Vengeance Kinetic Text Loader](https://www.vengenceui.com/components/kinetic-text-loader) | Playful typographic waiting indicator. | Optional for a genuinely slow operation, after simpler progress feedback. |

### Source findings that affect adoption

The published [Image Scatter registry source](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/image-scatter.json) imports GSAP and ScrollTrigger but advances sections using a three-second interval. It does not create a ScrollTrigger in that effect, despite the documentation's scroll-triggered description. It also animates `left`/`top`, uses random placement, creates images without alternative text, and has no reduced-motion branch. It needs adaptation before use as an accessible portfolio story.

The [Gooey Text source](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/gooey-text-reveal.json) uses React, GSAP, its React integration, ScrollTrigger, and SplitText. It does account for reduced motion, fonts, resize, and cleanup. Translating that lifecycle into Stimulus would still be work; filtered text rendering also warrants device testing.

The [Kinetic Loader source](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/kinetic-text-loader.json) imports a Google font in its embedded styles and tunes letter positions for “Loading.” Our current CSP permits fonts and styles from our own origin, so an adaptation should use our local fonts and stylesheet. Vengeance UI is [MIT licensed](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/LICENSE); preserve its notice if copying substantial source.

## Proposed behavior

### 1. Loading states

- **Navigation:** theme `.turbo-progress-bar` to the portfolio palette. Turbo already supplies delayed progress and page `aria-busy`; its handbook documents a default 500 ms threshold. Check the bundled version when implementing. [Turbo Drive progress](https://turbo.hotwired.dev/handbook/drive#displaying-progress).
- **Project filtering:** keep existing results visible while the GET form submits. Change the button label to “Filtering…” and prevent duplicate submission; restore it on completion or failure. Preserve the selected filter and expose a recoverable failure state. A dedicated Turbo Frame can be added if keeping filters outside the results becomes useful; it is not required for the initial pass.
- **Images:** reserve the intended image area, show a muted placeholder while loading, then fade the image in. Handle cached `complete` images, `load`, `error`, and controller disconnect. A failed image should resolve to a stable fallback rather than leave a permanent skeleton. Give gallery images dimensions or a deliberate aspect-ratio container.
- **Initial visit:** render the server HTML immediately. Any brief hero entrance is decoration and should not wait for every image or an artificial timer. Keep the portrait high priority and the main heading visible.

### 2. Playful cards upon scroll

Use a reusable `reveal_controller.js`, attached to a grid or section, with explicit targets and a small set of variants. [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) can trigger entry without running a handler on every scroll event.

Suggested tuning, to validate visually:

- Card entry: translate Y 24–40 px, scale 0.96 to 1, rotation at most ±2 degrees to zero, opacity to 1, over 450–650 ms with mild overshoot.
- Paired cards: stagger 60–90 ms; cap the group delay around 240 ms so long lists stay responsive.
- Featured card: a gentler rise with minimal rotation. Experience rows: simple upward fade. Headings: short fade/rise.
- Start near the lower portion of the viewport and play once per visit. Use a small intersection threshold so tall featured cards still trigger on mobile.
- Animate outer card transforms and opacity. Retain the inner image hover effect. Reveal a keyboard-focused card immediately so focus never lands on invisible content.

### 3. Scrollytelling

Start with a single case study. On wide screens, place its visual in a sticky column beneath the existing topbar and the narrative sections in the adjacent column. As “The problem,” “My contribution,” and “Under the hood” enter an activation band, update a small chapter indicator and, when matching screenshots exist, the visual. Keep meaningful narrative text in normal document order.

The Overview can use the same progression without pinning: introduction → featured project → supporting projects → experience → contact. Entrance animations alone are decoration; changing the visual in response to the case-study chapters supplies the storytelling relationship.

On narrow screens, use a vertical sequence with visuals inline. Use this layout for reduced motion too, or keep only static sticky positioning if reading remains comfortable. Avoid requiring readers to traverse large empty scroll distances to advance the story. If only one useful screenshot exists, keep it steady rather than implying unsupported visual chapters.

## Implementation boundaries

Suggested new controllers: `reveal_controller.js`, `image_load_controller.js`, `loading_controller.js` for form feedback, and `story_controller.js` for chapter activation. The existing controller loader will discover them. Put motion rules and tuning variables in a dedicated stylesheet or a clearly grouped section of `site.css`.

Content must be visible by default when JavaScript is unavailable. Enable hidden entry states only after a working observer is installed. Reveal everything immediately for reduced motion, unsupported APIs, or initialization errors. React to preference changes during a visit.

Disconnect observers/listeners, cancel animations/timers, and restore temporary labels/disabled states. Before Turbo caches a page, resolve pending reveals to visible content and remove temporary loading UI; restored pages must not return half hidden. Scope reveal state to the rendered page and preserve completed states on back navigation. If GSAP is introduced, revert its context and kill section triggers on teardown; serve dependency assets locally under the existing CSP.

## Delivery order and validation

1. Theme Turbo progress and implement image completion/error states.
2. Add shared card reveals and restrained section entrances on Overview and Projects.
3. Build one sticky case-study narrative, with inline mobile behavior.
4. Evaluate a richer GSAP sequence only after reviewing that result on real devices.

Extend the existing Playwright suite with slow navigation/filter responses, image failure, fast scrolling, keyboard focus into pending cards, repeated Turbo visits and browser back, JavaScript disabled, and reduced motion. Keep its four viewport widths and axe checks; verify transforms introduce no horizontal overflow. For a story, confirm chapter updates work in both scroll directions and anchors remain clear of the topbar. A short phone performance trace should check for layout work during animation and confirm the hero is not delayed.

Acceptance: every card remains reachable, failed images settle, loading ends on both success and failure, restored pages remain visible, reduced motion avoids bounce/scrub, and scrolling stays under the reader's control. These are proposed checks; no runtime suite was run for this research-only change.
