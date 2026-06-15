/* ════════════════════════════════════════════════════════════
   PORTFOLIO CONTENT — honest, defensible content only.
   Sourced from the real Laravel seeder + portrait assets.
════════════════════════════════════════════════════════════ */
window.PORTFOLIO_DATA = {
    name: 'Airl Joriz R. Janoplo',
    short: 'Airl Joriz',
    handle: 'Au',
    title: 'Web Developer',
    location: 'Bukidnon, Philippines',
    email: 'janoplo.airljoriz@gmail.com',
    githubUrl: 'https://github.com/offlineAu',
    githubLabel: 'github.com/offlineAu',
    linkedinUrl: 'https://www.linkedin.com/in/airljoriz',
    linkedinLabel: 'in/airljoriz',
    availability: 'Open to internships & junior full-stack roles',

    tagline: "I design and build web apps fast — with AI in the loop. I've trained and deployed Hugging Face models for real-time sentiment analysis.",

    about: {
        heading: 'I build practical, considered software.',
        body: [
            "I'm an aspiring web developer from Bukidnon, Philippines, focused on building responsive, user-friendly web applications that solve real problems. My work spans full-stack systems, dashboards, and automation tools.",
            "I'm currently a web development intern at CHED Region X and a final-year student at USTP, where I led my capstone — an NLP-powered sentiment-analysis platform. I'm hungry to learn, and I learn fastest by shipping.",
        ],
        // Honest, defensible stats — no inflation.
        stats: [
            { value: 3, label: 'Systems shipped', suffix: '' },
            { value: 15, label: 'Technologies used', suffix: '+' },
            { value: 1, label: 'NLP capstone built', suffix: '' },
        ],
    },

    // Hero stat strip (compact, honest)
    heroStats: [
        { value: 3, suffix: '', label: 'Projects shipped' },
        { value: 15, suffix: '+', label: 'Technologies' },
        { value: 1, suffix: '', label: 'Internship · CHED' },
    ],

    skills: [
        { name: 'Laravel / PHP', pct: 85, note: 'Backend, MVC, APIs' },
        { name: 'React / TypeScript', pct: 82, note: 'SPA & component UI' },
        { name: 'React Native / Expo', pct: 75, note: 'Cross-platform mobile' },
        { name: 'Python', pct: 78, note: 'NLP & automation' },
        { name: 'MySQL / PostgreSQL', pct: 80, note: 'Relational data' },
        { name: 'Tailwind / Inertia', pct: 88, note: 'UI implementation' },
    ],

    stack: [
        { name: 'Laravel',        logo: 'https://cdn.simpleicons.org/laravel/c8a96e' },
        { name: 'React',          logo: 'https://cdn.simpleicons.org/react/c8a96e' },
        { name: 'TypeScript',     logo: 'https://cdn.simpleicons.org/typescript/c8a96e' },
        { name: 'React Native',   logo: 'https://cdn.simpleicons.org/react/c8a96e' },
        { name: 'Inertia.js',     logo: 'https://cdn.simpleicons.org/inertia/c8a96e' },
        { name: 'Tailwind',       logo: 'https://cdn.simpleicons.org/tailwindcss/c8a96e' },
        { name: 'PHP',            logo: 'https://cdn.simpleicons.org/php/c8a96e' },
        { name: 'Python',         logo: 'https://cdn.simpleicons.org/python/c8a96e' },
        { name: 'MySQL',          logo: 'https://cdn.simpleicons.org/mysql/c8a96e' },
        { name: 'PostgreSQL',     logo: 'https://cdn.simpleicons.org/postgresql/c8a96e' },
        { name: 'Hugging Face',   logo: 'https://cdn.simpleicons.org/huggingface/c8a96e' },
        { name: 'FastAPI',        logo: 'https://cdn.simpleicons.org/fastapi/c8a96e' },
        { name: 'Google Apps Script', logo: 'https://cdn.simpleicons.org/googleappsscript/c8a96e' },
        { name: 'Google Cloud',   logo: 'https://cdn.simpleicons.org/googlecloud/c8a96e' },
        { name: 'Node.js',        logo: 'https://cdn.simpleicons.org/nodedotjs/c8a96e' },
        { name: 'Git',            logo: 'https://cdn.simpleicons.org/git/c8a96e' },
    ],

    // "Built with" — the ACTUAL tech stack of this portfolio website
    techMarquee: [
        { name: 'HTML5',        logo: 'https://cdn.simpleicons.org/html5/c8a96e' },
        { name: 'CSS3',         logo: 'https://cdn.simpleicons.org/css/c8a96e' },
        { name: 'JavaScript',   logo: 'https://cdn.simpleicons.org/javascript/c8a96e' },
        { name: 'React',        logo: 'https://cdn.simpleicons.org/react/c8a96e' },
        { name: 'Babel',        logo: 'https://cdn.simpleicons.org/babel/c8a96e' },
        { name: 'Google Fonts', logo: 'https://cdn.simpleicons.org/googlefonts/c8a96e' },
    ],

    projects: [
        {
            id: 'sentisphere',
            name: 'Sentisphere',
            flagship: true,
            year: '2025–26',
            role: 'Capstone · Project Manager & Full-stack',
            tagline: 'NLP-powered student emotional tracking',
            description:
                'A web system and companion mobile app that tracks student emotional well-being through NLP sentiment analysis. The mobile app collects check-ins; the web dashboard visualises sentiment trends so counselors can act early. I led the team and built the analysis pipeline and dashboard.',
            highlights: [
                'Transformer-based sentiment model served via FastAPI',
                'Real-time dashboard with trend visualisation',
                'Mobile check-ins built in React Native (Expo)',
            ],
            tech: ['Laravel', 'React', 'Python', 'Hugging Face', 'FastAPI', 'MySQL', 'Expo'],
            primaryLanguage: 'Laravel',
            sourceUrl: 'https://github.com/offlineAu/sentisphere',
            liveUrl: null,
        },
        {
            id: 'syntax-sip',
            name: 'Syntax.sip',
            flagship: false,
            year: '2025',
            role: 'Mobile app',
            tagline: 'Order-ahead for a coffee shop',
            description:
                'A mobile ordering app that lets coffee-shop customers browse the menu, customise drinks, and pay — cutting queue time at the counter.',
            highlights: [
                'Menu, cart & checkout flow',
                'PostgreSQL-backed orders',
            ],
            tech: ['React Native', 'Expo', 'PostgreSQL'],
            primaryLanguage: 'React Native',
            sourceUrl: null,
            liveUrl: null,
        },
        {
            id: 'ched-subsystems',
            name: 'Government Subsystems',
            flagship: false,
            year: '2026',
            role: 'Internship · CHED Region X',
            tagline: 'Automation for higher-ed administration',
            description:
                'Internal subsystems for the Commission on Higher Education using Google Apps Script and Google Cloud Platform — automating data processing and reducing manual paperwork for staff.',
            highlights: [
                'Workflow automation with Apps Script',
                'Data processing on Google Cloud',
            ],
            tech: ['Google Apps Script', 'GCP', 'JavaScript', 'HTML', 'CSS'],
            primaryLanguage: 'JavaScript',
            sourceUrl: null,
            liveUrl: null,
        },
    ],

    experience: [
        {
            role: 'Web Developer',
            org: "CK Children's Publishing",
            period: 'June 2026 — Present',
            current: true,
            details:
                'Building an HR portal for one of the schools under CK — a full web application for managing staff records and HR workflows.',
        },
        {
            role: 'Intern Web Developer',
            org: 'Commission on Higher Education (Region X)',
            period: '2026 — Present',
            current: true,
            details:
                'Building and maintaining internal web subsystems. Automating data processing and administrative workflows with Google Apps Script and GCP.',
        },
        {
            role: 'Student Full-stack Developer',
            org: 'University of Science & Technology of Southern Philippines',
            period: '2025 — 2026',
            current: false,
            details:
                'Led Sentisphere, a capstone web + mobile platform for student emotional tracking via NLP sentiment analysis. Owned the dashboard and analysis pipeline.',
        },
        {
            role: 'Quality Assurance Specialist',
            org: "CK Children's Publishing",
            period: 'June 2024',
            current: false,
            details:
                'Performed functional and non-functional QA testing across mobile applications and websites, documenting defects and verifying fixes.',
        },
    ],

    focus: [
        'Going deeper on Laravel and clean MVC architecture.',
        'Strengthening manual coding — building this portfolio by hand.',
        'Exploring new frameworks to broaden what I can build.',
        'Shipping subsystems for CHED Region X with Apps Script.',
    ],

    credentials: [
        'Civil Service Professional — Eligibility Passer',
    ],
};
