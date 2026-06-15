/* App composition + mount */
function App() {
    useReveal();
    return (
        <>
            <Nav />
            <main>
                <Hero />
                <Marquee />
                <Work />
                <About />
                <Skills />
                <Experience />
                <Contact />
            </main>
            <Footer />
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

/* Dismiss the loading screen once the app has mounted and fonts are ready,
   keeping a short minimum so it doesn't flash on fast loads. */
(function dismissLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const start = performance.now();
    const hide = () => {
        const wait = Math.max(0, 650 - (performance.now() - start));
        setTimeout(() => {
            loader.classList.add('is-done');
            setTimeout(() => loader.remove(), 700);
        }, wait);
    };
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(hide);
        setTimeout(hide, 3500); // safety fallback
    } else {
        hide();
    }
})();
