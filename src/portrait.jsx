/* ════════════════════════════════════════════════════════════
   INTERACTIVE SHOWPIECES
   CinematicCard · SentimentGauge · Typewriter · StatCounter · TechMarquee
════════════════════════════════════════════════════════════ */
const { useState, useRef, useEffect, useCallback } = React;

/* ── Typewriter ─────────────────────────────────────────── */
function Typewriter({ text, startDelay = 900 }) {
    const [out, setOut] = useState('');
    const [started, setStarted] = useState(false);
    const [done, setDone] = useState(false);
    const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    useEffect(() => {
        if (reduced.current) { setOut(text); setDone(true); return; }
        const t = setTimeout(() => setStarted(true), startDelay);
        return () => clearTimeout(t);
    }, [text, startDelay]);

    useEffect(() => {
        if (!started || reduced.current) return;
        if (out.length >= text.length) { setDone(true); return; }
        const ch = text[out.length];
        const delay = ch === '.' || ch === ',' ? 120 : 26 + Math.random() * 34;
        const t = setTimeout(() => setOut(text.slice(0, out.length + 1)), delay);
        return () => clearTimeout(t);
    }, [started, out, text]);

    return (
        <span className="hero-tagline__text">
            {out}
            <span className="tw-caret" style={{ opacity: done ? undefined : 1 }} />
        </span>
    );
}

/* ── StatCounter (animates when scrolled into view) ─────── */
function StatCounter({ value, suffix = '', duration = 1400 }) {
    const [n, setN] = useState(0);
    const ref = useRef(null);
    const ran = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) { setN(value); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting && !ran.current) {
                    ran.current = true;
                    const start = performance.now();
                    const tick = (now) => {
                        const p = Math.min(1, (now - start) / duration);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setN(Math.round(eased * value));
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            });
        }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, [value, duration]);

    return <span ref={ref}>{n}{suffix}</span>;
}

