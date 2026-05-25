import React, { useState, useEffect } from 'react';
import { api } from '../api';

export function PostCard({ post, user, onPostSelect, onAuthorSelect, onCategorySelect, onTagSelect, onBookmarkToggle, isBookmarked }) {
  const [likesCount, setLikesCount] = useState(post?.likesCount || post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStats, setShareStats] = useState(null);

  useEffect(() => {
    // If likes list exists in payload, check if user id is inside
    if (post?.likes && user) {
      setIsLiked(post.likes.some(l => l.userId === user.id || l.id === user.id));
    }
  }, [post, user]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to like this story.');
      return;
    }
    try {
      const res = await api.toggleLike(post.id);
      setIsLiked(res.liked);
      setLikesCount(prev => res.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    setSharing(true);
    try {
      const shareData = await api.sharePost(post.id, 'TWITTER');
      // Fetch share stats
      const stats = await api.getShareStats(post.id).catch(() => null);
      setShareStats(stats);
      alert(`Story Link Copied: ${shareData.shareUrl}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const formattedDate = new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="glass-card post-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
      <div>
        <div className="post-card-header">
          <div className="post-card-author">
            <div className="author-avatar">
              {(post.author?.displayName || post.author?.username || 'A')[0].toUpperCase()}
            </div>
            <div className="author-info">
              <h4 onClick={() => onAuthorSelect(post.author?.username)}>
                {post.author?.displayName || post.author?.username || 'Anonymous'}
              </h4>
              <span>{formattedDate}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className={`badge ${post.visibility === 'PREMIUM' ? 'badge-premium' : 'badge-user'}`}>
              {post.visibility}
            </span>
          </div>
        </div>

        <div className="post-card-body" style={{ marginTop: '0.5rem' }}>
          <h3 onClick={() => onPostSelect(post.slug || post.id)} style={{ color: 'var(--text-primary)' }}>
            {post.title}
          </h3>
          <p>{post.excerpt || (post.contentMarkdown ? post.contentMarkdown.substring(0, 100) + '...' : '')}</p>
        </div>
      </div>

      <div>
        {post.category && (
          <div style={{ marginBottom: '0.85rem' }}>
            <span 
              onClick={() => onCategorySelect(post.category)}
              style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer' }}
            >
              #{post.category.name || post.category}
            </span>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((t, idx) => (
              <span key={idx} className="tag-badge" onClick={() => onTagSelect(t.slug || t)}>
                #{t.name || t}
              </span>
            ))}
          </div>
        )}

        <div className="engagement-bar">
          <button className={`engagement-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
            ❤️ {likesCount}
          </button>
          
          <button className={`engagement-btn bookmark-btn ${isBookmarked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onBookmarkToggle(post.id); }}>
            🔖 {isBookmarked ? 'Saved' : 'Save'}
          </button>

          <button className="engagement-btn" onClick={handleShare} disabled={sharing}>
            ↗️ Share {shareStats ? `(${Object.values(shareStats).reduce((a, b) => a + b, 0)})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostReader({ idOrSlug, user, onClose, onBookmarkToggle, isBookmarked }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  
  // Reporting state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  // Editing comments
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const loadPostDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedPost = await api.getPost(idOrSlug);
      setPost(fetchedPost);
      
      if (user && fetchedPost.authorId && user.id !== fetchedPost.authorId) {
        try {
          const followRes = await api.isFollowing(fetchedPost.authorId);
          setFollowing(followRes.following);
        } catch (e) {
          console.error(e);
        }
      }
      
      const commentList = await api.getComments(fetchedPost.id).catch(() => []);
      setComments(commentList?.items || commentList || []);
    } catch (err) {
      setError(err.message || 'Unable to load post. It may be Premium content requiring login and active subscription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostDetails();
  }, [idOrSlug]);

  const handleFollowToggle = async () => {
    if (!user) return alert('Please log in to follow creators.');
    try {
      if (following) {
        await api.unfollowUser(post.authorId);
        setFollowing(false);
      } else {
        await api.followUser(post.authorId);
        setFollowing(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikePost = async () => {
    if (!user) return alert('Please log in.');
    try {
      const res = await api.toggleLike(post.id);
      setPost(prev => ({
        ...prev,
        likesCount: res.liked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 1) - 1)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to comment.');
    if (!commentText.trim()) return;

    try {
      const newComment = await api.addComment(post.id, commentText);
      const commentWithAuthor = {
        ...newComment,
        author: user
      };
      setComments([commentWithAuthor, ...comments]);
      setCommentText('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!user) return alert('Please log in.');
    try {
      const res = await api.toggleCommentLike(commentId);
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likesCount: res.liked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 1) - 1)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const updated = await api.updateComment(commentId, editingCommentText);
      setComments(comments.map(c => c.id === commentId ? { ...c, body: updated.body } : c));
      setEditingCommentId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReportPost = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in.');
    try {
      await api.createReport(post.id, 'POST', reportReason);
      alert('Thank you. The story has been reported to moderation review.');
      setReportReason('');
      setShowReport(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Story details...</div>;

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button className="btn-secondary" onClick={onClose}>Back to Explore</button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', animation: 'slideUp 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={onClose}>← Back to Stories</button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => onBookmarkToggle(post.id)}>
            🔖 {post && isBookmarked(post.id) ? 'Unsave' : 'Save Story'}
          </button>
          <button className="btn-danger" style={{ padding: '0.5rem 0.85rem' }} onClick={() => setShowReport(true)}>
            ⚠️ Report
          </button>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className={`badge ${post.visibility === 'PREMIUM' ? 'badge-premium' : 'badge-user'}`}>{post.visibility}</span>
          {post.category && <span className="badge badge-creator">{post.category.name || post.category}</span>}
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: '1.3' }}>{post.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <div className="author-avatar">
            {(post.author?.displayName || post.author?.username || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: '600' }}>{post.author?.displayName || post.author?.username}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Published {new Date(post.createdAt).toLocaleDateString()} · {post.readingTimeMinutes || 3} min read
            </p>
          </div>
          {user && post.authorId && user.id !== post.authorId && (
            <button
              className="follow-btn"
              style={{
                background: following ? 'rgba(255, 255, 255, 0.05)' : 'var(--accent-primary)',
                color: following ? 'var(--text-secondary)' : '#000',
                border: following ? '1px solid var(--glass-border)' : 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={handleFollowToggle}
            >
              {following ? '👤 Following' : '➕ Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Main post contents */}
      <div style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#cbd5e1', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
        {post.contentMarkdown || post.content}
      </div>

      {/* Post likes interaction */}
      <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '1rem 0', marginBottom: '2rem' }}>
        <button onClick={handleLikePost} className="btn-secondary" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
          ❤️ Like Story ({post.likesCount || 0})
        </button>
      </div>

      {/* Report Modal overlays */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Story</h2>
              <button className="btn-icon" onClick={() => setShowReport(false)}>×</button>
            </div>
            <form onSubmit={handleReportPost}>
              <div className="form-group">
                <label>Reason for report</label>
                <textarea rows="4" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Please explain why this post violates community guidelines..." required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowReport(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="comments-container">
        <h3>Discussion ({comments.length})</h3>
        
        <form onSubmit={handlePostComment} style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          <div className="comment-input-area">
            <textarea
              rows="3"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What are your thoughts on this story? Write a comment..."
              required
            />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }}>
              Comment
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No comments yet. Start the conversation!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-card">
                <div className="author-avatar" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                  {((comment.author || comment.user)?.displayName || (comment.author || comment.user)?.username || 'A')[0].toUpperCase()}
                </div>
                <div className="comment-right">
                  <div className="comment-header">
                    <span className="comment-author-name">{(comment.author || comment.user)?.displayName || (comment.author || comment.user)?.username}</span>
                    <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <textarea
                        rows="2"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                        <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleUpdateComment(comment.id)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{comment.body}</p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleToggleCommentLike(comment.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                    >
                      👍 Like ({comment.likesCount || 0})
                    </button>
                    {user && (user.id === comment.authorId || user.id === comment.userId || user.role === 'ADMIN') && editingCommentId !== comment.id && (
                      <>
                        <button 
                          onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.body); }} 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(comment.id)} 
                          style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
