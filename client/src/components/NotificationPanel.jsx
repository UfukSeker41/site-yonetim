import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, X, Check, AlertCircle, CheckCircle, Info } from 'lucide-react';

const NotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, removeNotification, clearAll } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes}d önce`;
    if (hours < 24) return `${hours}s önce`;
    if (days < 7) return `${days}g önce`;
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-zinc-400 hover:text-white transition-colors focus:outline-none"
        title="Bildirimler"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-[600px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-zinc-800 border-b border-zinc-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Bildirimler</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-zinc-400">{unreadCount} okunmamış</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors border-l-4 ${
                      notif.read ? 'border-l-zinc-600 opacity-75' : 'border-l-blue-500'
                    } ${getNotificationBg(notif.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {notif.title}
                        </p>
                        <p className="text-sm text-zinc-300 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-zinc-800 border-t border-zinc-700 p-3">
              <button
                onClick={() => clearAll()}
                className="w-full text-xs text-zinc-400 hover:text-white py-2 transition-colors"
              >
                Hepsini Temizle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationPanel;
