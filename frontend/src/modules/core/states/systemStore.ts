import { create } from 'zustand';
import apiClient from '@modules/core/lib/apiClient';
import { soundEffects } from '@modules/core/lib/soundEffects';

export interface SystemNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  is_broadcast: boolean;
  is_read: boolean;
  created_at: string;
}

export interface PublicSystemSettings {
  site_name: string;
  site_title: string;
  site_desc: string;
  brand_logo_url: string | null;
  favicon_url: string | null;
  default_lang: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export interface FullSystemSettings extends PublicSystemSettings {
  auto_backup: boolean;
  email_notif: boolean;
  webhook_url?: string;
  google_client_id?: string;
  google_client_secret?: string;
  telegram_bot_username?: string;
  telegram_bot_token?: string;
  updated_at?: string;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  timestamp: number;
}

interface SystemState {
  siteName: string;
  siteTitle: string;
  siteDesc: string;
  brandLogoUrl: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  notifications: SystemNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  activeToast: ToastAlert | null;
  knownNotificationIds: Set<string>;

  fetchPublicSettings: () => Promise<void>;
  fetchNotifications: (silent?: boolean) => Promise<void>;
  pollSystemUpdates: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateSettings: (payload: Partial<FullSystemSettings>) => Promise<FullSystemSettings>;
  uploadLogo: (file: File) => Promise<string>;
  resetLogo: () => Promise<void>;
  broadcastNotification: (title: string, message: string, type?: 'info' | 'warning' | 'danger' | 'success') => Promise<void>;
  dismissToast: () => void;
  playTestChime: () => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  siteName: 'VeloX AI Gateway',
  siteTitle: 'VeloX — AI Studio & Gateway',
  siteDesc: 'Nền tảng trung gian AI Gateway thế hệ mới',
  brandLogoUrl: null,
  maintenanceMode: false,
  maintenanceMessage: 'Hệ thống đang trong thời gian bảo trì nâng cấp. Mọi tiến trình AI và API tạm dừng. Vui lòng quay lại sau!',
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isInitialized: false,
  activeToast: null,
  knownNotificationIds: new Set<string>(),

  playTestChime: () => {
    soundEffects.playNotificationChime();
  },

  dismissToast: () => {
    set({ activeToast: null });
  },

  fetchPublicSettings: async () => {
    try {
      const res = await apiClient.get<PublicSystemSettings>('/system/public-settings');
      if (res && res.data) {
        const d = res.data;
        set({
          siteName: d.site_name || 'VeloX AI Gateway',
          siteTitle: d.site_title || 'VeloX — AI Studio & Gateway',
          siteDesc: d.site_desc || '',
          brandLogoUrl: d.brand_logo_url || null,
          maintenanceMode: Boolean(d.maintenance_mode),
          maintenanceMessage: d.maintenance_message || 'Hệ thống đang trong thời gian bảo trì nâng cấp.',
        });

        // Dynamic Document Title
        if (d.site_name) {
          document.title = `${d.site_name} — AI Studio & Gateway`;
        }
      }
    } catch {
      // Fallback silently if offline
    }
  },

  fetchNotifications: async (silent = false) => {
    try {
      const res = await apiClient.get<SystemNotificationItem[]>('/system/notifications');
      if (res && Array.isArray(res.data)) {
        const list = res.data;
        const unread = list.filter((n) => !n.is_read).length;
        const currentKnown = get().knownNotificationIds;

        // If not silent and initialized, detect newly created notifications
        if (!silent && get().isInitialized && currentKnown.size > 0) {
          const freshItems = list.filter((n) => !currentKnown.has(n.id));
          if (freshItems.length > 0) {
            // Ring the chime sound!
            soundEffects.playNotificationChime();

            // Display top toast for the newest update
            const newest = freshItems[0];
            set({
              activeToast: {
                id: newest.id,
                title: newest.title,
                message: newest.message,
                type: newest.type,
                timestamp: Date.now(),
              },
            });
          }
        }

        const newKnownSet = new Set(list.map((n) => n.id));
        set({
          notifications: list,
          unreadCount: unread,
          knownNotificationIds: newKnownSet,
        });
      }
    } catch {
      // Keep existing
    }
  },

