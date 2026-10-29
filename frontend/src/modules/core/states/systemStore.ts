import { create } from 'zustand';
import apiClient from '@modules/core/lib/apiClient';

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
  updated_at?: string;
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

  fetchPublicSettings: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateSettings: (payload: Partial<FullSystemSettings>) => Promise<FullSystemSettings>;
  uploadLogo: (file: File) => Promise<string>;
  resetLogo: () => Promise<void>;
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

  fetchNotifications: async () => {
    try {
      const res = await apiClient.get<SystemNotificationItem[]>('/system/notifications');
      if (res && Array.isArray(res.data)) {
        const list = res.data;
        const unread = list.filter((n) => !n.is_read).length;
        set({
          notifications: list,
          unreadCount: unread,
        });
      }
    } catch {
      // Keep existing
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
    // Refresh notifications after setting update (in case maintenance broadcast created)
    get().fetchNotifications();
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
}));
