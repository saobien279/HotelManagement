'use client';

import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { revenueMonthly, revenueBySource, activityLog } from '@/context/HotelContext';
import { fmtShort, logColor } from '@/lib/utils';
import {
  Building, CheckCircle2, LogIn, LogOut, Wallet,
  BarChart, Home, Globe, Clock, Zap,
  ArrowUp, BellRing, Calendar, Sparkles, ShoppingCart, BarChart2, TrendingUp,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { getStats, reservations } = useHotel();
  const stats = getStats();

  const todayCheckins  = reservations.filter(r => r.checkIn  === '2026-03-14' && r.status !== 'cancelled').length;
  const todayCheckouts = reservations.filter(r => r.checkOut === '2026-03-14' && r.status !== 'cancelled').length;

  const maxRev = Math.max(...revenueMonthly.map(r => r.revenue));

  const roomStatusItems = [
    { label: 'Có khách',  count: stats.occupied,    total: stats.total, cls: '',        color: '#A5B4FC', icon: <Home size={14} /> },
    { label: 'Trống',     count: stats.vacant,      total: stats.total, cls: 'success', color: '#6EE7B7', icon: <CheckCircle2 size={14} /> },
    { label: 'Đang dọn',  count: stats.cleaning,    total: stats.total, cls: 'warning', color: '#FCD34D', icon: <Sparkles size={14} /> },
    { label: 'Đã đặt',   count: stats.reserved,    total: stats.total, cls: 'info',    color: '#93C5FD', icon: <Calendar size={14} /> },
    { label: 'Đang sửa',  count: stats.maintenance, total: stats.total, cls: 'danger',  color: '#FCA5A5', icon: <Building size={14} /> },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart2 size={22} /> Tổng quan hôm nay</h1>
          <p className="page-subtitle">Thứ Bảy, 14 tháng 3 năm 2026</p>
        </div>
        <div className="page-actions">
          <Link href="/reports" className="btn btn-dark btn-sm"><BarChart size={14}/> Báo cáo chi tiết</Link>
          <Link href="/reservation" className="btn btn-primary btn-sm"><LogIn size={14}/> Đặt phòng mới</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Building size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Công suất hôm nay</div>
            <div className="stat-value">{stats.occupancy}%</div>
            <div className="stat-change up"><ArrowUp size={11}/> +5% so với hôm qua</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Phòng đang có khách</div>
            <div className="stat-value">{stats.occupied}/{stats.total}</div>
            <div className="stat-change">Phòng trống: {stats.vacant}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><LogIn size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Check-in hôm nay</div>
            <div className="stat-value">{todayCheckins}</div>
            <div className="stat-change">Khách mới đến</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><LogOut size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Check-out hôm nay</div>
            <div className="stat-value">{todayCheckouts}</div>
            <div className="stat-change">Khách trả phòng</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><Wallet size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Doanh thu tháng 3</div>
            <div className="stat-value">{fmtShort(52100000)}</div>
            <div className="stat-change up"><ArrowUp size={11}/> +35% so với T2</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="content-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
              <BarChart size={17}/> Doanh thu theo tháng (2025–2026)
            </span>
            <span className="tag">Năm nay</span>
          </div>
          <div className="bar-chart" style={{ height: 160 }}>
            {revenueMonthly.map(r => (
              <div className="bar-item" key={r.month}>
                <div className="bar-value">{fmtShort(r.revenue)}</div>
                <div
                  className={`bar-fill${r.month === 'T3' ? ' highest' : ''}`}
                  style={{ height: `${Math.round((r.revenue / maxRev) * 100)}%` }}
                />
                <div className="bar-label">{r.month}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:10, fontSize:12, color:'var(--text-muted)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <MapPin size={12}/> Tháng hiện tại:&nbsp;<strong style={{color:'var(--text-primary)'}}>52.1M VNĐ</strong>
            </span>
            <span>Cao nhất: <strong style={{color:'var(--text-primary)'}}>82.1M VNĐ (T7)</strong></span>
          </div>
        </div>

        {/* Room Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Home size={17}/> Trạng thái phòng
            </span>
            <Link href="/reservation" className="btn btn-ghost btn-sm">Xem</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {roomStatusItems.map(item => (
              <div key={item.label}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6, color: item.color }}>{item.icon} {item.label}</span>
                  <strong>{item.count}/{item.total}</strong>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${item.cls}`} style={{ width:`${Math.round(item.count/item.total*100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 18 }}>
        {/* By Source */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Globe size={17}/> Nguồn khách tháng này
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {revenueBySource.map(s => (
              <div key={s.source}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span>{s.source}</span>
                  <span>{fmtShort(s.amount)} <strong style={{ color:'var(--text-primary)' }}>({s.percent}%)</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${s.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Clock size={17}/> Hoạt động gần đây
            </span>
          </div>
          <div className="activity-list">
            {activityLog.slice(0, 5).map(l => (
              <div className="activity-item" key={l.id}>
                <div className="activity-dot" style={{ background: logColor[l.type] }} />
                <div>
                  <div className="activity-text">{l.action}</div>
                  <div className="activity-meta">{l.user} · {l.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Zap size={17}/> Truy cập nhanh
          </span>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Link href="/frontdesk"    className="btn btn-primary"><BellRing size={15}/> Check-in / Check-out</Link>
          <Link href="/reservation"  className="btn btn-dark"><Calendar size={15}/> Tạo đặt phòng</Link>
          <Link href="/housekeeping" className="btn btn-ghost"><Sparkles size={15}/> Cập nhật phòng</Link>
          <Link href="/pos"          className="btn btn-ghost"><ShoppingCart size={15}/> Thêm dịch vụ</Link>
          <Link href="/reports"      className="btn btn-ghost"><TrendingUp size={15}/> Xem báo cáo</Link>
        </div>
      </div>
    </>
  );
}
