import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Eye, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';

interface NotificationsPageProps {
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
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

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  setActiveTab,
  onBack 
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (notif: NotificationItem) => {
    await handleMarkAsRead(notif.id);
    if (
      notif.action_url === '/reports' || 
      notif.type === 'report_reviewed' || 
      notif.type === 'report_finalized' || 
      notif.title.toLowerCase().includes('report') || 
      notif.message.toLowerCase().includes('report')
    ) {
      setActiveTab('reports');
    } else if (notif.type === 'profile_completion') {
      setActiveTab('profile');
    } else if (notif.action_url) {
      setActiveTab(notif.action_url.replace(/^\//, ''));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n) => !n.is_read) 
    : notifications;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight">
              Notifications
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Screening reports, clinician updates, and care alerts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-[#0756B8]" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0756B8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs / Filter Filter Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-[#0756B8] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-[#0756B8] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="card-clean p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0756B8]" />
          <p className="text-xs">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card-clean p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F1F6FC] text-[#0756B8] flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#071426]">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have reviewed all your clinical notifications.'
              : 'When a doctor finalizes your retinal screening report or clinical notes are updated, notifications will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isReport = 
              notif.action_url === '/reports' || 
              notif.type === 'report_reviewed' || 
              notif.type === 'report_finalized' || 
              notif.title.toLowerCase().includes('report') || 
              notif.message.toLowerCase().includes('report');

            return (
              <div
                key={notif.id}
                className={`card-clean p-4 sm:p-5 flex items-start justify-between gap-4 transition-all hover:border-[#0756B8] shadow-2xs ${
                  notif.is_read ? 'bg-white' : 'bg-[#edf5ff]/50 border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.is_read 
                      ? 'bg-slate-100 text-slate-500' 
                      : 'bg-[#0756B8] text-white shadow-xs'
                  }`}>
                    {isReport ? (
                      <Eye className="w-5 h-5" />
                    ) : notif.type === 'profile_completion' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-[#071426] truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="pt-2 flex items-center space-x-2">
                      {isReport && (
                        <button
                          type="button"
                          onClick={() => handleAction(notif)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-2xs transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Screening Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {notif.type === 'profile_completion' && (
                        <button
                          type="button"
                          onClick={() => handleAction(notif)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-2xs transition-all"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Complete Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#19C7E8] shrink-0 mt-2 ring-2 ring-[#bcdbff]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
