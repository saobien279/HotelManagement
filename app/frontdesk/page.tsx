'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort, fmtDate, statusLabel, roomTypeLabel, statusBadgeClass, calcNights, TODAY, calcRoomPrice } from '@/lib/utils';
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

// ── CreateGroupForm Subcomponent ──────────────
function CreateGroupForm({ rooms, reservations, roomTypes, onSave, onCancel }: {
  rooms: any[];
  reservations: any[];
  roomTypes: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState(TODAY);
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date(new Date(TODAY).getTime() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [totalGuests, setTotalGuests] = useState(5);
  const [roomType, setRoomType] = useState(roomTypes[0]?.id || 'SGL');
  const [roomCount, setRoomCount] = useState(2);
  const [note, setNote] = useState('');
  
  // Available rooms calculation
  const getAvailableRooms = () => {
    if (!checkIn || !checkOut) return [];
    const roomsOfType = rooms.filter(rm => rm.type === roomType);
    return roomsOfType.filter(rm => {
      const hasOverlap = reservations.some(r => 
        r.roomId === rm.id && 
        r.status !== 'cancelled' && 
        r.status !== 'checkedout' &&
        !(checkOut <= r.checkIn || checkIn >= r.checkOut)
      );
      return !hasOverlap;
    });
  };

  const available = getAvailableRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !phone || !checkIn || !checkOut) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    if (available.length < roomCount) {
      alert(`Không đủ phòng trống thuộc loại này (Chỉ còn ${available.length} phòng)`);
      return;
    }
    await onSave({
      name, contact, phone, checkIn, checkOut, totalGuests, roomType, roomCount, note
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tên đoàn / Công ty <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Đoàn du lịch XYZ" required />
        </div>
        <div className="form-group">
          <label className="form-label">Người liên hệ <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input type="text" className="form-input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nguyễn Văn A" required />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Số điện thoại <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" required />
        </div>
        <div className="form-group">
          <label className="form-label">Số lượng khách</label>
          <input type="number" className="form-input" value={totalGuests} onChange={e => setTotalGuests(Number(e.target.value))} min={1} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Ngày Check-in <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input type="date" className="form-input" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Ngày Check-out <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input type="date" className="form-input" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Loại phòng</label>
          <select className="form-select" value={roomType} onChange={e => setRoomType(e.target.value)}>
            {roomTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id}) – {fmtShort(t.basePrice)}/đêm</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Số phòng đăng ký</label>
          <input type="number" className="form-input" value={roomCount} onChange={e => setRoomCount(Number(e.target.value))} min={1} max={available.length || 1} required />
          <div style={{ fontSize:11, color: available.length >= roomCount ? 'var(--color-success)' : 'var(--color-danger)', marginTop:4 }}>
            {available.length > 0 ? `Còn ${available.length} phòng trống loại này` : 'Hết phòng trống loại này'}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Ghi chú</label>
        <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} style={{ minHeight: 60 }} placeholder="Ghi chú thêm..."></textarea>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="submit" className="btn btn-primary" disabled={available.length < roomCount}>✓ Lưu & Tạo đoàn</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  );
}

