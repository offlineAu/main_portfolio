require "json"

# Import once. Existing records belong to the editor and are never overwritten.
original = JSON.parse(Rails.root.join("db/content/original.json").read)
resume = JSON.parse(Rails.root.join("db/content/resume.json").read)
original = original.deep_merge(resume)
unless Profile.exists?
  profile = Profile.create!(
    name: original["name"], short_name: original["short"], handle: original["handle"],
    phone: original["phone"], website_url: original["websiteUrl"], education: original["education"],
    title: original["title"], location: original["location"], email: original["email"],
    github_url: original["githubUrl"], linkedin_url: original["linkedinUrl"],
    availability: original["availability"], introduction: original["tagline"],
    about: original.dig("about", "body").join("\n\n"),
    focus: original["focus"].join("\n"),
    credentials: original["credentials"].join("\n"), portrait_alt: "Portrait of Airl Joriz Janoplo"
  )
  profile.portrait.attach(io: File.open(Rails.root.join("db/content/portrait.png")), filename: "airl-joriz.png", content_type: "image/png")
end

projects = [
  {
    slug: "sentisphere", name: "Sentisphere", tagline: "NLP-powered student emotional tracking",
    description: resume["sentisphere"]["description"], role: resume["sentisphere"]["role"], year: resume["sentisphere"]["year"],
    category: "Web application", status: "Case study", featured: true,
    technologies: ["Laravel", "React", "TypeScript", "Python", "Hugging Face", "FastAPI", "MySQL", "Expo"],
    highlights: resume["sentisphere"]["highlights"], source_url: "https://github.com/offlineAu/Sentisphere",
    problem: "Student check-ins contain signals about emotional well-being. Sentisphere brings those signals together so counselors can review sentiment trends and identify where support may be needed.",
    contribution: resume["sentisphere"]["contribution"],
    implementation: "A Laravel and React web application connects to a Python FastAPI backend. Transformer-based NLP models process sentiment, with a React Native and Expo companion app for student check-ins.",
    editorial_notes: "GitHub confirms Laravel, React, FastAPI, transformer dependencies, and Expo components. A Railway homepage is listed in repository metadata; reachability is unverified, so no live link is published. Role, dates, contribution, and summary were updated from the supplied resume."
  },
  {
    slug: "veloce", name: "Veloce", tagline: "Websites, referrals, and a clearer path to new clients",
    description: "A client-acquisition platform combining a custom-website sales page, personalized referral pages, and a lead and introduction pipeline backed by PostgreSQL.",
    role: "Personal project · Web development", category: "Web application", status: "In development",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"],
    highlights: ["Personalized client-referral pages", "Lead and introduction pipeline", "PostgreSQL-backed application"],
    source_url: "https://github.com/offlineAu/Veloce-Dev", live_url: "https://veloce-sable.vercel.app",
    cover_alt: "Veloce website showing its custom software and web development introduction",
    problem: "Present website services and connect introductions to a structured lead pipeline.",
    contribution: "Built the service presentation and referral experience, organizing lead introductions into a structured pipeline.",
    implementation: "Next.js App Router and React power the interface. TypeScript, Prisma, and PostgreSQL support the application, with shared validation and server-side services.",
    editorial_notes: "Based on the public README and package manifest reviewed October 16, 2026. Public Vercel homepage verified and captured on the same date. No client totals or commercial results have been verified. Confirm personal contribution and status before adding stronger claims."
  },
  {
    slug: "e-lista", name: "E-Lista", tagline: "Everyday commerce for neighborhood sari-sari stores",
    description: "A Flutter and Firebase application for Philippine neighborhood stores. It brings shopper browsing and ordering together with an owner workspace for pricing, restocking, and fulfillment. The repository documents a local emulator setup; a production Firebase project is not connected yet.",
    role: "Personal project · Mobile development", category: "Mobile application", status: "In development",
    technologies: ["Flutter", "Dart", "Firebase", "TypeScript"],
    highlights: ["Guest shopping and order tracking", "Owner pricing and restocking workflows", "Server-side checkout and transactional inventory"],
    source_url: "https://github.com/offlineAu/E-Lista",
    problem: "Small neighborhood stores need simple ways to manage products, pricing, and stock while helping customers place orders.",
    contribution: "Connected shopper browsing and ordering with owner pricing and restocking workflows, keeping price calculations and inventory changes in the server-side layer.",
    implementation: "Flutter handles the mobile experience. Firebase and TypeScript Cloud Functions provide server-side pricing, checkout, and inventory transactions. Development currently uses the Firebase emulator suite.",
    editorial_notes: "Based on the dev-branch README reviewed October 16, 2026. Repository language metadata lists Python, but the implementation documentation describes Flutter/Dart and Firebase. No production launch claimed."
  },
  {
    slug: "loom", name: "LOOM", tagline: "A considered home for everyday trackers",
    description: "A mobile-first tracker platform built with Next.js and TypeScript. The project focuses on a shared design system, tracker discovery, and a reusable public application shell.",
    role: "Personal project · Interface development", category: "Web application", status: "In development",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    highlights: ["Shared design system and application shell", "Mobile-first tracker gallery", "Documented phased architecture"],
    source_url: "https://github.com/offlineAu/loom",
    problem: "Give everyday tracking tools a coherent interface and a reusable platform foundation.",
    contribution: "Development of the public application shell, tracker discovery interface, and shared visual system.",
    implementation: "Next.js, React, and TypeScript provide the platform foundation, with Tailwind CSS and shared components for the visual system.",
    editorial_notes: "README and Phase 1A report describe the frontend shell. The current manifest includes Supabase and Dexie; documentation may lag code. Verify current implementation before claiming authentication, sync, persistence, or completed debt-tracking behavior."
  },
  {
    slug: "syntax-sip", name: "Syntax.sip", tagline: "A coffee-shop ordering experience, on mobile",
    description: original["projects"][1]["description"], role: original["projects"][1]["role"],
    category: "Mobile application", status: "Prototype", technologies: original["projects"][1]["tech"],
    highlights: original["projects"][1]["highlights"], source_url: "https://github.com/offlineAu/mobile-syntax-sip",
    problem: "Make it easier for coffee-shop customers to explore the menu and place an order from their phone.",
    contribution: "Developed the mobile coffee-shop interface, including the welcome screen and account flows.",
    implementation: "React Native and Expo power the mobile interface, with PostgreSQL-backed ordering workflows.",
    editorial_notes: "Original portfolio labels this 2025, but public repository was last updated in December 2024. Date omitted pending review. Menu, payment, and PostgreSQL claims are owner-supplied; public source inspected contains welcome/login/signup screens."
  },
  {
    slug: "issuance-subsystem", name: "Issuance Subsystem", tagline: "Less paperwork. Clearer administrative workflows.",
    description: "An internal higher-education administration subsystem built during work at CHED Region X. Google Apps Script powers issuance and processing workflows, with reporting and data synchronization components for administrative staff.",
    role: "Internship · CHED Region X", year: "2026", category: "Automation", status: "Internal system",
    technologies: ["Google Apps Script", "JavaScript", "BigQuery", "HTML", "CSS"],
    highlights: ["Issuance and processing workflows", "Administrative dashboard and reporting", "BigQuery synchronization components"],
    source_url: "https://github.com/offlineAu/IssuanceSubsystem",
    problem: "Administrative processes need a clearer view of application stages, assignments, and issuance history.",
    contribution: "Built and maintained internal workflow and reporting components as part of the CHED Region X internship described in the original portfolio.",
    implementation: "Google Apps Script serves the HTML interface and processing logic. Spreadsheet-backed records and BigQuery reporting components support the administrative workflow.",
    editorial_notes: "Public source contains dashboard, issuance, typing, caching, and BigQuery synchronization components. Organization and role come from the original portfolio. No confidential records or operational screenshots are imported."
  }
]
projects.each_with_index do |attributes, position|
  Project.find_or_create_by!(slug: attributes[:slug]) do |project|
    project.assign_attributes(attributes.merge(position: position, published: true))
    if project.slug == "veloce"
      project.cover.attach(io: File.open(Rails.root.join("db/content/veloce.webp")), filename: "veloce.webp", content_type: "image/webp")
    end
  end
end

original["experience"].each_with_index do |item, position|
  Experience.find_or_create_by!(role: item["role"], organization: item["org"]) do |experience|
    experience.assign_attributes(period: item["period"], current: item["current"], details: item["details"], position: position)
  end
end

skills = resume["skills"]
skills.each_with_index do |(name, category, note), position|
  Skill.find_or_create_by!(name: name) { |skill| skill.assign_attributes(category: category, note: note, position: position) }
end
puts "Portfolio content ready. Existing editor changes were preserved. Run bin/rails owner:setup to create your login."
