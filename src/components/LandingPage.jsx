'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';

// ============================================================================
// DISTRIBUTO - AWARD-WINNING LANDING PAGE V6
// Apple-quality • Creatify-inspired • Premium Animations
// ============================================================================

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  TikTok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  Instagram: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Layers: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Zap: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  BarChart: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Brain: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    </svg>
  ),
  Target: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Video: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  ),
  Twitter: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Linkedin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  Play: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Refresh: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  ),
  Grid: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LandingPage() {
  return (
    <main className="relative bg-white overflow-x-hidden">
      
      <Navigation />
      <HeroSection />
      <StatsSection />
      <FeatureExperimentMatrix />
      <TrackingSection />
      <FeatureLearningLoop />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}

// ============================================================================
// NAVIGATION
// ============================================================================

function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100' : ''
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.a href="#" className="flex items-center gap-2.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Icons.Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">distributo</span>
        </motion.a>
        
        <div className="hidden lg:flex items-center gap-1">
          {['Features', 'How it Works', 'Pricing'].map((item) => (
            <motion.a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {item}
            </motion.a>
          ))}
        </div>
        
        <motion.button 
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
          <Icons.Sparkles className="w-4 h-4 text-orange-400" />
          Start Free Trial
        </motion.button>
      </div>
    </motion.nav>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500 via-purple-400 via-40% to-orange-200 to-90%" />
      </div>
      
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="absolute top-20 left-10 w-64 h-64 border border-white/20 rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute bottom-40 right-20 w-96 h-96 border border-white/10 rounded-full"
          animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} />
      </div>
      
      <motion.div className="relative z-10 pt-32 pb-20 px-6" style={{ y, opacity }}>
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Now in Beta • First 50 users get 30% off</span>
          </motion.div>
          
          <motion.h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight mb-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            Find your winning content formula 10x faster
          </motion.h1>
          
          <motion.p className="text-xl md:text-2xl text-white/90 mb-4 max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            Stop guessing which content works. Know exactly which hooks, formats, and angles convert for YOUR audience.
          </motion.p>
          <motion.p className="text-lg text-white/70 mb-12"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            (your content strategy on autopilot)
          </motion.p>
          
          <motion.div className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
            <motion.button className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white text-base font-semibold rounded-2xl shadow-2xl"
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
                <Icons.Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="tracking-wide">START YOUR FIRST EXPERIMENT</span>
              <Icons.ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </motion.button>
            
            <div className="flex items-center gap-6 text-white/80">
              <div className="flex items-center gap-2"><Icons.Check className="w-4 h-4" /><span className="text-sm">7-day free trial</span></div>
              <div className="flex items-center gap-2"><Icons.Check className="w-4 h-4" /><span className="text-sm">No credit card required</span></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

// ============================================================================
// STATS SECTION - Like Creatify reference image 1
// ============================================================================

function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { label: 'Time Saved', value: '12+ hrs', sublabel: '/week', desc: 'vs. manual creation & testing' },
    { label: 'Cost Per Video', value: '~$0.65', sublabel: '', desc: 'vs. $50-300 per freelancer video' },
    { label: 'Ad Efficiency', value: '+40-60%', sublabel: '', desc: 'by eliminating losing creatives early' },
    { label: 'First Pattern', value: '18', sublabel: ' days', desc: 'Average time to first high-confidence insight' },
    { label: 'Experiment Cycles', value: '4', sublabel: '/mo', desc: 'Continuous learning and optimization' },
  ];

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Gradient background like the reference */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white via-50% to-purple-50/50" />
      
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
              <p className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                {stat.value}
                <span className="text-2xl md:text-3xl text-gray-400">{stat.sublabel}</span>
              </p>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURE 1: EXPERIMENT MATRIX
// ============================================================================

