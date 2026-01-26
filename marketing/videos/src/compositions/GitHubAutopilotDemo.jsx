import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

const brand = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  bgLight: '#fafbfc',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  green: '#10b981',
  purple: '#8b5cf6',
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  terminalBg: '#161b22',
  terminalBorder: '#30363d',
  terminalText: '#c9d1d9',
  terminalGreen: '#7ee787',
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

const GitHubIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const XIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const Background = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: brand.bgLight }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: `radial-gradient(${brand.textMuted}30 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      <div style={{ position: 'absolute', top: '20%', right: '20%', width: 400, height: 400, background: `radial-gradient(circle, ${brand.purple}15, transparent 70%)`, filter: 'blur(60px)', transform: `translateY(${Math.sin(frame / 50) * 8}px)` }} />
    </AbsoluteFill>
  );
};

const Terminal = ({ lines, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ background: brand.terminalBg, borderRadius: 20, border: `1px solid ${brand.terminalBorder}`, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', width: 700, ...style }}>
      <div style={{ padding: '14px 18px', background: '#0d1117', borderBottom: `1px solid ${brand.terminalBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#27ca3f' }} />
        <span style={{ marginLeft: 14, color: brand.textMuted, fontSize: 15, fontFamily: 'monospace' }}>Terminal</span>
      </div>
      <div style={{ padding: 28, fontFamily: 'monospace', fontSize: 18 }}>
        {lines.map((line, i) => {
          const lineDelay = i * 25;
          const showLine = frame > lineDelay;
          const typingProgress = interpolate(frame - lineDelay, [0, 35], [0, 1], { extrapolateRight: 'clamp' });
          if (!showLine) return null;
          const visibleChars = Math.floor(line.text.length * typingProgress);
          return (
            <div key={i} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
              {line.prompt && <span style={{ color: brand.terminalGreen, marginRight: 10 }}>➜</span>}
              {line.prompt && <span style={{ color: '#79c0ff', marginRight: 10 }}>~/distributo</span>}
              <span style={{ color: line.color || brand.terminalText }}>{line.text.substring(0, visibleChars)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PostCard = ({ platform, content, status, style }) => (
  <div style={{ background: brand.cardBg, borderRadius: 20, padding: 28, border: `1px solid ${brand.cardBorder}`, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', width: 500, fontFamily: 'system-ui, sans-serif', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: platform === 'x' ? '#000' : brand.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {platform === 'x' ? <XIcon size={24} color="white" /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
      </div>
      <div style={{ flex: 1 }}><div style={{ color: brand.textPrimary, fontWeight: 600, fontSize: 20 }}>{platform === 'x' ? 'X / Twitter' : 'LinkedIn'}</div></div>
      <div style={{ background: `${brand.blue}12`, color: brand.blue, padding: '8px 16px', borderRadius: 20, fontSize: 15, fontWeight: 600 }}>Scheduled</div>
    </div>
    <div style={{ color: brand.textPrimary, fontSize: 18, lineHeight: 1.6 }}>{content}</div>
  </div>
);

const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const terminalScale = spring({ frame, fps, config: { damping: 18 } });
  const lines = [
    { prompt: true, text: 'git add .' },
    { prompt: true, text: 'git commit -m "feat: add user authentication"' },
    { prompt: true, text: 'git push origin main' },
    { text: 'Enumerating objects: 15, done.', color: brand.textMuted },
    { text: '✓ Pushed to origin/main', color: brand.terminalGreen },
  ];
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 50 }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', opacity: terminalScale, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: brand.cardBg, padding: '16px 28px', borderRadius: 28, border: `1px solid ${brand.cardBorder}` }}>
          <GitHubIcon size={28} color={brand.textPrimary} />
          <span style={{ color: brand.textPrimary, fontWeight: 600, fontSize: 22 }}>GitHub Autopilot</span>
        </div>
      </div>
      <div style={{ transform: `scale(${terminalScale})` }}><Terminal lines={lines} /></div>
    </AbsoluteFill>
  );
};

const Scene2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const webhookScale = spring({ frame, fps, config: { damping: 15 } });
  const processingOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const rotation = interpolate(frame, [50, 120], [0, 720]);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', transform: `scale(${webhookScale})` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, background: `${brand.purple}12`, border: `2px solid ${brand.purple}40`, borderRadius: 24, padding: '26px 40px', marginBottom: 44 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={brand.purple} strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: brand.purple, fontWeight: 600, fontSize: 22 }}>Webhook Received</div>
            <div style={{ color: brand.textMuted, fontSize: 16, marginTop: 4 }}>feat: add user authentication</div>
          </div>
        </div>
        <div style={{ opacity: processingOpacity }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: '50%', border: `4px solid ${brand.cardBorder}`, borderTopColor: brand.blue, transform: `rotate(${rotation}deg)` }} />
          <div style={{ color: brand.textPrimary, fontSize: 24, fontWeight: 500 }}>Analyzing code diff...</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card1 = spring({ frame, fps, config: { damping: 18 } });
  const card2 = spring({ frame: frame - 15, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 50 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ transform: `translateX(${interpolate(card1, [0, 1], [-50, 0])}px)`, opacity: card1 }}>
          <PostCard platform="x" content="Just shipped user authentication! Built with JWT + refresh tokens." status="scheduled" />
        </div>
        <div style={{ transform: `translateX(${interpolate(card2, [0, 1], [50, 0])}px)`, opacity: card2 }}>
          <PostCard platform="linkedin" content="Shipped a major security milestone: full user authentication with JWT." status="scheduled" />
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
        <div style={{ fontSize: 48, fontWeight: 700, color: brand.textPrimary, marginBottom: 12 }}>Ship Code.</div>
        <div style={{ fontSize: 48, fontWeight: 700, background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 52 }}>We Ship Content.</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <DistributoLogo size={56} />
          <span style={{ fontSize: 28, fontWeight: 600, color: brand.textPrimary }}>Distributo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const GitHubAutopilotDemo = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={150}><Scene1 /></Sequence>
    <Sequence from={150} durationInFrames={120}><Scene2 /></Sequence>
    <Sequence from={270} durationInFrames={90}><Scene3 /></Sequence>
    <Sequence from={360} durationInFrames={90}><Scene4 /></Sequence>
  </AbsoluteFill>
);