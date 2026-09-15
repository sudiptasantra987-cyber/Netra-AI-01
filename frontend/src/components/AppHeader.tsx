import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Eye, Languages, Menu, PhoneCall, X, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  activeTab?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  setActiveTab: (tab: string) => void;
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  subtitle, 
  activeTab,
  isSidebarOpen,
  onToggleSidebar,
  onOpenMobileMenu,
  setActiveTab 
}) => {
  const { user, language, setLanguage } = useAuth();

  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, activeTab]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationPanelOpen &&
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setIsNotificationPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationPanelOpen]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
    } catch (e) {
      console.error(e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch (e) {
      console.error(e);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleCompleteProfile = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
    } catch (e) {
      console.error(e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    setIsNotificationPanelOpen(false);
    setActiveTab('profile');
  };

  const displayName = user?.name || 'User';
  const firstName = displayName.split(' ')[0] || 'User';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200/90 bg-white px-3 py-3 shadow-xs sm:px-8 sm:py-4">
      {/* Top-Left: Menu (☰) Toggle Button, Logo, & Section Title / Greeting */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* Universal Menu (☰) Button for Desktop and Mobile */}
        <button
          type="button"
          onClick={onToggleSidebar || onOpenMobileMenu}
          className="p-2 sm:p-2.5 rounded-xl text-[#071426] hover:text-[#0756B8] hover:bg-[#F1F6FC] border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#19C7E8] shrink-0"
          title={isSidebarOpen ? "Close menu" : "Open menu (☰)"}
          aria-label="Toggle navigation sidebar"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-2 shrink-0 transition-transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-[#19C7E8] rounded-xl p-1"
          title="Netra AI Home"
          aria-label="Go to Netra AI Home"
        >
          <img
            src="/netra-ai-logo-transparent.png"
            alt="Netra AI"
            className="h-9 w-auto object-contain"
          />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-[#071426] sm:text-2xl">
            {title || `Good Morning, ${firstName}`}
          </h1>
          <p className="hidden text-xs font-medium text-slate-500 sm:block sm:text-sm">
            {subtitle || 'Take care of your eyes. They help you see the world.'}
          </p>
        </div>
      </div>

      {/* Right Controls: SOS, Language, Notification, Profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Language selector */}
        <div className="hidden sm:flex items-center bg-[#F1F6FC] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Languages className="w-3.5 h-3.5 text-[#0756B8] mr-1.5" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent outline-none cursor-pointer text-xs font-semibold text-slate-700"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="bn">বাংলা</option>
          </select>
        </div>

        {/* Emergency SOS Call */}
        <a
          href="tel:112"
          className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all shadow-2xs"
          title="Ocular Emergency: Call 112"
        >
          <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>SOS: 112</span>
        </a>

        {/* Notification Bell & Panel */}
        <div ref={notificationPanelRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationPanelOpen((isOpen) => !isOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-[#F1F6FC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:ring-offset-2"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={isNotificationPanelOpen}
            aria-controls="netra-notification-panel"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0756B8] text-[10px] font-extrabold text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationPanelOpen && (
            <div
              id="netra-notification-panel"
              role="dialog"
              aria-label="Notifications"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsNotificationPanelOpen(false);
              }}
              className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-[#071426]">Notifications</h2>
                  <p className="text-[11px] text-slate-500">
                    {unreadCount ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'You are all caught up'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#0756B8] hover:bg-[#F1F6FC]"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotificationPanelOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                        notification.is_read ? 'bg-white' : 'bg-[#edf5ff]/60'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-[#d7e7fe] text-[#0756B8]'
                      }`}>
                        {notification.type === 'profile_completion' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-bold text-[#071426]">{notification.title}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">{formatTimeAgo(notification.created_at)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{notification.message}</p>
                        
                        {notification.type === 'profile_completion' && !notification.is_read && (
                          <button
                            type="button"
                            onClick={() => handleCompleteProfile(notification.id)}
                            className="mt-2 inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-[#0756B8] hover:bg-[#054494] text-white font-semibold text-[11px] shadow-2xs transition-colors"
                          >
                            <span>Complete Profile</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-end justify-between">
                        {!notification.is_read ? (
                          <button
                            type="button"
                            onClick={() => markNotificationAsRead(notification.id)}
                            title="Mark as read"
                            className="h-2.5 w-2.5 rounded-full bg-[#19C7E8] ring-2 ring-[#bcdbff] cursor-pointer"
                            aria-label="Mark as read"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="group flex cursor-pointer items-center space-x-2 pl-0 sm:space-x-2.5 sm:pl-2"
          title="Click to View Profile"
        >
          <div className="w-9 h-9 rounded-full bg-[#0756B8] border-2 border-[#19C7E8] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            {userInitial}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-[#071426] group-hover:text-[#0756B8] leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] font-semibold text-[#0756B8] capitalize">
              {user?.role || 'Patient'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