  pollSystemUpdates: async () => {
    try {
      const prevState = get();

      // 1. Fetch public settings
      const settingsRes = await apiClient.get<PublicSystemSettings>('/system/public-settings');
      if (settingsRes && settingsRes.data) {
        const d = settingsRes.data;
        const prevMaint = prevState.maintenanceMode;
        const nextMaint = Boolean(d.maintenance_mode);

        set({
          siteName: d.site_name || 'VeloX AI Gateway',
          siteTitle: d.site_title || 'VeloX — AI Studio & Gateway',
          siteDesc: d.site_desc || '',
          brandLogoUrl: d.brand_logo_url || null,
          maintenanceMode: nextMaint,
          maintenanceMessage: d.maintenance_message || 'Hệ thống đang trong thời gian bảo trì nâng cấp.',
        });

        if (d.site_name) {
          document.title = `${d.site_name} — AI Studio & Gateway`;
        }

        // Maintenance state transition notification & audio chime
        if (prevState.isInitialized) {
          if (!prevMaint && nextMaint) {
            // Maintenance turned ON by admin
            soundEffects.playMaintenanceAlertSound();
            set({
              activeToast: {
                id: `maint-on-${Date.now()}`,
                title: '⚠️ Hệ Thống Bắt Đầu Bảo Trì',
                message: d.maintenance_message || 'Admin vừa kích hoạt chế độ bảo trì hệ thống. Mọi tiến trình tạm dừng.',
                type: 'danger',
                timestamp: Date.now(),
              },
            });
          } else if (prevMaint && !nextMaint) {
            // Maintenance turned OFF by admin
            soundEffects.playNotificationChime();
            set({
              activeToast: {
                id: `maint-off-${Date.now()}`,
                title: '✅ Hệ Thống Đã Hoạt Động Bình Thường',
                message: 'Admin đã hoàn tất quá trình bảo trì. Tất cả dịch vụ AI đã sẵn sàng phục vụ!',
                type: 'success',
                timestamp: Date.now(),
              },
            });
          }
        }
      }

      // 2. Fetch notifications
      const notifRes = await apiClient.get<SystemNotificationItem[]>('/system/notifications');
      if (notifRes && Array.isArray(notifRes.data)) {
        const list = notifRes.data;
        const unread = list.filter((n) => !n.is_read).length;
        const currentKnown = prevState.knownNotificationIds;

        if (prevState.isInitialized && currentKnown.size > 0) {
          const freshItems = list.filter((n) => !currentKnown.has(n.id));
          if (freshItems.length > 0) {
            // Ring the notification chime!
            soundEffects.playNotificationChime();

            const newest = freshItems[0];
            set({
              activeToast: {
                id: newest.id,
                title: newest.title,
                message: newest.message,
                type: newest.type,
                timestamp: Date.now(),
              },
            });
          }
        }

        const newKnownSet = new Set(list.map((n) => n.id));
        set({
          notifications: list,
          unreadCount: unread,
          knownNotificationIds: newKnownSet,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      // Silent error during periodic polling
      set({ isInitialized: true });
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiClient.post('/system/notifications/mark-all-read');
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map((n: SystemNotificationItem) => ({ ...n, is_read: true })),
      }));
    } catch {
      // Optimistic update
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map((n: SystemNotificationItem) => ({ ...n, is_read: true })),
      }));
    }
  },

  updateSettings: async (payload) => {
    const res = await apiClient.put<FullSystemSettings>('/system/settings', payload);
    const d = res.data;
    set({
      siteName: d.site_name,
      siteTitle: d.site_title,
      siteDesc: d.site_desc,
      brandLogoUrl: d.brand_logo_url || null,
      maintenanceMode: Boolean(d.maintenance_mode),
      maintenanceMessage: d.maintenance_message,
    });
    if (d.site_name) {
      document.title = `${d.site_name} — AI Studio & Gateway`;
    }
    // Refresh notifications after setting update
    get().fetchNotifications(true);
    return d;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ status: string; logo_url: string }>('/system/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const logoUrl = res.data.logo_url;
    set({ brandLogoUrl: logoUrl });
    return logoUrl;
  },

  resetLogo: async () => {
    await apiClient.delete('/system/brand-logo');
    set({ brandLogoUrl: null });
  },

  broadcastNotification: async (title: string, message: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') => {
    await apiClient.post('/system/notifications', {
      title,
      message,
      type,
      is_broadcast: true,
    });
    // Immediately play chime for admin and refresh
    soundEffects.playNotificationChime();
    get().fetchNotifications(true);
  },
}));
