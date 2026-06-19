'use client';

import { useState, useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence, Variants } from 'framer-motion';
// Framer Motion transition presets
const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE_EXPO }
  }
};
const STAGGER = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // §5  BACKGROUND VIDEO — ABSOLUTE MOUSE SCRUBBING
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetRef = useRef<number>(0);       // target scrub time
  const currentRef = useRef<number>(0);       // smoothed current time
  const rafRef = useRef<number | null>(null);

  // Desktop scrub effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.innerWidth < 1024) return;

    let isSeeking = false;
    let lastSeekTime = 0;

    // The rAF loop — runs at 60fps independent of mouse events
    function scrubLoop() {
      const v = videoRef.current;
      if (v && v.duration && !isNaN(v.duration)) {
        const LERP = 0.08;      // increased for a faster and tighter feel
        const target = targetRef.current;
        const prev = currentRef.current;

        // Smoothly interpolate current time to target coordinate
        currentRef.current = prev + (target - prev) * LERP;
        currentRef.current = Math.max(0, Math.min(v.duration, currentRef.current));

        const now = performance.now();
        // Allow seeking if browser completed previous seek OR if seek timed out (> 150ms)
        const canSeek = !isSeeking || (now - lastSeekTime > 150);

        if (canSeek && Math.abs(currentRef.current - v.currentTime) > 0.005) {
          isSeeking = true;
          lastSeekTime = now;
          v.currentTime = currentRef.current;
        }
      }
      rafRef.current = requestAnimationFrame(scrubLoop);
    }

    video.pause();

    const onSeeked = () => {
      isSeeking = false;
    };
    video.addEventListener('seeked', onSeeked);

    const onMove = (e: MouseEvent) => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;
      // Map cursor X coordinate directly and absolutely to video timeline
      targetRef.current = (e.clientX / window.innerWidth) * duration;
    };

    const onMouseLeave = () => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;
      targetRef.current = duration / 2; // slowly rotate head back to face forward on leave
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    rafRef.current = requestAnimationFrame(scrubLoop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      video.removeEventListener('seeked', onSeeked);
    };
  }, []);

  // Mobile autoplay effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.innerWidth >= 1024) return;
    video.loop = true;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  // Scroll Backdrop Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 48) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuLinks = ["About", "Services", "Portfolio", "Contact"];

  return (
    <LazyMotion features={domAnimation}>
      {/* §4  PAGE SHELL */}
      <div className="relative bg-void text-text-1 font-body antialiased overflow-x-hidden flex flex-col lg:block lg:min-h-screen selection:bg-[#EAECE9] selection:text-[#1C2E1E]">
        <div className="grid-plane" />
        
        {/* §6  NAVBAR */}
        <header
          className={`fixed top-0 inset-x-0 z-50 px-8 sm:px-16 py-5 flex items-center justify-between transition-all duration-150 ease-out ${
            scrolled
              ? "bg-[#0B0B0F]/80 backdrop-blur-md"
              : "bg-transparent"
          }`}
        >
          {/* Logo Section (left) */}
          <div className="flex flex-row items-center gap-2 select-none cursor-pointer">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="HA Logo"
                className="h-full w-auto max-w-none invert"
              />
            </div>
            <span className="font-display text-[18px] sm:text-[21px] font-bold tracking-[-0.03em] text-white whitespace-nowrap">
              Human Architecture
            </span>
          </div>

          {/* Desktop nav (center) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {menuLinks.map((link, idx) => (
              <span key={link} className="flex items-center">
                <a
                  href={`#${link.toLowerCase()}`}
                  className="font-body text-[15px] font-medium text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 tracking-[-0.01em]"
                >
                  {link}
                </a>
                {idx < menuLinks.length - 1 && (
                  <span className="text-white/40 mx-0.5 text-[15px] select-none">,</span>
                )}
              </span>
            ))}
          </nav>

          {/* Desktop CTA (right) */}
          <div className="hidden md:flex">
            <a
              href="#book-a-call"
              className="font-body text-[14px] font-medium text-white bg-transparent border border-white/20 rounded-full px-4.5 py-1.5 hover:bg-white hover:text-[#0B0B0F] hover:border-white active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              Book a Call &rarr;
            </a>
          </div>

          {/* Hamburger button (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8 z-50 relative focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            <span
              className={`block w-5 h-[1.5px] bg-text-1 transition-all duration-300 transform ${
                isMobileMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text-1 transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text-1 transition-all duration-300 transform ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
              }`}
            />
          </button>
        </header>

        {/* Sidebar: Left-side follow column */}
        <aside className="hidden lg:flex fixed left-8 top-36 w-8 flex-col items-center gap-6 z-40 select-none">
          <span className="font-mono text-[9px] font-bold tracking-[0.25em] text-text-2 uppercase whitespace-nowrap rotate-[-90deg] origin-center mb-10 select-none">
            follow our journey
          </span>
          
          <div className="flex flex-col items-center gap-5">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-2 hover:text-text-1 transition-colors"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            
            {/* LinkedIn (in text) */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body font-bold text-[14px] text-text-2 hover:text-text-1 transition-colors leading-none select-none"
              aria-label="LinkedIn"
            >
              in
            </a>
            
            {/* Behance Character Bē */}
            <a
              href="https://behance.net"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display font-bold text-[15px] text-text-2 hover:text-text-1 transition-colors leading-none select-none"
              aria-label="Behance"
            >
              Bē
            </a>
            
            {/* Mail */}
            <a
              href="mailto:contact@humanarchitecture.com"
              className="text-text-2 hover:text-text-1 transition-colors"
              aria-label="Email"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </a>
          </div>
        </aside>

        {/* Mobile Navigation Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-void flex flex-col px-6 py-20 transition-all duration-350 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-2'
          }`}
        >
          {/* Logo row at top */}
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex flex-row gap-2 items-center select-none">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 overflow-hidden flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="HA Logo"
                  className="h-full w-auto max-w-none invert"
                />
              </div>
              <span className="font-display text-[18px] sm:text-[21px] font-bold tracking-[-0.03em] text-text-1 whitespace-nowrap">
                Human Architecture
              </span>
            </div>
            
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-text-1 cursor-pointer"
              aria-label="Close Menu"
            >
              <span className="text-[32px] font-light">&times;</span>
            </button>
          </div>

          {/* Links stacked */}
          <div className="flex-1 flex flex-col justify-center items-start gap-6 my-12">
            <AnimatePresence>
              {isMobileMenuOpen && (
                <m.nav
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    show: { transition: { staggerChildren: 0.07 } }
                  }}
                  className="flex flex-col gap-6"
                >
                  {menuLinks.map((link) => (
                    <m.div key={link} variants={FADE_UP} className="will-change-[transform,opacity]">
                      <a
                        href={`#${link.toLowerCase()}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-display text-[36px] font-bold text-white leading-[1.1] tracking-[-0.03em] hover:text-violet-lt transition-colors"
                      >
                        {link}
                      </a>
                    </m.div>
                  ))}
                  
                  <m.div variants={FADE_UP} className="mt-8 will-change-[transform,opacity]">
                    <a
                      href="#book-a-call"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-block text-[15px] font-body font-medium text-white bg-transparent border border-white/20 rounded-full px-5 py-2.5 hover:bg-white hover:text-[#0B0B0F] hover:border-white active:scale-[0.97] transition-all duration-200 shadow-sm"
                    >
                      Book a Call &rarr;
                    </a>
                  </m.div>
                </m.nav>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* §5  BACKGROUND VIDEO */}
        <div className="order-last lg:order-none relative lg:fixed lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-screen lg:w-screen bg-deep lg:bg-transparent">
          {/* Dark gradient overlay above video: fades from solid void on the left (for text readability) to fully transparent on the right */}
          <div
            className="hidden lg:block absolute inset-0 z-[1]"
            style={{
              background: 'linear-gradient(to right, rgba(11,11,15,1) 0%, rgba(11,11,15,1) 20%, rgba(11,11,15,0) 45%)',
            }}
          />
          <div className="w-full h-full relative">
            {/* Backing Circle (Purple moon-like glow) */}
            <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#7C3AED]/20 filter blur-[80px] pointer-events-none" />
            
            <div className="w-full h-full mix-blend-multiply">
              <video
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                style={{ willChange: 'transform, contents', transform: 'translate3d(0, 0, 0)' }}
                className="w-full h-full object-cover object-center lg:object-right"
                src="/nexus/watermark_removed_7df78e83-9b68-4eb0-8b29-f9f7a12a09b9.mp4"
              />
            </div>
          </div>
        </div>

        {/* §7  CONTENT LAYER */}
        <div className="relative z-10 flex flex-col order-first lg:order-none w-full bg-deep lg:bg-transparent pb-10 lg:pb-0 lg:min-h-screen">
          <main id="hero-main" className="w-full max-w-[1340px] mx-auto px-6 sm:px-10 lg:pl-32 lg:pr-16 pt-[110px] sm:pt-[130px] lg:pt-[140px] pb-16 flex-1 flex flex-col justify-center">
            
            {/* Entrance Stagger Container */}
            <m.div
              initial="hidden"
              animate="show"
              variants={STAGGER}
              className="flex flex-col items-start w-full lg:max-w-[480px] xl:max-w-[540px] lg:-translate-y-12"
            >
              
              {/* §9  HERO HEADLINE */}
              <m.div variants={FADE_UP} className="will-change-[transform,opacity] w-full">
                <h1 className="font-display text-[32px] sm:text-[44px] lg:text-[52px] xl:text-[60px] font-extrabold tracking-[-0.04em] leading-[1.05] text-text-1 select-none whitespace-pre-wrap mb-0 lowercase">
                  we help brands <span className="bg-gradient-to-r from-violet to-violet-lt bg-clip-text text-transparent font-extrabold">grow</span> through content, design <span className="text-violet font-semibold">&</span> technology
                </h1>
              </m.div>

              {/* §10  SUBHEADLINE */}
              <m.div variants={FADE_UP} className="mt-8 mb-12 will-change-[transform,opacity]">
                <p className="font-mono text-[12px] sm:text-[14px] uppercase tracking-[0.12em] text-white/90 font-semibold">
                  content strategy &bull; branding &bull; websites
                </p>
              </m.div>

              {/* §11  PRIMARY CALL TO ACTIONS */}
              <m.div variants={FADE_UP} className="flex flex-wrap gap-4 items-center will-change-[transform,opacity]">
                <a
                  href="#portfolio"
                  className="font-body text-[13px] font-semibold tracking-[0.08em] text-white bg-transparent border border-white/20 rounded-full px-7 py-3.5 hover:bg-white hover:text-[#0B0B0F] hover:border-white active:scale-[0.97] transition-all duration-200 shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
                >
                  View Portfolio &rarr;
                </a>
                <a
                  href="#book-a-call"
                  className="font-body text-[13px] font-semibold tracking-[0.08em] text-white bg-transparent border border-white/20 rounded-full px-7 py-3.5 hover:bg-white hover:text-[#0B0B0F] hover:border-white active:scale-[0.97] transition-all duration-200"
                >
                  Book a Call &rarr;
                </a>
              </m.div>
            </m.div>

          </main>
        </div>

        {/* Bottom-Right Overlay Widgets */}
        <div className="fixed bottom-8 right-8 z-40 flex items-center gap-3 select-none">
          {/* Chatbot Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-11 h-11 rounded-full bg-[#7C3AED] hover:bg-[#9061F9] flex items-center justify-center text-white transition-all duration-200 active:scale-95 shadow-lg shadow-[#7C3AED]/20 relative cursor-pointer"
            aria-label="Toggle Chatbot"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border border-void animate-pulse" />
          </button>

          {/* Chatbot Bubble popover */}
          <AnimatePresence>
            {isChatOpen && (
              <m.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-16 right-0 w-[260px] p-4 rounded-2xl bg-[#101016] border border-[#2C2C3A] backdrop-blur-md shadow-2xl text-left"
              >
                <div className="flex items-center gap-1.5 mb-2 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-2">assistant</span>
                </div>
                <p className="font-body text-[13px] text-white leading-relaxed">
                  hello! how can we help you build the <span className="text-[#7C3AED] font-semibold">future.</span>?
                </p>
                <div className="mt-3 flex gap-2">
                  <a
                    href="#book-a-call"
                    onClick={() => setIsChatOpen(false)}
                    className="text-[10px] font-mono uppercase tracking-[0.06em] bg-[#7C3AED] hover:bg-[#9061F9] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    chat now
                  </a>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </LazyMotion>
  );
}