function FeatureExperimentMatrix() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCell, setActiveCell] = useState({ row: 0, col: 0 });
  
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveCell(prev => {
        const next = prev.col < 2 ? { row: prev.row, col: prev.col + 1 } : { row: (prev.row + 1) % 3, col: 0 };
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isInView]);

  const hooks = ['Curiosity', 'Direct', 'Story'];
  const formats = ['UGC', 'Slideshow', 'Text'];

  return (
    <section ref={ref} id="features" className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 rounded-lg mb-6">
              <Icons.Grid className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-600">EXPERIMENT</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
              Structured Experiments,<br />Not Random Posts
            </h2>
            
            <ul className="space-y-4 mb-8">
              {[
                'Test 3 hooks × 3 formats = 9 isolated variables',
                '12 videos per experiment cycle',
                'Statistical significance, not gut feelings',
                'Know exactly what works and why'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icons.Check className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            
            <motion.button
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icons.Sparkles className="w-4 h-4 text-violet-400" />
              CREATE EXPERIMENT
            </motion.button>
          </motion.div>
          
          {/* Right: Animated Matrix Visualization */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-orange-400 rounded-3xl p-8 shadow-2xl">
              {/* Matrix grid */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div />
                  {formats.map((format, i) => (
                    <motion.div
                      key={format}
                      className={`text-center py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        i === activeCell.col ? 'bg-white text-violet-600' : 'text-white/70'
                      }`}
                      animate={i === activeCell.col ? { scale: [1, 1.05, 1] } : {}}
                    >
                      {format}
                    </motion.div>
                  ))}
                </div>
                
                {/* Data rows */}
                {hooks.map((hook, rowIdx) => (
                  <div key={hook} className="grid grid-cols-4 gap-3 mb-3 last:mb-0">
                    <motion.div
                      className={`py-3 px-2 rounded-lg text-sm font-semibold text-center transition-all duration-300 ${
                        rowIdx === activeCell.row ? 'bg-white text-purple-600' : 'text-white/70'
                      }`}
                      animate={rowIdx === activeCell.row ? { scale: [1, 1.05, 1] } : {}}
                    >
                      {hook}
                    </motion.div>
                    {formats.map((_, colIdx) => {
                      const isActive = rowIdx === activeCell.row && colIdx === activeCell.col;
                      const isPast = rowIdx < activeCell.row || (rowIdx === activeCell.row && colIdx < activeCell.col);
                      
                      return (
                        <motion.div
                          key={`${rowIdx}-${colIdx}`}
                          className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-500 ${
                            isActive ? 'bg-white shadow-xl scale-105' : isPast ? 'bg-white/30' : 'bg-white/10'
                          }`}
                          animate={isActive ? { scale: [1, 1.08, 1.05] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {isPast && <Icons.Check className="w-5 h-5 text-white" />}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                          )}
                          {!isPast && !isActive && (
                            <div className="w-2 h-2 bg-white/30 rounded-full" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* Status bar */}
              <div className="mt-6 flex items-center justify-between text-white/80 text-sm">
                <span>Testing: {hooks[activeCell.row]} × {formats[activeCell.col]}</span>
                <span className="font-semibold">{Math.round((activeCell.row * 3 + activeCell.col + 1) / 9 * 100)}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURE 2: AUTO TRACKING - Circular flow like reference image 2
// ============================================================================

function TrackingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <section ref={ref} className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Animated Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-400/20 to-orange-300/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
              {/* Mini Dashboard Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-gray-500 text-sm font-mono">distributo analytics</span>
              </div>
              
              {/* Animated Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div 
                  className="bg-gray-800/50 rounded-xl p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-500 text-xs">Videos</p>
                  <motion.p 
                    className="text-2xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.4 }}
                  >
                    47
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="bg-gray-800/50 rounded-xl p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-gray-500 text-xs">Patterns</p>
                  <motion.p 
                    className="text-2xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.5 }}
                  >
                    8
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="bg-gray-800/50 rounded-xl p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-gray-500 text-xs">Save Rate</p>
                  <motion.p 
                    className="text-2xl font-bold text-green-400"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 }}
                  >
                    3.2%
                  </motion.p>
                </motion.div>
              </div>
              
              {/* Performance Bars */}
              <div className="space-y-3 mb-6">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Hook Performance</p>
                
                {/* Curiosity - Best performer */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Curiosity</span>
                    <span className="text-xs text-green-400 font-semibold">+47%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '85%' } : {}}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
                
                {/* Story */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Story</span>
                    <span className="text-xs text-green-400 font-semibold">+12%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '62%' } : {}}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                
                {/* Direct - Underperformer */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Direct</span>
                    <span className="text-xs text-red-400 font-semibold">-23%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '35%' } : {}}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* AI Insight Popup */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1 }}
                className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icons.Brain className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold">AI Insight</span>
                </div>
                <p className="text-white/90 text-sm">
                  Curiosity hooks get <span className="font-bold">47% more saves</span> than your average. 
                  Try this for your next 3 posts.
                </p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 rounded-lg mb-6">
              <Icons.BarChart className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-600">TRACK & OPTIMIZE</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Track What Works,<br />
              Kill What Doesn't
            </h2>
            
            <ul className="space-y-4">
              {[
                'See views, saves, and engagement for every video',
                'Compare performance across all your content types',
                'Know exactly which hooks and formats convert',
                'AI finds patterns you\'d never spot manually',
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icons.Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-600">{item}</span>
                </motion.li>
              ))}
            </ul>
            
            <motion.a
              href="/signup"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icons.BarChart className="w-5 h-5" />
              View Analytics Demo
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURE 3: LEARNING LOOP - Shows AI actually learning
// ============================================================================

function FeatureLearningLoop() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [cycle, setCycle] = useState(1);
  const [dataPoints, setDataPoints] = useState([]);
  const [patterns, setPatterns] = useState([
    { name: 'Curiosity Hooks', confidence: 0, trend: '+0%', winner: false },
    { name: 'Slideshow Format', confidence: 0, trend: '+0%', winner: false },
    { name: 'Problem-Aware', confidence: 0, trend: '+0%', winner: false },
  ]);
  
  // Simulate learning process
  useEffect(() => {
    if (!isInView) return;
    
    // Add data points over time
    const dataInterval = setInterval(() => {
      setDataPoints(prev => {
        if (prev.length >= 12) return prev;
        return [...prev, { id: prev.length, value: Math.random() }];
      });
    }, 400);
    
    // Update patterns as data comes in
    const patternInterval = setInterval(() => {
      setPatterns(prev => prev.map((p, i) => {
        const targetConfidence = [89, 76, 64][i];
        const newConfidence = Math.min(p.confidence + Math.random() * 8, targetConfidence);
        const trend = Math.round((newConfidence / targetConfidence) * [23, 18, 12][i]);
        return {
          ...p,
          confidence: newConfidence,
          trend: `+${trend}%`,
          winner: newConfidence > 70
        };
      }));
    }, 600);
    
    // Cycle through experiments
    const cycleInterval = setInterval(() => {
      setCycle(c => c < 4 ? c + 1 : c);
    }, 3000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(patternInterval);
      clearInterval(cycleInterval);
    };
  }, [isInView]);

  return (
    <section ref={ref} className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg mb-6">
              <Icons.Brain className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">LEARN</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
              AI That Gets Smarter<br />Every Cycle
            </h2>
            
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              After each experiment, our Learning Engine analyzes your results and identifies patterns specific to YOUR audience. The longer you use it, the more personalized and accurate it becomes.
            </p>
            
            <div className="p-6 bg-gray-50 rounded-2xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">Learning in progress...</span>
              </div>
              <div className="space-y-3">
                {patterns.map((pattern, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pattern.winner && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Icons.Check className="w-2.5 h-2.5 text-white" />
                        </motion.div>
                      )}
                      <span className={`text-sm ${pattern.winner ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {pattern.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${pattern.winner ? 'bg-green-500' : 'bg-orange-500'}`}
                          animate={{ width: `${pattern.confidence}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-10 ${pattern.winner ? 'text-green-600' : 'text-gray-400'}`}>
                        {pattern.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <motion.button
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icons.Brain className="w-4 h-4 text-orange-400" />
              VIEW INSIGHTS
            </motion.button>
          </motion.div>
          
          {/* Right: AI Learning Visualization */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative bg-gray-900 rounded-3xl p-6 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white/80 text-sm font-medium">Learning Engine Active</span>
                </div>
                <div className="text-xs text-white/50">Cycle {cycle}/4</div>
              </div>
              
              {/* Data ingestion visualization */}
              <div className="mb-6">
                <div className="text-xs text-white/50 mb-3">DATA INGESTION</div>
                <div className="grid grid-cols-12 gap-1.5">
                  {[...Array(12)].map((_, i) => {
                    const hasData = i < dataPoints.length;
                    const isNew = i === dataPoints.length - 1;
                    return (
                      <motion.div
                        key={i}
                        className={`aspect-square rounded-md ${
                          hasData 
                            ? isNew ? 'bg-orange-500' : 'bg-orange-500/60'
                            : 'bg-white/10'
                        }`}
                        initial={hasData && isNew ? { scale: 0, opacity: 0 } : {}}
                        animate={hasData && isNew ? { scale: 1, opacity: 1 } : {}}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-white/40">{dataPoints.length}/12 videos analyzed</span>
                  <span className="text-xs text-orange-400">{Math.round(dataPoints.length / 12 * 100)}%</span>
                </div>
              </div>
              
              {/* Pattern detection */}
              <div className="mb-6">
                <div className="text-xs text-white/50 mb-3">PATTERN DETECTION</div>
                <div className="space-y-3">
                  {[
                    { label: 'Hook Analysis', value: patterns[0].confidence, color: 'violet' },
                    { label: 'Format Analysis', value: patterns[1].confidence, color: 'blue' },
                    { label: 'Angle Analysis', value: patterns[2].confidence, color: 'emerald' },
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-white/70">{item.label}</span>
                        <span className="text-xs text-white/50">{Math.round(item.value)}% confidence</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            item.color === 'violet' ? 'bg-violet-500' :
                            item.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Discovered insights */}
              <div>
                <div className="text-xs text-white/50 mb-3">DISCOVERED INSIGHTS</div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {patterns[0].confidence > 50 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        className="flex items-center gap-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg"
                      >
                        <Icons.TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-xs text-green-300">Curiosity hooks +67% vs direct</span>
                      </motion.div>
                    )}
                    {patterns[1].confidence > 60 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        className="flex items-center gap-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                      >
                        <Icons.TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-xs text-blue-300">Slideshow 2.3x more saves</span>
                      </motion.div>
                    )}
                    {patterns[2].confidence > 40 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        className="flex items-center gap-2 p-2 bg-violet-500/20 border border-violet-500/30 rounded-lg"
                      >
                        <Icons.Target className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        <span className="text-xs text-violet-300">Problem-aware angle trending</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Next action */}
              {cycle >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icons.Zap className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-semibold text-orange-300">NEXT CYCLE ACTION</span>
                  </div>
                  <p className="text-xs text-orange-200/80">
                    Weighting curiosity hooks 2x, testing 3 slideshow variants
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS - Advanced step-by-step with visuals like reference image 3
// ============================================================================

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      num: '01',
      title: 'Define',
      desc: 'Tell us about your product, audience, and goals. Our AI builds a structured experiment plan.',
      visual: 'define'
    },
    {
      num: '02',
      title: 'Generate',
      desc: '12 unique videos created, each testing isolated variables: hooks, formats, angles.',
      visual: 'generate'
    },
    {
      num: '03',
      title: 'Publish',
      desc: 'Review, approve, and post to TikTok & Instagram with one click.',
      visual: 'publish'
    },
    {
      num: '04',
      title: 'Learn',
      desc: 'AI tracks performance and identifies winning patterns. Your next cycle gets smarter.',
      visual: 'learn'
    },
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-32 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Your Content Strategy,<br />Automated
          </h2>
          <p className="text-xl text-gray-400">
            Four simple steps to data-driven content creation
          </p>
        </motion.div>
        
        {/* Steps - alternating layout like reference image 3 */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-orange-500 to-violet-500 opacity-30 hidden lg:block" />
          
          {steps.map((step, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={i}
                className={`relative grid lg:grid-cols-2 gap-12 mb-24 last:mb-0 ${
                  isEven ? '' : 'lg:direction-rtl'
                }`}
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.15 }}
              >
                {/* Content side */}
                <div className={`flex flex-col justify-center ${isEven ? 'lg:pr-16 lg:text-right lg:items-end' : 'lg:pl-16 lg:order-2'}`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg mb-4 ${isEven ? '' : ''}`}>
                    <span className="text-xs font-bold text-gray-400">Step {step.num}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 max-w-md leading-relaxed">{step.desc}</p>
                </div>
                
                {/* Visual side */}
                <div className={`relative ${isEven ? 'lg:order-2 lg:pl-16' : 'lg:pr-16'}`}>
                  <StepVisual type={step.visual} isInView={isInView} delay={i * 0.15} />
                </div>
                
                {/* Center dot on timeline */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
                  <motion.div
                    className="w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: i * 0.15 + 0.3 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepVisual({ type, isInView, delay }) {
  const baseClasses = "relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl";
  
  if (type === 'define') {
    return (
      <motion.div
        className={`${baseClasses} p-6`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        {/* Browser dots */}
        <div className="flex gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        
        {/* Form mockup */}
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">Product Name</div>
            <div className="h-10 bg-gray-800 rounded-lg flex items-center px-3">
              <span className="text-sm text-gray-400">GlowSkin Serum</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Target Audience</div>
            <div className="h-10 bg-gray-800 rounded-lg flex items-center px-3">
              <span className="text-sm text-gray-400">Women 25-35, skincare enthusiasts</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Content Goal</div>
            <div className="flex gap-2">
              <div className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-400">Organic Growth</div>
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-500">Paid Ads</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (type === 'generate') {
    return (
      <motion.div
        className={`${baseClasses} p-6`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        <div className="flex gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        
        {/* Video grid */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="aspect-[9/16] bg-gradient-to-br from-violet-500/20 to-orange-500/20 rounded-lg relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: delay + 0.5 + i * 0.1 }}
            >
              {i < 5 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icons.Check className="w-4 h-4 text-green-400" />
                </div>
              )}
              {i === 5 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-gray-500">Generating videos...</span>
          <span className="text-orange-400 font-semibold">6/12</span>
        </div>
      </motion.div>
    );
  }
  
  if (type === 'publish') {
    return (
      <motion.div
        className={`${baseClasses} p-6`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        <div className="flex gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        
        {/* Platform selection */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl">
            <Icons.TikTok className="w-5 h-5 text-white" />
            <span className="text-sm text-white">TikTok</span>
            <Icons.Check className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl">
            <Icons.Instagram className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-white">Reels</span>
            <Icons.Check className="w-4 h-4 text-green-400" />
          </div>
        </div>
        
        {/* Schedule */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-3">Scheduled Posts</div>
          <div className="space-y-2">
            {['Today 6:00 PM', 'Today 9:00 PM', 'Tomorrow 12:00 PM'].map((time, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{time}</span>
                <span className="text-xs text-green-400">Ready</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (type === 'learn') {
    return (
      <motion.div
        className={`${baseClasses} p-6`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        <div className="flex gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        
        {/* Insights */}
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icons.TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Pattern Detected</span>
            </div>
            <p className="text-sm text-gray-300">Curiosity hooks outperform direct by <span className="text-green-400 font-bold">67%</span></p>
          </div>
          
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Brain className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">Next Cycle</span>
            </div>
            <p className="text-sm text-gray-300">Weighting curiosity hooks <span className="text-orange-400 font-bold">2x</span> in next experiment</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return null;
}

// ============================================================================
// PRICING SECTION
// ============================================================================

function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const plans = [
    {
      name: 'Creator',
      price: '$49',
      period: '/mo',
      annualPrice: '$39',
      description: '~90 videos/month',
      features: [
        { text: '3 videos per day', included: true },
        { text: '2 experiment cycles/mo', included: true },
        { text: '10 core templates', included: true },
        { text: 'Basic pattern detection', included: true },
        { text: 'Manual metrics logging', included: true },
        { text: 'Auto API sync', included: false },
      ],
      cta: 'Start 7-Day Trial',
      ctaStyle: 'secondary'
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/mo',
      annualPrice: '$119',
      description: '~150 videos/month',
      features: [
        { text: '5 videos per day', included: true },
        { text: '4 experiment cycles/mo', included: true },
        { text: 'Full template library (25+)', included: true },
        { text: 'Advanced pattern detection', included: true },
        { text: 'TikTok & Instagram API sync', included: true },
        { text: '10 UGC avatar presets', included: true },
      ],
      cta: 'Start 7-Day Trial',
      ctaStyle: 'primary',
      highlighted: true,
      badge: 'Most Popular'
    },
    {
      name: 'Scale',
      price: '$499',
      period: '/mo',
      annualPrice: '$399',
      description: '~450 videos/month',
      features: [
        { text: '15 videos per day', included: true },
        { text: '12 experiment cycles/mo', included: true },
        { text: 'Custom templates', included: true },
        { text: 'Full insights + API', included: true },
        { text: 'All platform sync', included: true },
        { text: 'Unlimited avatars', included: true },
      ],
      cta: 'Contact Sales',
      ctaStyle: 'secondary'
    },
  ];

  return (
    <section ref={ref} id="pricing" className="py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-500">Start with a 7-day free trial. Cancel anytime.</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`relative p-8 rounded-3xl border-2 transition-all ${
                plan.highlighted ? 'border-orange-500 bg-white shadow-xl' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}>
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                  {plan.badge}
                </div>
              )}
              
              <div className="text-center mb-8">
                <div className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <div className="text-sm text-gray-400">or {plan.annualPrice}/mo billed yearly</div>
                <div className="text-sm text-gray-500 mt-2">{plan.description}</div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icons.Check className="w-3 h-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icons.X className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>{feature.text}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                  plan.ctaStyle === 'primary'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          Ready to stop guessing?
        </motion.h2>
        <motion.p className="text-xl text-gray-400 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}>
          Start your first experiment today. Know what works in 2 weeks.
        </motion.p>
        <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <motion.button
            className="group flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl shadow-2xl transition-colors"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}>
            <Icons.Sparkles className="w-5 h-5" />
            Start Free Trial
            <Icons.ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </motion.button>
          <motion.button
            className="px-8 py-4 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-lg font-semibold rounded-2xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}>
            Schedule Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  return (
    <footer className="py-16 px-6 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 pb-12 border-b border-gray-200">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Icons.Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">distributo</span>
            </a>
            <p className="text-gray-500 leading-relaxed max-w-sm mb-6">
              The AI-powered content experiment engine. Stop guessing which content works. Start knowing.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all text-gray-500">
                <Icons.Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all text-gray-500">
                <Icons.Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Resources', links: ['Blog', 'Help Center', 'API Docs', 'Status'] },
            { title: 'Company', links: ['About', 'Careers', 'Contact', 'Press'] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold text-gray-900 mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link}><a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">© 2026 Distributo. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}