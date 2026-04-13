'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { roomTypes } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import {
  fmtShort, fmtDate, statusLabel, roomTypeLabel,
  statusBadgeClass, sourceLabel, sourceCls, calcNights, TODAY,
} from '@/lib/utils';
import {
  Calendar, LayoutGrid, List, Plus, Building2, Globe2, Search,
  Users, Bed, Wrench, Sparkles, CheckCircle2, CalendarX,
  Phone, MessageSquare, CreditCard, StickyNote,
} from 'lucide-react';

export default function ReservationPage() {
  const [activeTab, setActiveTab]   = useState<'map' | 'list'>('map');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [searchQ, setSearchQ]           = useState('');
  const [listStatus, setListStatus]     = useState('all');
  const [listSource, setListSource]     = useState('all');

  const { rooms, reservations, updateRoomStatus, updateReservationStatus, addReservation } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const floors = [...new Set(rooms.map(r => r.floor))].sort();

  const statusOptions = [
    { val: 'all',         label: 'Tất cả' },
    { val: 'vacant',      label: '● Trống' },
    { val: 'occupied',    label: '● Có khách' },
    { val: 'cleaning',    label: '● Đang dọn' },
    { val: 'maintenance', label: '● Bảo trì' },
    { val: 'reserved',    label: '● Đã đặt' },
  ];

  const typeOptions = [
    { val: 'all', label: 'Tất cả loại phòng' },
    ...roomTypes.map(t => ({ val: t.id, label: `${t.id} – ${t.name}` })),
  ];

  const filteredReservations = reservations.filter(r => {
    const q = searchQ.toLowerCase();
    const matchSearch = !q || r.guestName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.phone?.includes(q);
    const matchStatus = listStatus === 'all' || r.status === listStatus;
    const matchSource = listSource === 'all' || r.source === listSource;
    return matchSearch && matchStatus && matchSource;
  });

  // ── Summary counts ──────────────────────────────
  const countByStatus = (s: string) => rooms.filter(r => r.status === s).length;

  // ── Open new booking modal ──────────────────────
  const openNewBooking = () => {
    const form = (
      <div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Họ tên khách <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="nb_name" type="text" className="form-input" placeholder="Nguyễn Văn A"/>
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="nb_phone" type="tel" className="form-input" placeholder="09xxxxxxxx"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CCCD / Hộ chiếu</label>
            <input id="nb_cccd" type="text" className="form-input" placeholder="079 xxx xxx xxx"/>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="nb_email" type="email" className="form-input" placeholder="email@example.com"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Loại phòng <span style={{color:'var(--color-danger)'}}>*</span></label>
            <select id="nb_type" className="form-select">
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id}) – {fmtShort(t.basePrice)}/đêm</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nguồn khách <span style={{color:'var(--color-danger)'}}>*</span></label>
            <select id="nb_source" className="form-select">
              <option value="direct">Trực tiếp</option>
              <option value="booking">Booking.com</option>
              <option value="agoda">Agoda</option>
              <option value="expedia">Expedia</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ngày đến <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="nb_checkin" type="date" className="form-input" defaultValue={TODAY}/>
          </div>
          <div className="form-group">
            <label className="form-label">Ngày đi <span style={{color:'var(--color-danger)'}}>*</span></label>
            <input id="nb_checkout" type="date" className="form-input" defaultValue="2026-03-15"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Người lớn</label>
            <input id="nb_adults" type="number" className="form-input" defaultValue={2} min={1} max={6}/>
          </div>
          <div className="form-group">
            <label className="form-label">Trẻ em</label>
            <input id="nb_children" type="number" className="form-input" defaultValue={0} min={0} max={4}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Yêu cầu đặc biệt</label>
          <textarea id="nb_note" className="form-textarea" placeholder="Phòng tầng cao, giường đôi, không hút thuốc..."/>
        </div>
      </div>
    );
    openModal('Tạo đặt phòng mới', form, [
      { label: 'Xác nhận & Lưu', cls: 'btn-primary', onClick: () => {
        const name  = (document.getElementById('nb_name') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('nb_phone') as HTMLInputElement).value.trim();
        if (!name || !phone) { toast('Vui lòng nhập đầy đủ họ tên và SĐT', 'warn'); return; }
        const type     = (document.getElementById('nb_type') as HTMLSelectElement).value as any;
        const checkIn  = (document.getElementById('nb_checkin') as HTMLInputElement).value;
        const checkOut = (document.getElementById('nb_checkout') as HTMLInputElement).value;
        if (checkOut <= checkIn) { toast('Ngày đi phải sau ngày đến', 'warn'); return; }
        const rt     = roomTypes.find(t => t.id === type)!;
        const nights = calcNights(checkIn, checkOut);
        addReservation({
          guestName: name, phone, roomId: null, roomType: type, checkIn, checkOut,
          adults:   +(document.getElementById('nb_adults') as HTMLInputElement).value,
          children: +(document.getElementById('nb_children') as HTMLInputElement).value,
          status:   'confirmed',
          source:   (document.getElementById('nb_source') as HTMLSelectElement).value as any,
          note:     (document.getElementById('nb_note') as HTMLTextAreaElement).value,
          total:    rt.basePrice * nights,
        });
        closeModal();
        toast(`Đã tạo đặt phòng cho ${name} (${nights} đêm)`, 'success');
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  // ── Open room detail modal ──────────────────────
  const openRoomDetail = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)!;
    const rt   = roomTypes.find(t => t.id === room.type)!;
    const res  = reservations.find(r => r.roomId === roomId && ['checkedin','confirmed','deposit'].includes(r.status));
    const nights = res ? calcNights(res.checkIn, res.checkOut) : 0;

    openModal(`Phòng ${room.id} – ${rt.name}`, (
      <div>
        {/* Room info */}
        <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:14, marginBottom:16, display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Thông tin phòng</div>
            <div className="info-row"><span className="info-key">Loại phòng</span><span className="info-value">{rt.name}</span></div>
            <div className="info-row"><span className="info-key">Tầng</span><span className="info-value">Tầng {room.floor}</span></div>
            <div className="info-row"><span className="info-key">Sức chứa</span><span className="info-value">{rt.capacity} khách</span></div>
            <div className="info-row">
              <span className="info-key">Trạng thái</span>
              <span className="info-value"><span className={`badge ${statusBadgeClass(room.status)}`}>{statusLabel[room.status]}</span></span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Giá niêm yết</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--accent-1)' }}>{fmtShort(rt.basePrice)}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>/đêm</div>
          </div>
        </div>

        {/* Guest info if occupied */}
        {res && (
          <div style={{ background:'var(--color-info-bg)', borderRadius:'var(--radius-md)', padding:14, marginBottom:16, border:'1px solid var(--color-info-border)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--color-info)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Khách đang ở</div>
            <div className="info-row"><span className="info-key">Họ tên</span><span className="info-value" style={{fontWeight:700}}>{res.guestName}</span></div>
            <div className="info-row"><span className="info-key">Mã đặt phòng</span><span className="info-value">{res.id}</span></div>
            <div className="info-row"><span className="info-key">Check-in</span><span className="info-value">{fmtDate(res.checkIn)}</span></div>
            <div className="info-row"><span className="info-key">Check-out</span><span className="info-value">{fmtDate(res.checkOut)} ({nights} đêm)</span></div>
            <div className="info-row"><span className="info-key">Tổng tiền phòng</span><span className="info-value" style={{color:'var(--accent-1)',fontWeight:800}}>{fmtShort(res.total)}</span></div>
            {res.note && <div className="info-row"><span className="info-key">Ghi chú</span><span className="info-value" style={{color:'var(--text-muted)'}}>{res.note}</span></div>}
          </div>
        )}

        {/* Status update */}
        <div className="form-group">
          <label className="form-label">Cập nhật trạng thái phòng</label>
          <select className="form-select" id="roomStatusSel" defaultValue={room.status}>
            <option value="vacant">Phòng trống – sẵn sàng</option>
            <option value="occupied">Đang có khách</option>
            <option value="cleaning">Đang dọn dẹp</option>
            <option value="maintenance">Bảo trì / Sửa chữa</option>
            <option value="reserved">Đã đặt trước</option>
          </select>
        </div>
      </div>
    ), [
      { label: 'Lưu trạng thái', cls: 'btn-primary', onClick: () => {
        const val = (document.getElementById('roomStatusSel') as HTMLSelectElement).value as any;
        updateRoomStatus(roomId, val);
        closeModal();
        toast(`Phòng ${roomId}: ${statusLabel[val]}`, 'success');
      }},
      { label: 'Đóng', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  // Legend counts
  const legendData = [
    { status:'vacant',      label:'Trống',     color:'var(--color-success)', count: countByStatus('vacant') },
    { status:'occupied',    label:'Có khách',   color:'var(--accent-1)',      count: countByStatus('occupied') },
    { status:'reserved',    label:'Đã đặt',     color:'var(--color-info)',    count: countByStatus('reserved') },
    { status:'cleaning',    label:'Đang dọn',   color:'var(--color-warning)', count: countByStatus('cleaning') },
    { status:'maintenance', label:'Bảo trì',    color:'var(--color-danger)',  count: countByStatus('maintenance') },
  ];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-title-icon"><Calendar size={18}/></span>
            Đặt phòng & Sơ đồ phòng
          </h1>
          <p className="page-subtitle">Quản lý tình trạng phòng và đơn đặt phòng theo thời gian thực</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNewBooking}><Plus size={15}/> Đặt phòng mới</button>
        </div>
      </div>

      {/* Legend Summary */}
      <div className="legend">
        {legendData.map(l => (
          <div className="legend-item" key={l.status}
            style={{ cursor:'pointer', padding:'4px 8px', borderRadius:'var(--radius-sm)', background: filterStatus===l.status ? 'var(--bg-hover)' : '' }}
            onClick={() => setFilterStatus(filterStatus === l.status ? 'all' : l.status)}>
            <div className="legend-dot" style={{ background: l.color }}/>
            <span style={{ fontWeight: filterStatus===l.status ? 700 : 500 }}>{l.label}</span>
            <span style={{ fontWeight:700, color: l.color, fontSize:13, marginLeft:2 }}>{l.count}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
          Tổng: <strong style={{ color:'var(--text-primary)' }}>{rooms.length} phòng</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${activeTab==='map'?' active':''}`} onClick={() => setActiveTab('map')}>
          <LayoutGrid size={14}/> Sơ đồ phòng
        </button>
        <button className={`tab-btn${activeTab==='list'?' active':''}`} onClick={() => setActiveTab('list')}>
          <List size={14}/> Danh sách đặt phòng
          <span className="nav-badge accent" style={{background:'var(--accent-1)',fontSize:9,padding:'1px 6px'}}>
            {reservations.filter(r => !['cancelled','checkedout'].includes(r.status)).length}
          </span>
        </button>
      </div>

      {/* ── MAP TAB ── */}
      {activeTab === 'map' && (
        <div>
          <div className="bento-filters-bar">
            <div className="bento-filter-group">
              {statusOptions.map(o => (
                <button
                  key={o.val}
                  className={`bento-badge${filterStatus===o.val?' active':''}`}
                  onClick={() => setFilterStatus(o.val)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="bento-filter-group">
              {typeOptions.map(o => (
                <button
                  key={o.val}
                  className={`bento-badge${filterType===o.val?' active':''}`}
                  onClick={() => setFilterType(o.val)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {floors.map(floor => {
            const floorRooms = rooms.filter(r =>
              r.floor === floor &&
              (filterStatus === 'all' || r.status === filterStatus) &&
              (filterType === 'all' || r.type === filterType)
            );
            if (!floorRooms.length) return null;
            return (
              <div key={floor}>
                <div className="floor-label">Tầng {floor}</div>
                <div className="room-grid-bento">
                  {floorRooms.map(room => {
                    const rt  = roomTypes.find(t => t.id === room.type)!;
                    const res = reservations.find(r => r.roomId === room.id && r.status === 'checkedin');
                    // nights elapsed since check-in
                    const dayStay = res
                      ? Math.max(0, Math.round((new Date(TODAY).getTime() - new Date(res.checkIn).getTime()) / 86400000))
                      : 0;
                    const nightsLeft = res ? calcNights(TODAY, res.checkOut) : 0;

                    return (
                      <div key={room.id} className={`room-cell ${room.status}`} onClick={() => openRoomDetail(room.id)}>
                        {/* Top row: Room number + status dot */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <span className="room-number-giant">{room.id}</span>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                            <div className="status-dot"/>
                            <span className="room-type-badge">{rt.name}</span>
                          </div>
                        </div>

                        {/* Middle: contextual info */}
                        <div style={{ padding:'10px 0', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                          {room.status === 'occupied' && res ? (
                            <>
                              <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', lineHeight:1.3 }}>
                                {res.guestName}
                              </div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                                {res.adults + res.children} khách · {res.adults}NL{res.children>0?`, ${res.children}TE`:''}
                              </div>
                              <div style={{ fontSize:11, color:'var(--color-info)', fontWeight:600 }}>
                                N{dayStay} · Còn {nightsLeft} đêm
                              </div>
                            </>
                          ) : room.status === 'reserved' ? (
                            <>
                              {(() => {
                                const upcoming = reservations.find(r => r.roomId === room.id && r.status === 'confirmed');
                                return upcoming ? (
                                  <>
                                    <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>
                                      {upcoming.guestName}
                                    </div>
                                    <div style={{ fontSize:11, color:'var(--color-info)', fontWeight:600 }}>
                                      Check-in: {fmtDate(upcoming.checkIn)}
                                    </div>
                                  </>
                                ) : <div style={{ fontSize:12, color:'var(--text-muted)' }}>Đã đặt trước</div>;
                              })()}
                            </>
                          ) : room.status === 'cleaning' ? (
                            <div style={{ fontSize:12, color:'var(--color-warning)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                              <Sparkles size={13}/> Đang vệ sinh
                            </div>
                          ) : room.status === 'maintenance' ? (
                            <div style={{ fontSize:12, color:'var(--color-danger)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                              <Wrench size={13}/> Đang bảo trì
                            </div>
                          ) : (
                            <div style={{ fontSize:12, color:'var(--color-success)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                              <CheckCircle2 size={13}/> Sẵn sàng nhận
                            </div>
                          )}
                        </div>

                        {/* Bottom: price */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                            {fmtShort(rt.basePrice)}/đêm
                          </span>
                          <span style={{ fontSize:10, color:'var(--text-placeholder)', fontFamily:'monospace' }}>
                            T{room.floor}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === 'list' && (
        <div>
          <div className="filter-bar">
            <div className="filter-input-wrapper">
              <span className="filter-icon"><Search size={14}/></span>
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên khách, mã ĐP, số điện thoại..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </div>
            <select className="filter-select" value={listStatus} onChange={e => setListStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="deposit">Đã đặt cọc</option>
              <option value="checkedin">Đang ở</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="checkedout">Đã trả phòng</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select className="filter-select" value={listSource} onChange={e => setListSource(e.target.value)}>
              <option value="all">Tất cả nguồn</option>
              <option value="direct">Trực tiếp</option>
              <option value="booking">Booking.com</option>
              <option value="agoda">Agoda</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã ĐP</th>
                    <th>Khách hàng</th>
                    <th>Phòng / Loại</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Số đêm</th>
                    <th>Nguồn</th>
                    <th>Trạng thái</th>
                    <th style={{textAlign:'right'}}>Tổng tiền</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <div className="empty-icon"><CalendarX size={36}/></div>
                          <h3>Không có đặt phòng nào</h3>
                          <p>Thử thay đổi bộ lọc hoặc tạo đặt phòng mới</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReservations.map(r => {
                    const nights = calcNights(r.checkIn, r.checkOut);
                    return (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontWeight:800, color:'var(--accent-1)', fontFamily:'monospace', fontSize:12 }}>{r.id}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight:700, fontSize:13 }}>{r.guestName}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                            <Phone size={10}/> {r.phone}
                          </div>
                          {r.note && (
                            <div style={{ fontSize:11, color:'var(--color-info)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                              <StickyNote size={10}/> {r.note.substring(0, 30)}{r.note.length > 30 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          {r.roomId ? (
                            <div>
                              <span style={{ fontWeight:800, fontSize:14 }}>P.{r.roomId}</span>
                              <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:6 }}>
                                {roomTypeLabel[r.roomType]}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span style={{ color:'var(--text-muted)', fontSize:13 }}>Chưa phân phòng</span>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>({roomTypeLabel[r.roomType]})</div>
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize:13 }}>{fmtDate(r.checkIn)}</td>
                        <td style={{ fontSize:13 }}>{fmtDate(r.checkOut)}</td>
                        <td style={{ textAlign:'center', fontWeight:700, color:'var(--text-secondary)' }}>
                          {nights}đ
                        </td>
                        <td>
                          <span className={`source-tag ${sourceCls[r.source] ?? ''}`}>
                            {sourceLabel[r.source] ?? r.source}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass(r.status)}`}>{statusLabel[r.status]}</span>
                        </td>
                        <td style={{ textAlign:'right', fontWeight:800, color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>
                          {fmtShort(r.total)}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            {(r.status==='confirmed'||r.status==='deposit') && (
                              <button className="btn btn-success btn-sm" onClick={() => {
                                updateReservationStatus(r.id, 'checkedin');
                                toast(`Check-in ${r.guestName} – P.${r.roomId ?? '?'}`, 'success');
                              }}>Check-in</button>
                            )}
                            {r.status==='checkedin' && (
                              <button className="btn btn-dark btn-sm" onClick={() => {
                                updateReservationStatus(r.id, 'checkedout');
                                toast(`Check-out ${r.guestName} hoàn tất`, 'success');
                              }}>Check-out</button>
                            )}
                            {!['cancelled','checkedout'].includes(r.status) && (
                              <button className="btn btn-danger btn-sm" onClick={() => {
                                updateReservationStatus(r.id, 'cancelled');
                                toast(`Đã hủy đặt phòng ${r.id}`, 'warn');
                              }}>Hủy</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Footer summary */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:20, padding:'10px 4px', fontSize:12, color:'var(--text-muted)' }}>
            <span>Hiển thị <strong style={{color:'var(--text-primary)'}}>{filteredReservations.length}</strong> / {reservations.length} đặt phòng</span>
            <span>Tổng doanh thu (hiển thị): <strong style={{color:'var(--accent-1)'}}>
              {fmtShort(filteredReservations.reduce((s,r) => s+r.total, 0))}
            </strong></span>
          </div>
        </div>
      )}
    </>
  );
}
