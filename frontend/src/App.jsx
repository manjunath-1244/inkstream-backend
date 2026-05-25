import React, { useState, useEffect } from 'react';
import { api } from './api';
import { PostCard, PostReader } from './components/PostCard';
import Dashboard from './components/Dashboard';
import CreatePost from './components/CreatePost';
import AdminSandbox from './components/AdminSandbox';
import ModeratorSandbox from './components/ModeratorSandbox';
import AuthModal from './components/AuthModal';
import NotificationsList from './components/NotificationsList';
import DeveloperConsole from './components/DeveloperConsole';

export default function App() {
  // Authentication & Session
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Main UI state
  const [view, setView] = useState('EXPLORE'); // EXPLORE, DASHBOARD, WRITE, ADMIN, MODERATOR
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedPostIdOrSlug, setSelectedPostIdOrSlug] = useState(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedTab, setFeedTab] = useState('EXPLORE'); // EXPLORE, FOLLOWING

  // Initialize Session
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(userData => {
          setUser(userData);
          // Fetch bookmarks
          api.getBookmarks()
            .then(bList => setBookmarks(bList?.items || bList || []))
            .catch(() => {});
          
          // Fetch unread count
          api.getUnreadNotificationsCount()
            .then(res => setUnreadNotifs(res.count || 0))
            .catch(() => {});
        })
        .catch(() => {
          api.logout();
          setUser(null);
        });
    }
    
    // Fetch categories
    api.getCategories()
      .then(cats => setCategories(cats || []))
      .catch(() => {});
  }, []);

  // Fetch Feed
  const fetchFeed = async () => {
    setLoading(true);
    try {
      let data = null;
      if (activeSearch) {
        data = await api.searchPosts(activeSearch, page, 10);
      } else if (selectedCategory) {
        // Find category posts
        const allPosts = await api.getPosts(page, 100);
        const filtered = (allPosts?.items || allPosts || []).filter(p => 
          p.category === selectedCategory || 
          p.category?.name === selectedCategory.name || 
          p.category?.slug === selectedCategory.slug
        );
        data = { items: filtered };
      } else if (selectedTag) {
        data = await api.getPostsByTag(selectedTag);
      } else if (selectedAuthor) {
        data = await api.getUserPosts(selectedAuthor);
      } else {
        if (feedTab === 'FOLLOWING' && user) {
          data = await api.getFeed(page, 10);
        } else {
          data = await api.getPosts(page, 10);
        }
      }

      const items = data?.items || data || [];
      setPosts(items);
      setHasMore(items.length >= 10);
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'EXPLORE' && !selectedPostIdOrSlug) {
      fetchFeed();
    }
  }, [view, page, selectedCategory, selectedTag, selectedAuthor, activeSearch, feedTab, selectedPostIdOrSlug]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedAuthor(null);
    setSelectedPostIdOrSlug(null);
    setActiveSearch(searchQuery);
    setPage(1);
    setView('EXPLORE');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedAuthor(null);
    setSelectedPostIdOrSlug(null);
    setPage(1);
  };

  const handleBookmarkToggle = async (postId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await api.toggleBookmark(postId);
      const bList = await api.getBookmarks();
      setBookmarks(bList?.items || bList || []);
    } catch (err) {
      console.error(err);
    }
  };

  const isBookmarked = (postId) => {
    const list = Array.isArray(bookmarks) ? bookmarks : (bookmarks?.items || []);
    return list.some(b => b && (b.postId === postId || b.id === postId || b.post?.id === postId));
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setBookmarks([]);
    setView('EXPLORE');
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Top Glass Navbar */}
      <nav className="glass-nav">
        <div className="logo" onClick={handleClearFilters}>
          <span style={{ fontSize: '1.8rem' }}>🖊️</span> Inkstream
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ flex: '0 1 350px', margin: '0 1.5rem' }}>
          <input
            type="text"
            placeholder="Search stories, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          />
        </form>

        <div className="nav-links">
          <button className={`btn ${view === 'EXPLORE' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setView('EXPLORE'); setSelectedPostIdOrSlug(null); }}>
            Explore
          </button>

          {user ? (
            <>
              <button className={`btn ${view === 'DASHBOARD' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('DASHBOARD')}>
                Dashboard
              </button>

              {(user.role === 'CREATOR' || user.role === 'ADMIN') && (
                <button className={`btn ${view === 'WRITE' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('WRITE')}>
                  Write
                </button>
              )}

              {(user.role === 'MODERATOR' || user.role === 'ADMIN') && (
                <button className={`btn ${view === 'MODERATOR' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('MODERATOR')}>
                  Mod Space
                </button>
              )}

              {user.role === 'ADMIN' && (
                <button className={`btn ${view === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('ADMIN')}>
                  Admin
                </button>
              )}

              {/* Notification icon */}
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn-icon"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  🔔
                  {unreadNotifs > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <NotificationsList 
                    onClose={() => setShowNotifDropdown(false)} 
                    onUnreadChange={setUnreadNotifs}
                  />
                )}
              </div>

              {/* User logout */}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                @{user.username}
              </span>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
              Login / Register
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="container">
        {/* Banner */}
        {view === 'EXPLORE' && !selectedPostIdOrSlug && (
          <div className="welcome-gradient-banner">
            <h1>Welcome to Inkstream Portal</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.5rem auto 0', fontSize: '0.95rem' }}>
              A glassmorphic decentralized writing and publication environment. Discover blogs, purchase premium subscriptions, follow creators, and manage platforms.
            </p>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Main workspace panels */}
          <div className="main-feed-container">
            {view === 'EXPLORE' && (
              <>
                {selectedPostIdOrSlug ? (
                  <PostReader
                    idOrSlug={selectedPostIdOrSlug}
                    user={user}
                    onClose={() => setSelectedPostIdOrSlug(null)}
                    onBookmarkToggle={handleBookmarkToggle}
                    isBookmarked={isBookmarked}
                  />
                ) : (
                  <>
                    {/* Header line showing current filters */}
                    {(selectedCategory || selectedTag || selectedAuthor || activeSearch) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.85rem' }}>
                          Showing stories filtered by:{' '}
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                            {selectedCategory && `Category: ${selectedCategory.name || selectedCategory}`}
                            {selectedTag && `Tag: #${selectedTag}`}
                            {selectedAuthor && `Author: @${selectedAuthor}`}
                            {activeSearch && `Search query: "${activeSearch}"`}
                          </span>
                        </span>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', margin: 0 }} onClick={handleClearFilters}>
                          Clear Filters
                        </button>
                      </div>
                    )}

                    {!selectedCategory && !selectedTag && !selectedAuthor && !activeSearch && user && (
                      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <button 
                          className={`tab ${feedTab === 'EXPLORE' ? 'active' : ''}`}
                          style={{
                            background: feedTab === 'EXPLORE' ? 'rgba(99, 102, 241, 0.15)' : 'none',
                            border: 'none',
                            color: feedTab === 'EXPLORE' ? '#fff' : 'var(--text-secondary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                          onClick={() => { setFeedTab('EXPLORE'); setPage(1); }}
                        >
                          Explore Feed
                        </button>
                        <button 
                          className={`tab ${feedTab === 'FOLLOWING' ? 'active' : ''}`}
                          style={{
                            background: feedTab === 'FOLLOWING' ? 'rgba(99, 102, 241, 0.15)' : 'none',
                            border: 'none',
                            color: feedTab === 'FOLLOWING' ? '#fff' : 'var(--text-secondary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                          onClick={() => { setFeedTab('FOLLOWING'); setPage(1); }}
                        >
                          Following Feed
                        </button>
                      </div>
                    )}

                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '3rem' }}>Fetching publications stream...</div>
                    ) : posts.length === 0 ? (
                      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3>No publications found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Be the first creator to post a story here!</p>
                      </div>
                    ) : (
                      <div className="posts-list">
                        {posts.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            user={user}
                            onPostSelect={setSelectedPostIdOrSlug}
                            onAuthorSelect={(username) => { setSelectedAuthor(username); setSelectedCategory(null); setSelectedTag(null); }}
                            onCategorySelect={(cat) => { setSelectedCategory(cat); setSelectedTag(null); setSelectedAuthor(null); }}
                            onTagSelect={(tag) => { setSelectedTag(tag); setSelectedCategory(null); setSelectedAuthor(null); }}
                            onBookmarkToggle={handleBookmarkToggle}
                            isBookmarked={isBookmarked(post.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {posts.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                          Previous Page
                        </button>
                        <button className="btn-secondary" disabled={!hasMore} onClick={() => setPage(page + 1)}>
                          Next Page
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {view === 'DASHBOARD' && user && (
              <Dashboard 
                user={user} 
                onUserUpdate={setUser} 
                onPostSelect={(idOrSlug) => { setView('EXPLORE'); setSelectedPostIdOrSlug(idOrSlug); }}
              />
            )}

            {view === 'WRITE' && (user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
              <CreatePost
                user={user}
                onPostCreated={() => { setView('EXPLORE'); setSelectedPostIdOrSlug(null); fetchFeed(); }}
                onCancel={() => setView('EXPLORE')}
              />
            )}

            {view === 'MODERATOR' && (user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
              <ModeratorSandbox />
            )}

            {view === 'ADMIN' && user?.role === 'ADMIN' && (
              <AdminSandbox />
            )}
          </div>

          {/* Right sidebar */}
          <div className="sidebar-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Profile */}
            {user && (
              <div className="glass-card profile-card">
                <div className="profile-avatar-large">
                  {user.displayName ? user.displayName[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : 'U')}
                </div>
                <h3>{user.displayName || user.username}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>@{user.username}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  {user.role && <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>}
                </div>
                
                {user.bio && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0' }}>
                    {user.bio}
                  </p>
                )}

                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                    🌐 {new URL(user.website).hostname}
                  </a>
                )}
              </div>
            )}

            {/* Category selection */}
            <div className="glass-card sidebar-section">
              <h3>Categories</h3>
              <div className="category-list">
                {categories.map((cat, index) => {
                  const name = cat.name || cat;
                  const slug = cat.slug || cat;
                  const isSelected = selectedCategory === cat || selectedCategory?.slug === slug;
                  return (
                    <div
                      key={index}
                      className="category-item"
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'var(--glass-border)'
                      }}
                      onClick={() => {
                        setSelectedCategory(isSelected ? null : cat);
                        setSelectedTag(null);
                        setSelectedAuthor(null);
                        setSelectedPostIdOrSlug(null);
                      }}
                    >
                      <span className="category-name" style={{ color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                        {name}
                      </span>
                    </div>
                  );
                })}
                {categories.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No categories registered.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth overlay modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={(userData) => {
            setUser(userData);
            // Fetch bookmarks
            api.getBookmarks()
              .then(bList => setBookmarks(bList?.items || bList || []))
              .catch(() => {});
          }}
        />
      )}

      {/* Always-on API Logger debugger console widget */}
      <DeveloperConsole />
    </div>
  );
}
