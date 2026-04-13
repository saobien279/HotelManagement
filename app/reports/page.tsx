'use client';

import { useState, useMemo } from 'react';
import { useHotel } from '@/context/HotelContext';
import { revenueMonthly, revenueBySource } from '@/context/HotelContext';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort, occColor, calcADR, calcRevPAR } from '@/lib/utils';
import { roomTypes } from '@/context/HotelContext';
import {
  TrendingUp, TrendingDown, Coins, Calendar, BarChart2,
  Download, FileText, ArrowUp, ArrowDown, Minus,
  Building, Award, Users, CreditCard, DollarSign,
  ChevronUp, ChevronDown,
} from 'lucide-react';

/* ─── Static Finance Data ─────────────────────── */
const transactions = [
  { type:'in',  desc:'Doanh thu phòng – T3/2026',    amount:52100000, date:'2026-03-01', cat:'Phòng' },
  { type:'in',  desc:'Doanh thu dịch vụ – T3/2026',  amount:6252000,  date:'2026-03-01', cat:'Dịch vụ' },
  { type:'in',  desc:'Công nợ Công ty Lữ hành XYZ',  amount:12000000, date:'2026-03-12', cat:'Công nợ' },
  { type:'out', desc:'Chi phí nhân sự – T3/2026',     amount:28000000, date:'2026-03-05', cat:'Nhân sự' },
  { type:'out', desc:'Hoa hồng OTA – T3/2026',       amount:4500000,  date:'2026-03-05', cat:'OTA' },
  { type:'out', desc:'Điện nước – T3/2026',           amount:8200000,  date:'2026-03-07', cat:'Utilities' },
  { type:'out', desc:'Nhập vật tư phòng – T3/2026',  amount:3100000,  date:'2026-03-10', cat:'Kho vật tư' },
  { type:'out', desc:'Chi phí marketing – T3/2026',   amount:2500000,  date:'2026-03-10', cat:'Marketing' },
  { type:'out', desc:'Phí bảo trì thiết bị',          amount:1800000,  date:'2026-03-14', cat:'Bảo trì' },
];

