import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

// ==========================================
// HOOK + PLUG DEMO VIDEO
// Professional motion design matching Distributo brand
// Duration: 15 seconds (450 frames at 30fps)
// ==========================================

// Brand Colors from Distributo
const brand = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  bgLight: '#fafbfc',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  green: '#10b981',
  red: '#ef4444',
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
};

// Distributo Logo SVG
const DistributoLogo = ({ size = 48 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: size * 0.25,
    background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

// Icons
const XIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const CheckIcon = ({ size = 20, color = brand.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = ({ size = 20, color = brand.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
  </svg>
);

const LinkIcon = ({ size = 20, color = brand.blue }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round"/>
  </svg>
);

// Background
const Background = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ background: brand.bgLight }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.4,
        backgroundImage: `radial-gradient(${brand.textMuted}30 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: 500,
        height: 500,
        background: `radial-gradient(circle, ${brand.blue}15, transparent 70%)`,
        filter: 'blur(60px)',
        transform: `translateY(${Math.sin(frame / 60) * 10}px)`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: 400,
        height: 400,
        background: `radial-gradient(circle, ${brand.indigo}12, transparent 70%)`,
        filter: 'blur(60px)',
        transform: `translateY(${Math.cos(frame / 60) * 10}px)`,
      }} />
    </AbsoluteFill>
  );
};

// Tweet Card
const TweetCard = ({ content, hasLink, linkText, warning, engagement, style }) => (
  <div style={{
    background: brand.cardBg,
    borderRadius: 20,
    padding: 28,
    border: `1px solid ${warning ? brand.red + '40' : brand.cardBorder}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    width: 480,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`,
      }} />
      <div>
        <div style={{ color: brand.textPrimary, fontWeight: 600, fontSize: 17 }}>Denis</div>
        <div style={{ color: brand.textMuted, fontSize: 14 }}>@denis_indie</div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <XIcon size={20} color={brand.textMuted} />
      </div>
    </div>
    
    <div style={{ color: brand.textPrimary, fontSize: 18, lineHeight: 1.6, marginBottom: 16 }}>
      {content}
      {hasLink && <span style={{ color: brand.blue }}> {linkText}</span>}
    </div>
    
    {warning && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: `${brand.red}08`,
        border: `1px solid ${brand.red}25`,
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <CloseIcon size={18} />
        <span style={{ color: brand.red, fontSize: 14, fontWeight: 500 }}>{warning}</span>
      </div>
    )}
    
    <div style={{ 
      display: 'flex', 
      gap: 28, 
      color: brand.textMuted, 
      fontSize: 14,
      paddingTop: 16,
      borderTop: `1px solid ${brand.cardBorder}`,
    }}>
      <span>❤️ {engagement.likes}</span>
      <span>💬 {engagement.replies}</span>
      <span>🔄 {engagement.retweets}</span>
    </div>
  </div>
);

// Scene 1: The Problem
const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const cardY = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const warningOpacity = interpolate(frame, [45, 75], [0, 1], { extrapolateRight: 'clamp' });
  const statsAppear = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ 
        transform: `translateY(${interpolate(cardY, [0, 1], [40, 0])}px)`,
        opacity: cardY,
      }}>
        <TweetCard
          content="Just shipped a new feature! Check it out 👇"
          hasLink={warningOpacity > 0.3}
          linkText="distributo.io"
          warning={warningOpacity > 0.5 ? "Link detected → Algorithm suppression" : null}
          engagement={{ likes: '24', replies: '3', retweets: '2' }}
        />
        
        {statsAppear > 0.3 && (
          <div style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'center',
            opacity: statsAppear,
            transform: `translateY(${interpolate(statsAppear, [0, 1], [20, 0])}px)`,
          }}>
            <div style={{
              background: brand.cardBg,
              padding: '20px 32px',
              borderRadius: 16,
              border: `1px solid ${brand.red}30`,
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: brand.red }}>-50%</div>
              <div style={{ fontSize: 13, color: brand.textMuted, marginTop: 4 }}>Reach with links</div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The Solution
const Scene2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = spring({ frame, fps, config: { damping: 20 } });
  const hookAppear = spring({ frame: frame - 20, fps, config: { damping: 18 } });
  const connectorAppear = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  const plugAppear = spring({ frame: frame - 70, fps, config: { damping: 18 } });
  
  return (
    <AbsoluteFill style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 60,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: titleOpacity,
      }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: brand.textPrimary }}>
          The <span style={{ 
            background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Hook + Plug</span> Strategy
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
        {/* Hook */}
        <div style={{
          opacity: hookAppear,
          transform: `translateX(${interpolate(hookAppear, [0, 1], [-30, 0])}px)`,
        }}>
          <div style={{
            background: brand.cardBg,
            borderRadius: 16,
            padding: 24,
            border: `2px solid ${brand.blue}40`,
            width: 440,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: brand.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 15, fontWeight: 700,
              }}>1</div>
              <span style={{ color: brand.blue, fontWeight: 600, fontSize: 15 }}>HOOK</span>
              <div style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                background: `${brand.green}12`,
                borderRadius: 20,
              }}>
                <CheckIcon size={14} />
                <span style={{ color: brand.green, fontSize: 12, fontWeight: 500 }}>No links</span>
              </div>
            </div>
            <div style={{ color: brand.textPrimary, fontSize: 15, lineHeight: 1.5 }}>
              Just shipped a feature that 3x'd my tweet reach.
              <br /><br />
              The algorithm has a loophole. Here's how 👇
            </div>
          </div>
        </div>
        
        {/* Connector */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: connectorAppear,
        }}>
          <div style={{ width: 2, height: 24, background: `linear-gradient(to bottom, ${brand.blue}, ${brand.indigo})` }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            background: brand.cardBg,
            borderRadius: 24,
            border: `1px solid ${brand.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand.textMuted} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ color: brand.textSecondary, fontSize: 13, fontWeight: 500 }}>60 second delay</span>
          </div>
          <div style={{ width: 2, height: 24, background: `linear-gradient(to bottom, ${brand.indigo}, ${brand.green})` }} />
        </div>
        
        {/* Plug */}
        <div style={{
          opacity: plugAppear,
          transform: `translateX(${interpolate(plugAppear, [0, 1], [30, 0])}px)`,
        }}>
          <div style={{
            background: brand.cardBg,
            borderRadius: 16,
            padding: 24,
            border: `2px solid ${brand.green}40`,
            width: 440,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: brand.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 15, fontWeight: 700,
              }}>2</div>
              <span style={{ color: brand.green, fontWeight: 600, fontSize: 15 }}>PLUG</span>
              <div style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                background: `${brand.blue}12`,
                borderRadius: 20,
              }}>
                <LinkIcon size={14} />
                <span style={{ color: brand.blue, fontSize: 12, fontWeight: 500 }}>Link safe here</span>
              </div>
            </div>
            <div style={{ color: brand.textPrimary, fontSize: 15, lineHeight: 1.5 }}>
              Built this into Distributo ↓
              <br />
              <span style={{ color: brand.blue }}>distributo.io</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: The Result
