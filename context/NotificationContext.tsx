'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useHotel } from './HotelContext';
import { TODAY } from '@/lib/utils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'checkin' | 'booking' | 'inventory' | 'checkout' | 'system' | 'housekeeping';
  time: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { activityLog, reservations, inventory } = useHotel();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  // Load read status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hotelOS:readNotifs');
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch(e) {}
  }, []);

  const notifications = useMemo(() => {
    const notifs: AppNotification[] = [];
    
    // 1. Checkout due today
    reservations.forEach(r => {
      if (r.status === 'checkedin' && r.checkOut === TODAY) {
        notifs.push({
          id: `co-${r.id}`,
          title: 'Check-out đến hạn',
          message: `Phòng ${r.roomId || '?'} (${r.guestName}) cần check-out hôm nay.`,
          type: 'checkout',
          time: 'Hôm nay',
          read: readIds.has(`co-${r.id}`)
        });
      }
    });

    // 2. Low inventory
    inventory.forEach(item => {
      if (item.stock <= item.minStock) {
        notifs.push({
          id: `inv-${item.id}`,
          title: 'Hàng sắp hết tồn',
          message: `${item.name} còn ${item.stock} ${item.unit} (Tối thiểu: ${item.minStock}).`,
          type: 'inventory',
          time: 'Hệ thống',
          read: readIds.has(`inv-${item.id}`)
        });
      }
    });

    // 3. Activity logs (checkin, booking, housekeeping)
    activityLog.forEach(log => {
      if (log.date === TODAY && (log.type === 'checkin' || log.type === 'booking' || log.type === 'housekeeping')) {
        let title = 'Đặt phòng mới';
        if (log.type === 'checkin') title = 'Check-in mới';
        if (log.type === 'housekeeping') title = 'Cập nhật buồng phòng';

        notifs.push({
          id: `log-${log.id}`,
          title,
          message: log.action,
          type: log.type as any,
          time: log.time,
          read: readIds.has(`log-${log.id}`)
        });
      }
    });
    
    return notifs.sort((a, b) => b.id.localeCompare(a.id)); 
  }, [activityLog, reservations, inventory, readIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    localStorage.setItem('hotelOS:readNotifs', JSON.stringify(Array.from(newSet)));
  };

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    saveReadIds(next);
  };

  const markAllAsRead = () => {
    saveReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, unreadCount, markAsRead, markAllAsRead,
      isDropdownOpen, setDropdownOpen 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
}
