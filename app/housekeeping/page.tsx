'use client';

import { useState } from 'react';
import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { roomTypeLabel, statusBadgeClass, statusLabel } from '@/lib/utils';
import { Sparkles, Wrench, CheckCircle, LayoutGrid, BedDouble, Package, ClipboardList } from 'lucide-react';
import type { RoomStatus } from '@/lib/types';

interface HousekeepingTask {
  id: number;
  room: string;
  type: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  time: string;
  done: boolean;
}

const initialTasks: HousekeepingTask[] = [
  { id: 1, room: '103', type: 'Vệ sinh toàn phần', assignee: 'Buồng phòng 1', priority: 'high', time: '08:00', done: true },
  { id: 2, room: '204', type: 'Thay ga, khăn',     assignee: 'Buồng phòng 1', priority: 'high', time: '09:00', done: true },
  { id: 3, room: '304', type: 'Vệ sinh toàn phần', assignee: 'Buồng phòng 2', priority: 'high', time: '10:00', done: false },
  { id: 4, room: '106', type: 'Sửa điều hòa',      assignee: 'Kỹ thuật',       priority: 'medium', time: '11:00', done: false },
  { id: 5, room: '301', type: 'Bổ sung minibar',   assignee: 'Buồng phòng 1', priority: 'low',    time: '14:00', done: false },
];
const priorityColor = { high:'var(--color-danger)', medium:'var(--color-warning)', low:'var(--color-info)' };
const priorityLabel = { high:'Cao', medium:'Trung bình', low:'Thấp' };

