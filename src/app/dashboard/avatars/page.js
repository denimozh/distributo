"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NICHE_TAGS = {
  'Sophie': 'Beauty & Lifestyle', 'Marcus': 'Business & Finance', 'Emma': 'Fashion & Style',
  'James': 'Fitness & Health', 'Olivia': 'Home & Living', 'Lucas': 'Tech & Reviews',
  'Ava': 'Skincare & Beauty', 'Noah': 'E-commerce', 'Isabella': 'Food & Cooking',
  'David': 'Product Reviews', 'Maria': 'Wellness', 'Alex': 'Fits any niche',
  'Sarah': 'Fashion', 'Michael': 'Tech', 'Emily': 'Wellness', 'Chris': 'Fits any niche',
  'Lisa': 'Lifestyle', 'Nina': 'Beauty',
};

const STYLES = [
  { id: 'casual', label: 'Casual' },
  { id: 'professional', label: 'Professional' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

const BACKGROUNDS = [
  { id: 'home', label: 'Indoor Home' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'studio', label: 'Studio' },
  { id: 'coffee', label: 'Coffee Shop' },
];

export default function AvatarsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState([]);
  const [customAvatars, setCustomAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const [createForm, setCreateForm] = useState({ description: '', style: 'casual', background: 'home' });

  useEffect(() => { loadAvatars(); }, []);

  const loadAvatars = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: systemAvatars } = await supabase.from("avatars").select("*").eq("is_system", true).order("name");
    setAvatars(systemAvatars || []);

    const { data: userAvatars } = await supabase.from("avatars").select("*").eq("user_id", user.id).eq("is_system", false);
    setCustomAvatars(userAvatars || []);
    setLoading(false);
  };

  const handleCreateAvatar = async () => {
    if (!createForm.description.trim()) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 3000));
    setGeneratedAvatars([
      { id: 'gen-1', image_url: avatars[0]?.image_url, name: 'Option 1' },
      { id: 'gen-2', image_url: avatars[1]?.image_url, name: 'Option 2' },
      { id: 'gen-3', image_url: avatars[2]?.image_url, name: 'Option 3' },
      { id: 'gen-4', image_url: avatars[3]?.image_url, name: 'Option 4' },
    ]);
    setCreating(false);
  };

  const handleSelectGeneratedAvatar = async (avatar) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("avatars").insert({ user_id: user.id, name: `Custom Avatar`, image_url: avatar.image_url, is_system: false });
    }
    closeModal();
    loadAvatars();
  };

  const handleUseAvatar = (avatarId) => { router.push(`/dashboard/create?avatar=${avatarId}`); };
  const closeModal = () => { setShowCreateModal(false); setGeneratedAvatars([]); setCreateForm({ description: '', style: 'casual', background: 'home' }); };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Avatars</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Choose an AI presenter for your videos. These are the faces that will deliver your content.</p>
      </div>

      {/* Custom Avatars Section */}
      {customAvatars.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Your Custom Avatars</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {customAvatars.map((avatar) => (
              <AvatarCard key={avatar.id} avatar={avatar} nicheTag="Custom" isCustom onClick={() => setSelectedAvatar(avatar)} />
            ))}
          </div>
        </div>
      )}

      {/* Preset Avatars */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Preset Avatars</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {/* Create Your Own - SAME HEIGHT as avatar cards */}
          <button onClick={() => setShowCreateModal(true)} style={{ padding: 0, background: 'white', border: '2px dashed #d1d5db', borderRadius: '16px', cursor: 'pointer', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ aspectRatio: '1', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Create Your Own</p>
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Design a custom avatar</p>
            </div>
          </button>

          {avatars.map((avatar) => (
            <AvatarCard key={avatar.id} avatar={avatar} nicheTag={NICHE_TAGS[avatar.name] || 'Fits any niche'} onClick={() => setSelectedAvatar(avatar)} />
          ))}
        </div>
      </div>

      {/* Avatar Detail Modal */}
      {selectedAvatar && (
        <div onClick={(e) => e.target === e.currentTarget && setSelectedAvatar(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1', background: '#f3f4f6', position: 'relative' }}>
              {selectedAvatar.image_url && <img src={selectedAvatar.image_url} alt={selectedAvatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <button onClick={() => setSelectedAvatar(null)} style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{selectedAvatar.name}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <span style={{ padding: '6px 12px', background: '#f5f3ff', color: '#7c3aed', fontSize: '13px', fontWeight: '500', borderRadius: '6px' }}>{NICHE_TAGS[selectedAvatar.name] || 'Fits any niche'}</span>
              </div>
              <button onClick={() => handleUseAvatar(selectedAvatar.id)} style={{ width: '100%', padding: '14px', background: '#7c3aed', color: 'white', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Use in Strategy</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Avatar Modal */}
      {showCreateModal && (
        <div onClick={(e) => e.target === e.currentTarget && closeModal()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '28px' }}>
            {generatedAvatars.length > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Choose your avatar</h3>
                  <button onClick={closeModal} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Select one of the generated options below</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {generatedAvatars.map((avatar) => (
                    <button key={avatar.id} onClick={() => handleSelectGeneratedAvatar(avatar)} style={{ padding: 0, border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: 'none', transition: 'border-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ aspectRatio: '1', background: '#f3f4f6' }}>
                        {avatar.image_url && <img src={avatar.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ padding: '10px', background: 'white' }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{avatar.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setGeneratedAvatars([])} style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280', cursor: 'pointer' }}>Generate new options</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Create Custom Avatar</h3>
                  <button onClick={closeModal} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Describe your avatar</label>
                  <textarea rows={3} placeholder="e.g., A friendly woman in her 30s with dark hair, warm smile" value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Style</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {STYLES.map((style) => (
                      <button key={style.id} onClick={() => setCreateForm(f => ({ ...f, style: style.id }))} style={{ flex: 1, padding: '10px', background: createForm.style === style.id ? '#f5f3ff' : 'white', border: createForm.style === style.id ? '2px solid #7c3aed' : '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: createForm.style === style.id ? '#7c3aed' : '#4b5563', cursor: 'pointer' }}>{style.label}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Background</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {BACKGROUNDS.map((bg) => (
                      <button key={bg.id} onClick={() => setCreateForm(f => ({ ...f, background: bg.id }))} style={{ padding: '10px', background: createForm.background === bg.id ? '#f5f3ff' : 'white', border: createForm.background === bg.id ? '2px solid #7c3aed' : '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: createForm.background === bg.id ? '#7c3aed' : '#4b5563', cursor: 'pointer' }}>{bg.label}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCreateAvatar} disabled={!createForm.description.trim() || creating} style={{ width: '100%', padding: '14px', background: createForm.description.trim() ? '#7c3aed' : '#e5e7eb', color: createForm.description.trim() ? 'white' : '#9ca3af', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '10px', cursor: createForm.description.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {creating ? (
                    <>
                      <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Generating 4 options...
                    </>
                  ) : 'Generate Avatar'}
                </button>
                {!createForm.description.trim() && <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '10px' }}>Describe your avatar above to generate</p>}
                <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>Uses 1 credit per generation</p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AvatarCard({ avatar, nicheTag, isCustom, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ padding: 0, background: 'white', border: '2px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative', textAlign: 'left', transition: 'border-color 0.2s, transform 0.2s', borderColor: hovered ? '#7c3aed' : '#e5e7eb', transform: hovered ? 'translateY(-2px)' : 'none' }}>
      <div style={{ aspectRatio: '1', background: '#f3f4f6', position: 'relative' }}>
        {avatar.image_url && <img src={avatar.image_url} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {isCustom && <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '4px 8px', background: '#7c3aed', borderRadius: '4px' }}><span style={{ fontSize: '10px', color: 'white', fontWeight: '600' }}>CUSTOM</span></div>}
        {/* Hover play button overlay */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c3aed"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>{avatar.name}</p>
        <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500' }}>{nicheTag}</p>
      </div>
    </button>
  );
}