/* ─── KPI delta helper ─────────────────────────── */
const Delta = ({ val, suffix = '' }: { val: number; suffix?: string }) => {
  if (val === 0) return <span style={{ color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Minus size={12}/> Không đổi</span>;
  const up = val > 0;
  return (
    <span style={{ color: up ? 'var(--color-success)' : 'var(--color-danger)', display:'flex', alignItems:'center', gap:3, fontSize:11.5, fontWeight:700 }}>
      {up ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      {up ? '+' : ''}{val}{suffix}
    </span>
  );
};

/* ─── Donut-style percentage ring ─────────────── */
const MiniDonut = ({ pct, color }: { pct: number; color: string }) => {
  const r = 18; const c = 2 * Math.PI * r;
  return (
    <svg width={46} height={46} style={{ flexShrink:0 }}>
      <circle cx={23} cy={23} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
      <circle cx={23} cy={23} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${(pct/100)*c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 23 23)"
        style={{ transition:'stroke-dasharray 0.7s ease' }}
      />
      <text x={23} y={27} textAnchor="middle" fontSize={9} fontWeight={800} fill={color}>{pct}%</text>
    </svg>
  );
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview'|'revenue'|'occupancy'|'finance'>('overview');
  const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month');
  const { rooms, getStats } = useHotel();
  const { toast } = useToast();
  const stats = getStats();

  const TOTAL_ROOMS = 18;
  const DAYS_IN_MONTH = 31; // March

  const maxRev   = Math.max(...revenueMonthly.map(r => r.revenue));
  const totalY   = revenueMonthly.reduce((s,r) => s + r.revenue, 0);
  const avgM     = Math.round(totalY / 12);
  const totalIn  = transactions.filter(t => t.type==='in').reduce((s,t) => s+t.amount, 0);
  const totalOut = transactions.filter(t => t.type==='out').reduce((s,t) => s+t.amount, 0);
  const profit   = totalIn - totalOut;
  const margin   = Math.round((profit / totalIn) * 100);

  // KPI metrics (chuẩn ngành)
  const currentRevenue  = 52100000;
  const prevRevenue     = 38500000;
  const currentOcc      = 78;
  const prevOcc         = 58;
  const adr             = calcADR(currentRevenue, TOTAL_ROOMS * currentOcc / 100 * DAYS_IN_MONTH);
  const revpar          = calcRevPAR(currentRevenue, TOTAL_ROOMS, DAYS_IN_MONTH);
  const trevpar         = calcRevPAR(totalIn, TOTAL_ROOMS, DAYS_IN_MONTH); // Total RevPAR incl services
  const goppar          = calcRevPAR(profit, TOTAL_ROOMS, DAYS_IN_MONTH);

  // Occupancy donut average
  const avgOcc = Math.round(revenueMonthly.reduce((s,r) => s+r.occupancy, 0) / 12);

  // Category expense breakdown
  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type==='out').forEach(t => {
      cats[t.cat] = (cats[t.cat] ?? 0) + t.amount;
    });
    return Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([cat, amount]) => ({
      cat, amount, pct: Math.round(amount / totalOut * 100),
    }));
  }, [totalOut]);

  const catColors: Record<string,string> = {
    'Nhân sự':'#4F46E5','OTA':'#7C3AED','Utilities':'#2563EB',
    'Kho vật tư':'#059669','Marketing':'#D97706','Bảo trì':'#DC2626',
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-title-icon"><TrendingUp size={18}/></span>
            Báo cáo & Thống kê
          </h1>
          <p className="page-subtitle">Dữ liệu kinh doanh · Tháng 3/2026 · Cập nhật: 14/03/2026 14:30</p>
        </div>
        <div className="page-actions">
          {/* Period selector */}
          <div className="tabs" style={{ margin:0 }}>
            {([['month','Tháng'],['quarter','Quý'],['year','Năm']] as const).map(([v,l]) => (
              <button key={v} className={`tab-btn${period===v?' active':''}`} onClick={() => setPeriod(v)} style={{padding:'5px 12px',fontSize:12}}>{l}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('Đang xuất báo cáo Excel...','info')}>
            <Download size={14}/> Xuất Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => toast('Đang gửi lệnh in...','info')}>
            <FileText size={14}/> In báo cáo
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab-btn${activeTab==='overview'?' active':''}`} onClick={() => setActiveTab('overview')}><BarChart2 size={14}/> Tổng quan KPI</button>
        <button className={`tab-btn${activeTab==='revenue'?' active':''}`} onClick={() => setActiveTab('revenue')}><Coins size={14}/> Doanh thu</button>
        <button className={`tab-btn${activeTab==='occupancy'?' active':''}`} onClick={() => setActiveTab('occupancy')}><Building size={14}/> Công suất</button>
        <button className={`tab-btn${activeTab==='finance'?' active':''}`} onClick={() => setActiveTab('finance')}><CreditCard size={14}/> Thu chi</button>
      </div>

      {/* ══════════════════════════════════════
          OVERVIEW TAB – Hotel KPI Dashboard
         ══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Top KPI row */}
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))' }}>
            {/* ADR */}
            <div className="stat-card">
              <div className="stat-icon"><DollarSign size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">ADR (Giá phòng trung bình)</div>
                <div className="stat-value">{fmtShort(adr)}</div>
                <Delta val={12} suffix="%"/><span style={{fontSize:10,color:'var(--text-muted)'}}>so với T2</span>
              </div>
            </div>
            {/* RevPAR */}
            <div className="stat-card">
              <div className="stat-icon info"><TrendingUp size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">RevPAR</div>
                <div className="stat-value">{fmtShort(revpar)}</div>
                <Delta val={20} suffix="%"/>
              </div>
            </div>
            {/* Occupancy */}
            <div className="stat-card">
              <MiniDonut pct={currentOcc} color={occColor(currentOcc)}/>
              <div className="stat-info">
                <div className="stat-label">Công suất buồng phòng</div>
                <div className="stat-value" style={{ color: occColor(currentOcc) }}>{currentOcc}%</div>
                <Delta val={currentOcc - prevOcc} suffix=" điểm %"/>
              </div>
            </div>
            {/* GOPPAR */}
            <div className="stat-card">
              <div className="stat-icon success"><Award size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">GOPPAR (Lợi nhuận/phòng)</div>
                <div className="stat-value">{fmtShort(goppar)}</div>
                <div className="stat-change" style={{ color:'var(--color-success)', fontWeight:600 }}>Margin {margin}%</div>
              </div>
            </div>
          </div>

          {/* Second row */}
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', marginTop:0 }}>
            <div className="stat-card">
              <div className="stat-icon warning"><Calendar size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Doanh thu T3</div>
                <div className="stat-value">{fmtShort(currentRevenue)}</div>
                <Delta val={Math.round((currentRevenue-prevRevenue)/prevRevenue*100)} suffix="%"/>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Users size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">TRevPAR</div>
                <div className="stat-value">{fmtShort(trevpar)}</div>
                <div className="stat-change">Bao gồm dịch vụ</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><Coins size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Lợi nhuận gộp T3</div>
                <div className="stat-value">{fmtShort(profit)}</div>
                <div className="stat-change up">Tỷ suất: {margin}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><TrendingDown size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Tổng chi phí T3</div>
                <div className="stat-value">{fmtShort(totalOut)}</div>
                <div className="stat-change">%Revenue: {Math.round(totalOut/totalIn*100)}%</div>
              </div>
            </div>
          </div>

          {/* 2-column grid */}
          <div className="content-grid" style={{ gridTemplateColumns:'2fr 1fr', marginTop:0 }}>
            {/* Revenue trend */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Xu hướng doanh thu 12 tháng</span>
                <span className="badge badge-confirmed">Tổng: {fmtShort(totalY)}</span>
              </div>
              <div className="bar-chart" style={{ height:160 }}>
                {revenueMonthly.map(r => (
                  <div className="bar-item" key={r.month}>
                    <div className="bar-value">{fmtShort(r.revenue)}</div>
                    <div
                      className={`bar-fill${r.month==='T3'?' highest':r.revenue===maxRev?' highest':''}`}
                      style={{ height:`${Math.round((r.revenue/maxRev)*100)}%` }}
                    />
                    <div className="bar-label">{r.month}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
                <span>Cao nhất: <strong style={{color:'var(--text-primary)'}}>{fmtShort(maxRev)} (T7)</strong></span>
                <span>Thấp nhất: <strong style={{color:'var(--text-primary)'}}>{fmtShort(Math.min(...revenueMonthly.map(r=>r.revenue)))} (T2)</strong></span>
                <span>Trung bình: <strong style={{color:'var(--text-primary)'}}>{fmtShort(avgM)}</strong></span>
              </div>
            </div>

            {/* Source breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Nguồn khách T3</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {revenueBySource.map(s => (
                  <div key={s.source}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                      <span style={{ fontWeight:600 }}>{s.source}</span>
                      <span><strong style={{color:'var(--accent-1)'}}>{s.percent}%</strong></span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${s.percent}%` }}/>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{fmtShort(s.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expense breakdown */}
          <div className="card" style={{ marginTop:16 }}>
            <div className="card-header">
              <span className="card-title">Cơ cấu chi phí T3/2026</span>
              <span className="badge badge-occupied">Tổng chi: {fmtShort(totalOut)}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
              {expenseByCategory.map(e => (
                <div key={e.cat} style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:12, borderLeft:`3px solid ${catColors[e.cat]??'var(--border-strong)'}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:catColors[e.cat]??'var(--text-secondary)', marginBottom:4 }}>{e.cat}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)' }}>{fmtShort(e.amount)}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{e.pct}% tổng chi</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          REVENUE TAB
         ══════════════════════════════════════ */}
      {activeTab === 'revenue' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Doanh thu T3/2026</div>
                <div className="stat-value">{fmtShort(currentRevenue)}</div>
                <Delta val={35} suffix="% vs T2"/>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><TrendingUp size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Tổng năm tài chính</div>
                <div className="stat-value">{fmtShort(totalY)}</div>
                <div className="stat-change">12 tháng gần nhất</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info"><BarChart2 size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Trung bình/tháng</div>
                <div className="stat-value">{fmtShort(avgM)}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning"><Award size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Tháng đỉnh cao</div>
                <div className="stat-value">T7</div>
                <div className="stat-change">{fmtShort(maxRev)}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="content-grid" style={{ gridTemplateColumns:'2fr 1fr' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Doanh thu theo tháng (2025–2026)</span>
                <button className="btn btn-ghost btn-sm">Năm nay</button>
              </div>
              <div className="bar-chart" style={{ height:190 }}>
                {revenueMonthly.map(r => (
                  <div className="bar-item" key={r.month}>
                    <div className="bar-value">{fmtShort(r.revenue)}</div>
                    <div
                      className={`bar-fill${r.month==='T3'?' highest':''}`}
                      style={{ height:`${Math.round((r.revenue/maxRev)*100)}%` }}
                    />
                    <div className="bar-label">{r.month}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Phân bổ nguồn khách</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {revenueBySource.map(s => (
                  <div key={s.source}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                      <span>{s.source}</span>
                      <span style={{ fontWeight:700 }}>{s.percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${s.percent}%` }}/>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtShort(s.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="card" style={{ marginTop:16, padding:0, overflow:'hidden' }}>
            <div className="card-header" style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
              <span className="card-title">Chi tiết doanh thu 12 tháng</span>
              <select className="filter-select" style={{ fontSize:12 }}>
                <option>Năm tài chính 2025–2026</option>
                <option>Năm tài chính 2024–2025</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table className="table striped">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th style={{textAlign:'right'}}>DT phòng</th>
                    <th style={{textAlign:'right'}}>DT dịch vụ (≈12%)</th>
                    <th style={{textAlign:'right'}}>Tổng cộng</th>
                    <th>Công suất</th>
                    <th style={{textAlign:'right'}}>ADR</th>
                    <th style={{textAlign:'right'}}>RevPAR</th>
                    <th>Vs kế hoạch</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueMonthly.map((r, i) => {
                    const svc = Math.round(r.revenue * 0.12);
                    const plan = r.revenue * (0.9 + ((i * 7 + 3) % 11) / 20);
                    const pct  = Math.round((r.revenue / plan) * 100);
                    const roomNightsSold = Math.round(TOTAL_ROOMS * r.occupancy / 100 * 30);
                    const monthAdr  = roomNightsSold > 0 ? Math.round(r.revenue / roomNightsSold) : 0;
                    const monthRevpar = Math.round(r.revenue / (TOTAL_ROOMS * 30));
                    return (
                      <tr key={r.month} style={{ fontWeight: r.month==='T3' ? 700 : undefined }}>
                        <td>
                          <span style={{ fontWeight:700 }}>{r.month}/2026</span>
                          {r.month==='T3' && <span className="badge badge-checkedin badge-sm" style={{marginLeft:6}}>Hiện tại</span>}
                        </td>
                        <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.revenue)}</td>
                        <td style={{ textAlign:'right', color:'var(--color-info)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(svc)}</td>
                        <td style={{ textAlign:'right', fontWeight:800, color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.revenue+svc)}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div className="progress-bar" style={{ width:55, height:6, display:'inline-block' }}>
                              <div
                                className={`progress-fill${r.occupancy>=80?' success':r.occupancy>=60?'':' warning'}`}
                                style={{ width:`${r.occupancy}%` }}
                              />
                            </div>
                            <span style={{ fontWeight:700, color:occColor(r.occupancy), fontVariantNumeric:'tabular-nums' }}>{r.occupancy}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(monthAdr)}</td>
                        <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(monthRevpar)}</td>
                        <td>
                          <span style={{ color:pct>=100?'var(--color-success)':'var(--color-danger)', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}>
                            {pct>=100 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:'var(--accent-light)', fontWeight:800 }}>
                    <td style={{ color:'var(--accent-1)' }}>TỔNG NĂM</td>
                    <td style={{ textAlign:'right', color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(totalY)}</td>
                    <td style={{ textAlign:'right', color:'var(--color-info)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(Math.round(totalY*0.12))}</td>
                    <td style={{ textAlign:'right', color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(Math.round(totalY*1.12))}</td>
                    <td><span style={{ fontWeight:800, color:occColor(avgOcc) }}>{avgOcc}% avg.</span></td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(Math.round(totalY/(TOTAL_ROOMS*365)))}</td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(Math.round(totalY/(TOTAL_ROOMS*365)))}</td>
                    <td>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          OCCUPANCY TAB
         ══════════════════════════════════════ */}
      {activeTab === 'occupancy' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
            <div className="stat-card">
              <MiniDonut pct={stats.occupancy} color={occColor(stats.occupancy)}/>
              <div className="stat-info">
                <div className="stat-label">Công suất hôm nay</div>
                <div className="stat-value" style={{ color:occColor(stats.occupancy) }}>{stats.occupancy}%</div>
                <div className="stat-change">{stats.occupied}/{stats.total} phòng</div>
              </div>
            </div>
            <div className="stat-card">
              <MiniDonut pct={avgOcc} color={occColor(avgOcc)}/>
              <div className="stat-info">
                <div className="stat-label">Trung bình năm</div>
                <div className="stat-value">{avgOcc}%</div>
                <div className="stat-change">12 tháng gần nhất</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning"><Award size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Đỉnh cao nhất</div>
                <div className="stat-value">95%</div>
                <div className="stat-change">Tháng 7/2025</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info"><TrendingUp size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">RevPAR tháng này</div>
                <div className="stat-value">{fmtShort(revpar)}</div>
                <Delta val={20} suffix="% vs T2"/>
              </div>
            </div>
          </div>

          {/* Occupancy chart */}
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-header"><span className="card-title">Tỷ lệ lấp đầy 12 tháng</span></div>
            <div className="bar-chart" style={{ height:170 }}>
              {revenueMonthly.map(r => (
                <div className="bar-item" key={r.month}>
                  <div className="bar-value">{r.occupancy}%</div>
                  <div className={`bar-fill${r.occupancy>=80?' good':r.occupancy>=60?'':' warn'}`}
                    style={{ height:`${r.occupancy}%` }}/>
                  <div className="bar-label">{r.month}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, marginTop:8, fontSize:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:12,height:8,background:'#059669',borderRadius:2 }}/> ≥80% (Tốt)</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:12,height:8,background:'#E5E7EB',borderRadius:2 }}/> 60–79% (Trung bình)</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:12,height:8,background:'#EF4444',borderRadius:2 }}/> &lt;60% (Cần cải thiện)</div>
            </div>
          </div>

          {/* By room type */}
          <div className="card">
            <div className="card-header"><span className="card-title">Công suất theo loại phòng · Tháng 3</span></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {roomTypes.map(rt => {
                const rtRooms  = rooms.filter(r => r.type === rt.id);
                const occCount = rtRooms.filter(r => r.status === 'occupied').length;
                const occ      = rtRooms.length ? Math.round(occCount / rtRooms.length * 100) : 0;
                return (
                  <div key={rt.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr 60px 100px', alignItems:'center', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{rt.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{rtRooms.length} phòng · {fmtShort(rt.basePrice)}/đêm</div>
                    </div>
                    <div className="progress-bar" style={{ height:10 }}>
                      <div className={`progress-fill${occ>=70?' success':occ>=40?'':' danger'}`} style={{ width:`${occ}%` }}/>
                    </div>
                    <div style={{ fontWeight:800, color:occColor(occ), textAlign:'right', fontSize:14 }}>{occ}%</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
                      {occCount}/{rtRooms.length} phòng
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          FINANCE TAB
         ══════════════════════════════════════ */}
      {activeTab === 'finance' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon success"><ArrowDown size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Tổng thu T3</div>
                <div className="stat-value" style={{ fontSize:20 }}>{fmtShort(totalIn)}</div>
                <div className="stat-change up">3 nguồn thu</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><ArrowUp size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Tổng chi T3</div>
                <div className="stat-value" style={{ fontSize:20 }}>{fmtShort(totalOut)}</div>
                <div className="stat-change">{expenseByCategory.length} khoản chi</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><Coins size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Lợi nhuận gộp</div>
                <div className="stat-value" style={{ fontSize:20 }}>{fmtShort(profit)}</div>
                <div className="stat-change up">Margin: {margin}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><BarChart2 size={20}/></div>
              <div className="stat-info">
                <div className="stat-label">Chi/Doanh thu</div>
                <div className="stat-value" style={{ fontSize:20 }}>{Math.round(totalOut/totalIn*100)}%</div>
                <div className="stat-change">Cost ratio</div>
              </div>
            </div>
          </div>

          <div className="content-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
            {/* Expense bar chart */}
            <div className="card">
              <div className="card-header"><span className="card-title">Cơ cấu chi phí</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {expenseByCategory.map(e => (
                  <div key={e.cat}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                      <span style={{ fontWeight:600 }}>{e.cat}</span>
                      <span style={{ display:'flex', gap:10 }}>
                        <span style={{ color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(e.amount)}</span>
                        <strong style={{ color: catColors[e.cat]??'var(--text-primary)', minWidth:32, textAlign:'right' }}>{e.pct}%</strong>
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${e.pct}%`, background: catColors[e.cat]??'var(--accent-1)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Income breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Cơ cấu doanh thu</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {transactions.filter(t => t.type==='in').map(t => {
                  const pct = Math.round(t.amount / totalIn * 100);
                  return (
                    <div key={t.desc}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                        <span style={{ fontWeight:600 }}>{t.cat}</span>
                        <span style={{ display:'flex', gap:10 }}>
                          <span style={{ color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(t.amount)}</span>
                          <strong style={{ color:'var(--color-success)', minWidth:32, textAlign:'right' }}>{pct}%</strong>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill success" style={{ width:`${pct}%` }}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:13 }}>
                  <span>Tổng thu</span>
                  <span style={{ color:'var(--color-success)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(totalIn)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction table */}
          <div className="card" style={{ marginTop:16, padding:0, overflow:'hidden' }}>
            <div className="card-header" style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
              <span className="card-title">Sổ thu chi T3/2026</span>
              <div style={{ display:'flex', gap:8 }}>
                <span className="badge badge-confirmed">Thu: {fmtShort(totalIn)}</span>
                <span className="badge badge-maintenance">Chi: {fmtShort(totalOut)}</span>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table striped">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Mô tả</th>
                    <th>Danh mục</th>
                    <th style={{textAlign:'right'}}>Thu (Có)</th>
                    <th style={{textAlign:'right'}}>Chi (Nợ)</th>
                    <th style={{textAlign:'right'}}>Số dư</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let balance = 0;
                    return transactions.map((t, i) => {
                      balance += t.type==='in' ? t.amount : -t.amount;
                      return (
                        <tr key={i}>
                          <td style={{ color:'var(--text-muted)', fontSize:12, whiteSpace:'nowrap' }}>{t.date.replace(/(\d{4})-(\d{2})-(\d{2})/,'$3/$2/$1')}</td>
                          <td style={{ fontWeight:500 }}>{t.desc}</td>
                          <td>
                            <span className="tag" style={{ borderColor: catColors[t.cat]??'var(--border)', color: catColors[t.cat]??'var(--text-secondary)' }}>
                              {t.cat}
                            </span>
                          </td>
                          <td style={{ textAlign:'right', color:'var(--color-success)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                            {t.type==='in' ? fmtShort(t.amount) : ''}
                          </td>
                          <td style={{ textAlign:'right', color:'var(--color-danger)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                            {t.type==='out' ? fmtShort(t.amount) : ''}
                          </td>
                          <td style={{ textAlign:'right', fontWeight:700, color: balance>=0?'var(--color-success)':'var(--color-danger)', fontVariantNumeric:'tabular-nums' }}>
                            {balance>=0?'+':''}{fmtShort(balance)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr style={{ background:'var(--bg-elevated)', fontWeight:800 }}>
                    <td colSpan={3} style={{ textAlign:'right', color:'var(--text-secondary)', padding:'11px 14px' }}>TỔNG CỘNG</td>
                    <td style={{ textAlign:'right', color:'var(--color-success)', fontVariantNumeric:'tabular-nums', padding:'11px 14px' }}>{fmtShort(totalIn)}</td>
                    <td style={{ textAlign:'right', color:'var(--color-danger)', fontVariantNumeric:'tabular-nums', padding:'11px 14px' }}>{fmtShort(totalOut)}</td>
                    <td style={{ textAlign:'right', color:'var(--color-success)', fontVariantNumeric:'tabular-nums', padding:'11px 14px' }}>+{fmtShort(profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
