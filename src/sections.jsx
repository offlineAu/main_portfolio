/* ════════════════════════════════════════════════════════════
   PAGE SECTIONS
════════════════════════════════════════════════════════════ */
const D = window.PORTFOLIO_DATA;

/* useReveal — adds .is-in when scrolled into view */
function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('.reveal');
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

const NAV = [
    { id: 'work', label: 'Work', idx: '01' },
    { id: 'about', label: 'About', idx: '02' },
    { id: 'experience', label: 'Experience', idx: '03' },
    { id: 'contact', label: 'Contact', idx: '04' },
];

function Nav() {
    const [stuck, setStuck] = useState(false);
    const [menu, setMenu] = useState(false);
    const [active, setActive] = useState('');
    const barRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            setStuck(window.scrollY > 24);
            const h = document.documentElement;
            const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
            if (barRef.current) barRef.current.style.width = `${Math.max(0, Math.min(1, p)) * 100}%`;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // scroll-spy: highlight the nav link for the section currently in view
    useEffect(() => {
        const ids = NAV.map((n) => n.id);
        const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
        if (!sections.length) return;
        const io = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(visible.target.id);
        }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });
        sections.forEach((s) => io.observe(s));
        return () => io.disconnect();
    }, []);

    const go = useCallback((id) => (e) => {
        e.preventDefault();
        setMenu(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <>
            <div className="progress" ref={barRef} />
            <nav className={`nav${stuck ? ' is-stuck' : ''}`}>
                <div className="nav-inner">
                    <a href="#top" className="brand" onClick={go('top')} aria-label="Back to top">
                        <span className="brand__mark">Au</span>
                        <span className="brand__name">{D.short}<span>{D.title}</span></span>
                    </a>
                    <div className="nav-links">
                        {NAV.map((n) => (
                            <a key={n.id} href={`#${n.id}`} className={`nav-link${active === n.id ? ' is-active' : ''}`} onClick={go(n.id)}>
                                <span className="nav-link__idx">{n.idx}</span>{n.label}
                            </a>
                        ))}
                        <a href="Motion Lab.html" className="nav-link nav-link--lab">
                            <span className="nav-link__idx">✦</span>Motion Lab
                        </a>
                    </div>
                    <a href={`mailto:${D.email}`} className="nav-cta">
                        Get in touch <span aria-hidden="true">→</span>
                    </a>
                    <button className="nav-burger" onClick={() => setMenu(true)} aria-label="Open menu">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="6" x2="18" y2="6"/><line x1="2" y1="14" x2="18" y2="14"/></svg>
                    </button>
                </div>
            </nav>
            <div className={`mobile-menu${menu ? ' is-open' : ''}`}>
                <button className="mobile-menu__close" onClick={() => setMenu(false)}>CLOSE ✕</button>
                {NAV.map((n) => (
                    <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}><span>{n.idx}</span>{n.label}</a>
                ))}
                <a href="Motion Lab.html"><span>✦</span>Motion Lab</a>
            </div>
        </>
    );
}

