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
        
        {/* §6  NAVBAR */}
        <header
          className={`fixed top-0 inset-x-0 z-50 px-6 sm:px-10 py-5 flex items-center justify-between transition-all duration-150 ease-out ${
            scrolled
              ? "bg-white"
              : "bg-transparent"
          }`}
        >
          {/* Logo Section (left) */}
          <div className="flex flex-row items-center gap-2 select-none cursor-pointer">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="HA Logo"
                className="h-full w-auto max-w-none mix-blend-multiply"
              />
            </div>
            <span className="font-display text-[18px] sm:text-[21px] font-bold tracking-[-0.03em] text-text-1 whitespace-nowrap">
              Human Architecture
            </span>
          </div>

          {/* Desktop nav (center) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {menuLinks.map((link, idx) => (
              <span key={link} className="flex items-center">
                <a
                  href={`#${link.toLowerCase()}`}
                  className="font-body text-[15px] text-text-2 px-2.5 py-1.5 rounded-lg hover:text-text-1 hover:bg-surface transition-all duration-200 tracking-[-0.01em]"
                >
                  {link}
                </a>
                {idx < menuLinks.length - 1 && (
                  <span className="text-border mx-0.5 text-[15px] select-none">,</span>
                )}
              </span>
            ))}
          </nav>

          {/* Desktop CTA (right) */}
          <div className="hidden md:flex">
            <a
              href="#book-a-call"
              className="font-body text-[14px] font-medium text-text-1 bg-transparent border border-text-1 rounded-full px-4.5 py-1.5 hover:bg-text-1 hover:text-white active:scale-[0.97] transition-all duration-200 shadow-sm"
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

        {/* Mobile Navigation Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-white flex flex-col px-6 py-20 transition-all duration-350 ${
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
                  className="h-full w-auto max-w-none mix-blend-multiply"
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
                        className="font-display text-[36px] font-bold text-text-1 leading-[1.1] tracking-[-0.03em] hover:text-violet-lt transition-colors"
                      >
                        {link}
                      </a>
                    </m.div>
                  ))}
                  
                  <m.div variants={FADE_UP} className="mt-8 will-change-[transform,opacity]">
                    <a
                      href="#book-a-call"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-block text-[15px] font-body font-medium text-text-1 bg-transparent border border-text-1 rounded-full px-5 py-2.5 hover:bg-text-1 hover:text-white active:scale-[0.97] transition-all duration-200 shadow-sm"
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
          {/* Light gradient overlay above video: fades from solid white on the left (for text readability) to fully transparent on the right */}
          <div
            className="hidden lg:block absolute inset-0 z-[1]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 20%, rgba(255,255,255,0) 45%)',
            }}
          />
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

        {/* §7  CONTENT LAYER */}
        <div className="relative z-10 flex flex-col order-first lg:order-none w-full bg-deep lg:bg-transparent pb-10 lg:pb-0 lg:min-h-screen">
          <main id="hero-main" className="w-full max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-16 pt-[110px] sm:pt-[130px] lg:pt-[140px] pb-16 flex-1 flex flex-col justify-center">
            
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
                  we help brands grow through content, design & technology
                </h1>
              </m.div>

              {/* §10  SUBHEADLINE */}
              <m.div variants={FADE_UP} className="mt-8 mb-12 will-change-[transform,opacity]">
                <p className="font-mono text-[12px] sm:text-[14px] uppercase tracking-[0.12em] text-text-2 font-semibold">
                  content strategy &bull; branding &bull; websites
                </p>
              </m.div>

              {/* §11  PRIMARY CALL TO ACTIONS */}
              <m.div variants={FADE_UP} className="flex flex-wrap gap-4 items-center will-change-[transform,opacity]">
                <a
                  href="#portfolio"
                  className="font-body text-[13px] font-semibold tracking-[0.08em] text-text-1 bg-transparent border border-text-1 rounded-full px-7 py-3.5 hover:bg-text-1 hover:text-white active:scale-[0.97] transition-all duration-200 shadow-[0_4px_12px_rgba(17,24,39,0.05)]"
                >
                  View Portfolio &rarr;
                </a>
                <a
                  href="#book-a-call"
                  className="font-body text-[13px] font-semibold tracking-[0.08em] text-text-1 bg-transparent border border-text-1 rounded-full px-7 py-3.5 hover:bg-text-1 hover:text-white active:scale-[0.97] transition-all duration-200"
                >
                  Book a Call &rarr;
                </a>
              </m.div>
            </m.div>

          </main>
        </div>
      </div>

    </LazyMotion>
  );
}


