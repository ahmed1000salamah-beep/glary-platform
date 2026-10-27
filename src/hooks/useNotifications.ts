import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlatformNotification } from '../types';
import { storageService } from '../services/storage';
import { NotificationFilterContext, isNotificationRelevantForUser } from '../utils/notificationFilter';
import { notificationSound } from '../utils/notificationSound';

export function useNotifications(userContext?: NotificationFilterContext) {
  const [allNotifications, setAllNotifications] = useState<PlatformNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activeToast, setActiveToast] = useState<PlatformNotification | null>(null);

  const loadNotifications = useCallback(() => {
    const list = storageService.getNotifications();
    setAllNotifications(list);
  }, []);

  useEffect(() => {
    loadNotifications();

    const handleStorageChanged = () => {
      loadNotifications();
    };

    const handleNotificationAdded = (e: any) => {
      loadNotifications();
      const notif = e.detail as PlatformNotification;
      if (notif) {
        // Only trigger toast if relevant for this user
        if (!userContext || isNotificationRelevantForUser(notif, userContext)) {
          showLocalNotification(notif.title, notif.body);
        }
      }
    };

    window.addEventListener('glary_notification_added', handleNotificationAdded);
    window.addEventListener('glary_storage_changed', handleStorageChanged);
    window.addEventListener('storage', handleStorageChanged);

    const storedEnabled = typeof window !== 'undefined' ? localStorage.getItem('glry_notifications_enabled') === 'true' : false;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' || storedEnabled) {
        setPermission('granted');
      } else {
        setPermission(Notification.permission);
      }
    } else if (storedEnabled) {
      setPermission('granted');
    }

    return () => {
      window.removeEventListener('glary_notification_added', handleNotificationAdded);
      window.removeEventListener('glary_storage_changed', handleStorageChanged);
      window.removeEventListener('storage', handleStorageChanged);
    };
  }, [loadNotifications, userContext]);

  // Notifications filtered exclusively for the active user (Group, Grade, Student, or Parent)
  const notifications = useMemo(() => {
    if (!userContext) return allNotifications;
    return allNotifications.filter((n) => isNotificationRelevantForUser(n, userContext));
  }, [allNotifications, userContext]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const res = await Notification.requestPermission();
          if (res === 'granted') {
            setPermission('granted');
          }
        } catch (nativeErr) {
          console.info('Native Notification API restricted (likely inside iframe), falling back to in-app alerts:', nativeErr);
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('glry_notifications_enabled', 'true');
      }
      setPermission('granted');

      showLocalNotification(
        'تم تفعيل الإشعارات بنجاح 🔔',
        'التنبيهات الفورية مفعّلة الآن! ستصلك إشعارات درجات الامتحانات، حضور المحاضرات، ودرجات التسميع فور رصدها.'
      );
      return true;
    } catch (e) {
      console.warn('Error activating notifications:', e);
      setPermission('granted');
      return true;
    }
  };

  const showLocalNotification = (title: string, body: string, icon = '/icon.svg') => {
    // 0. Play audible chime alert if enabled
    notificationSound.playNotificationChime();

    // 1. In-app toast popup
    const tempNotif: PlatformNotification = {
      id: `toast-${Date.now()}`,
      title,
      body,
      date: 'الآن',
      read: false,
      type: 'announcement'
    };
    setActiveToast(tempNotif);
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === tempNotif.id ? null : curr));
    }, 5500);

    // 2. Native Web Notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon,
              badge: '/icon.svg',
              dir: 'rtl',
              lang: 'ar',
            } as NotificationOptions);
          });
        } else {
          new Notification(title, {
            body,
            icon,
            dir: 'rtl',
            lang: 'ar'
          });
        }
      } catch (err) {
        console.warn('Could not display system notification:', err);
      }
    }
  };

  const markAsRead = (id: string) => {
    storageService.markNotificationRead(id);
    loadNotifications();
  };

  return {
    notifications,
    unreadCount,
    permission,
    activeToast,
    closeToast: () => setActiveToast(null),
    requestPermission,
    showLocalNotification,
    refreshNotifications: loadNotifications,
    markAsRead,
  };
}
