# The Veloce case study is told as a walk through the product: acts group steps, and each step
# pairs one screenshot (app/assets/images/veloce) with a short caption. Copy describes only what
# the screenshots show; it makes no claims about clients, traffic, or results.
module VeloceStoryHelper
  VELOCE_STORY = [
    { id: "first-impression", title: "The first impression", steps: [
      { image: "01-landing-page", ratio: "16 / 10", heading: "Your idea shouldn’t stay an idea.",
        body: "The landing page opens with one promise, custom software and web development, and two clear next steps: start a conversation or see what gets built.",
        alt: "Veloce landing page: a dark hero reading “Your idea shouldn’t stay an idea” with buttons to start a conversation or see what Veloce builds" },
      { image: "02-diagonal-carousel", ratio: "16 / 10", heading: "Finished work, before the first message.",
        body: "A diagonal carousel of sample websites, including a homeware online store, shows what “built the way we’d build yours” looks like.",
        alt: "A carousel of sample websites tilted on a diagonal, with a homeware online store in focus" }
    ] },
    { id: "explore-services", title: "Explore the services", steps: [
      { image: "03-service-book-cover", ratio: "4 / 3", heading: "Services as a book you open.",
        body: "Instead of a bulleted list, the services sit in a closed green book titled “Explore every service,” with a contents list beside it.",
        alt: "A closed green service book titled “Explore every service” next to a contents list of services" },
      { image: "04-service-book-open", ratio: "4 / 3", heading: "Every page answers one need.",
        body: "Open it and each spread covers one service, such as business websites, with a way to ask about it. The contents groups them by reaching customers, running the day, and improving what already exists.",
        alt: "The service book open to a Business websites page, with the contents list on the left" }
    ] },
    { id: "design-it-yourself", title: "Design it yourself", steps: [
      { image: "05-website-builder", ratio: "16 / 10", heading: "A builder that runs in the browser.",
        body: "Visitors can sketch their own site: a block list on the left, a live canvas in the middle, and theme, color, and font controls on the right.",
        alt: "The Veloce website builder showing a tattoo studio template on the canvas with block and theme panels" },
      { image: "06-template-library", ratio: "16 / 10", heading: "Start from a template.",
        body: "A “Choose a starting point” library offers templates for a tattoo studio, an advisory firm, an executive dashboard, and a client portal.",
        alt: "The template library dialog listing a tattoo studio, advisory firm, executive dashboard, and client portal template" },
      { image: "09-builder-guide", ratio: "16 / 10", heading: "Four steps to a draft.",
        body: "“Design it yourself. We build it for real.” Pick a template, drag blocks, make it yours, and send it over. The draft stays in the visitor’s own browser until they choose to send it.",
        alt: "A guide titled “Design it yourself. We build it for real” with four steps from picking a template to sending it" }
    ] },
    { id: "how-it-works", title: "How it works", steps: [
      { image: "07-interactive-workflow", ratio: "4 / 3", heading: "Try the process, not just read about it.",
        body: "“Build what matters” walks through think, build, and make it work, with an interactive example of a booking request moving from scattered messages to one place.",
        alt: "An interactive workflow panel titled “Try the process” with a customer booking example" },
      { image: "08-capabilities", ratio: "16 / 10", heading: "The functionality a business needs.",
        body: "Capabilities are grouped for customers, for the team, and for commerce and data, with illustrative examples like booking, contact forms, customer portals, and sign-in.",
        alt: "A capabilities section with a booking calendar and cards for contact forms, booking systems, customer portals, and authentication" },
      { image: "10-about-page", ratio: "16 / 10", heading: "Built in the Philippines, around your business.",
        body: "The story closes on the About page: a software team that builds websites, web applications, and custom systems for businesses that want working software.",
        alt: "The Veloce About page with a dark panel reading “Built in the Philippines. Built around your business.”" }
    ] }
  ].freeze

  # Expands the three database-managed chapters. The short database text stays as the lead
  # sentence (editable in the admin); these notes are checked against the Veloce-Dev repository.
  VELOCE_CASE = {
    "the-problem" => {
      intro: "A business that wants a custom website usually has to commit before it can picture the result, and the people who recommend that business have no clean way to introduce it. Three gaps kept showing up.",
      items: [
        ["Services were hard to browse", "A flat list of services doesn’t tell a visitor which one fits their business. They needed a way to explore by need, such as reaching customers, running the day-to-day, or improving what already exists."],
        ["Nobody could picture the finished site", "Without examples, “custom website” stays abstract. A visitor should be able to see finished sample sites, and even sketch their own, before deciding to talk."],
        ["Introductions couldn’t be traced", "The referral designs I started from shared a message with no link, a “Copy link” button that copied the company homepage, and an offer claimed through a self-declared checkbox. Nothing tied a new inquiry back to the person who made the introduction."]
      ]
    },
    "my-contribution" => {
      intro: "Veloce is a personal project and I built it end to end: the interface, the data model, the server logic, the tests, and the documentation behind the decisions.",
      items: [
        ["The sales experience", "The landing page, the sample-site carousel, and the service book that groups services by need, with “ask about this” on every page."],
        ["Referral pages and links", "Personalised referral pages, plus a prospect link that carries a private token so the offer and the introducing person show up when the link is opened."],
        ["A lead and introduction pipeline", "Inquiry and introduction forms feed a PostgreSQL pipeline. Leads move through New, Contacted, Consultation scheduled, Proposal in progress, then Converted or Not proceeding."],
        ["A website builder", "A browser-based builder with starter templates, movable blocks, theme controls, and an importer that turns exported HTML designs into editable templates."],
        ["Meeting booking and analytics", "A meeting request flow with optional Cal.com scheduling, and consent-first analytics. Both ship switched off until real accounts and disclosures are configured, so status here is “in development”."],
        ["Tests and written decisions", "Vitest unit and integration tests, Playwright end-to-end tests at mobile, tablet and desktop sizes with accessibility checks, and decision records for the choices that weren’t obvious."]
      ]
    },
    "under-the-hood" => {
      intro: "Next.js App Router and React 19 power the interface, written in strict TypeScript with Tailwind CSS 4 and Radix UI. Prisma 7 and PostgreSQL hold the data, and the builder runs on the Puck editor.",
      items: [
        ["Clear layers", "Components call server actions, actions call services, and services talk to Prisma. Components never import the database client, and services never import React."],
        ["One schema for both sides", "Each form has a single Zod schema used by the browser for instant feedback and again on the server, so the rules can’t drift apart."],
        ["Referral attribution on the server", "The link carries a long random token, never the database id. The server looks the campaign up and records the attribution itself. A bad or expired token degrades quietly instead of showing an error, and an expired offer is simply not shown."],
        ["Safe to retry", "Each form submission carries an idempotency key, so a double-click or a network retry can’t create a second lead. Notifications are logged before sending with a unique key, so the same email isn’t sent twice."],
        ["Abuse and input handling", "A honeypot field, Postgres-backed rate limiting that works across server instances, and strict security headers including a content security policy. Builder HTML is sanitized in the browser and cleaned again on the server."],
        ["Privacy by default", "Analytics are off unless enabled, load only after the visitor consents, and drop query strings and referral tokens from recorded paths."]
      ]
    }
  }.freeze

  def veloce_story
    VELOCE_STORY
  end

  def veloce_case(id)
    VELOCE_CASE[id]
  end
end