const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const statsAppear = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  
  return (
    <AbsoluteFill style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <div style={{
          fontSize: 140,
          fontWeight: 700,
          background: `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>3-5x</div>
        <div style={{ fontSize: 32, fontWeight: 600, color: brand.textPrimary, marginTop: 12 }}>
          More Reach
        </div>
        
        <div style={{
          marginTop: 48,
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          opacity: statsAppear,
          transform: `translateY(${interpolate(statsAppear, [0, 1], [20, 0])}px)`,
        }}>
          {[
            { label: 'Likes', value: '1x' },
            { label: 'Retweets', value: '20x' },
            { label: 'Your Reply', value: '150x', highlight: true },
          ].map((stat, i) => (
            <div key={i} style={{
              background: stat.highlight ? `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})` : brand.cardBg,
              padding: '16px 24px',
              borderRadius: 14,
              border: stat.highlight ? 'none' : `1px solid ${brand.cardBorder}`,
              minWidth: 100,
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.highlight ? 'white' : brand.textPrimary }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: stat.highlight ? 'rgba(255,255,255,0.8)' : brand.textMuted, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          opacity: statsAppear,
        }}>
          <DistributoLogo size={40} />
          <span style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>Distributo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const HookPlugDemo = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={135}><Scene1 /></Sequence>
    <Sequence from={135} durationInFrames={180}><Scene2 /></Sequence>
    <Sequence from={315} durationInFrames={135}><Scene3 /></Sequence>
  </AbsoluteFill>
);