'use client';

import { useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useHotel } from '@/context/HotelContext';
import {
  LayoutDashboard, Calendar, BellRing, Sparkles,
  ShoppingCart, TrendingUp, Settings, Building,
  ChevronLeft, ChevronRight, Bell, Search,
  MoreHorizontal, Menu, X,
} from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/':             'Dashboard',
  '/reservation':  'Đặt phòng & Sơ đồ phòng',
  '/frontdesk':    'Tiền sảnh (Front Desk)',
  '/housekeeping': 'Quản lý Buồng phòng',
  '/pos':          'Dịch vụ & Kho hàng',
  '/reports':      'Báo cáo & Thống kê',
  '/admin':        'Quản trị Hệ thống',
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { stats, reservations, rooms } = useHotel();
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { rooms: [], reservations: [] };
    const q = searchQuery.toLowerCase();
    return {
      rooms: rooms.filter(r => r.id.toLowerCase().includes(q)),
      reservations: reservations.filter(r => 
        r.id.toLowerCase().includes(q) || 
        r.guestName.toLowerCase().includes(q) ||
        r.phone.includes(q)
      )
    };
  }, [searchQuery, rooms, reservations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => setCollapsed(c => !c), []);
  const closeMobile   = useCallback(() => setMobileOpen(false), []);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Dynamic badge values from real data ──
  const pendingBookings = reservations.filter(r =>
    r.status === 'confirmed' || r.status === 'deposit' || r.status === 'pending'
  ).length;
  const cleaningRooms = stats?.cleaning ?? 0;
  const checkInToday  = stats?.checkInToday ?? 0;
  const checkOutToday = stats?.checkOutToday ?? 0;
  const lowStock      = stats?.lowStockItems ?? 0;

  const navGroups = [
    {
      label: 'Tổng quan',
      items: [
        { id: 'dashboard', href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      label: 'Vận hành',
      items: [
        {
          id: 'reservation',  href: '/reservation',  label: 'Đặt phòng',
          icon: <Calendar size={18} />,
          badge: pendingBookings > 0 ? String(pendingBookings) : undefined,
        },
        {
          id: 'frontdesk',    href: '/frontdesk',    label: 'Tiền sảnh',
          icon: <BellRing size={18} />,
          badge: (checkInToday + checkOutToday) > 0 ? String(checkInToday + checkOutToday) : undefined,
          badgeClass: 'accent',
        },
        {
          id: 'housekeeping', href: '/housekeeping',  label: 'Buồng phòng',
          icon: <Sparkles size={18} />,
          badge: cleaningRooms > 0 ? String(cleaningRooms) : undefined,
          badgeClass: 'warn',
        },
      ],
    },
    {
      label: 'Kinh doanh',
      items: [
        {
          id: 'pos',     href: '/pos',     label: 'Dịch vụ & Kho',
          icon: <ShoppingCart size={18} />,
          badge: lowStock > 0 ? String(lowStock) : undefined,
          badgeClass: 'warn',
        },
        { id: 'reports', href: '/reports', label: 'Báo cáo',      icon: <TrendingUp size={18} /> },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        { id: 'admin', href: '/admin', label: 'Quản trị', icon: <Settings size={18} /> },
      ],
    },
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`} id="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Building size={18} color="white"/>
            </div>
            <div className="logo-text">
              <span className="logo-name">HotelOS</span>
              <span className="logo-sub">Pro Management</span>
            </div>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="nav-menu">
          {navGroups.map(group => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    id={`nav-${item.id}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                    {item.badge && (
                      <span className={`nav-badge${item.badgeClass ? ' ' + item.badgeClass : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Occupancy bar at bottom of sidebar */}
        {!collapsed && stats && (
          <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:10, color:'rgba(199,210,254,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:5 }}>
              Công suất hôm nay
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'#C7D2FE' }}>{stats.occupied}/{stats.total} phòng</span>
              <span style={{ fontSize:11, fontWeight:800, color: stats.occupancy >= 80 ? '#6EE7B7' : stats.occupancy >= 60 ? '#FCD34D' : '#FCA5A5' }}>
                {stats.occupancy}%
              </span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:2,
                background: stats.occupancy >= 80 ? '#10B981' : stats.occupancy >= 60 ? '#F59E0B' : '#EF4444',
                width: `${stats.occupancy}%`, transition:'width 0.7s ease'
              }}/>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <span className="user-name">Admin</span>
              <span className="user-role">Quản trị viên</span>
            </div>
            <button className="user-menu-btn" title="Tài khoản">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:99, backdropFilter:'blur(4px)' }}
          onClick={closeMobile}
        />
      )}

      {/* ── Main Content ── */}
      <main className={`main-content${collapsed ? ' expanded' : ''}`} id="mainContent">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="breadcrumb">
              {pageTitles[pathname] ?? 'HotelOS'}
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-date">{today}</div>
            {/* Notif badge shows pending tasks */}
            <button className="topbar-btn" title={`${pendingBookings} đặt phòng chờ xử lý`}>
              <Bell size={17} />
              {pendingBookings > 0 && <span className="notif-dot" />}
            </button>
            <button className="topbar-btn" title="Tìm kiếm (Ctrl+K)" onClick={() => setSearchOpen(true)}>
              <Search size={17} />
            </button>
          </div>
        </header>

        {/* Page */}
        <div className="page-container">
          {children}
        </div>
      </main>

      {/* ── Global Search Modal ── */}
      {isSearchOpen && (
        <div 
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, backdropFilter:'blur(6px)', display:'flex', justifyContent:'center', paddingTop:'10vh' }}
          onClick={() => setSearchOpen(false)}
        >
          <div 
            style={{ 
              background:'var(--bg-surface)', 
              width:'100%', 
              maxWidth: 550, 
              borderRadius: 14, 
              boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
              border:'1px solid var(--border)', 
              overflow:'hidden', 
              display:'flex', 
              flexDirection:'column', 
              maxHeight:'70vh' 
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              .search-result-item {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid transparent;
              }
              .search-result-item:hover {
                background: var(--bg-hover) !important;
                border-color: var(--border) !important;
                transform: translateX(4px);
              }
              .search-kbd {
                background: var(--bg-hover);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                border: 1px solid var(--border);
                color: var(--text-secondary);
                font-family: inherit;
                box-shadow: 0 1px 1px rgba(0,0,0,0.05);
              }
            `}</style>
            <div style={{ display:'flex', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)' }}>
              <Search size={20} style={{ color:'var(--text-muted)', marginRight:12 }} />
              <input 
                autoFocus
                type="text" 
                placeholder="Tìm kiếm phòng, tên khách hàng, số điện thoại..." 
                style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:16, color:'var(--text-primary)', fontWeight:500 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button onClick={() => setSearchOpen(false)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:4, borderRadius:4 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18}/></button>
            </div>
            
            <div style={{ overflowY:'auto', padding:'16px 20px' }}>
              {!searchQuery.trim() ? (
                <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                  <Search size={32} style={{ color:'var(--text-placeholder)', marginBottom:12, opacity:0.6 }} />
                  <div>Nhập từ khóa để bắt đầu tra cứu thông tin phòng hoặc khách hàng...</div>
                  <div style={{ marginTop:16, display:'flex', gap:6, justifyContent:'center', alignItems:'center', fontSize:12 }}>
                    Nhấn <kbd className="search-kbd">Ctrl</kbd> + <kbd className="search-kbd">K</kbd> để mở nhanh từ mọi nơi
                  </div>
                </div>
              ) : (
                <>
                  {searchResults.rooms.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8, paddingLeft:4 }}>Danh sách Phòng</div>
                      {searchResults.rooms.map(r => (
                        <Link href="/reservation" key={r.id} onClick={() => setSearchOpen(false)} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:10, textDecoration:'none', color:'var(--text-primary)', marginBottom:6 }} className="search-result-item">
                          <div style={{ width:36, height:36, borderRadius:8, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Building size={18} color="var(--accent-1)" />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:15 }}>Phòng {r.id}</div>
                            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Tầng {r.floor} · Loại: {r.type}</div>
                          </div>
                          <span className={`badge badge-${r.status}`} style={{ fontSize:11 }}>{r.status === 'vacant' ? 'Trống' : r.status === 'occupied' ? 'Có khách' : r.status === 'cleaning' ? 'Dọn phòng' : 'Bảo trì'}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.reservations.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8, paddingLeft:4 }}>Khách hàng & Đặt phòng</div>
                      {searchResults.reservations.map(r => (
                        <Link href="/reservation" key={r.id} onClick={() => setSearchOpen(false)} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:10, textDecoration:'none', color:'var(--text-primary)', marginBottom:6 }} className="search-result-item">
                          <div style={{ width:36, height:36, borderRadius:8, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Calendar size={18} color="var(--color-info)" />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:15 }}>{r.guestName} <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:400 }}>({r.id})</span></div>
                            <div style={{ fontSize:12, color:'var(--text-muted)' }}>SĐT: {r.phone} · Phòng: {r.roomId || 'Chưa xếp phòng'}</div>
                          </div>
                          <span className={`badge badge-${r.status}`} style={{ fontSize:11 }}>{r.status === 'checkedin' ? 'Đang ở' : r.status === 'confirmed' ? 'Đã xác nhận' : r.status === 'deposit' ? 'Đã cọc' : 'Chờ xử lý'}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.rooms.length === 0 && searchResults.reservations.length === 0 && (
                    <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                      Không tìm thấy kết quả nào trùng khớp với "{searchQuery}"
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
