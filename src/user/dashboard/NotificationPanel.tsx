import React from 'react';
import { motion } from 'motion/react';
import { X, Bell, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string | number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationPanel({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter for important/positive notifications
  const tomorrowAlerts = notifications.filter(n => 
    (n.type === 'hearing' || n.type === 'task' || n.type === 'case_update') &&
    n.message.toLowerCase().includes('আগামীকাল') // Matches Bengali text for "tomorrow"
  );

  const otherNotifications = notifications.filter(n => !tomorrowAlerts.includes(n));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-slate-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Important Tomorrow's Alerts */}
            {tomorrowAlerts.length > 0 && (
              <div className="bg-amber-50/50">
                <div className="px-4 py-2 text-xs font-bold text-amber-800 uppercase flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  আগামীকালের সতর্কতা
                </div>
                {tomorrowAlerts.map(notification => renderNotification(notification, onMarkAsRead))}
              </div>
            )}
            
            {/* Other Notifications */}
            {otherNotifications.map(notification => renderNotification(notification, onMarkAsRead))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function renderNotification(notification: Notification, onMarkAsRead: (id: string | number) => void) {
  return (
    <div 
      key={notification.id} 
      className={`p-4 hover:bg-slate-50 transition-colors flex gap-3 ${
        !notification.isRead ? 'bg-indigo-50/30' : ''
      }`}
    >
      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
        !notification.isRead ? 'bg-indigo-500' : 'bg-transparent'
      }`} />
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className={`text-sm font-bold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
            {notification.title}
          </p>
        )}
        <p className={`text-sm ${!notification.isRead ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {notification.time}
        </p>
      </div>
      {!notification.isRead && (
        <button 
          onClick={() => onMarkAsRead(notification.id)}
          className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors flex-shrink-0 h-fit"
          title="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
