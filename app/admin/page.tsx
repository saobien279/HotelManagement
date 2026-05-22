'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort, TODAY } from '@/lib/utils';
import { Settings, Users, Building, List, Globe, Plus, Edit2, Lock, Unlock, Coins, RefreshCw, Sliders, Mail, MessageSquare, Send, Eye } from 'lucide-react';

const roleColors: Record<string,{color:string;bg:string;label:string}> = {
  admin:        { color:'#a78bfa', bg:'rgba(139,92,246,0.15)',  label:'Admin' },
  frontdesk:    { color:'#60a5fa', bg:'rgba(59,130,246,0.15)',  label:'Lễ tân' },
  housekeeping: { color:'#34d399', bg:'rgba(16,185,129,0.15)',  label:'Buồng phòng' },
  accountant:   { color:'#fbbf24', bg:'rgba(245,158,11,0.15)',  label:'Kế toán' },
  inventory:    { color:'#f87171', bg:'rgba(239,68,68,0.15)',   label:'Kho' },
};

const rolePerms: Record<string,string> = {
  admin:        'Toàn quyền hệ thống',
  frontdesk:    'Đặt phòng · Check-in/out · Sơ đồ phòng',
  housekeeping: 'Cập nhật trạng thái phòng · Xem vật tư',
  accountant:   'Xem báo cáo · Xuất hóa đơn',
  inventory:    'Quản lý kho · Xuất nhập kho',
};