// ── GroupInvoiceModalContent Subcomponent ──────
function GroupInvoiceModalContent({ group, reservations, services }: { group: any; reservations: any[]; services: any[] }) {
  const groupRes = reservations.filter(r => group.reservationIds.includes(r.id));
  
  let totalNights = 0;
  let totalRoomBill = 0;
  let totalServiceBill = 0;

  const itemizedRooms = groupRes.map(r => {
    const nights = calcNights(r.checkIn, r.checkOut);
    totalNights += nights;
    totalRoomBill += r.total;

    const roomSvcs = services.filter(s => s.bookingId === r.id);
    const roomSvcTotal = roomSvcs.reduce((sum, s) => sum + s.price * s.qty, 0);
    totalServiceBill += roomSvcTotal;

    return {
      reservation: r,
      nights,
      services: roomSvcs,
      roomSvcTotal,
      subtotal: r.total + roomSvcTotal
    };
  });

  const grandTotal = totalRoomBill + totalServiceBill;

  return (
    <div className="invoice-print-container">
      <div style={{ textAlign:'center', marginBottom:16, paddingBottom:14, borderBottom:'2px dashed var(--border)' }}>
        <div style={{ fontWeight:900, fontSize:20, letterSpacing:-0.5 }}>🏨 HOTEL OS</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>HÓA ĐƠN GỘP KHÁCH ĐOÀN</div>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Mã đoàn: {group.id} · Tên đoàn: {group.name}</div>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Ngày in: {fmtDate(TODAY)} {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
      </div>

      <div style={{ marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12 }}>
        <div>
          <strong>Người liên hệ:</strong> {group.contact} <br />
          <strong>Số điện thoại:</strong> {group.phone}
        </div>
        <div style={{ textAlign:'right' }}>
          <strong>Thời gian:</strong> {fmtDate(group.checkIn)} → {fmtDate(group.checkOut)} <br />
          <strong>Tổng số khách:</strong> {group.totalGuests} người
        </div>
      </div>

      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', marginBottom:14 }}>
        <table className="table striped" style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
              <th style={{ padding:8, textAlign:'left' }}>Phòng</th>
              <th style={{ padding:8, textAlign:'left' }}>Khách hàng</th>
              <th style={{ padding:8, textAlign:'right' }}>Tiền phòng</th>
              <th style={{ padding:8, textAlign:'right' }}>Tiền dịch vụ</th>
              <th style={{ padding:8, textAlign:'right' }}>Cộng</th>
            </tr>
          </thead>
          <tbody>
            {itemizedRooms.map(item => (
              <tr key={item.reservation.id} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:8 }}><strong>P.{item.reservation.roomId}</strong><br/><span style={{fontSize:9, color:'var(--text-muted)'}}>{roomTypeLabel[item.reservation.roomType]} ({item.nights} đêm)</span></td>
                <td style={{ padding:8 }}>{item.reservation.guestName}</td>
                <td style={{ padding:8, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtShort(item.reservation.total)}</td>
                <td style={{ padding:8, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                  {item.roomSvcTotal > 0 ? (
                    <div>
                      {fmtShort(item.roomSvcTotal)}
                      <div style={{ fontSize:8, color:'var(--color-info)' }}>
                        {item.services.map(s => `${s.name}(${s.qty})`).join(', ')}
                      </div>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ padding:8, textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmtShort(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding:10, background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
        <div className="info-row" style={{ fontSize:12, marginBottom:4 }}><span className="info-key">Tổng cộng tiền phòng:</span><span className="info-value">{fmtShort(totalRoomBill)}</span></div>
        <div className="info-row" style={{ fontSize:12, marginBottom:4 }}><span className="info-key">Tổng cộng tiền dịch vụ:</span><span className="info-value">{fmtShort(totalServiceBill)}</span></div>
        <hr className="divider" style={{ margin:'6px 0' }}/>
        <div className="info-row" style={{ fontSize:14 }}>
          <span className="info-key" style={{ fontWeight:800 }}>TỔNG THANH TOÁN ĐOÀN</span>
          <span className="info-value strong" style={{ fontVariantNumeric:'tabular-nums', color:'var(--accent-1)', fontSize:18 }}>{fmtShort(grandTotal)}</span>
        </div>
      </div>

      <div style={{ marginTop:14, fontSize:10, color:'var(--text-muted)', textAlign:'center', fontStyle:'italic' }}>
        Cảm ơn quý khách đã tin tưởng và chọn dịch vụ của chúng tôi!
      </div>
    </div>
  );
}

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'checkin'|'checkout'|'staying'|'groups'>('checkin');
  const { rooms, reservations, services, updateReservationStatus, addReservation, roomTypes, loading, groups, addGroup, updateGroupStatus, deleteGroup } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  // ── Group Actions Handlers ──────────────────
  const handleGroupCheckIn = (group: any) => {
    const groupReservations = reservations.filter(r => group.reservationIds.includes(r.id));
    const unassigned = groupReservations.filter(r => !r.roomId);
    if (unassigned.length > 0) {
      toast(`Không thể check-in: Còn ${unassigned.length} phòng chưa được gán phòng thực tế!`, 'warn');
      return;
    }

    openModal('Xác nhận Check-in cả đoàn', (
      <div>
        <p>Bạn có chắc chắn muốn thực hiện nhận phòng (Check-in) cho toàn bộ đoàn <strong>{group.name}</strong>?</p>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Mọi phòng trong đoàn sẽ chuyển sang trạng thái "Đang có khách".</p>
      </div>
    ), [
      { label: '✓ Xác nhận', cls: 'btn-primary', onClick: async () => {
        try {
          await updateGroupStatus(group.id, 'checkedin');
          closeModal();
          toast(`✅ Đã check-in thành công cho đoàn ${group.name}!`, 'success');
        } catch (e: any) {
          toast(e.message || 'Lỗi hệ thống', 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const handleGroupCheckOut = (group: any, grandTotal: number) => {
    openModal('Xác nhận Check-out cả đoàn', (
      <div>
        <p>Xác nhận thanh toán và Check-out cho đoàn <strong>{group.name}</strong>?</p>
        <p style={{ fontSize:13 }}>Tổng tiền thanh toán gộp: <strong style={{ color:'var(--accent-1)', fontSize: 16 }}>{fmtShort(grandTotal)}</strong></p>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>Tất cả các phòng liên quan sẽ được giải phóng và chuyển sang trạng thái dọn dẹp.</p>
      </div>
    ), [
      { label: '💳 Hoàn tất & Thanh toán', cls: 'btn-primary', onClick: async () => {
        try {
          await updateGroupStatus(group.id, 'checkedout');
          closeModal();
          toast(`✅ Đã check-out và thanh toán thành công đoàn ${group.name}!`, 'success');
        } catch (e: any) {
          toast(e.message || 'Lỗi hệ thống', 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const handleCancelGroup = (id: string) => {
    openModal('Hủy đặt phòng đoàn', (
      <div style={{ color: 'var(--color-danger)' }}>
        <strong>Cảnh báo:</strong> Bạn có chắc chắn muốn hủy đặt phòng cho toàn bộ đoàn này? 
        Hành động này sẽ hủy tất cả các đặt phòng liên kết và giải phóng toàn bộ phòng đã giữ.
      </div>
    ), [
      { label: '❌ Xác nhận hủy', cls: 'btn-danger', onClick: async () => {
        try {
          await deleteGroup(id);
          closeModal();
          toast('✅ Đã hủy đoàn thành công!', 'success');
        } catch (e: any) {
          toast(e.message || 'Lỗi hệ thống', 'error');
        }
      }},
      { label: 'Đóng', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const openGroupInvoiceModal = (group: any) => {
    openModal(`Hóa đơn gộp đoàn – ${group.id}`, (
      <GroupInvoiceModalContent group={group} reservations={reservations} services={services} />
    ), [
      { label: '🖨️ In hóa đơn', cls: 'btn-primary', onClick: () => { window.print(); closeModal(); } },
      { label: 'Đóng', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const openCreateGroupModal = () => {
    openModal('Tạo đặt phòng đoàn mới', (
      <CreateGroupForm 
        rooms={rooms} 
        reservations={reservations} 
        roomTypes={roomTypes} 
        onSave={async (data) => {
          try {
            await addGroup(data);
            closeModal();
            toast(`✅ Đặt phòng đoàn ${data.name} đã được tạo thành công!`, 'success');
          } catch (e: any) {
            toast(e.message || 'Lỗi hệ thống', 'error');
          }
        }} 
        onCancel={closeModal} 
      />
    ));
  };

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
        <div className="form-group">
          <label className="form-label">CCCD / Hộ chiếu <span style={{color:'var(--color-danger)'}}>*</span></label>
          <input id="ci_cccd" type="text" className="form-input" placeholder="079 xxx xxx xxx"/>
        </div>
        {!r.roomId && (
          <div className="form-group">
            <label className="form-label">Gán phòng <span style={{color:'var(--color-danger)'}}>*</span></label>
            <select id="ci_room" className="form-select">
              <option value="">-- Chọn phòng trống --</option>
              {rooms.filter(rm => rm.status === 'vacant' && rm.type === r.roomType).map(rm => (
                <option key={rm.id} value={rm.id}>Phòng {rm.id}</option>
              ))}
            </select>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              Loại phòng: {roomTypeLabel[r.roomType]}
            </div>
          </div>
        )}
      </div>
    ), [
      { label: '✓ Xác nhận Check-in', cls: 'btn-primary', onClick: async () => {
        const cccd = (document.getElementById('ci_cccd') as HTMLInputElement)?.value?.trim();
        if (!cccd) { toast('Vui lòng nhập số CCCD / Hộ chiếu', 'warn'); return; }
        
        const roomId = r.roomId || (document.getElementById('ci_room') as HTMLSelectElement)?.value;
        if (!roomId) { toast('Vui lòng chọn phòng để Check-in', 'warn'); return; }

        try {
          await updateReservationStatus(id, 'checkedin', { roomId });
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
      <div className="invoice-print-container">
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:16, paddingBottom:14, borderBottom:'2px dashed var(--border)' }}>
          <div style={{ fontWeight:900, fontSize:18, letterSpacing:-0.5 }}>🏨 HOTEL OS</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Hóa đơn thanh toán</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Ngày in: {fmtDate(TODAY)} {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
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
    const renderRoomOptions = (typeId: string) => {
      const filtered = rooms.filter(rm => rm.status === 'vacant' && rm.type === typeId);
      if (filtered.length === 0) return '<option value="">-- Hết phòng loại này --</option>';
      return filtered.map(rm => `<option value="${rm.id}">Phòng ${rm.id}</option>`).join('');
    };

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
            <select id="wi_type" className="form-select" onChange={(e) => {
              const roomSel = document.getElementById('wi_room') as HTMLSelectElement;
              if (roomSel) roomSel.innerHTML = renderRoomOptions(e.target.value);
            }}>
              {roomTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id}) – {fmtShort(t.basePrice)}/đêm</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Chọn phòng <span style={{color:'var(--color-danger)'}}>*</span></label>
            <select id="wi_room" className="form-select" dangerouslySetInnerHTML={{ __html: renderRoomOptions(roomTypes[0].id) }} />
          </div>
          <div className="form-group">
            <label className="form-label">Số đêm</label>
            <input id="wi_nights" type="number" className="form-input" defaultValue={1} min={1}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Phương thức thanh toán</label>
          <select id="wi_pay" className="form-select">
            <option>Tiền mặt</option>
            <option>Chuyển khoản</option>
            <option>Thẻ tín dụng</option>
          </select>
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
        const roomId = (document.getElementById('wi_room') as HTMLSelectElement)?.value;
        
        if (!name || !phone || !cccd) { toast('Vui lòng điền đầy đủ thông tin bắt buộc *', 'warn'); return; }
        if (!roomId) { toast('Vui lòng chọn phòng trống', 'warn'); return; }

        const typeId = (document.getElementById('wi_type') as HTMLSelectElement)?.value as any;
        const nights = +(document.getElementById('wi_nights') as HTMLInputElement)?.value || 1;
        const note   = (document.getElementById('wi_note') as HTMLTextAreaElement)?.value || '';
        const rt     = roomTypes.find(t => t.id === typeId)!;
        const checkIn  = TODAY;
        const checkOut = new Date(new Date(TODAY).getTime() + nights * 86400000).toISOString().slice(0, 10);

        try {
          await addReservation({
            guestName: name, phone, roomId, roomType: typeId,
            checkIn, checkOut, adults: 1, children: 0,
            status: 'checkedin', source: 'direct', note,
            total: calcRoomPrice(checkIn, checkOut, rt),
          });
          closeModal();
          toast(`✅ Walk-in thành công! ${name} – Phòng ${roomId}`, 'success');
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
                      <td style={{ textAlign:'right' }}>
                        {(() => {
                          const svcTotal = services.filter(s => s.bookingId === r.id).reduce((sum, s) => sum + s.price * s.qty, 0);
                          return (
                            <>
                              <div style={{ fontWeight:700, color:'var(--accent-1)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(r.total + svcTotal)}</div>
                              {svcTotal > 0 && <div style={{ fontSize:10, color:'var(--color-info)' }}>Dịch vụ: +{fmtShort(svcTotal)}</div>}
                            </>
                          );
                        })()}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:140 }}>{r.note || '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => doCheckOut(r.id)}>Thanh toán</button>
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
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Quản lý khách đoàn</span>
            <button className="btn btn-primary btn-sm" onClick={openCreateGroupModal}>
              <Plus size={14}/> Tạo đoàn mới
            </button>
          </div>
          
          {!groups || groups.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon"><Users size={40}/></div>
              <h3>Không có đoàn khách nào</h3>
              <p>Hệ thống chưa ghi nhận đoàn khách nào được đặt phòng</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14, padding: 16 }}>
              {groups.map(group => {
                const groupRes = reservations.filter(r => group.reservationIds.includes(r.id));
                const roomsCount = groupRes.length;
                const statusBadge = (s: string) => {
                  const map: Record<string, string> = {
                    confirmed: 'badge-confirmed',
                    pending: 'badge-pending',
                    checkedin: 'badge-checkedin',
                    checkedout: 'badge-checkedout',
                    cancelled: 'badge-cancelled',
                  };
                  return map[s] ?? 'badge-muted';
                };
                const statusLabelLocal: Record<string, string> = {
                  confirmed: 'Đã xác nhận',
                  pending: 'Chờ xác nhận',
                  checkedin: 'Đang ở',
                  checkedout: 'Đã trả phòng',
                  cancelled: 'Đã hủy',
                };
                
                // Group totals
                const totalRoomBill = groupRes.reduce((s, r) => s + r.total, 0);
                const groupSvcs = services.filter(s => groupRes.some(r => r.id === s.bookingId));
                const totalSvcBill = groupSvcs.reduce((s, x) => s + x.price * x.qty, 0);
                const grandTotal = totalRoomBill + totalSvcBill;

                return (
                  <div key={group.id} style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:20, border:'1px solid var(--border)', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:15, color:'var(--accent-1)' }}>
                          {group.name} ({group.id})
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                          <span>👤 Liên hệ: <strong>{group.contact}</strong></span>
                          <span>📱 SĐT: <strong>{group.phone}</strong></span>
                          <span>📅 {fmtDate(group.checkIn)} → {fmtDate(group.checkOut)}</span>
                          <span>👥 {group.totalGuests} khách ({roomsCount} phòng)</span>
                        </div>
                      </div>
                      <span className={`badge ${statusBadge(group.status)}`}>{statusLabelLocal[group.status] || group.status}</span>
                    </div>

                    {/* Room grid */}
                    {groupRes.length > 0 && (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8, margin:'14px 0' }}>
                        {groupRes.map(res => (
                          <div key={res.id} style={{ background:'var(--bg-card)', borderRadius:'var(--radius-md)', padding:10, textAlign:'center', border:'1px solid var(--border)' }}>
                            <div style={{ fontWeight:700, fontSize:13 }}>P.{res.roomId || 'Chưa gán'}</div>
                            <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>{roomTypeLabel[res.roomType]}</div>
                            <div style={{ fontSize:9, fontWeight:600, color: res.status === 'checkedin' ? 'var(--color-success)' : res.status === 'checkedout' ? 'var(--text-muted)' : 'var(--color-warning)', marginTop:3 }}>
                              {statusLabel[res.status]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                      {group.note && <span>📝 Ghi chú: {group.note}</span>}
                    </div>

                    <div style={{ display:'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ fontSize: 13 }}>
                        Tổng chi phí: <strong style={{ color:'var(--accent-1)', fontSize: 15 }}>{fmtShort(grandTotal)}</strong>
                        {totalSvcBill > 0 && <span style={{ fontSize: 10, color: 'var(--color-info)', marginLeft: 6 }}>(Dịch vụ: {fmtShort(totalSvcBill)})</span>}
                      </div>

                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {/* Action buttons based on status */}
                        {group.status === 'confirmed' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleGroupCheckIn(group)}>✓ Check-in cả đoàn</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancelGroup(group.id)}>❌ Hủy đoàn</button>
                          </>
                        )}
                        {group.status === 'checkedin' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleGroupCheckOut(group, grandTotal)}>💳 Check-out cả đoàn</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openGroupInvoiceModal(group)}>🧾 Gộp hóa đơn</button>
                          </>
                        )}
                        {group.status === 'checkedout' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openGroupInvoiceModal(group)}>🧾 Xem hóa đơn gộp</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