function Hero() {
    return (
        <header className="hero" id="top">
            <div className="hero-grid">
                <div className="hero-left">
                    <span className="hero-avail">
                        <span className="hero-avail__dot" />
                        Available for work
                    </span>
                    <p className="hero-kicker"><b>{D.title}</b> · {D.location}</p>
                    <h1 className="hero-name">
                        <span className="ln"><span>Airl Joriz</span></span>
                        <span className="ln"><span><em>Janoplo</em></span></span>
                    </h1>
                    <div className="hero-tagline">
                        <span className="hero-tagline__bar" />
                        <Typewriter text={D.tagline} />
                    </div>
                    <div className="hero-actions">
                        <a href="#work" className="btn btn--primary" onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            View my work <span className="btn__arrow" aria-hidden="true">↗</span>
                        </a>
                        <a href={`mailto:${D.email}`} className="btn btn--ghost">Get in touch</a>
                    </div>
                    <div className="hero-stats">
                        {D.heroStats.map((s) => (
                            <div className="hero-stat" key={s.label}>
                                <span className="hero-stat__num"><em><StatCounter value={s.value} suffix={s.suffix} /></em></span>
                                <span className="hero-stat__label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hero-right">
                    <CinematicCard />
                    <SentimentGauge />
                </div>
            </div>
        </header>
    );
}

function Marquee() {
    return (
        <section className="marquee" aria-label="Technologies I build with">
            <p className="marquee__label">Built with</p>
            <TechMarquee items={D.techMarquee} />
        </section>
    );
}

function Work() {
    return (
        <section className="section" id="work">
            <div className="wrap">
                <span className="section-num">01 / WORK</span>
                <p className="eyebrow reveal">Selected work</p>
                <h2 className="section-title reveal d1">Things I've <em>shipped</em></h2>
                <div className="work-list">
                    {D.projects.map((p, i) => (
                        <ProjectCard key={p.id} p={p} i={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ProjectLink({ href, label, icon }) {
    if (!href) {
        return <span className="proj__link proj__link--muted">{icon} {label}</span>;
    }
    return (
        <a href={href} target="_blank" rel="noreferrer" className="proj__link">{icon} {label}</a>
    );
}

/* pointer-follow glow — sets --mx / --my on the card for a soft spotlight */
function useSpotlight() {
    return useCallback((e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, []);
}

function ProjectCard({ p, i }) {
    const onMove = useSpotlight();
    if (p.flagship) {
        return (
            <article className="proj proj--flagship reveal" onMouseMove={onMove}>
                <div className="proj__flag-top">★ Flagship · {p.tagline}</div>
                <h3 className="proj__name">{p.name}</h3>
                <p className="proj__role">{p.role} · {p.year}</p>
                <p className="proj__desc">{p.description}</p>
                <ul className="proj__hl">
                    {p.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
                <div className="proj__bottom">
                    <div className="proj__tech">
                        {p.tech.map((t) => <span key={t}>{t}</span>)}
                    </div>
                    <div className="proj__links">
                        <ProjectLink href={p.sourceUrl} label="Source" icon="↗" />
                        {p.liveUrl && <ProjectLink href={p.liveUrl} label="Live" icon="↗" />}
                    </div>
                </div>
            </article>
        );
    }
    return (
        <article className="proj reveal" onMouseMove={onMove}>
            <div className="proj__index">0{i + 1}</div>
            <div className="proj__body">
                <h3 className="proj__name">{p.name}</h3>
                <p className="proj__role">{p.role}{p.tagline ? ` · ${p.tagline}` : ''}</p>
                <p className="proj__desc">{p.description}</p>
                {p.highlights && p.highlights.length > 0 && (
                    <ul className="proj__hl proj__hl--compact">
                        {p.highlights.map((h) => <li key={h}>{h}</li>)}
                    </ul>
                )}
                <div className="proj__tech">
                    {p.tech.map((t) => <span key={t}>{t}</span>)}
                </div>
            </div>
            <div className="proj__meta">
                <span className="proj__year">{p.year}</span>
                <div className="proj__links">
                    <ProjectLink href={p.sourceUrl} label={p.sourceUrl ? 'Source' : 'Private'} icon="↗" />
                </div>
            </div>
        </article>
    );
}

function About() {
    return (
        <section className="section" id="about">
            <div className="wrap">
                <span className="section-num">02 / ABOUT</span>
                <div className="about-grid">
                    <div>
                        <p className="eyebrow reveal">About me</p>
                        <h2 className="section-title reveal d1">{D.about.heading}</h2>
                        <div className="about-body">
                            {D.about.body.map((para, i) => (
                                <p className="lead reveal" key={i} style={{ transitionDelay: `${0.15 + i * 0.08}s` }}>{para}</p>
                            ))}
                        </div>
                        <div className="about-stats reveal d3">
                            {D.about.stats.map((s) => (
                                <div className="about-stat" key={s.label}>
                                    <div className="about-stat__num"><StatCounter value={s.value} suffix={s.suffix} /></div>
                                    <div className="about-stat__label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="about-ring reveal d2">
                        <Medallion />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Medallion() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    const c = el.querySelector('#mfill');
                    if (c) {
                        const len = 2 * Math.PI * 115;
                        c.style.strokeDasharray = `${len}`;
                        c.style.strokeDashoffset = reduced ? `${len * 0.18}` : `${len}`;
                        if (!reduced) {
                            requestAnimationFrame(() => {
                                c.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1)';
                                c.style.strokeDashoffset = `${len * 0.18}`;
                            });
                        }
                    }
                    io.disconnect();
                }
            });
        }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return (
        <svg ref={ref} viewBox="0 0 260 260" aria-hidden="true">
            <circle className="ring-track" cx="130" cy="130" r="115" />
            <circle id="mfill" className="ring-fill" cx="130" cy="130" r="115" transform="rotate(-90 130 130)" />
            <circle fill="none" stroke="var(--line)" strokeWidth="0.5" cx="130" cy="130" r="92" />
            <circle fill="none" stroke="var(--line)" strokeWidth="0.5" cx="130" cy="130" r="68" />
            <text className="ring-label" x="130" y="124" textAnchor="middle">FULL</text>
            <text className="ring-label" x="130" y="152" textAnchor="middle">STACK</text>
            <text className="ring-sub" x="130" y="172" textAnchor="middle">DEVELOPER</text>
            <g stroke="var(--gold-deep)" strokeWidth="0.6">
                <line x1="130" y1="13" x2="130" y2="22" />
                <line x1="130" y1="238" x2="130" y2="247" />
                <line x1="13" y1="130" x2="22" y2="130" />
                <line x1="238" y1="130" x2="247" y2="130" />
            </g>
        </svg>
    );
}

function Skills() {
    const wrapRef = useRef(null);
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    el.querySelectorAll('.skill__bar').forEach((bar) => {
                        bar.style.width = `${bar.dataset.pct}%`;
                    });
                    io.disconnect();
                }
            });
        }, { threshold: 0.3 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return (
        <section className="section" aria-labelledby="skills-h">
            <div className="wrap">
                <p className="eyebrow reveal">What I work with</p>
                <h2 className="section-title reveal d1" id="skills-h" style={{ maxWidth: '14ch' }}>Skills &amp; <em>stack</em></h2>
                <div className="skills-grid reveal d2" ref={wrapRef}>
                    {D.skills.map((s) => (
                        <div className="skill" key={s.name}>
                            <div className="skill__top">
                                <span className="skill__name">{s.name}</span>
                                <span className="skill__pct">{s.pct}%</span>
                            </div>
                            <div className="skill__track">
                                <div className="skill__bar" data-pct={s.pct} />
                            </div>
                            <span className="skill__note">{s.note}</span>
                        </div>
                    ))}
                </div>
                <div className="tag-row reveal d3">
                    {D.stack.map((t) => (
                        <span className="tag" key={t.name}>
                            <img
                                className="tag__logo"
                                src={t.logo}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {t.name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Experience() {
    return (
        <section className="section" id="experience">
            <div className="wrap">
                <span className="section-num">03 / PATH</span>
                <p className="eyebrow reveal">Experience</p>
                <h2 className="section-title reveal d1">Where I've <em>worked</em></h2>
                <div className="timeline">
                    {D.experience.map((x) => (
                        <div className={`tl-item reveal${x.current ? ' tl-item--current' : ''}`} key={x.role + x.org}>
                            <div className="tl-dot" />
                            <div className="tl-head">
                                <span className="tl-role">{x.role}</span>
                                <span className="tl-period">{x.period}</span>
                            </div>
                            <div className="tl-org">{x.org}</div>
                            <p className="tl-detail">{x.details}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Contact() {
    return (
        <section className="section contact" id="contact">
            <div className="wrap">
                <span className="section-num">04 / CONTACT</span>
                <p className="eyebrow reveal">Get in touch</p>
                <h2 className="section-title reveal d1">Let's build <em>something</em></h2>
                <div className="contact-grid">
                    <div className="contact-links reveal d2">
                        <a className="clink" href={`mailto:${D.email}`}>
                            <span><span className="clink__k">Email</span><span className="clink__v">{D.email}</span></span>
                            <span className="clink__arrow" aria-hidden="true">↗</span>
                        </a>
                        <a className="clink" href={D.githubUrl} target="_blank" rel="noreferrer">
                            <span><span className="clink__k">GitHub</span><span className="clink__v">{D.githubLabel}</span></span>
                            <span className="clink__arrow" aria-hidden="true">↗</span>
                        </a>
                        <a className="clink" href={D.linkedinUrl} target="_blank" rel="noreferrer">
                            <span><span className="clink__k">LinkedIn</span><span className="clink__v">{D.linkedinLabel}</span></span>
                            <span className="clink__arrow" aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <div className="contact-card reveal d3">
                        <div className="contact-card__avail"><span className="hero-avail__dot" /> {D.availability}</div>
                        <p>Based in {D.location} — open to remote, internships, and junior full-stack roles. I usually reply within a day.</p>
                        <a href={`mailto:${D.email}`} className="btn btn--primary">Email me <span className="btn__arrow" aria-hidden="true">↗</span></a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const top = (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    return (
        <footer className="footer">
            <div className="footer-inner">
                <p>© {new Date().getFullYear()} {D.name} · {D.credentials[0]}</p>
                <a href="#top" className="to-top" onClick={top}>Back to top <span aria-hidden="true">↑</span></a>
            </div>
        </footer>
    );
}

Object.assign(window, {
    useReveal, Nav, Hero, Marquee, Work, About, Skills, Experience, Contact, Footer,
});
