import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

const brand = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  bgLight: '#fafbfc',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  green: '#10b981',
  amber: '#f59e0b',
  purple: '#8b5cf6',
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

const Background = () => (
  <AbsoluteFill style={{ background: brand.bgLight }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: `radial-gradient(${brand.textMuted}30 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
  </AbsoluteFill>
);

const StatCard = ({ icon, label, value, change, color, style }) => (
  <div style={{
    background: brand.cardBg, borderRadius: 18, padding: 22,
    border: `1px solid ${brand.cardBorder}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
    fontFamily: 'system-ui, sans-serif',
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ color: brand.textMuted, fontSize: 14 }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700, color: brand.textPrimary }}>{value}</span>
      {change && <span style={{ color: brand.green, fontSize: 13, fontWeight: 500 }}>+{change}%</span>}
    </div>
  </div>
);

const PendingCard = ({ platform, content, time, style }) => (
  <div style={{
    background: brand.cardBg, borderRadius: 14, padding: 18,
    border: `1px solid ${brand.cardBorder}`,
    width: 260, flexShrink: 0,
    fontFamily: 'system-ui, sans-serif',
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: platform === 'x' ? '#000' : brand.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          {platform === 'x' ? <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/> : <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>}
        </svg>
      </div>
      <span style={{ color: brand.textMuted, fontSize: 12 }}>{time}</span>
      <span style={{ marginLeft: 'auto', background: `${brand.amber}12`, color: brand.amber, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>Pending</span>
    </div>
    <div style={{ color: brand.textPrimary, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{content}</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, padding: '8px', background: brand.green, color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Approve</div>
      <div style={{ padding: '8px 14px', background: brand.bgLight, color: brand.textMuted, borderRadius: 8, fontSize: 13, border: `1px solid ${brand.cardBorder}` }}>Edit</div>
    </div>
  </div>
);

const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 18 } });
  const s2 = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 16, fps, config: { damping: 18 } });
  const s4 = spring({ frame: frame - 24, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: 50, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <DistributoLogo size={44} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary }}>Dashboard</div>
          <div style={{ color: brand.textMuted, fontSize: 14 }}>Welcome back, Denis</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.blue} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Posts This Week" value="24" change={12} color={brand.blue} style={{ transform: `scale(${s1})`, opacity: s1 }} />
        <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.amber} strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>} label="Shipping Streak" value="7 days" color={brand.amber} style={{ transform: `scale(${s2})`, opacity: s2 }} />
        <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.green} strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} label="Replies Sent" value="18" change={45} color={brand.green} style={{ transform: `scale(${s3})`, opacity: s3 }} />
        <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.purple} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} label="Impressions" value="12.4K" change={28} color={brand.purple} style={{ transform: `scale(${s4})`, opacity: s4 }} />
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = () => {
  const frame = useCurrentFrame();
  const scrollX = interpolate(frame, [0, 150], [0, -200]);
  const posts = [
    { platform: 'x', content: "Just shipped user auth! The trickiest part was token rotation...", time: '9:00 AM' },
    { platform: 'x', content: "New feature: webhook integrations for GitHub...", time: '12:00 PM' },
    { platform: 'linkedin', content: "Excited to announce our latest milestone...", time: '3:00 PM' },
  ];

  return (
    <AbsoluteFill style={{ padding: 50, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${brand.amber}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={brand.amber} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary }}>Pending Approval</div>
          <div style={{ color: brand.textMuted, fontSize: 13 }}>3 posts ready to review</div>
        </div>
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, transform: `translateX(${scrollX}px)` }}>
          {posts.map((p, i) => <PendingCard key={i} {...p} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: brand.cardBg, borderRadius: 20, padding: 28, width: 420,
        border: `1px solid ${brand.cardBorder}`,
        transform: `scale(${scale})`,
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: brand.textPrimary, marginBottom: 6 }}>Edit Thread</div>
        <div style={{ color: brand.textMuted, fontSize: 13, marginBottom: 20 }}>Hook + Plug Strategy</div>
        
        <div style={{ background: `${brand.blue}08`, border: `2px solid ${brand.blue}30`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: brand.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>1</div>
            <span style={{ color: brand.blue, fontWeight: 600, fontSize: 14 }}>HOOK</span>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, color: brand.textPrimary, fontSize: 13 }}>Just shipped a feature that 3x my reach...</div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
          <div style={{ background: brand.bgLight, padding: '5px 12px', borderRadius: 16, border: `1px solid ${brand.cardBorder}`, fontSize: 12, color: brand.textMuted }}>⏱️ 60s</div>
        </div>
        
        <div style={{ background: `${brand.green}08`, border: `2px solid ${brand.green}30`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: brand.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>2</div>
            <span style={{ color: brand.green, fontWeight: 600, fontSize: 14 }}>PLUG</span>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, color: brand.textPrimary, fontSize: 13 }}>Check it out: <span style={{ color: brand.blue }}>distributo.io</span></div>
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
        <div style={{ fontSize: 36, fontWeight: 700, color: brand.textPrimary, marginBottom: 8 }}>Clean. Simple.</div>
        <div style={{ fontSize: 36, fontWeight: 700, background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 40 }}>Powerful.</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <DistributoLogo size={44} />
          <span style={{ fontSize: 22, fontWeight: 600, color: brand.textPrimary }}>Distributo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DashboardDemo = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={150}><Scene1 /></Sequence>
    <Sequence from={150} durationInFrames={150}><Scene2 /></Sequence>
    <Sequence from={300} durationInFrames={150}><Scene3 /></Sequence>
    <Sequence from={450} durationInFrames={150}><Scene4 /></Sequence>
  </AbsoluteFill>
);