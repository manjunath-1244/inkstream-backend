import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function NotificationsList({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications().catch(() => ({ data: [] }));
      const items = res?.data || res || [];
      setNotifications(items);
      
      const unreadCount = items.filter(n => !n.isRead).length;
      if (onUnreadChange) onUnreadChange(unreadCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      const count = notifications.filter(n => n.id !== id ? !n.isRead : false).length;
      if (onUnreadChange) onUnreadChange(count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      if (onUnreadChange) onUnreadChange(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="notif-header">
        <h4 style={{ color: '#fff', fontWeight: 'bold' }}>Notifications</h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }} onClick={handleMarkAllRead}>
            Mark all read
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="notif-list">
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>You have no notifications.</div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <div className="notif-title" style={{ color: !notif.isRead ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                {notif.type || 'Activity'}
              </div>
              <div className="notif-body" style={{ color: 'var(--text-secondary)' }}>
                {notif.message}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                {new Date(notif.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
