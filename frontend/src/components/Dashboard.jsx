import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard({ user, onUserUpdate, onPostSelect }) {
  const [plans, setPlans] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [drafts, setDrafts] = useState([]);
  
  // Profile edits
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  
  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, SUBSCRIPTION, BOOKMARKS, DRAFTS
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStatusAndData = async () => {
    try {
      // Fetch sub status
      const sub = await api.getSubscriptionStatus().catch(() => null);
      setSubStatus(sub);

      // Bookmarks
      const bMarks = await api.getBookmarks().catch(() => []);
      setBookmarks(bMarks?.items || bMarks || []);

      // Drafts (if creator or admin)
      if (user?.role === 'CREATOR' || user?.role === 'ADMIN') {
        const myDrafts = await api.getDrafts().catch(() => ({ items: [] }));
        setDrafts(myDrafts?.items || myDrafts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatusAndData();
    // Fetch plans
    api.getPlans().then(setPlans).catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      const updated = await api.updateProfile({ displayName, bio, website });
      onUserUpdate(updated);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeCreator = async () => {
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      const updated = await api.upgradeToCreator();
      onUserUpdate(updated);
      setMessage('Congratulations! You are now a Creator. You can now publish stories.');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planCode) => {
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      const checkoutRes = await api.checkoutSubscription(planCode);
      setMessage(`Checkout session generated successfully! Code: ${planCode}. Transaction: ${checkoutRes.transactionId || 'SIMULATED'}.`);
      
      // Auto-trigger simulated payment webhook so the user doesn't need to manually hit the API
      await api.simulatePaymentWebhook(user.id, planCode, checkoutRes.transactionId || 'TX_SIM_' + Math.floor(Math.random() * 1000000));
      
      setMessage(`Subscription activated! Simulated payment webhook completed successfully.`);
      fetchStatusAndData();
      
      // Refresh current user object in storage
      const refreshedMe = await api.getMe();
      onUserUpdate(refreshedMe);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSub = async () => {
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      await api.cancelSubscription();
      setMessage('Subscription cancelled successfully.');
      fetchStatusAndData();
      const refreshedMe = await api.getMe();
      onUserUpdate(refreshedMe);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hello, {user?.displayName || user?.username}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>Manage your profile, creation studio, and subscriptions.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className={`badge badge-${user?.role?.toLowerCase()}`}>
            {user?.role}
          </span>
          {subStatus?.status === 'ACTIVE' && (
            <span className="badge badge-premium">PREMIUM PASS</span>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'PROFILE' ? 'active' : ''}`} onClick={() => setActiveTab('PROFILE')}>My Profile</button>
        <button className={`tab ${activeTab === 'SUBSCRIPTION' ? 'active' : ''}`} onClick={() => setActiveTab('SUBSCRIPTION')}>Subscription</button>
        <button className={`tab ${activeTab === 'BOOKMARKS' ? 'active' : ''}`} onClick={() => setActiveTab('BOOKMARKS')}>Bookmarks ({bookmarks.length})</button>
        {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
          <button className={`tab ${activeTab === 'DRAFTS' ? 'active' : ''}`} onClick={() => setActiveTab('DRAFTS')}>My Drafts ({drafts.length})</button>
        )}
      </div>

      {activeTab === 'PROFILE' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <form onSubmit={handleUpdateProfile} style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Website URL</label>
                <input type="url" placeholder="https://mywebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Bio (Tell people about yourself)</label>
              <textarea rows="3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Writer, explorer..." />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <button type="submit" className="btn-primary" disabled={loading}>Save Changes</button>
              {user?.role === 'USER' && (
                <button type="button" className="btn-success" onClick={handleUpgradeCreator} disabled={loading}>
                  ✨ Upgrade to Creator (Write Stories)
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'SUBSCRIPTION' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {subStatus?.status === 'ACTIVE' ? (
            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <span className="badge badge-premium" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>ACTIVE SUBSCRIPTION</span>
              <h3>Premium Member ({subStatus.planCode})</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1.25rem' }}>
                You have unlimited access to premium reader publications and stories. Thank you for your support!
              </p>
              <button className="btn-danger" onClick={handleCancelSub} disabled={loading}>Cancel Subscription</button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Unlock premium publications, support amazing creators, and access exclusive content.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {plans.length > 0 ? plans.map(plan => (
                  <div key={plan.code} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{plan.name}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0' }}>Plan Code: {plan.code}</p>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-primary)', margin: '0.5rem 0' }}>
                        ${plan.price} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ month</span>
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{plan.description || 'Full access to premium member posts.'}</p>
                    </div>
                    <button className="btn-primary" onClick={() => handleCheckout(plan.code)} disabled={loading}>
                      Upgrade to {plan.name}
                    </button>
                  </div>
                )) : (
                  // Default mock subscription trigger
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    width: '100%',
                    textAlign: 'center'
                  }}>
                    <h4>Premium Membership (PREMIUM)</h4>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-primary)', margin: '0.5rem 0' }}>$9.99 / mo</h3>
                    <button className="btn-primary" onClick={() => handleCheckout('PREMIUM')} disabled={loading}>
                      Buy Premium Pass
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'BOOKMARKS' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {bookmarks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
              You haven't bookmarked any posts yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookmarks.map(item => {
                const post = item.post || item;
                if (!post) return null;
                return (
                  <div key={post.id} style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 
                        style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                        onClick={() => onPostSelect(post.slug || post.id)}
                      >
                        {post.title}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {post.author?.displayName || 'Unknown'}</p>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPostSelect(post.slug || post.id)}>
                      Read Post
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'DRAFTS' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {drafts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
              No drafts found. Try creating a post and saving as draft.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {drafts.map(post => (
                <div key={post.id} style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold' }}>{post.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPostSelect(post.slug || post.id)}>
                      Publish / Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
