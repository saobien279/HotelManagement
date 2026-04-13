'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { activityLog, roomTypes } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort } from '@/lib/utils';
import { Settings, Users, Building, List, Globe, Plus, Edit2, Lock, Unlock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'users'|'rooms'|'log'|'channel'>('users');
  const { users, addUser, updateUser } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

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
      { label: 'Tạo tài khoản', cls: 'btn-primary', onClick: () => {
        const name     = (document.getElementById('nu_name') as HTMLInputElement)?.value.trim();
        const username = (document.getElementById('nu_username') as HTMLInputElement)?.value.trim();
        if (!name||!username) { toast('Vui lòng điền đầy đủ','warn'); return; }
        addUser({ name, username, role:(document.getElementById('nu_role') as HTMLSelectElement)?.value as any, status:'active', lastLogin:'—' });
        closeModal(); toast(`Tài khoản ${name} đã được tạo!`,'success');
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
      { label: 'Lưu thay đổi', cls: 'btn-primary', onClick: () => {
        updateUser(id, { name:(document.getElementById('eu_name') as HTMLInputElement)?.value, role:(document.getElementById('eu_role') as HTMLSelectElement)?.value as any });
        closeModal(); toast('Đã cập nhật người dùng!','success');
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  const channels = [
    { name:'Booking.com', connected:true,  rooms:12, lastSync:'15:05 hôm nay' },
    { name:'Agoda',       connected:true,  rooms:12, lastSync:'15:05 hôm nay' },
    { name:'Expedia',     connected:false, rooms:0,  lastSync:'Chưa kết nối' },
    { name:'Airbnb',      connected:false, rooms:0,  lastSync:'Chưa kết nối' },
  ];

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
        <button className={`tab-btn${activeTab==='channel'?' active':''}`} onClick={()=>setActiveTab('channel')}><Globe size={15}/> Channel Manager</button>
      </div>

      {/* ── USERS ── */}
      {activeTab==='users' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,alignItems:'center'}}>
            <div className="section-label">Danh sách tài khoản</div>
            <button className="btn btn-primary btn-sm" onClick={openAddUser}><Plus size={14}/> Thêm người dùng</button>
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
                            <button className="btn btn-ghost btn-sm" onClick={()=>editUser(u.id)}><Edit2 size={13}/></button>
                            {u.role!=='admin'&&<button className="btn btn-ghost btn-sm" onClick={()=>{updateUser(u.id,{status:u.status==='active'?'inactive':'active'});toast(`Tài khoản ${u.name} đã ${u.status==='active'?'khóa':'mở'}!`,'success');}}>
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
            <div className="filter-input-wrapper"><span className="filter-icon"><Settings size={14}/></span><input type="text" className="filter-input" placeholder="Tìm kiếm thao tác..."/></div>
            <select className="filter-select"><option>Tất cả loại</option><option>Check-in/out</option><option>Đặt phòng</option><option>Hủy</option></select>
            <select className="filter-select"><option>Hôm nay</option><option>7 ngày qua</option><option>30 ngày qua</option></select>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Loại</th><th>Nội dung thao tác</th></tr></thead>
                <tbody>
                  {activityLog.map(l=>(
                    <tr key={l.id}>
                      <td style={{whiteSpace:'nowrap',color:'var(--text-muted)',fontSize:12}}>{l.date} {l.time}</td>
                      <td><span style={{fontWeight:600}}>{l.user}</span></td>
                      <td><span style={{color:typeColors[l.type]??'var(--text-muted)',fontSize:12,fontWeight:600}}>{l.type}</span></td>
                      <td style={{fontSize:13}}>{l.action}</td>
                    </tr>
                  ))}
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
            <div className="card-header"><span className="card-title">Kênh phân phối (OTA)</span><span className="badge badge-confirmed">Tự động đồng bộ</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
              {channels.map(ch=>(
                <div key={ch.name} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-lg)',padding:18,border:`2px solid ${ch.connected?'rgba(16,185,129,0.3)':'var(--border)'}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <Globe size={22} style={{color:ch.connected?'#6EE7B7':'var(--text-muted)'}}/>
                    <span style={{fontWeight:700,fontSize:15}}>{ch.name}</span>
                    <span className={`badge ${ch.connected?'badge-confirmed':'badge-muted'}`} style={{marginLeft:'auto'}}>{ch.connected?'Kết nối':'Chưa'}</span>
                  </div>
                  {ch.connected?(
                    <>
                      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{ch.rooms} phòng đồng bộ</div>
                      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>{ch.lastSync}</div>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>toast(`Đang đồng bộ ${ch.name}...`,'info')}>Đồng bộ ngay</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>toast('Mở cài đặt','info')}>Cài đặt</button>
                      </div>
                    </>
                  ):(
                    <>
                      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Chưa tích hợp kênh này</div>
                      <button className="btn btn-primary btn-sm" onClick={()=>toast(`Mở cửa sổ kết nối ${ch.name}...`,'info')}>Kết nối</button>
                    </>
                  )}
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
    </>
  );
}
