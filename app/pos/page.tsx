'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { initialInventory } from '@/lib/data';
import { roomTypes } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmtShort } from '@/lib/utils';
import { ShoppingCart, Clock, CheckCircle, Coins, ConciergeBell, Package, AlertTriangle, Coffee, Shirt, Utensils, Flower2, Map, Plane, Car } from 'lucide-react';

const serviceTypes = [
  { name: 'Minibar',        icon: Coffee,       price: 150000 },
  { name: 'Giặt ủi',        icon: Shirt,        price: 80000 },
  { name: 'Nhà hàng',       icon: Utensils,     price: 0 },
  { name: 'Spa',            icon: Flower2,      price: 500000 },
  { name: 'Tour du lịch',   icon: Map,          price: 250000 },
  { name: 'Đưa đón sân bay',icon: Plane,        price: 350000 },
  { name: 'Thuê xe',        icon: Car,          price: 600000 },
];

export default function POSPage() {
  const [activeTab, setActiveTab] = useState<'services'|'inventory'>('services');
  const { services, reservations, addService } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const pending  = services.filter(s=>s.status==='pending').length;
  const billed   = services.filter(s=>s.status==='billed').length;
  const totalRev = services.filter(s=>s.status==='billed').reduce((sum,s)=>sum+s.price*s.qty,0);
  const checkedinRes = reservations.filter(r=>r.status==='checkedin');

  const catLabels: Record<string,string> = { linens:'Chăn ga', amenity:'Vật dụng', beverage:'Đồ uống', supplies:'Vật tư' };

  const openAddService = (name: string, price: number) => {
    openModal(`Thêm dịch vụ: ${name}`, (
      <div>
        <div className="form-group"><label className="form-label">Đặt phòng (khách đang ở) *</label>
          <select id="svc_booking" className="form-select">
            {checkedinRes.map(r=><option key={r.id} value={r.id}>{r.id} – {r.guestName} (P.{r.roomId})</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Số lượng</label><input id="svc_qty" type="number" className="form-input" defaultValue={1} min={1}/></div>
          <div className="form-group"><label className="form-label">Đơn giá (VND)</label><input id="svc_price" type="number" className="form-input" defaultValue={price}/></div>
        </div>
        <div className="form-group"><label className="form-label">Ghi chú</label><textarea id="svc_note" className="form-textarea" style={{minHeight:60}} placeholder="Mô tả thêm..."/></div>
      </div>
    ), [
      { label: 'Thêm vào hóa đơn', cls: 'btn-primary', onClick: () => {
        const bkId  = (document.getElementById('svc_booking') as HTMLSelectElement)?.value;
        const qty   = +(document.getElementById('svc_qty') as HTMLInputElement)?.value;
        const price2= +(document.getElementById('svc_price') as HTMLInputElement)?.value;
        if (!bkId) { toast('Chưa có khách đang ở','warn'); return; }
        addService({ bookingId: bkId, name, qty, unit:'lần', price: price2, date:'2026-03-14', status:'pending' });
        closeModal(); toast(`Đã thêm dịch vụ ${name}!`,'success');
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  const openImport = (name: string) => {
    openModal(`Nhập kho: ${name}`, (
      <div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Số lượng nhập</label><input type="number" className="form-input" defaultValue={50} min={1}/></div>
          <div className="form-group"><label className="form-label">Nhà cung cấp</label><input type="text" className="form-input" placeholder="Công ty ABC"/></div>
        </div>
        <div className="form-group"><label className="form-label">Ghi chú</label><input type="text" className="form-input" placeholder="Lô hàng tháng 3..."/></div>
      </div>
    ), [
      { label: 'Lưu nhập kho', cls: 'btn-primary', onClick: () => { closeModal(); toast(`Đã nhập kho ${name}!`,'success'); }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  const lowStock = initialInventory.filter(i=>i.stock<=i.minStock);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><ShoppingCart size={22}/> Dịch vụ & Kho hàng</h1>
          <p className="page-subtitle">Quản lý dịch vụ đi kèm và xuất-nhập-tồn kho</p>
        </div>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
        <div className="stat-card">
          <div className="stat-icon warning"><Clock size={22}/></div>
          <div className="stat-info"><div className="stat-label">Chờ tính tiền</div><div className="stat-value">{pending}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={22}/></div>
          <div className="stat-info"><div className="stat-label">Đã tính</div><div className="stat-value">{billed}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Coins size={22}/></div>
          <div className="stat-info"><div className="stat-label">Doanh thu DV</div><div className="stat-value">{fmtShort(totalRev)}</div></div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${activeTab==='services'?' active':''}`} onClick={()=>setActiveTab('services')}><ConciergeBell size={15}/> Dịch vụ đi kèm</button>
        <button className={`tab-btn${activeTab==='inventory'?' active':''}`} onClick={()=>setActiveTab('inventory')}><Package size={15}/> Quản lý kho</button>
      </div>

      {activeTab==='services' && (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><span className="card-title">Thêm dịch vụ cho khách</span></div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {serviceTypes.map(s=>{
                const Icon = s.icon;
                return (
                  <button key={s.name} className="btn btn-ghost btn-sm" onClick={()=>openAddService(s.name,s.price)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'12px 16px',height:'auto'}}>
                    <Icon size={18}/>
                    <span>{s.name}</span>
                    {s.price>0&&<span style={{color:'#A5B4FC',fontSize:10}}>{fmtShort(s.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="card-header" style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}><span className="card-title">Danh sách dịch vụ</span></div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Mã DV</th><th>Mã ĐP</th><th>Dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {services.map(s=>(
                    <tr key={s.id}>
                      <td style={{fontWeight:600,color:'#A5B4FC'}}>{s.id}</td>
                      <td>{s.bookingId}</td>
                      <td style={{fontWeight:600}}>{s.name}</td>
                      <td>{s.qty} {s.unit}</td>
                      <td>{fmtShort(s.price)}</td>
                      <td style={{fontWeight:700,color:'#A5B4FC'}}>{fmtShort(s.price*s.qty)}</td>
                      <td style={{color:'var(--text-muted)'}}>{s.date}</td>
                      <td>{s.status==='billed'?<span className="badge badge-confirmed">Đã tính</span>:<span className="badge badge-pending">Chờ tính</span>}</td>
                      <td>{s.status==='pending'&&<button className="btn btn-primary btn-sm" onClick={()=>toast('Đã tính vào hóa đơn!','success')}>Tính tiền</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab==='inventory' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
            {lowStock.length>0&&(
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius-md)',fontSize:13}}>
                <AlertTriangle size={16} style={{color:'var(--color-danger)'}}/> <strong>{lowStock.length} mặt hàng</strong>&nbsp;sắp hết tồn kho
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost btn-sm">Nhập kho</button>
              <button className="btn btn-primary btn-sm" onClick={()=>toast('Đang mở form xuất kho...','info')}>Xuất kho</button>
            </div>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Tên hàng</th><th>Danh mục</th><th>Đơn vị</th><th>Tồn kho</th><th>Tối thiểu</th><th>Đơn giá</th><th>Giá trị tồn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {initialInventory.map(i=>{
                    const isLow=i.stock<=i.minStock;
                    return (
                      <tr key={i.id} style={{background:isLow?'rgba(239,68,68,0.04)':''}}>
                        <td style={{fontWeight:600}}>{i.name}</td>
                        <td style={{fontSize:12,color:'var(--text-muted)'}}>{catLabels[i.category]??i.category}</td>
                        <td>{i.unit}</td>
                        <td style={{fontWeight:700,fontSize:15,color:isLow?'var(--color-danger)':'var(--color-success)'}}>{i.stock}</td>
                        <td style={{color:'var(--text-muted)'}}>{i.minStock}</td>
                        <td>{fmtShort(i.cost)}</td>
                        <td style={{fontWeight:600}}>{fmtShort(i.stock*i.cost)}</td>
                        <td>{isLow?<span className="badge badge-maintenance">Sắp hết</span>:<span className="badge badge-vacant">Đủ</span>}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={()=>openImport(i.name)}>Nhập</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