/* ── CinematicCard (flip + 3D tilt + sheen) ─────────────── */
function CinematicCard() {
    const [flipped, setFlipped] = useState(false);
    const cardRef = useRef(null);

    const onMove = useCallback((e) => {
        const el = cardRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${px * 14}deg`);
        el.style.setProperty('--rx', `${-py * 12}deg`);
    }, []);
    const onLeave = useCallback(() => {
        const el = cardRef.current;
        if (!el) return;
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
    }, []);

    const toggle = useCallback(() => setFlipped((f) => !f), []);
    const onKey = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    }, [toggle]);

    return (
        <>
            <div className="card-stage" onMouseMove={onMove} onMouseLeave={onLeave}>
                <div
                    ref={cardRef}
                    className={`card${flipped ? ' is-flipped' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={flipped ? 'Show card back' : 'Reveal photo of Airl'}
                    aria-pressed={flipped}
                    onClick={toggle}
                    onKeyDown={onKey}
                >
                    {/* BACK — ornate gold Au card */}
                    <div className="card__face card__back">
                        <img src="assets/back_card.png" alt="" aria-hidden="true" />
                        <span className="card__corner card__corner--tl" />
                        <span className="card__corner card__corner--tr" />
                        <span className="card__corner card__corner--bl" />
                        <span className="card__corner card__corner--br" />
                    </div>
                    {/* FRONT — real photo */}
                    <div className="card__face card__front">
                        <img src="assets/frame_9.png" alt="Portrait of Airl Joriz R. Janoplo" />
                        <span className="card__corner card__corner--tl" />
                        <span className="card__corner card__corner--tr" />
                        <div className="card__nameplate">
                            <div className="card__nameplate-line" />
                            <div className="card__nameplate-name">Airl Joriz</div>
                            <div className="card__nameplate-sub">Web Developer · AI</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-hint">
                <span className="card-hint__key">click</span>
                {flipped ? 'flip back to the Au card' : 'to reveal the developer'}
            </div>
        </>
    );
}

/* ── SentimentGauge — client-side heuristic for the prototype ── */
const POS_WORDS = ['love','great','amazing','awesome','good','happy','excited','wonderful','best','fantastic','enjoy','beautiful','brilliant','excellent','nice','glad','grateful','hope','win','success','perfect','cool','fun','proud','thrilled','delighted','impressive','smooth','clean','fast'];
const NEG_WORDS = ['hate','bad','awful','terrible','sad','angry','worst','horrible','disappointed','annoyed','broken','bug','slow','ugly','fail','failure','frustrated','tired','stuck','confusing','poor','wrong','crash','pain','boring','hard','difficult','stress','anxious','messy'];

function localSentiment(text) {
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    let score = 0, key = '', keyWeight = 0;
    words.forEach((w) => {
        if (POS_WORDS.includes(w)) { score += 1; if (1 > keyWeight) { key = w; keyWeight = 1; } }
        if (NEG_WORDS.includes(w)) { score -= 1; if (1 > keyWeight) { key = w; keyWeight = 1; } }
    });
    const neg = /\b(not|no|never|don't|isn't|wasn't|can't)\b/.test(text.toLowerCase());
    if (neg) score *= -0.6;
    const norm = Math.max(-1, Math.min(1, score / 2));
    const label = norm > 0.15 ? 'Positive' : norm < -0.15 ? 'Negative' : 'Neutral';
    const confidence = Math.round(55 + Math.min(40, Math.abs(score) * 18) + Math.random() * 5);
    return { score: norm, label, confidence: Math.min(98, confidence), word: key };
}

function scoreToPct(s) { return Math.round(((s + 1) / 2) * 100); }
function sentColor(s) {
    if (s > 0.15) return '#c8a96e';
    if (s < -0.15) return '#9a6a4a';
    return '#6e6a60';
}

function SentimentGauge() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const [placed, setPlaced] = useState(false);
    const debounce = useRef(null);

    const run = useCallback((val) => {
        setLoading(true);
        setPlaced(false);
        // simulate model latency
        setTimeout(() => {
            setResult(localSentiment(val));
            setLoading(false);
            requestAnimationFrame(() => setPlaced(true));
        }, 500 + Math.random() * 300);
    }, []);

    const onChange = useCallback((e) => {
        const v = e.target.value;
        setText(v);
        if (debounce.current) clearTimeout(debounce.current);
        if (v.trim().length >= 3) {
            debounce.current = setTimeout(() => run(v), 650);
        } else {
            setResult(null); setPlaced(false);
        }
    }, [run]);

    const onKey = useCallback((e) => {
        if (e.key === 'Enter') {
            if (debounce.current) clearTimeout(debounce.current);
            if (text.trim().length >= 1) run(text);
        }
    }, [run, text]);

    const pct = result ? scoreToPct(result.score) : 50;
    const color = result ? sentColor(result.score) : '#2a2620';
    const active = !!result && !loading;

    return (
        <div className={`sg${focused ? ' is-focused' : ''}${active ? ' is-active' : ''}`}>
            <div className="sg__eyebrow">
                <span className="sg__eyebrow-dot" />
                <span>NLP · Live sentiment</span>
                <span className="sg__tag">Sentisphere</span>
            </div>
            <div className="sg__input-wrap">
                <input
                    className="sg__input"
                    type="text"
                    value={text}
                    onChange={onChange}
                    onKeyDown={onKey}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Type a phrase — e.g. I love building this"
                    maxLength={120}
                    aria-label="Type text to analyse sentiment"
                    spellCheck={false}
                    autoComplete="off"
                />
                <div className="sg__input-line" />
                {loading && <div className="sg__spinner" aria-hidden="true" />}
            </div>
            <div aria-hidden="true">
                <div className="sg__track-labels">
                    <span>Neg</span><span>Neutral</span><span>Pos</span>
                </div>
                <div className="sg__track">
                    <div className="sg__tick" />
                    <div
                        className={`sg__dot${placed ? ' is-placed' : ''}`}
                        style={{ left: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}` }}
                    />
                </div>
                <div className={`sg__result${active ? ' is-visible' : ''}`}>
                    {result && (
                        <>
                            <span className="sg__result-label" style={{ color }}>{result.label}</span>
                            <span className="sg__result-conf">{result.confidence}% conf.</span>
                            {result.word && <span className="sg__result-word">key: <em>{result.word}</em></span>}
                        </>
                    )}
                </div>
            </div>
            {!result && !loading && (
                <p className="sg__hint">Runs a live model on your text — a peek at my capstone.</p>
            )}
        </div>
    );
}

/* ── TechMarquee ────────────────────────────────────────── */
function TechMarquee({ items }) {
    const doubled = [...items, ...items];
    const trackRef = useRef(null);
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        let raf, last = null, x = 0, paused = false;
        const SPEED = 33; // px per second
        const half = () => track.scrollWidth / 2;
        const tick = (now) => {
            if (last == null) last = now;
            const dt = (now - last) / 1000;
            last = now;
            if (!paused) {
                x -= SPEED * dt;
                const h = half();
                if (h > 0 && x <= -h) x += h;
                track.style.transform = `translateX(${x}px)`;
            }
            raf = requestAnimationFrame(tick);
        };
        const enter = () => { paused = true; };
        const leave = () => { paused = false; };
        track.addEventListener('mouseenter', enter);
        track.addEventListener('mouseleave', leave);
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            track.removeEventListener('mouseenter', enter);
            track.removeEventListener('mouseleave', leave);
        };
    }, []);
    return (
        <div className="marquee__viewport">
            <div className="marquee__track marquee__track--js" ref={trackRef}>
                {doubled.map((t, i) => (
                    <div className="marquee__item" key={`${t.name}-${i}`}>
                        <img src={t.logo} alt="" loading="lazy" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span>{t.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

Object.assign(window, {
    Typewriter, StatCounter, CinematicCard, SentimentGauge, TechMarquee,
});
