import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminSandbox() {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [roleUserId, setRoleUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('CREATOR');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const systemStats = await api.getAdminStats().catch(() => null);
      setStats(systemStats);
      
      const logs = await api.getAuditLog(1, 25).catch(() => []);
      setAuditLogs(logs?.items || logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBan = async (e) => {
    e.preventDefault();
    if (!banUserId.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.adminBanUser(banUserId, banReason || 'Violated system guidelines');
      setMessage(`User ${banUserId} has been successfully BANNED!`);
      setBanUserId('');
      setBanReason('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!roleUserId.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.adminChangeRole(roleUserId, selectedRole);
      setMessage(`User ${roleUserId} role updated to ${selectedRole}!`);
      setRoleUserId('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.75rem' }}>
        <h2 style={{ color: '#ef4444', fontSize: '1.4rem', fontWeight: 'bold' }}>🛡️ Admin Control Panel</h2>
        <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={loadData}>Refresh Data</button>
      </div>

      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Active Users</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '0.25rem' }}>
            {stats?.usersCount ?? stats?.totalUsers ?? '0'}
          </h2>
        </div>
        
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Monthly Recurring Revenue</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.25rem' }}>
            ${stats?.mrr ?? stats?.totalRevenue ?? '0.00'}
          </h2>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Premium Subscriptions</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.25rem' }}>
            {stats?.subscriptionsCount ?? stats?.activeSubscriptions ?? '0'}
          </h2>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Publications</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#a855f7', marginTop: '0.25rem' }}>
            {stats?.postsCount ?? stats?.totalPosts ?? '0'}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {/* Ban Form */}
        <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1.25rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>🔨 Ban Platform Account</h3>
          <form onSubmit={handleBan} style={{ marginTop: 0 }}>
            <div className="form-group">
              <label>User UUID</label>
              <input type="text" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" value={banUserId} onChange={(e) => setBanUserId(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Ban Reason</label>
              <input type="text" placeholder="Violation of platform TOS..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            </div>
            <button type="submit" className="btn-danger" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              Restrict User Account
            </button>
          </form>
        </div>

        {/* Change Role Form */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '1rem' }}>👤 Assign User Roles</h3>
          <form onSubmit={handleChangeRole} style={{ marginTop: 0 }}>
            <div className="form-group">
              <label>User UUID</label>
              <input type="text" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>System Role</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="USER">USER</option>
                <option value="CREATOR">CREATOR</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              Assign Role Permission
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.85rem' }}>📋 Platform Audit Trails</h3>
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              No audit logs captured.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Actor</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Action</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Target</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Meta</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#c084fc' }}>{log.userId || log.user?.username || 'SYSTEM'}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 'bold', color: '#fff' }}>{log.action}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{log.targetId || 'N/A'}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{JSON.stringify(log.meta || log.details || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
