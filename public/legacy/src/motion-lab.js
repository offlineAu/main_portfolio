/* ═══════════════════════════════════════════════════════════════
   MOTION LAB — interactions
═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /* ── load curtain (page-transition theme) ── */
    window.addEventListener('load', () => {
        const c = $('#curtain');
        if (!c) return;
        setTimeout(() => c.classList.add('lifted'), reduce ? 0 : 650);
        setTimeout(() => c.remove(), reduce ? 60 : 1800);
    });

    /* ── reveal labs on scroll ── */
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.lab').forEach((el) => io.observe(el));

    /* ── 01 glass / neuro / clay ── */
    const gncCard = $('#gnc-card');
    $$('#gnc-seg button').forEach((b) => {
        b.addEventListener('click', () => {
            $$('#gnc-seg button').forEach((x) => x.classList.remove('is-on'));
            b.classList.add('is-on');
            gncCard.dataset.mat = b.dataset.mat;
        });
    });

    /* ── 02 skeleton ── */
    const sk = $('#sk');
    const skReplay = $('#sk-replay');
    let skTimer;
    function runSkeleton() {
        if (!sk) return;
        clearTimeout(skTimer);
        sk.classList.remove('is-loaded');
        skTimer = setTimeout(() => sk.classList.add('is-loaded'), reduce ? 0 : 1900);
    }
    if (skReplay) skReplay.addEventListener('click', runSkeleton);
    runSkeleton();

    /* ── 03 page transitions ── */
    const ptPanels = $$('.pt-panel');
    const ptDots = $$('#pt-dots button');
    const ptCurtain = $('#pt-curtain');
    let ptCurrent = 0, ptBusy = false;
    function ptGo(i) {
        if (ptBusy || i === ptCurrent) return;
        ptBusy = true;
        if (!reduce && ptCurtain) {
            ptCurtain.classList.remove('sweep');
            void ptCurtain.offsetWidth;
            ptCurtain.classList.add('sweep');
        }
        const swap = () => {
            ptPanels.forEach((p, idx) => p.classList.toggle('is-active', idx === i));
            ptDots.forEach((d, idx) => d.classList.toggle('is-on', idx === i));
            ptCurrent = i;
        };
        setTimeout(swap, reduce ? 0 : 360);
        setTimeout(() => { ptBusy = false; }, reduce ? 0 : 850);
    }
    ptDots.forEach((d, i) => d.addEventListener('click', () => ptGo(i)));
    $('#pt-next')?.addEventListener('click', () => ptGo((ptCurrent + 1) % ptPanels.length));

    /* ── 04 expressive typography rotator ── */
    const rotList = $('#ty-rotator-list');
    if (rotList && !reduce) {
        const items = rotList.children.length / 2 || rotList.children.length;
        let idx = 0;
        const total = $$('#ty-rotator-list > span').length / 2;
        setInterval(() => {
            idx = (idx + 1) % total;
            rotList.style.transform = `translateY(-${idx * 1.4}em)`;
        }, 1700);
    }

    /* ── 05 microinteractions ── */
    // magnetic
    const magnet = $('#mi-magnet');
    if (magnet && !reduce) {
        magnet.addEventListener('mousemove', (e) => {
            const r = magnet.getBoundingClientRect();
            magnet.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
        });
        magnet.addEventListener('mouseleave', () => { magnet.style.transform = ''; });
    }
    // heart + sparks
    const heart = $('#mi-heart');
    if (heart) {
        heart.addEventListener('click', () => {
            const liked = heart.classList.toggle('liked');
            heart.textContent = liked ? '♥' : '♡';
            heart.appendChild(makeSparkHolder());
            if (liked && !reduce) burst(heart);
        });
    }
    function makeSparkHolder() { return document.createComment('x'); }
    function burst(el) {
        for (let i = 0; i < 8; i++) {
            const s = document.createElement('span');
            s.className = 'spark';
            el.appendChild(s);
            const ang = (Math.PI * 2 * i) / 8;
            const dist = 26 + Math.random() * 12;
            s.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(0)`, opacity: 0 },
            ], { duration: 600, easing: 'cubic-bezier(0.22,1,0.36,1)' }).onfinish = () => s.remove();
        }
    }
    // toggle
    const toggle = $('#mi-toggle');
    if (toggle) toggle.addEventListener('click', () => toggle.classList.toggle('on'));
    // copy
    const copy = $('#mi-copy');
    if (copy) {
        copy.addEventListener('click', () => {
            const txt = copy.dataset.copy || '';
            const label = copy.querySelector('.mi-copy__t');
            if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
            copy.classList.add('copied');
            if (label) label.textContent = 'Copied ✓';
            setTimeout(() => { copy.classList.remove('copied'); if (label) label.textContent = copy.dataset.copy; }, 1400);
        });
    }
    // stars
    const stars = $$('#mi-stars span');
    let rating = 0;
    stars.forEach((st, i) => {
        st.addEventListener('mouseenter', () => stars.forEach((s, j) => s.classList.toggle('lit', j <= i)));
        st.addEventListener('click', () => { rating = i + 1; });
        st.addEventListener('mouseleave', () => stars.forEach((s, j) => s.classList.toggle('lit', j < rating)));
    });
    $('#mi-stars')?.addEventListener('mouseleave', () => stars.forEach((s, j) => s.classList.toggle('lit', j < rating)));

    /* ── 08 morph play/pause icon ── */
    const morphIcon = $('#morph-icon');
    if (morphIcon) {
        let playing = false;
        const left = morphIcon.querySelector('.mbar--l');
        const right = morphIcon.querySelector('.mbar--r');
        const PLAY_L = 'M8 5 L8 25 L17 15 Z';
        const PLAY_R = 'M17 15 L17 15 L17 15 Z';
        const PAUSE_L = 'M8 5 L13 5 L13 25 L8 25 Z';
        const PAUSE_R = 'M18 5 L23 5 L23 25 L18 25 Z';
        const set = () => {
            left.setAttribute('d', playing ? PAUSE_L : PLAY_L);
            right.setAttribute('d', playing ? PAUSE_R : PLAY_R);
        };
        set();
        morphIcon.addEventListener('click', () => { playing = !playing; set(); });
    }
})();
