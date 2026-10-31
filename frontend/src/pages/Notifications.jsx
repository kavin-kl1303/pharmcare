import React, { useState, useEffect } from 'react';
import { getNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotificationsApi();
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      loadNotifications();
    } catch (e) {
      // quiet
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      loadNotifications();
    } catch (e) {
      // quiet
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono-data text-[11px] font-semibold uppercase">
              Alerts Dispatch
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-error font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span> {unreadCount} Unread Alerts
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Clinical Alerts & Stock Notifications
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Live alerts for expiring pharmaceutical batches, under-reorder inventory, and goods receipt notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/40 transition-all cursor-pointer"
            onClick={handleMarkAllRead}
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            <span>Mark All As Read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const isCritical = n.severity === 'CRITICAL';
            const isWarning = n.severity === 'WARNING';

            return (
              <div
                key={n._id}
                className={`p-4 rounded-xl shadow-sm border transition-all flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-surface-container-lowest border-primary/40'
                    : 'bg-surface-container-low/40 border-outline-variant/30 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCritical
                        ? 'bg-error-container text-error'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary-container/20 text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isCritical ? 'warning' : isWarning ? 'timer' : 'info'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-on-surface">{n.title}</h4>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                          isCritical
                            ? 'bg-error text-on-error'
                            : isWarning
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        {n.severity}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.message}</p>
                    <span className="font-mono text-[10px] text-outline mt-2 block">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors shrink-0"
                    onClick={() => handleMarkRead(n._id)}
                    title="Mark as read"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-outline text-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30">
            {loading ? 'Checking live alerts in MongoDB...' : 'No notifications. All clinical systems are optimal!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
