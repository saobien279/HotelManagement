'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { roomTypes } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort, fmtDate, statusLabel, roomTypeLabel, statusBadgeClass, calcNights, TODAY } from '@/lib/utils';
import { BellRing, Inbox, Send, Home, Users, Plus, Phone, StickyNote, Loader2 } from 'lucide-react';

// ── Reusable Avatar ──────────────────────────
function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      width:44, height:44, borderRadius:'50%', background:color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:800, fontSize:18, color:'white', flexShrink:0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'checkin'|'checkout'|'staying'|'groups'>('checkin');
  const { reservations, services, updateReservationStatus, addReservation, loading } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const checkInPending  = reservations.filter(r => (r.status==='confirmed'||r.status==='deposit') && r.checkIn <= TODAY);
  const checkOutPending = reservations.filter(r => r.status==='checkedin' && r.checkOut <= TODAY);
  const staying         = reservations.filter(r => r.status==='checkedin');

  // ── Check-in modal ────────────────────────
  const doCheckIn = (id: string) => {
    const r = reservations.find(x => x.id === id)!;
    openModal('Xác nhận Check-in', (
      <div>
        {/* Guest summary */}
        <div style={{ background:'var(--color-success-bg)', borderRadius:'var(--radius-md)', padding:14, marginBottom:16, border:'1px solid var(--color-success-border)' }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{r.guestName}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
            <span>📱 {r.phone}</span>
            <span>🛏️ Phòng {r.roomId ?? '(chưa phân)'} · {roomTypeLabel[r.roomType]}</span>
            <span>📅 {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} ({calcNights(r.checkIn, r.checkOut)} đêm)</span>
            <span>👥 {r.adults}NL{r.children > 0 ? `, ${r.children}TE` : ''}</span>
          </div>
          {r.note && <div style={{ fontSize:12, marginTop:6, color:'var(--color-info)', fontStyle:'italic' }}>📝 {r.note}</div>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CCCD / Hộ chiếu <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="ci_cccd" type="text" className="form-input" placeholder="079 xxx xxx xxx"/>
          </div>
          <div className="form-group">
            <label className="form-label">Phương thức thanh toán cọc</label>
            <select id="ci_payment" className="form-select">
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="card">Thẻ tín dụng</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Số tiền đặt cọc (VND)</label>
          <input id="ci_deposit" type="number" className="form-input" placeholder="0" defaultValue={Math.round(r.total / 2)}/>
        </div>
      </div>
    ), [
      { label: '✓ Xác nhận Check-in', cls: 'btn-primary', onClick: async () => {
        const cccd = (document.getElementById('ci_cccd') as HTMLInputElement)?.value?.trim();
        if (!cccd) { toast('Vui lòng nhập số CCCD / Hộ chiếu', 'warn'); return; }
        try {
          await updateReservationStatus(id, 'checkedin');
          closeModal();
          toast(`✅ Check-in thành công! Chào mừng ${r.guestName}`, 'success');
        } catch (e: any) {
          toast(e.message ?? 'Lỗi check-in', 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  // ── Check-out modal ────────────────────────
  const doCheckOut = (id: string) => {
    const r = reservations.find(x => x.id === id)!;
    const svcList  = services.filter(s => s.bookingId === id);
    const svcTotal = svcList.reduce((s, x) => s + x.price * x.qty, 0);
    const grand    = r.total + svcTotal;

    openModal('Check-out & Thanh toán', (
      <div>
        {/* Bill summary */}
        <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:16, marginBottom:16, border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>{r.guestName} · Phòng {r.roomId}</div>
          <div className="info-row"><span className="info-key">Tiền phòng ({calcNights(r.checkIn, r.checkOut)} đêm)</span><span className="info-value">{fmtShort(r.total)}</span></div>
          {svcList.map(s => (
            <div key={s.id} className="info-row">
              <span className="info-key">{s.name} ×{s.qty} ({s.unit})</span>
              <span className="info-value">{fmtShort(s.price * s.qty)}</span>
            </div>
          ))}
          <hr className="divider"/>
          <div className="info-row">
            <span className="info-key" style={{ fontWeight:800, fontSize:14 }}>TỔNG THANH TOÁN</span>
            <span className="info-value" style={{ fontWeight:900, fontSize:20, color:'var(--accent-1)' }}>{fmtShort(grand)}</span>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phương thức thanh toán</label>
            <select id="co_payment" className="form-select">
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="card">Thẻ tín dụng / Quẹt thẻ</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Đánh giá khách</label>
            <select id="co_rating" className="form-select">
              <option value="">Không đánh giá</option>
              <option value="5">⭐⭐⭐⭐⭐ Xuất sắc</option>
              <option value="4">⭐⭐⭐⭐ Tốt</option>
              <option value="3">⭐⭐⭐ Bình thường</option>
              <option value="2">⭐⭐ Cần cải thiện</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Ghi chú cho nhân viên buồng phòng</label>
          <textarea id="co_note" className="form-textarea" style={{ minHeight:60 }} placeholder="Phòng cần dọn dẹp kỹ, tình trạng đặc biệt..."/>
        </div>
      </div>
    ), [
      { label: '💳 Hoàn tất & Thanh toán', cls: 'btn-primary', onClick: async () => {
        try {
          await updateReservationStatus(id, 'checkedout');
          closeModal();
          toast(`✅ Check-out hoàn tất. Cảm ơn ${r.guestName}!`, 'success');
        } catch (e: any) {
          toast(e.message ?? 'Lỗi check-out', 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  // ── Invoice modal ──────────────────────────
  const viewInvoice = (id: string) => {
    const r = reservations.find(x => x.id === id)!;
    const svcList  = services.filter(s => s.bookingId === id);
    const svcTotal = svcList.reduce((s, x) => s + x.price * x.qty, 0);
    const nights   = calcNights(r.checkIn, r.checkOut);
    const rt       = roomTypeLabel[r.roomType];

    openModal(`Hóa đơn – ${r.id}`, (
      <div>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:16, paddingBottom:14, borderBottom:'2px dashed var(--border)' }}>
          <div style={{ fontWeight:900, fontSize:18, letterSpacing:-0.5 }}>🏨 HOTEL OS</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Hóa đơn thanh toán</div>
        </div>
        {/* Guest block */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:15 }}>{r.guestName}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.phone} · Phòng {r.roomId} ({rt})</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {nights} đêm</div>
        </div>
        {/* Itemized */}
        <div className="info-row">
          <span className="info-key">Phòng {r.roomId} × {nights} đêm</span>
          <span className="info-value" style={{ fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.total)}</span>
        </div>
        {svcList.map(s => (
          <div key={s.id} className="info-row">
            <span className="info-key">{s.name} ×{s.qty} {s.unit}</span>
            <span className="info-value" style={{ fontVariantNumeric:'tabular-nums' }}>{fmtShort(s.price * s.qty)}</span>
          </div>
        ))}
        <hr className="divider"/>
        <div className="info-row">
          <span className="info-key" style={{ fontWeight:800 }}>TỔNG CỘNG</span>
          <span className="info-value strong" style={{ fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.total + svcTotal)}</span>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:'var(--text-muted)', textAlign:'center' }}>
          Cảm ơn quý khách đã lựa chọn dịch vụ của chúng tôi!
        </div>
      </div>
    ), [
      { label: '🖨️ In hóa đơn', cls: 'btn-primary', onClick: () => { window.print(); closeModal(); }},
      { label: 'Đóng', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  // ── Walk-in modal ──────────────────────────
  const openWalkIn = () => {
    openModal('Walk-in – Nhận phòng trực tiếp', (
      <div>
        <div style={{ background:'var(--color-info-bg)', borderRadius:'var(--radius-md)', padding:10, marginBottom:14, fontSize:12, color:'var(--color-info)', border:'1px solid var(--color-info-border)' }}>
          Walk-in: khách đến trực tiếp không đặt trước. Phòng sẽ chuyển sang "Đang có khách" ngay lập tức.
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Họ tên <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="wi_name" type="text" className="form-input" placeholder="Nguyễn Văn A"/>
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="wi_phone" type="tel" className="form-input" placeholder="09xxxxxxxx"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CCCD / Hộ chiếu <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="wi_cccd" type="text" className="form-input" placeholder="079 xxx xxx xxx"/>
          </div>
          <div className="form-group">
            <label className="form-label">Loại phòng</label>
            <select id="wi_type" className="form-select">
              {roomTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id}) – {fmtShort(t.basePrice)}/đêm</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Số đêm</label>
            <input id="wi_nights" type="number" className="form-input" defaultValue={1} min={1}/>
          </div>
          <div className="form-group">
            <label className="form-label">Phương thức thanh toán</label>
            <select id="wi_pay" className="form-select">
              <option>Tiền mặt</option>
              <option>Chuyển khoản</option>
              <option>Thẻ tín dụng</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Ghi chú</label>
          <textarea id="wi_note" className="form-textarea" style={{minHeight:55}} placeholder="Yêu cầu đặc biệt..."/>
        </div>
      </div>
    ), [
      { label: '🔑 Nhận phòng ngay', cls: 'btn-primary', onClick: async () => {
        const name  = (document.getElementById('wi_name') as HTMLInputElement)?.value?.trim();
        const phone = (document.getElementById('wi_phone') as HTMLInputElement)?.value?.trim();
        const cccd  = (document.getElementById('wi_cccd') as HTMLInputElement)?.value?.trim();
        if (!name || !phone || !cccd) { toast('Vui lòng điền đầy đủ thông tin bắt buộc *', 'warn'); return; }
        const typeId = (document.getElementById('wi_type') as HTMLSelectElement)?.value as any;
        const nights = +(document.getElementById('wi_nights') as HTMLInputElement)?.value || 1;
        const note   = (document.getElementById('wi_note') as HTMLTextAreaElement)?.value || '';
        const rt     = roomTypes.find(t => t.id === typeId)!;
        const checkIn  = TODAY;
        const checkOut = new Date(new Date(TODAY).getTime() + nights * 86400000).toISOString().slice(0, 10);
        try {
          await addReservation({
            guestName: name, phone, roomId: null, roomType: typeId,
            checkIn, checkOut, adults: 1, children: 0,
            status: 'checkedin', source: 'direct', note,
            total: rt.basePrice * nights,
          });
          closeModal();
          toast(`✅ Walk-in thành công! ${name} – ${nights} đêm`, 'success');
        } catch (e: any) {
          toast(e.message ?? 'Lỗi hệ thống', 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'var(--text-muted)' }}>
        <Loader2 size={22} style={{ animation:'spin 1s linear infinite' }}/> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-title-icon"><BellRing size={18}/></span>
            Tiền sảnh (Front Desk)
          </h1>
          <p className="page-subtitle">Quản lý nhận phòng, trả phòng và hóa đơn khách</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openWalkIn}><Plus size={15}/> Walk-in</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
        <div className="stat-card">
          <div className="stat-icon info"><Inbox size={22}/></div>
          <div className="stat-info"><div className="stat-label">Chờ Check-in</div><div className="stat-value">{checkInPending.length}</div><div className="stat-change">Cần xử lý hôm nay</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Send size={22}/></div>
          <div className="stat-info"><div className="stat-label">Chờ Check-out</div><div className="stat-value">{checkOutPending.length}</div><div className="stat-change">Cần thanh toán hôm nay</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><Home size={22}/></div>
          <div className="stat-info"><div className="stat-label">Đang ở</div><div className="stat-value">{staying.length}</div><div className="stat-change">Khách trong khách sạn</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${activeTab==='checkin'?' active':''}`} onClick={() => setActiveTab('checkin')}>
          <Inbox size={14}/> Check-in
          {checkInPending.length > 0 && <span className="nav-badge" style={{background:'var(--color-danger)',fontSize:9,padding:'1px 6px'}}>{checkInPending.length}</span>}
        </button>
        <button className={`tab-btn${activeTab==='checkout'?' active':''}`} onClick={() => setActiveTab('checkout')}>
          <Send size={14}/> Check-out
          {checkOutPending.length > 0 && <span className="nav-badge" style={{background:'var(--color-warning)',fontSize:9,padding:'1px 6px'}}>{checkOutPending.length}</span>}
        </button>
        <button className={`tab-btn${activeTab==='staying'?' active':''}`} onClick={() => setActiveTab('staying')}>
          <Home size={14}/> Đang ở ({staying.length})
        </button>
        <button className={`tab-btn${activeTab==='groups'?' active':''}`} onClick={() => setActiveTab('groups')}>
          <Users size={14}/> Khách đoàn
        </button>
      </div>

      {/* ── CHECK-IN TAB ── */}
      {activeTab === 'checkin' && (
        checkInPending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Inbox size={40}/></div>
            <h3>Không có khách chờ check-in</h3>
            <p>Tất cả khách đặt phòng hôm nay đã được nhận phòng</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {checkInPending.map(r => (
              <div key={r.id} className="card" style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px' }}>
                <Avatar name={r.guestName} color="linear-gradient(135deg,#10b981,#059669)"/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{r.guestName}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:10, flexWrap:'wrap', marginTop:3 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:3 }}><Phone size={11}/> {r.phone}</span>
                    <span>👥 {r.adults}NL{r.children?`, ${r.children}TE`:''}</span>
                  </div>
                  {r.note && <div style={{ fontSize:11, color:'var(--color-info)', marginTop:3, display:'flex', alignItems:'center', gap:4 }}><StickyNote size={11}/> {r.note}</div>}
                </div>
                <div style={{ textAlign:'center', flexShrink:0, minWidth:70 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Phòng</div>
                  <div style={{ fontSize:22, fontWeight:900, color:'var(--accent-1)', lineHeight:1 }}>{r.roomId ?? '—'}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{roomTypeLabel[r.roomType]}</div>
                </div>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Check-in</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{fmtDate(r.checkIn)}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>→ {fmtDate(r.checkOut)}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--accent-1)' }}>{calcNights(r.checkIn, r.checkOut)} đêm</div>
                </div>
                <span className={`badge ${statusBadgeClass(r.status)}`}>{statusLabel[r.status]}</span>
                <button className="btn btn-success btn-sm" onClick={() => doCheckIn(r.id)}>Check-in</button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── CHECK-OUT TAB ── */}
      {activeTab === 'checkout' && (
        checkOutPending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Send size={40}/></div>
            <h3>Không có khách cần check-out</h3>
            <p>Không có check-out nào quá hạn hôm nay</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {checkOutPending.map(r => {
              const svcList  = services.filter(s => s.bookingId === r.id);
              const svcTotal = svcList.reduce((s, x) => s + x.price * x.qty, 0);
              const grand    = r.total + svcTotal;
              return (
                <div key={r.id} className="card" style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px' }}>
                  <Avatar name={r.guestName} color="linear-gradient(135deg,#f59e0b,#d97706)"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{r.guestName}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.id} · Phòng {r.roomId} ({roomTypeLabel[r.roomType]})</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {calcNights(r.checkIn, r.checkOut)} đêm</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Tiền phòng</div>
                    <div style={{ fontSize:13 }}>{fmtShort(r.total)}</div>
                    {svcTotal > 0 && <div style={{ fontSize:11, color:'var(--color-info)' }}>+ Dịch vụ: {fmtShort(svcTotal)}</div>}
                    <div style={{ fontSize:17, fontWeight:900, color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(grand)}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => doCheckOut(r.id)}>Check-out</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => viewInvoice(r.id)}>Hóa đơn</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── STAYING TAB ── */}
      {activeTab === 'staying' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrapper">
            <table className="table striped">
              <thead>
                <tr>
                  <th>Mã ĐP</th>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Check-in</th>
                  <th>Check-out còn</th>
                  <th>Số khách</th>
                  <th style={{textAlign:'right'}}>Tổng tiền</th>
                  <th>Ghi chú</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staying.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Không có khách đang ở</td></tr>
                ) : staying.map(r => {
                  const daysLeft = calcNights(TODAY, r.checkOut);
                  return (
                    <tr key={r.id}>
                      <td><strong style={{ color:'var(--accent-1)', fontFamily:'monospace' }}>{r.id}</strong></td>
                      <td>
                        <div style={{ fontWeight:700 }}>{r.guestName}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Phone size={10}/> {r.phone}</div>
                      </td>
                      <td>
                        <strong style={{ fontSize:15 }}>P.{r.roomId}</strong>
                        <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:5 }}>({roomTypeLabel[r.roomType]})</span>
                      </td>
                      <td style={{ fontSize:12 }}>{fmtDate(r.checkIn)}</td>
                      <td>
                        <span style={{ fontWeight:700, color: daysLeft <= 1 ? 'var(--color-danger)' : daysLeft <= 2 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {daysLeft > 0 ? `Còn ${daysLeft} đêm` : 'Đến hạn'}
                        </span>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtDate(r.checkOut)}</div>
                      </td>
                      <td>{r.adults + r.children} người</td>
                      <td style={{ textAlign:'right', fontWeight:700, color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.total)}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:140 }}>{r.note || '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => viewInvoice(r.id)}>Hóa đơn</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GROUPS TAB ── */}
      {activeTab === 'groups' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quản lý khách đoàn</span>
            <button className="btn btn-primary btn-sm" onClick={() => toast('Tính năng đang phát triển trong phiên bản tiếp theo', 'info')}>
              <Plus size={14}/> Tạo đoàn mới
            </button>
          </div>
          <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:20, border:'1px solid var(--border)', marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>TOUR-001 · Công ty Du lịch XYZ</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>8 phòng · Check-in: 14/03/2026 · Check-out: 17/03/2026 · 28 khách</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(70px,1fr))', gap:8, marginBottom:16 }}>
              {['101','102','201','202','301','302','303','304'].map((r, i) => (
                <div key={r} style={{ background:'var(--bg-card)', borderRadius:'var(--radius-md)', padding:10, textAlign:'center', border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:700 }}>P.{r}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)' }}>Khách {i*4+1}–{i*4+4}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="btn btn-success btn-sm" onClick={() => toast('Check-in cả đoàn thành công!', 'success')}>✓ Check-in cả đoàn</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Đang gộp hóa đơn...', 'info')}>Gộp hóa đơn</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Đang chia hóa đơn...', 'info')}>Chia hóa đơn</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Đang xuất danh sách khách...', 'info')}>Xuất DS khách</button>
            </div>
          </div>
          <div className="alert alert-info" style={{ fontSize:12 }}>
            <strong>💡 Tính năng khách đoàn đầy đủ</strong> bao gồm: quản lý danh sách khách, phân phòng tự động, gộp/chia hóa đơn, và báo cáo đoàn — sẽ ra mắt trong phiên bản v2.0.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
