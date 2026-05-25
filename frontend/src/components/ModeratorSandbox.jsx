import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ModeratorSandbox() {
  const [reports, setReports] = useState([]);
  
  // Custom moderation forms
  const [suspendUserId, setSuspendUserId] = useState('');
  const [suspendHours, setSuspendHours] = useState(24);
  const [hidePostId, setHidePostId] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    try {
      const data = await api.getReports(1, 20).catch(() => []);
      setReports(data?.items || data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolveReport = async (reportId, status) => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.updateReportStatus(reportId, status);
      setMessage(`Report status updated to ${status}!`);
      loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendUserId.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.modSuspendUser(suspendUserId, Number(suspendHours));
      setMessage(`User ${suspendUserId} has been suspended for ${suspendHours} hours!`);
      setSuspendUserId('');
      loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHidePost = async (e) => {
    e.preventDefault();
    if (!hidePostId.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.modHidePost(hidePostId);
      setMessage(`Post ${hidePostId} is now HIDDEN from the feed!`);
      setHidePostId('');
      loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', paddingBottom: '0.75rem' }}>
        <h2 style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 'bold' }}>⚖️ Moderator Workspace</h2>
        <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={loadReports}>Refresh Reports</button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {/* Suspend Form */}
        <div style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '1.25rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '1rem' }}>⏸️ Temporary Account Suspension</h3>
          <form onSubmit={handleSuspend} style={{ marginTop: 0 }}>
            <div className="form-group">
              <label>User UUID</label>
              <input type="text" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" value={suspendUserId} onChange={(e) => setSuspendUserId(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Duration (Hours)</label>
              <input type="number" min="1" value={suspendHours} onChange={(e) => setSuspendHours(e.target.value)} required />
            </div>
            <button type="submit" className="btn-success" style={{ width: '100%', marginTop: '1rem', background: '#f59e0b', color: 'black' }} disabled={loading}>
              Suspend User Account
            </button>
          </form>
        </div>

        {/* Hide Post Form */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '1rem' }}>👁️‍🗨️ Hide Offensive Post</h3>
          <form onSubmit={handleHidePost} style={{ marginTop: 0 }}>
            <div className="form-group">
              <label>Post UUID</label>
              <input type="text" placeholder="e.g. 889e8400-e29b-41d4-a716-446655440000" value={hidePostId} onChange={(e) => setHidePostId(e.target.value)} required />
            </div>
            <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '2.5rem' }} disabled={loading}>
              Hide Publication
            </button>
          </form>
        </div>
      </div>

      {/* Reports Queue */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.85rem' }}>🚩 User Abuse Reports Queue</h3>
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              No abuse reports currently queued.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Reporter</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Target Type</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Target UUID</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{report.reporter?.username || report.reporterId}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#fff', fontWeight: 'bold' }}>{report.reason}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{report.targetType}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{report.targetId}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span className={`status-indicator ${report.status === 'RESOLVED' ? 'success' : report.status === 'PENDING' ? 'warning' : 'danger'}`} style={{ marginRight: '0.35rem' }} />
                      {report.status}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', display: 'flex', gap: '0.35rem' }}>
                      {report.status === 'PENDING' && (
                        <>
                          <button className="btn-success" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', margin: 0 }} onClick={() => handleResolveReport(report.id, 'RESOLVED')}>
                            Resolve
                          </button>
                          <button className="btn-danger" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', margin: 0 }} onClick={() => handleResolveReport(report.id, 'DISMISSED')}>
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
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
