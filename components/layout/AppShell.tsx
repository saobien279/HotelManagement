'use client';

import { useState, useCallback, ReactNode } from 'react';
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
  const { stats, reservations } = useHotel();

  const toggleSidebar = useCallback(() => setCollapsed(c => !c), []);
  const closeMobile   = useCallback(() => setMobileOpen(false), []);

  const today = new Date('2026-03-14').toLocaleDateString('vi-VN', {
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
            <button className="topbar-btn" title="Tìm kiếm">
              <Search size={17} />
            </button>
          </div>
        </header>

        {/* Page */}
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
