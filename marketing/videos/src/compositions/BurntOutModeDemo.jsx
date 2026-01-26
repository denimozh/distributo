import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

const brand = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  bgLight: '#fafbfc',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
};

const DistributoLogo = ({ size = 48 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.25,
    background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const Background = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: brand.bgLight }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: `radial-gradient(${brand.textMuted}30 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      <div style={{ position: 'absolute', top: '30%', left: '50%', width: 500, height: 500, transform: 'translate(-50%, -50%)', background: `radial-gradient(circle, ${brand.amber}12, transparent 70%)`, filter: 'blur(80px)', opacity: 0.6 + Math.sin(frame / 60) * 0.2 }} />
    </AbsoluteFill>
  );
};

const CalendarDay = ({ day, hasPost, style }) => (
  <div style={{
    width: 64, height: 64, borderRadius: 14,
    background: hasPost ? `${brand.green}12` : brand.cardBg,
    border: `2px solid ${hasPost ? brand.green + '50' : brand.cardBorder}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    ...style,
  }}>
    <span style={{ color: hasPost ? brand.green : brand.textMuted, fontSize: 18, fontWeight: 600 }}>{day}</span>
    {hasPost && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand.green} strokeWidth="3" style={{ marginTop: 2 }}><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  </div>
);

const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const calendarScale = spring({ frame, fps, config: { damping: 18 } });
  const sadOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  const days = [
    { day: 'M', hasPost: true },
    { day: 'T', hasPost: true },
    { day: 'W', hasPost: false },
    { day: 'T', hasPost: false },
    { day: 'F', hasPost: false },
    { day: 'S', hasPost: false },
    { day: 'S', hasPost: false },
  ];
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', transform: `scale(${calendarScale})` }}>
        <div style={{ color: brand.textPrimary, fontSize: 24, fontWeight: 600, marginBottom: 32 }}>Your posting this week</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
          {days.map((d, i) => <CalendarDay key={i} day={d.day} hasPost={d.hasPost} />)}
        </div>
        <div style={{ opacity: sadOpacity }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${brand.red}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={brand.red} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div style={{ color: brand.red, fontSize: 22, fontWeight: 600 }}>5 days without posting</div>
          <div style={{ color: brand.textMuted, fontSize: 15, marginTop: 6 }}>Your consistency streak broke</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const toggleProgress = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });
  const glowIntensity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${brand.amber}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: glowIntensity > 0.5 ? `0 0 40px ${brand.amber}40` : 'none' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill={brand.amber}>
            <rect x="2" y="7" width="18" height="10" rx="2" ry="2"/>
            <rect x="20" y="10" width="2" height="4" rx="1"/>
            <rect x="4" y="9" width="12" height="6" rx="1"/>
          </svg>
        </div>
        <div style={{ color: brand.textPrimary, fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Burnt Out Mode</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 16,
          background: brand.cardBg, padding: '16px 28px', borderRadius: 40,
          border: `2px solid ${toggleProgress > 0.5 ? brand.amber : brand.cardBorder}`,
          boxShadow: toggleProgress > 0.5 ? `0 0 30px ${brand.amber}25` : 'none',
        }}>
          <span style={{ color: toggleProgress > 0.5 ? brand.textMuted : brand.textPrimary, fontSize: 16, fontWeight: 600 }}>OFF</span>
          <div style={{ width: 64, height: 34, borderRadius: 17, background: toggleProgress > 0.5 ? brand.amber : brand.cardBorder, position: 'relative' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'white',
              position: 'absolute', top: 3, left: interpolate(toggleProgress, [0, 1], [3, 33]),
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ color: toggleProgress > 0.5 ? brand.amber : brand.textMuted, fontSize: 16, fontWeight: 600 }}>ON</span>
        </div>
        {toggleProgress > 0.8 && (
          <div style={{ marginTop: 28, color: brand.amber, fontSize: 17, fontWeight: 500, opacity: glowIntensity }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={brand.amber} strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 8 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Autopilot activated
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const days = [
    { day: 'M', hasPost: true, delay: 0 },
    { day: 'T', hasPost: true, delay: 0 },
    { day: 'W', hasPost: true, delay: 15 },
    { day: 'T', hasPost: true, delay: 30 },
    { day: 'F', hasPost: true, delay: 45 },
    { day: 'S', hasPost: true, delay: 60 },
    { day: 'S', hasPost: true, delay: 75 },
  ];
  const successOpacity = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: brand.textPrimary, fontSize: 24, fontWeight: 600, marginBottom: 32 }}>Your posting this week</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
          {days.map((d, i) => {
            const appear = i >= 2 ? spring({ frame: Math.max(0, frame - d.delay), fps, config: { damping: 15 } }) : 1;
            return <CalendarDay key={i} day={d.day} hasPost={i < 2 || frame > d.delay + 20} style={{ transform: `scale(${appear})` }} />;
          })}
        </div>
        <div style={{ opacity: successOpacity }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${brand.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={brand.amber} strokeWidth="2">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div style={{ color: brand.green, fontSize: 22, fontWeight: 600 }}>7-day streak maintained!</div>
          <div style={{ color: brand.textMuted, fontSize: 15, marginTop: 6 }}>AI kept your content flowing</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: brand.textPrimary, marginBottom: 8, lineHeight: 1.3 }}>
          Take a break.
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, background: `linear-gradient(135deg, ${brand.amber}, ${brand.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
          We've got this.
        </div>
        <div style={{ color: brand.textSecondary, fontSize: 18, marginBottom: 48 }}>Your voice. Your style. On autopilot.</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <DistributoLogo size={44} />
          <span style={{ fontSize: 22, fontWeight: 600, color: brand.textPrimary }}>Distributo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BurntOutModeDemo = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={120}><Scene1 /></Sequence>
    <Sequence from={120} durationInFrames={90}><Scene2 /></Sequence>
    <Sequence from={210} durationInFrames={120}><Scene3 /></Sequence>
    <Sequence from={330} durationInFrames={120}><Scene4 /></Sequence>
  </AbsoluteFill>
);