export default function HousekeepingPage() {
  const [activeTab, setActiveTab] = useState<'rooms'|'supplies'|'tasks'>('rooms');
  const { rooms, updateRoomStatus, inventory, adjustInventory } = useHotel();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const cleaning    = rooms.filter(r=>r.status==='cleaning').length;
  const maintenance = rooms.filter(r=>r.status==='maintenance').length;
  const vacant      = rooms.filter(r=>r.status==='vacant').length;

  // Load tasks from localStorage on mount, fallback to initialTasks
  const [tasks, setTasks] = useState<HousekeepingTask[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotelOS:housekeeping_tasks');
      if (stored) {
        try {
          return JSON.parse(stored) as HousekeepingTask[];
        } catch (e) {}
      }
    }
    return initialTasks;
  });

  const saveTasks = (newTasks: typeof initialTasks) => {
    setTasks(newTasks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotelOS:housekeeping_tasks', JSON.stringify(newTasks));
    }
  };

  const toggleTask = (id: number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTasks(updated);
    toast('Đã cập nhật trạng thái công việc!', 'success');
  };

  const deleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    toast('Đã xóa công việc thành công!', 'success');
  };

  const openAddTask = () => {
    openModal('Thêm công việc hôm nay', (
      <div>
        <div className="form-group">
          <label className="form-label">Chọn phòng *</label>
          <select id="task_room" className="form-select">
            {rooms.map(r => <option key={r.id} value={r.id}>Phòng {r.id} ({roomTypeLabel[r.type] || r.type})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Loại công việc *</label>
          <input id="task_type" type="text" className="form-input" placeholder="Vệ sinh phòng, Sửa vòi nước, Thay ga giường..."/>
        </div>
        <div className="form-group">
          <label className="form-label">Nhân viên thực hiện *</label>
          <input id="task_assignee" type="text" className="form-input" placeholder="Buồng phòng 1, Kỹ thuật..."/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Giờ thực hiện</label>
            <input id="task_time" type="time" className="form-input" defaultValue="09:00"/>
          </div>
          <div className="form-group">
            <label className="form-label">Mức độ ưu tiên</label>
            <select id="task_priority" className="form-select">
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
        </div>
      </div>
    ), [
      { label: 'Thêm mới', cls: 'btn-primary', onClick: () => {
        const room = (document.getElementById('task_room') as HTMLSelectElement)?.value;
        const type = (document.getElementById('task_type') as HTMLInputElement)?.value.trim();
        const assignee = (document.getElementById('task_assignee') as HTMLInputElement)?.value.trim();
        const time = (document.getElementById('task_time') as HTMLInputElement)?.value;
        const priority = (document.getElementById('task_priority') as HTMLSelectElement)?.value as any;

        if (!room || !type || !assignee) {
          toast('Vui lòng điền các trường bắt buộc (*)', 'warn');
          return;
        }

        const newTask = {
          id: Date.now(),
          room,
          type,
          assignee,
          time: time || '09:00',
          priority,
          done: false
        };

        saveTasks([newTask, ...tasks]);
        closeModal();
        toast('Đã thêm công việc mới thành công!', 'success');
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal }
    ]);
  };

  const openAddSupply = () => {
    openModal('Nhập vật tư kho', (
      <div>
        <div className="form-group">
          <label className="form-label">Chọn vật tư</label>
          <select id="hk_inv_item" className="form-select">
            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Số lượng nhập</label><input id="hk_inv_qty" type="number" className="form-input" defaultValue={50} min={1}/></div>
      </div>
    ), [
      { label: 'Lưu', cls: 'btn-primary', onClick: async () => {
        const itemId = (document.getElementById('hk_inv_item') as HTMLSelectElement)?.value;
        const qty = +(document.getElementById('hk_inv_qty') as HTMLInputElement)?.value;
        if (!itemId || !qty) return;
        try {
          await adjustInventory(itemId, qty);
          closeModal();
          toast('Đã cập nhật vật tư kho!', 'success');
        } catch (e: any) {
          toast(e.message, 'error');
        }
      }},
      { label: 'Hủy', cls: 'btn-ghost', onClick: closeModal },
    ]);
  };

  const catLabels: Record<string, string> = { linens:'Ga/Chăn/Khăn', amenity:'Vật dụng', beverage:'Đồ uống', supplies:'Vật tư khác' };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Sparkles size={22}/> Quản lý Buồng phòng</h1>
          <p className="page-subtitle">Cập nhật trạng thái vệ sinh và quản lý vật tư phòng</p>
        </div>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        <div className="stat-card">
          <div className="stat-icon warning"><Sparkles size={22}/></div>
          <div className="stat-info"><div className="stat-label">Đang dọn</div><div className="stat-value">{cleaning}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><Wrench size={22}/></div>
          <div className="stat-info"><div className="stat-label">Đang sửa</div><div className="stat-value">{maintenance}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={22}/></div>
          <div className="stat-info"><div className="stat-label">Sẵn sàng</div><div className="stat-value">{vacant}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><LayoutGrid size={22}/></div>
          <div className="stat-info"><div className="stat-label">Tổng phòng</div><div className="stat-value">{rooms.length}</div></div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${activeTab==='rooms'?' active':''}`} onClick={()=>setActiveTab('rooms')}><BedDouble size={15}/> Trạng thái phòng</button>
        <button className={`tab-btn${activeTab==='supplies'?' active':''}`} onClick={()=>setActiveTab('supplies')}><Package size={15}/> Vật tư phòng</button>
        <button className={`tab-btn${activeTab==='tasks'?' active':''}`} onClick={()=>setActiveTab('tasks')}><ClipboardList size={15}/> Công việc hôm nay</button>
      </div>

      {activeTab==='rooms' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:14}}>
          {rooms.map(rm => {
            const statusColors: Record<string,string> = { vacant:'var(--room-vacant)', occupied:'var(--room-occupied)', cleaning:'var(--room-cleaning)', maintenance:'var(--room-maintenance)', reserved:'var(--room-reserved)' };
            return (
              <div key={rm.id} className="card" style={{borderTop:`2px solid ${statusColors[rm.status] ?? 'var(--border)'}`,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:800}}>Phòng {rm.id}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{roomTypeLabel[rm.type]} · Tầng {rm.floor}</div>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <span className={`badge ${statusBadgeClass(rm.status)}`}>{statusLabel[rm.status]}</span>
                  {rm.guest&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{rm.guest}</div>}
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {rm.status==='cleaning' && <button className="btn btn-primary btn-sm" onClick={()=>{updateRoomStatus(rm.id,'vacant');toast(`Phòng ${rm.id} đã dọn xong!`,'success');}}>Đã dọn xong</button>}
                  {rm.status==='vacant'   && <button className="btn btn-dark btn-sm" onClick={()=>{updateRoomStatus(rm.id,'cleaning');toast(`Phòng ${rm.id} đang dọn`,'info');}}>Bắt đầu dọn</button>}
                  {rm.status!=='maintenance'&&rm.status!=='occupied' && <button className="btn btn-ghost btn-sm" onClick={()=>{updateRoomStatus(rm.id,'maintenance');toast(`Phòng ${rm.id} chuyển sang sửa chữa`,'warn');}}>Sửa chữa</button>}
                  {rm.status==='maintenance' && <button className="btn btn-primary btn-sm" onClick={()=>{updateRoomStatus(rm.id,'vacant');toast(`Phòng ${rm.id} đã sửa xong!`,'success');}}>Sửa xong</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab==='supplies' && (
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
            <button className="btn btn-primary btn-sm" onClick={openAddSupply}>+ Nhập vật tư</button>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Tên vật tư</th><th>Danh mục</th><th>Đơn vị</th><th style={{textAlign:'right'}}>Tồn kho</th><th style={{textAlign:'right'}}>Tối thiểu</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {inventory.map(i=>(
                    <tr key={i.id}>
                      <td style={{fontWeight:600}}>{i.name}</td>
                      <td style={{color:'var(--text-muted)'}}>{catLabels[i.category]??i.category}</td>
                      <td>{i.unit}</td>
                      <td style={{fontWeight:700,fontSize:15,color:i.stock<=i.minStock?'var(--color-danger)':'var(--color-success)',textAlign:'right'}}>{i.stock}</td>
                      <td style={{color:'var(--text-muted)',textAlign:'right'}}>{i.minStock}</td>
                      <td>{i.stock<=i.minStock?<span className="badge badge-maintenance">Sắp hết</span>:<span className="badge badge-vacant">Đủ</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab==='tasks' && (
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
            <button className="btn btn-primary btn-sm" onClick={openAddTask}>+ Thêm công việc</button>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Phòng</th><th>Công việc</th><th>Nhân viên</th><th>Giờ</th><th>Mức độ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {tasks.map(t=>(
                    <tr key={t.id} style={{opacity:t.done?0.5:1}}>
                      <td><strong>P.{t.room}</strong></td>
                      <td>{t.type}</td>
                      <td style={{color:'var(--text-secondary)'}}>{t.assignee}</td>
                      <td>{t.time}</td>
                      <td><span style={{color:priorityColor[t.priority],fontWeight:700,fontSize:12}}>{priorityLabel[t.priority]}</span></td>
                      <td>{t.done?<span className="badge badge-confirmed">Hoàn thành</span>:<span className="badge badge-pending">Chưa xong</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!t.done && <button className="btn btn-primary btn-sm" onClick={()=>toggleTask(t.id)}>Xong</button>}
                          {t.done && <button className="btn btn-ghost btn-sm" onClick={()=>toggleTask(t.id)} style={{ color: 'var(--text-muted)' }}>Chưa xong</button>}
                          <button className="btn btn-ghost btn-sm" style={{color:'var(--color-danger)'}} onClick={()=>deleteTask(t.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