const typeColors: Record<string,string> = {
  checkin:'#10b981', booking:'#6366f1', housekeeping:'#f59e0b', cancel:'#ef4444', invoice:'#3b82f6', config:'#8b5cf6', system:'#64748b',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users'|'rooms'|'log'|'channel'|'pricing'|'message'>('users');
  const [logSearch, setLogSearch] = useState('');
  const [logType, setLogType] = useState('all');
  const [logPeriod, setLogPeriod] = useState('all');

  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedMsgType, setSelectedMsgType] = useState<'booking_confirm'|'checkin_remind'|'checkout_thanks'|'promo'>('booking_confirm');
  const [customMsgTemplate, setCustomMsgTemplate] = useState('Kính chào quý khách [TÊN_KHÁCH], HotelOS xác nhận đặt phòng [MÃ_ĐẶT_PHÒNG] thành công. Thời gian lưu trú: [CHECK_IN] → [CHECK_OUT]. Rất hân hạnh được phục vụ quý khách!');
  const [sendingMsg, setSendingMsg] = useState(false);
  
  const { 
    users, roomTypes, addUser, updateUser, updateRoomType, 
    activityLog, loading, channels, updateChannel,
    messages, sendManualMessage, reservations
  } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const openConfigureChannel = (ch: any) => {
    openModal(`Cấu hình kênh: ${ch.name}`, (
      <div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Tỷ lệ hoa hồng (%)</label>
          <input id="ch_commission" type="number" className="form-input" defaultValue={ch.commission} min={0} max={100} />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Hệ số điều chỉnh giá (Rate Modifier)</label>
          <input id="ch_rateModifier" type="number" className="form-input" defaultValue={ch.rateModifier} step={0.01} min={0.5} max={2.0} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Ví dụ: 1.15 nghĩa là giá phòng trên kênh này sẽ cao hơn 15% so với giá gốc.
          </p>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Số phòng phân bổ (Allocated Rooms)</label>
          <input id="ch_allocated" type="number" className="form-input" defaultValue={ch.allocatedRooms} min={0} max={18} />
        </div>
      </div>
    ), [
      {
        label: 'Lưu cấu hình',
        cls: 'btn-primary',
        onClick: async () => {
          const commission = Number((document.getElementById('ch_commission') as HTMLInputElement)?.value) || 0;
          const rateModifier = Number((document.getElementById('ch_rateModifier') as HTMLInputElement)?.value) || 1.0;
          const allocatedRooms = Number((document.getElementById('ch_allocated') as HTMLInputElement)?.value) || 0;
          try {
            await updateChannel(ch.id, { commission, rateModifier, allocatedRooms });
            toast(`Đã cập nhật cấu hình kênh ${ch.name}!`, 'success');
            closeModal();
          } catch (e: any) {
            toast(e.message, 'error');
          }
        }
      },
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const filteredLogs = activityLog.filter(l => {
    const matchesSearch = l.action.toLowerCase().includes(logSearch.toLowerCase()) || 
                         l.user.toLowerCase().includes(logSearch.toLowerCase());
    const matchesType = logType === 'all' || l.type === logType;
    
    let matchesPeriod = true;
    if (logPeriod === 'today') matchesPeriod = l.date === TODAY;
    // (Simplified period logic for demo)

    return matchesSearch && matchesType && matchesPeriod;
  });

  const openAddUser = () => {
    openModal('Thêm người dùng mới', (
      <div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Họ tên *</label><input id="nu_name" type="text" className="form-input" placeholder="Nguyễn Văn X"/></div>
          <div className="form-group"><label className="form-label">Tên đăng nhập *</label><input id="nu_username" type="text" className="form-input" placeholder="user_x"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Mật khẩu *</label><input id="nu_pass" type="password" className="form-input" placeholder="••••••••"/></div>
          <div className="form-group"><label className="form-label">Chức vụ *</label>
            <select id="nu_role" className="form-select">
              <option value="frontdesk">Lễ tân</option><option value="housekeeping">Buồng phòng</option>
              <option value="accountant">Kế toán</option><option value="inventory">Nhân viên kho</option><option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>
    ), [
      { label: 'Tạo tài khoản', cls: 'btn-primary', onClick: async () => {
        const name     = (document.getElementById('nu_name') as HTMLInputElement)?.value.trim();
        const username = (document.getElementById('nu_username') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('nu_pass') as HTMLInputElement)?.value;
        if (!name||!username||!password) { toast('Vui lòng điền đầy đủ','warn'); return; }
        try {
          await addUser({ name, username, password, role:(document.getElementById('nu_role') as HTMLSelectElement)?.value as any, status:'active', lastLogin:'—' });
          closeModal(); toast(`Tài khoản ${name} đã được tạo!`,'success');
        } catch (e: any) {
          toast(e.message, 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  const editUser = (id: string) => {
    const u = users.find(x=>x.id===id)!;
    openModal(`Chỉnh sửa: ${u.name}`, (
      <div>
        <div className="form-group"><label className="form-label">Họ tên</label><input id="eu_name" type="text" className="form-input" defaultValue={u.name}/></div>
        <div className="form-group"><label className="form-label">Chức vụ</label>
          <select id="eu_role" className="form-select" defaultValue={u.role}>
            <option value="frontdesk">Lễ tân</option><option value="housekeeping">Buồng phòng</option>
            <option value="accountant">Kế toán</option><option value="inventory">Nhân viên kho</option><option value="admin">Admin</option>
          </select>
        </div>
      </div>
    ), [
      { label: 'Lưu thay đổi', cls: 'btn-primary', onClick: async () => {
        try {
          await updateUser(id, { name:(document.getElementById('eu_name') as HTMLInputElement)?.value, role:(document.getElementById('eu_role') as HTMLSelectElement)?.value as any });
          closeModal(); toast('Đã cập nhật người dùng!','success');
        } catch (e: any) {
          toast(e.message, 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };



  if (loading) return <div style={{ padding:40, color:'var(--text-muted)' }}>Đang tải cấu hình hệ thống...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Settings size={22}/> Quản trị Hệ thống</h1>
          <p className="page-subtitle">Phân quyền, cấu hình phòng và lịch sử thao tác</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${activeTab==='users'?' active':''}`} onClick={()=>setActiveTab('users')}><Users size={15}/> Người dùng</button>
        <button className={`tab-btn${activeTab==='rooms'?' active':''}`} onClick={()=>setActiveTab('rooms')}><Building size={15}/> Cấu hình phòng</button>
        <button className={`tab-btn${activeTab==='log'?' active':''}`} onClick={()=>setActiveTab('log')}><List size={15}/> Lịch sử thao tác</button>
        <button className={`tab-btn${activeTab==='pricing'?' active':''}`} onClick={()=>setActiveTab('pricing')}><Coins size={15}/> Cấu hình giá</button>
        <button className={`tab-btn${activeTab==='channel'?' active':''}`} onClick={()=>setActiveTab('channel')}><Globe size={15}/> Channel Manager</button>
        <button className={`tab-btn${activeTab==='message'?' active':''}`} onClick={()=>setActiveTab('message')}><Mail size={15}/> Tin nhắn Automation</button>
      </div>

      {/* ── USERS ── */}
      {activeTab==='users' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,alignItems:'center'}}>
            <div className="section-label">Danh sách tài khoản</div>
            <button className="btn btn-primary btn-sm" onClick={openAddUser} disabled={loading}><Plus size={14}/> Thêm người dùng</button>
          </div>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><span className="card-title">Ma trận phân quyền</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
              {Object.entries(rolePerms).map(([role,perms])=>{
                const rc=roleColors[role];
                return (
                  <div key={role} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:14,borderLeft:`3px solid ${rc.color}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:rc.color,marginBottom:6}}>{rc.label}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',lineHeight:1.8}}>{perms.split(' · ').map((p,i)=><div key={i}>{p}</div>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Tên</th><th>Tên đăng nhập</th><th>Chức vụ</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {users.map(u=>{
                    const rc=roleColors[u.role]??{color:'#94a3b8',bg:'rgba(148,163,184,0.1)',label:u.role};
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:rc.bg,border:`1px solid ${rc.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:rc.color,fontSize:13}}>{u.name.charAt(0)}</div>
                            <span style={{fontWeight:600}}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{color:'var(--text-muted)',fontFamily:'monospace'}}>{u.username}</td>
                        <td><span style={{background:rc.bg,color:rc.color,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>{rc.label}</span></td>
                        <td>{u.status==='active'?<span className="badge badge-confirmed">Hoạt động</span>:<span className="badge badge-cancelled">Vô hiệu</span>}</td>
                        <td style={{fontSize:12,color:'var(--text-muted)'}}>{u.lastLogin}</td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>editUser(u.id)} disabled={loading}><Edit2 size={13}/></button>
                            {u.role!=='admin'&&<button className="btn btn-ghost btn-sm" onClick={()=>{updateUser(u.id,{status:u.status==='active'?'inactive':'active'});toast(`Tài khoản ${u.name} đã ${u.status==='active'?'khóa':'mở'}!`,'success');}} disabled={loading}>
                              {u.status==='active'?<Lock size={13}/>:<Unlock size={13}/>}
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ROOMS CONFIG ── */}
      {activeTab==='rooms' && (
        <div className="content-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Loại phòng & Giá</span><button className="btn btn-primary btn-sm" onClick={()=>toast('Tính năng đang phát triển','info')}><Plus size={14}/> Thêm loại</button></div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {roomTypes.map(rt=>(
                <div key={rt.id} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  <div><div style={{fontWeight:700,fontSize:14}}>{rt.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>Tối đa {rt.capacity} khách · ID: {rt.id}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:15,fontWeight:800,color:'#A5B4FC'}}>{fmtShort(rt.basePrice)}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>/đêm</div></div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toast('Mở form chỉnh sửa giá phòng','info')}><Edit2 size={13}/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Giá theo mùa</span><button className="btn btn-ghost btn-sm" onClick={()=>toast('Tính năng đang phát triển','info')}>+ Thêm mùa</button></div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[{season:'Mùa cao điểm',period:'T6 – T8, Tết',mult:'+30%',color:'var(--color-danger)'},{season:'Mùa bình thường',period:'T3 – T5, T9 – T11',mult:'0%',color:'var(--color-success)'},{season:'Mùa thấp điểm',period:'T1 – T2, T12',mult:'-15%',color:'var(--color-info)'}].map(s=>(
                <div key={s.season} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div><div style={{fontWeight:600}}>{s.season}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{s.period}</div></div>
                  <span style={{fontWeight:700,color:s.color,fontSize:16}}>{s.mult}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{gridColumn:'span 2'}}>
            <div className="card-header"><span className="card-title">Giá phòng theo giờ</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
              {[{label:'2 giờ đầu',price:150000},{label:'Thêm mỗi giờ',price:50000},{label:'Qua đêm (18–12h)',price:480000},{label:'Phụ phí trễ checkout',price:100000}].map(p=>(
                <div key={p.label} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:14,textAlign:'center'}}>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{p.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#A5B4FC'}}>{fmtShort(p.price)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOG ── */}
      {activeTab==='log' && (
        <>
          <div className="filter-bar" style={{marginBottom:16}}>
            <div className="filter-input-wrapper">
              <span className="filter-icon"><Settings size={14}/></span>
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Tìm kiếm thao tác..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option value="all">Tất cả loại</option>
              <option value="checkin">Check-in/out</option>
              <option value="booking">Đặt phòng</option>
              <option value="config">Cấu hình</option>
              <option value="housekeeping">Dọn dẹp</option>
            </select>
            <select className="filter-select" value={logPeriod} onChange={(e) => setLogPeriod(e.target.value)}>
              <option value="all">Mọi lúc</option>
              <option value="today">Hôm nay</option>
            </select>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Loại</th><th>Nội dung thao tác</th></tr></thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(l=>(
                      <tr key={l.id}>
                        <td style={{whiteSpace:'nowrap',color:'var(--text-muted)',fontSize:12}}>{l.date} {l.time}</td>
                        <td><span style={{fontWeight:600}}>{l.user}</span></td>
                        <td><span style={{color:typeColors[l.type]??'var(--text-muted)',fontSize:12,fontWeight:600}}>{l.type}</span></td>
                        <td style={{fontSize:13}}>{l.action}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>Không có dữ liệu phù hợp</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CHANNEL MANAGER ── */}
      {activeTab==='channel' && (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header">
              <span className="card-title">Kênh phân phối (OTA)</span>
              <span className="badge badge-confirmed">Tự động đồng bộ</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
              {channels.map(ch=>(
                <div key={ch.id} style={{
                  background:'var(--bg-elevated)',
                  borderRadius:'var(--radius-lg)',
                  padding:20,
                  border:`2px solid ${ch.enabled?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)'}`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                      <Globe size={22} style={{color:ch.enabled?'#6EE7B7':'var(--text-muted)'}}/>
                      <span style={{fontWeight:700,fontSize:16}}>{ch.name}</span>
                      <span className={`badge ${ch.enabled?'badge-confirmed':'badge-muted'}`} style={{marginLeft:'auto'}}>
                        {ch.enabled?'Đang bật':'Đang tắt'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)'}}>
                        <span>Phân bổ phòng:</span>
                        <span style={{fontWeight:600, color:ch.enabled?'var(--text)':'var(--text-muted)'}}>{ch.allocatedRooms} phòng</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)'}}>
                        <span>Hoa hồng (Commission):</span>
                        <span style={{fontWeight:600, color:ch.enabled?'var(--text)':'var(--text-muted)'}}>{ch.commission}%</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)'}}>
                        <span>Hệ số giá (Rate Mod):</span>
                        <span style={{fontWeight:600, color:ch.enabled ? (ch.rateModifier > 1 ? '#f59e0b' : '#10b981') : 'var(--text-muted)'}}>{ch.rateModifier}x</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop: 4}}>
                        <span>Đồng bộ cuối:</span>
                        <span style={{fontFamily:'monospace'}}>{ch.enabled ? new Date(ch.lastSync).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) + ' ' + new Date(ch.lastSync).toLocaleDateString('vi-VN') : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{display:'flex', gap:8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12}}>
                    {ch.enabled ? (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={async () => {
                          toast(`Đang đồng bộ ${ch.name}...`, 'info');
                          setTimeout(async () => {
                            await updateChannel(ch.id, { lastSync: new Date().toISOString() });
                            toast(`Đã đồng bộ thành công kênh ${ch.name}!`, 'success');
                          }, 1000);
                        }}>
                          <RefreshCw size={12}/> Đồng bộ
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openConfigureChannel(ch)}>
                          <Sliders size={12}/> Cấu hình
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" style={{ marginLeft: 'auto' }} onClick={async () => {
                          await updateChannel(ch.id, { enabled: false });
                          toast(`Đã ngắt kết nối kênh ${ch.name}`, 'warn');
                        }}>
                          Tắt kênh
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{fontSize:12,color:'var(--text-muted)',alignSelf:'center'}}>Kênh đang vô hiệu hóa</div>
                        <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={async () => {
                          await updateChannel(ch.id, { enabled: true });
                          toast(`Đã kết nối thành công kênh ${ch.name}!`, 'success');
                        }}>
                          Bật kết nối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Tự động gửi Email / SMS</span><button className="btn btn-primary btn-sm" onClick={()=>toast('Cấu hình email đang phát triển','info')}>+ Cấu hình</button></div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[{label:'Xác nhận đặt phòng',trigger:'Khi tạo booking',channel:'Email + SMS',active:true},{label:'Nhắc Check-in',trigger:'1 ngày trước check-in',channel:'Email',active:true},{label:'Cảm ơn sau check-out',trigger:'Sau khi check-out',channel:'Email',active:true},{label:'Email khuyến mãi',trigger:'Hàng tuần (Thứ 2)',channel:'Email',active:false}].map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--bg-elevated)',borderRadius:'var(--radius-md)'}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{t.label}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{t.trigger} · {t.channel}</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className={`badge ${t.active?'badge-confirmed':'badge-pending'}`}>{t.active?'Bật':'Tắt'}</span>
                    <button className="btn btn-ghost btn-sm" onClick={()=>toast('Mở cài đặt email','info')}><Edit2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {activeTab === 'pricing' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,alignItems:'center'}}>
            <div className="section-label">Quản lý giá theo mùa</div>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              try {
                const promises = roomTypes.map(rt => {
                  const basePrice = Number((document.getElementById(`rt_base_${rt.id}`) as HTMLInputElement).value);
                  const weekendPrice = Number((document.getElementById(`rt_weekend_${rt.id}`) as HTMLInputElement).value);
                  const peakMultiplier = Number((document.getElementById(`rt_peak_${rt.id}`) as HTMLInputElement).value);
                  return updateRoomType(rt.id, { basePrice, weekendPrice, peakMultiplier });
                });
                await Promise.all(promises);
                toast('Đã lưu tất cả thay đổi cấu hình giá!', 'success');
              } catch (e: any) {
                toast(e.message, 'error');
              }
            }}><Plus size={14}/> Lưu tất cả thay đổi</button>
          </div>
          <div className="card" style={{padding:0, overflow:'hidden', marginBottom:20}}>
            <div className="table-wrapper">
              <table className="table striped">
                <thead>
                  <tr>
                    <th>Loại phòng</th>
                    <th>Giá cơ bản (Ngày thường)</th>
                    <th>Giá Cuối tuần (T6-CN)</th>
                    <th>Mùa cao điểm (Multiplier)</th>
                    <th>Ngày áp dụng mùa cao điểm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map(rt => (
                    <tr key={rt.id}>
                      <td style={{fontWeight:700}}>{rt.name}</td>
                      <td><input id={`rt_base_${rt.id}`} type="number" className="form-input" style={{width:120, padding:'4px 8px', height:32}} defaultValue={rt.basePrice}/></td>
                      <td><input id={`rt_weekend_${rt.id}`} type="number" className="form-input" style={{width:120, padding:'4px 8px', height:32}} defaultValue={rt.weekendPrice}/></td>
                      <td><input id={`rt_peak_${rt.id}`} type="number" className="form-input" style={{width:80, padding:'4px 8px', height:32}} defaultValue={rt.peakMultiplier} step={0.1}/></td>
                      <td style={{fontSize:11, color:'var(--text-muted)'}}>01/06 → 31/08</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          const basePrice = Number((document.getElementById(`rt_base_${rt.id}`) as HTMLInputElement).value);
                          const weekendPrice = Number((document.getElementById(`rt_weekend_${rt.id}`) as HTMLInputElement).value);
                          const peakMultiplier = Number((document.getElementById(`rt_peak_${rt.id}`) as HTMLInputElement).value);
                          try {
                            await updateRoomType(rt.id, { basePrice, weekendPrice, peakMultiplier });
                            toast('Cập nhật giá thành công!', 'success');
                          } catch (e: any) {
                            toast(e.message, 'error');
                          }
                        }}><Edit2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header"><span className="card-title">Cấu hình Ngày lễ / Sự kiện</span></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 100px', gap:10, alignItems:'end'}}>
              <div className="form-group"><label className="form-label">Tên sự kiện</label><input type="text" className="form-input" defaultValue="Tết Nguyên Đán"/></div>
              <div className="form-group"><label className="form-label">Khoảng ngày</label><input type="text" className="form-input" defaultValue="29/01/2026 - 05/02/2026"/></div>
              <div className="form-group"><label className="form-label">Phụ thu (%)</label><input type="number" className="form-input" defaultValue={50}/></div>
              <button className="btn btn-primary" style={{height:42}}>Thêm</button>
            </div>
          </div>
        </>
      )}

      {/* ── MESSAGING AUTOMATION ── */}
      {activeTab === 'message' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start'}}>
          {/* Lịch sử tin nhắn */}
          <div className="card">
            <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="card-title">📨 Nhật ký Tin nhắn Automation</span>
              <span className="badge badge-info" style={{fontSize:12, padding:'2px 8px', borderRadius:4, background:'rgba(59,130,246,0.15)', color:'#3b82f6'}}>{messages?.length || 0} tin nhắn</span>
            </div>
            
            <div className="table-responsive" style={{maxHeight: '620px', overflowY: 'auto'}}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Khách hàng</th>
                    <th>Đặt phòng</th>
                    <th>Loại tin nhắn</th>
                    <th>Kênh</th>
                    <th>Trạng thái</th>
                    <th style={{width: 80, textAlign:'center'}}>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {!messages || messages.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{textAlign:'center', color:'var(--text-muted)', padding:20}}>
                        Chưa có lịch sử tin nhắn tự động nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg: any) => {
                      const typeMap: Record<string, { label: string; cls: string }> = {
                        booking_confirm: { label: 'Xác nhận đặt phòng', cls: 'badge-info' },
                        checkin_remind: { label: 'Nhắc check-in', cls: 'badge-warn' },
                        checkout_thanks: { label: 'Cảm ơn check-out', cls: 'badge-success' },
                        promo: { label: 'Email Khuyến mãi', cls: 'badge-primary' },
                      };
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        sent: { label: 'Đã gửi thành công', cls: 'status-vacant' },
                        failed: { label: 'Gửi thất bại', cls: 'status-maintenance' },
                        pending: { label: 'Đang xử lý', cls: 'status-cleaning' },
                      };

                      return (
                        <tr key={msg.id}>
                          <td style={{fontSize:12}}>
                            {new Date(msg.sentAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                            <div style={{fontSize:10, color:'var(--text-muted)'}}>{new Date(msg.sentAt).toLocaleDateString('vi-VN')}</div>
                          </td>
                          <td>
                            <div style={{fontWeight:600}}>{msg.guestName}</div>
                            <div style={{fontSize:11, color:'var(--text-muted)'}}>{msg.phone} • {msg.email}</div>
                          </td>
                          <td style={{fontWeight:600}}>{msg.bookingId}</td>
                          <td>
                            <span className={`badge ${typeMap[msg.type]?.cls || 'badge-info'}`} style={{fontSize:11}}>
                              {typeMap[msg.type]?.label || msg.type}
                            </span>
                          </td>
                          <td style={{fontSize:12, textTransform:'uppercase', fontWeight:500}}>{msg.channel}</td>
                          <td>
                            <span className={`room-status-badge ${statusMap[msg.status]?.cls || ''}`} style={{fontSize:11, padding:'2px 8px', borderRadius:10}}>
                              {statusMap[msg.status]?.label || msg.status}
                            </span>
                          </td>
                          <td style={{textAlign:'center'}}>
                            <button className="btn btn-secondary btn-sm" style={{padding:'4px 8px'}} title="Xem nội dung chi tiết" onClick={() => {
                              openModal(
                                `Chi tiết tin nhắn #${msg.id}`,
                                <div style={{padding: '5px 10px'}}>
                                  <div style={{marginBottom:15, fontSize:13, color:'var(--text-muted)', display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px 5px'}}>
                                    <span>Khách hàng:</span><strong style={{color:'var(--text-bright)'}}>{msg.guestName}</strong>
                                    <span>Mã đặt phòng:</span><strong>{msg.bookingId}</strong>
                                    <span>Số điện thoại:</span><span>{msg.phone}</span>
                                    <span>Email nhận:</span><span>{msg.email}</span>
                                    <span>Thời gian gửi:</span><span>{new Date(msg.sentAt).toLocaleString('vi-VN')}</span>
                                    <span>Kênh:</span><span style={{textTransform:'uppercase'}}>{msg.channel}</span>
                                  </div>
                                  <div style={{border:'1px solid var(--border-color)', borderRadius:8, padding:15, background:'rgba(255,255,255,0.03)', whiteSpace:'pre-wrap', lineHeight:1.5, color:'var(--text-bright)', fontSize:13}}>
                                    {msg.content}
                                  </div>
                                </div>,
                                [{ label: 'Đóng', onClick: closeModal }]
                              );
                            }}>
                              <Eye size={13}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel gửi thử tin nhắn */}
          <div style={{display:'flex', flexDirection:'column', gap:20}}>
            <div className="card">
              <div className="card-header"><span className="card-title">🧪 Giả lập gửi tin nhắn (Test Panel)</span></div>
              <div style={{padding:'5px 0', display:'flex', flexDirection:'column', gap:15}}>
                
                <div className="form-group">
                  <label className="form-label">1. Chọn đặt phòng đích</label>
                  <select className="form-input" value={selectedBooking} onChange={(e) => {
                    const bid = e.target.value;
                    setSelectedBooking(bid);
                  }}>
                    <option value="">-- Chọn khách hàng / Đặt phòng --</option>
                    {reservations.map(r => (
                      <option key={r.id} value={r.id}>
                        [{r.id}] {r.guestName} ({r.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">2. Loại sự kiện / Loại tin nhắn</label>
                  <select className="form-input" value={selectedMsgType} onChange={(e) => {
                    const type = e.target.value as any;
                    setSelectedMsgType(type);
                    // Update template content preview
                    const templates: Record<string, string> = {
                      booking_confirm: 'Kính chào quý khách [TÊN_KHÁCH], HotelOS xác nhận đặt phòng [MÃ_ĐẶT_PHÒNG] thành công. Thời gian lưu trú: [CHECK_IN] → [CHECK_OUT]. Rất hân hạnh được phục vụ quý khách!',
                      checkin_remind: 'Kính chào quý khách [TÊN_KHÁCH], chúc quý khách một ngày tốt lành. HotelOS xin nhắc quý khách về lịch check-in ngày mai ([CHECK_IN]). Hẹn gặp quý khách!',
                      checkout_thanks: 'Kính chào quý khách [TÊN_KHÁCH], chân thành cảm ơn quý khách đã tin tưởng và chọn lưu trú tại HotelOS. Chúc quý khách thượng lộ bình an!',
                      promo: 'Kính chào quý khách [TÊN_KHÁCH], HotelOS gửi tặng quý khách mã giảm giá 15% cho lần đặt phòng tiếp theo: DONGHANH15. Ưu đãi áp dụng đến cuối tháng.',
                    };
                    setCustomMsgTemplate(templates[type]);
                  }}>
                    <option value="booking_confirm">Xác nhận đặt phòng (Email + SMS)</option>
                    <option value="checkin_remind">Nhắc nhở check-in (Email)</option>
                    <option value="checkout_thanks">Cảm ơn sau check-out (Email)</option>
                    <option value="promo">Email Khuyến mãi quà tặng (Email)</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
                    <label className="form-label" style={{margin:0}}>3. Mẫu nội dung tùy chỉnh</label>
                    <span style={{fontSize:10, color:'var(--text-muted)'}}>Biến: [TÊN_KHÁCH], [MÃ_ĐẶT_PHÒNG]</span>
                  </div>
                  <textarea 
                    className="form-input" 
                    style={{minHeight:100, fontFamily:'inherit', fontSize:13, resize:'none'}} 
                    value={customMsgTemplate}
                    onChange={(e) => setCustomMsgTemplate(e.target.value)}
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  disabled={!selectedBooking || sendingMsg} 
                  style={{width:'100%', height:42, display:'flex', justifyContent:'center', alignItems:'center', gap:8}}
                  onClick={async () => {
                    if (!selectedBooking) {
                      toast('Vui lòng chọn một đặt phòng trước khi giả lập gửi!', 'warn');
                      return;
                    }
                    try {
                      setSendingMsg(true);
                      await sendManualMessage(selectedBooking, selectedMsgType, customMsgTemplate);
                      toast('Đã giả lập gửi tin nhắn automation thành công!', 'success');
                    } catch (e: any) {
                      toast(`Lỗi khi gửi: ${e.message}`, 'error');
                    } finally {
                      setSendingMsg(false);
                    }
                  }}
                >
                  <Send size={15}/> {sendingMsg ? 'Đang gửi...' : 'Gửi thử tin nhắn ngay'}
                </button>
              </div>
            </div>

            <div className="card" style={{fontSize:12, lineHeight:1.5, display:'flex', flexDirection:'column', gap:8}}>
              <div style={{fontWeight:600, color:'var(--text-bright)'}}>💡 Hướng dẫn kiểm thử:</div>
              <div>• Chọn bất kỳ khách hàng nào đang có trong danh sách đặt phòng.</div>
              <div>• Thay đổi mẫu tin nhắn và chèn các biến động như <code style={{color:'var(--text-bright)'}}>[TÊN_KHÁCH]</code>, <code style={{color:'var(--text-bright)'}}>[MÃ_ĐẶT_PHÒNG]</code>, <code style={{color:'var(--text-bright)'}}>[CHECK_IN]</code>, <code style={{color:'var(--text-bright)'}}>[CHECK_OUT]</code>.</div>
              <div>• Bấm nút gửi thử. Nhật ký tin nhắn sẽ lập tức cập nhật ở bên cạnh với trạng thái <strong style={{color:'#10b981'}}>Đã gửi thành công</strong>.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
