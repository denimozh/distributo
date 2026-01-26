import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

// ==========================================
// REPLY FINDER DEMO VIDEO
// Professional motion design - Tinder-style swipe UI
// Duration: 20 seconds (600 frames at 30fps)
// ==========================================

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
        top: '15%',
        left: '25%',
        width: 450,
        height: 450,
        background: `radial-gradient(circle, ${brand.blue}12, transparent 70%)`,
        filter: 'blur(60px)',
        transform: `translateY(${Math.sin(frame / 50) * 8}px)`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '20%',
        width: 350,
        height: 350,
        background: `radial-gradient(circle, ${brand.amber}10, transparent 70%)`,
        filter: 'blur(60px)',
        transform: `translateY(${Math.cos(frame / 50) * 8}px)`,
      }} />
    </AbsoluteFill>
  );
};

// Opportunity Card (Tinder-style) - ENLARGED
const OpportunityCard = ({ tweet, relevance, showReply, replyText, style }) => (
  <div style={{
    background: brand.cardBg,
    borderRadius: 32,
    padding: 40,
    border: `1px solid ${brand.cardBorder}`,
    boxShadow: '0 12px 48px rgba(0,0,0,0.1)',
    width: 620,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...style,
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
      <div style={{
        width: 68,
        height: 68,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${brand.amber}, #f97316)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 32,
        fontWeight: 700,
      }}>M</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: brand.textPrimary, fontWeight: 600, fontSize: 22 }}>{tweet.name}</div>
        <div style={{ color: brand.textMuted, fontSize: 17 }}>{tweet.handle}</div>
      </div>
      <div style={{
        background: relevance >= 90 ? `${brand.green}15` : `${brand.blue}15`,
        color: relevance >= 90 ? brand.green : brand.blue,
        padding: '10px 18px',
        borderRadius: 24,
        fontWeight: 700,
        fontSize: 20,
      }}>{relevance}%</div>
    </div>
    
    {/* Content */}
    <div style={{ color: brand.textPrimary, fontSize: 24, lineHeight: 1.5, marginBottom: 24 }}>
      {tweet.content}
    </div>
    
    {/* Question badge */}
    {tweet.isQuestion && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 20px',
        background: `${brand.amber}10`,
        border: `1px solid ${brand.amber}30`,
        borderRadius: 14,
        marginBottom: 24,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={brand.amber} strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
        <span style={{ color: brand.amber, fontSize: 18, fontWeight: 500 }}>
          Question detected — great reply opportunity!
        </span>
      </div>
    )}
    
    {/* Engagement */}
    <div style={{ 
      display: 'flex', 
      gap: 32, 
      color: brand.textMuted, 
      fontSize: 18,
      paddingTop: 20,
      borderTop: `1px solid ${brand.cardBorder}`,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {tweet.likes}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        {tweet.replies}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        {tweet.retweets}
      </span>
    </div>
    
    {/* AI Reply */}
    {showReply && (
      <div style={{
        marginTop: 24,
        padding: 22,
        background: `linear-gradient(135deg, ${brand.blue}08, ${brand.indigo}08)`,
        border: `1px solid ${brand.blue}25`,
        borderRadius: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.blue} strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span style={{ color: brand.blue, fontWeight: 600, fontSize: 16 }}>Distributo Generated Reply</span>
        </div>
        <div style={{ color: brand.textPrimary, fontSize: 19, lineHeight: 1.5 }}>{replyText}</div>
      </div>
    )}
  </div>
);

// Swipe Buttons - ENLARGED
const SwipeButtons = ({ highlightRight, style }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 40, ...style }}>
    <div style={{
      width: 80,
      height: 80,
      borderRadius: '50%',
      background: brand.cardBg,
      border: `2px solid ${brand.red}40`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={brand.red} strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
      </svg>
    </div>
    
    <div style={{
      width: 80,
      height: 80,
      borderRadius: '50%',
      background: highlightRight ? `linear-gradient(135deg, ${brand.blue}, ${brand.indigo})` : brand.cardBg,
      border: highlightRight ? 'none' : `2px solid ${brand.blue}40`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: highlightRight ? `0 10px 30px ${brand.blue}40` : '0 6px 20px rgba(0,0,0,0.08)',
      transform: highlightRight ? 'scale(1.15)' : 'scale(1)',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={highlightRight ? 'white' : brand.blue} strokeWidth="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    </div>
  </div>
);

// Scene 1: Card stack intro
const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const cardScale = spring({ frame, fps, config: { damping: 18 } });
  const buttonsOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });
  
  const tweet = {
    name: 'Marc Lou',
    handle: '@marc_louvion',
    content: "What's the best way to stay consistent with marketing as a solo founder?\n\nI always start strong then fall off after a week.",
    likes: '847',
    replies: '124',
    retweets: '89',
    isQuestion: true,
  };
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 50,
        left: 0, right: 0,
        textAlign: 'center',
        opacity: buttonsOpacity,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          background: brand.cardBg,
          padding: '16px 28px',
          borderRadius: 28,
          border: `1px solid ${brand.cardBorder}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brand.blue} strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ color: brand.textPrimary, fontWeight: 600, fontSize: 22 }}>Reply Finder</span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Background cards */}
        <div style={{
          position: 'absolute',
          top: 20, left: 20,
          width: 620, height: 400,
          background: brand.cardBg,
          borderRadius: 32,
          border: `1px solid ${brand.cardBorder}`,
          opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute',
          top: 10, left: 10,
          width: 620, height: 400,
          background: brand.cardBg,
          borderRadius: 32,
          border: `1px solid ${brand.cardBorder}`,
          opacity: 0.7,
        }} />
        
        {/* Main card */}
        <div style={{ transform: `scale(${cardScale})` }}>
          <OpportunityCard tweet={tweet} relevance={92} />
        </div>
      </div>
      
      <div style={{ marginTop: 44, opacity: buttonsOpacity }}>
        <SwipeButtons />
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Click generate + loading
const Scene2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const showLoading = frame > 30 && frame < 100;
  const loadingRotation = interpolate(frame, [0, 60], [0, 360]);
  
  const tweet = {
    name: 'Marc Lou',
    handle: '@marc_louvion',
    content: "What's the best way to stay consistent with marketing as a solo founder?",
    likes: '847',
    replies: '124',
    retweets: '89',
    isQuestion: true,
  };
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <OpportunityCard tweet={tweet} relevance={92} />
      
      <div style={{ marginTop: 36 }}>
        <SwipeButtons highlightRight={frame > 10} />
      </div>
      
      {showLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(250,251,252,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `3px solid ${brand.cardBorder}`,
            borderTopColor: brand.blue,
            transform: `rotate(${loadingRotation}deg)`,
          }} />
          <div style={{ color: brand.textPrimary, fontSize: 18, fontWeight: 500 }}>
            Crafting the perfect reply...
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 3: Reply generated
const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const replyAppear = spring({ frame, fps, config: { damping: 18 } });
  
  const tweet = {
    name: 'Marc Lou',
    handle: '@marc_louvion',
    content: "What's the best way to stay consistent with marketing as a solo founder?",
    likes: '847',
    replies: '124',
    retweets: '89',
    isQuestion: true,
  };
  
  const replyText = "What worked for me: batch create content on Sunday (2 hrs) and schedule for the week. Making it part of build routine, not a separate task, is the key.";
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ transform: `scale(${0.95 + replyAppear * 0.05})` }}>
        <OpportunityCard 
          tweet={tweet} 
          relevance={92}
          showReply={replyAppear > 0.4}
          replyText={replyText}
        />
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Success
const Scene4 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  
  return (
    <AbsoluteFill style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', transform: `scale(${Math.max(0, scale)})` }}>
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `${brand.green}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={brand.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div style={{ fontSize: 52, fontWeight: 700, color: brand.textPrimary, marginBottom: 16 }}>
          Reply Posted!
        </div>
        <div style={{ fontSize: 24, color: brand.textSecondary, marginBottom: 56 }}>
          Engagement farming on autopilot
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <DistributoLogo size={56} />
          <span style={{ fontSize: 28, fontWeight: 600, color: brand.textPrimary }}>Distributo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReplyFinderDemo = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={150}><Scene1 /></Sequence>
    <Sequence from={150} durationInFrames={120}><Scene2 /></Sequence>
    <Sequence from={270} durationInFrames={150}><Scene3 /></Sequence>
    <Sequence from={420} durationInFrames={180}><Scene4 /></Sequence>
  </AbsoluteFill>
);