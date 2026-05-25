import React, { useState, useEffect } from 'react';

export default function DeveloperConsole() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Initial fetch from window
    if (window.__apiLogs) {
      setLogs(window.__apiLogs);
    }

    const handler = (e) => {
      setLogs([...e.detail.logs]);
    };

    window.addEventListener('api-log', handler);
    return () => window.removeEventListener('api-log', handler);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'SUCCESS') return typeof log.status === 'number' && log.status >= 200 && log.status < 300;
    if (filter === 'ERROR') return log.error || (typeof log.status === 'number' && log.status >= 400);
    if (filter === 'PENDING') return log.status === 'PENDING';
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: isOpen ? '650px' : '220px',
      height: isOpen ? '420px' : '45px',
      background: 'rgba(11, 15, 25, 0.96)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderTopLeftRadius: '16px',
      borderBottomLeftRadius: isOpen ? '0' : '16px',
      zIndex: 99999,
      boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.5)',
      fontFamily: 'monospace',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
      color: '#00ff66',
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.65rem 1.25rem',
          background: 'rgba(99, 102, 241, 0.15)',
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '16px',
          userSelect: 'none'
        }}
      >
        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: logs.some(l => l.status === 'PENDING') ? '#f59e0b' : '#10b981',
            animation: logs.some(l => l.status === 'PENDING') ? 'pulse 1s infinite' : 'none'
          }} />
          API RESPONSE TRACKER ({logs.length})
        </span>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#00ff66',
          fontSize: '0.85rem',
          padding: 0,
          cursor: 'pointer'
        }}>
          {isOpen ? '[ Hide Console ]' : '[ Open Console ]'}
        </button>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* List panel */}
          <div style={{
            flex: 1.2,
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Filters */}
            <div style={{
              display: 'flex',
              padding: '0.35rem',
              background: '#090d16',
              gap: '0.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {['ALL', 'SUCCESS', 'ERROR', 'PENDING'].map(mode => (
                <button
                  key={mode}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilter(mode);
                  }}
                  style={{
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.65rem',
                    background: filter === mode ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                    color: filter === mode ? '#ffffff' : '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    margin: 0
                  }}
                >
                  {mode}
                </button>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.__apiLogs = [];
                  setLogs([]);
                  setActiveLog(null);
                }}
                style={{
                  marginLeft: 'auto',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '4px',
                  margin: 0
                }}
              >
                Clear
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
              {filteredLogs.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', marginTop: '2rem' }}>
                  No API calls logged yet.
                </div>
              ) : (
                filteredLogs.map(log => {
                  let badgeBg = '#64748b';
                  if (log.status >= 200 && log.status < 300) badgeBg = '#10b981';
                  if (log.status >= 400 || log.status === 'FAILED') badgeBg = '#ef4444';
                  if (log.status === 'PENDING') badgeBg = '#f59e0b';

                  const isSelected = activeLog?.id === log.id;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setActiveLog(log)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        <span style={{
                          fontWeight: 'bold',
                          color: log.method === 'POST' ? '#3b82f6' : log.method === 'PATCH' ? '#f59e0b' : log.method === 'DELETE' ? '#ef4444' : '#10b981',
                          marginRight: '0.35rem'
                        }}>
                          {log.method}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>{log.endpoint}</span>
                      </div>
                      <span style={{
                        padding: '0.05rem 0.3rem',
                        borderRadius: '3px',
                        fontSize: '0.62rem',
                        background: badgeBg,
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {log.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details panel */}
          <div style={{
            flex: 1.5,
            padding: '0.75rem',
            overflowY: 'auto',
            background: 'rgba(5, 7, 12, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.75rem'
          }}>
            {activeLog ? (
              <>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '0.25rem' }}>ENDPOINT INFORMATION</h4>
                  <div style={{ color: '#94a3b8' }}>Method: <span style={{ color: '#00ff66', fontWeight: 'bold' }}>{activeLog.method}</span></div>
                  <div style={{ color: '#94a3b8' }}>URL Path: <span style={{ color: '#38bdf8' }}>{activeLog.endpoint}</span></div>
                  <div style={{ color: '#94a3b8' }}>Status: <span style={{ color: activeLog.error ? '#ef4444' : '#00ff66' }}>{activeLog.status}</span></div>
                  <div style={{ color: '#94a3b8' }}>Time: <span style={{ color: '#cbd5e1' }}>{activeLog.timestamp}</span></div>
                </div>

                {activeLog.payload && (
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '0.25rem' }}>REQUEST PAYLOAD</h4>
                    <pre style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      overflowX: 'auto',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#fbbf24',
                      fontSize: '0.7rem'
                    }}>
                      {JSON.stringify(activeLog.payload, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '0.25rem' }}>RESPONSE BODY</h4>
                  {activeLog.error ? (
                    <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      Error: {activeLog.error}
                    </div>
                  ) : activeLog.response ? (
                    <pre style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      overflowX: 'auto',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#00ff66',
                      fontSize: '0.7rem'
                    }}>
                      {JSON.stringify(activeLog.response, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      {activeLog.status === 'PENDING' ? 'Awaiting response...' : 'No response payload (e.g. 204 No Content)'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                margin: 'auto',
                textAlign: 'center',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>&lt; Select an API call to inspect its raw JSON request & response details &gt;</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
