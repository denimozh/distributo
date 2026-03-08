"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navItems = [
    { name: "Home", href: "/dashboard", icon: "home", active: pathname === "/dashboard" },
    { name: "New Strategy", href: "/dashboard/create", icon: "plus", active: pathname === "/dashboard/create", primary: true },
    { name: "Videos", href: "/dashboard/videos", icon: "video", active: pathname.startsWith("/dashboard/videos") },
    { name: "Avatars", href: "/dashboard/avatars", icon: "users", active: pathname.startsWith("/dashboard/avatars") },
    { name: "Analytics", href: "/dashboard/analytics", icon: "chart", active: pathname.startsWith("/dashboard/analytics") },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex' }}>
      {/* Sidebar - NO platform status here */}
      <aside style={{ width: '240px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>D</span>
            </div>
            <span style={{ fontSize: '17px', fontWeight: '600', color: '#111827' }}>Distributo</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    background: item.primary ? '#7c3aed' : item.active ? '#f3f4f6' : 'transparent',
                    color: item.primary ? 'white' : item.active ? '#111827' : '#4b5563',
                  }}
                >
                  <NavIcon name={item.icon} color={item.primary ? 'white' : '#6b7280'} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Credits */}
        <div style={{ padding: '16px' }}>
          <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Credits</span>
              <Link href="/dashboard/settings" style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500', textDecoration: 'none' }}>
                Get more
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{profile?.credits || 0}</span>
              <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#7c3aed', borderRadius: '3px', width: `${Math.min((profile?.credits || 0) / 100 * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f3f4f6' }}>
          <Link
            href="/dashboard/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              background: pathname.startsWith("/dashboard/settings") ? '#f3f4f6' : 'transparent',
              color: pathname.startsWith("/dashboard/settings") ? '#111827' : '#4b5563',
            }}
          >
            <NavIcon name="settings" color="#6b7280" />
            Settings
          </Link>
        </div>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed' }}>
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || user?.email?.split("@")[0]}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                {profile?.plan || "Free"} Plan
              </p>
            </div>
            <button
              onClick={handleSignOut}
              style={{ padding: '8px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
              title="Sign out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function NavIcon({ name, color }) {
  const icons = {
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    video: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2" /><polygon points="22 7 22 17 17 12 22 7" /></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  };
  return icons[name] || null;
}
