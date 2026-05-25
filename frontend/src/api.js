const API_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000'
  : `${window.location.protocol}//${window.location.hostname}:3000`;

export const api = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      method: options.method || 'GET',
      endpoint,
      payload: options.body ? JSON.parse(options.body) : null,
      status: 'PENDING',
      response: null,
      error: null
    };

    window.__apiLogs = window.__apiLogs || [];
    window.__apiLogs = [logEntry, ...window.__apiLogs].slice(0, 100);
    window.dispatchEvent(new CustomEvent('api-log', { detail: { logs: window.__apiLogs } }));

    try {
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      logEntry.status = response.status;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logEntry.error = errorData.message || `API Error: ${response.status}`;
        logEntry.response = errorData;
        window.dispatchEvent(new CustomEvent('api-log', { detail: { logs: window.__apiLogs } }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }
      
      if (response.status === 204) {
        logEntry.response = null;
        window.dispatchEvent(new CustomEvent('api-log', { detail: { logs: window.__apiLogs } }));
        return null;
      }
      
      const data = await response.json().catch(() => null);
      logEntry.response = data;
      window.dispatchEvent(new CustomEvent('api-log', { detail: { logs: window.__apiLogs } }));
      return data;
    } catch (err) {
      if (logEntry.status === 'PENDING') {
        logEntry.status = 'FAILED';
        logEntry.error = err.message;
      }
      window.dispatchEvent(new CustomEvent('api-log', { detail: { logs: window.__apiLogs } }));
      throw err;
    }
  },

  // Auth
  login: async (email, password) => {
    const data = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data?.accessToken) {
      api.setToken(data.accessToken);
    }
    return data;
  },
  
  register: async (email, password, username, displayName) => {
    const data = await api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, displayName })
    });
    if (data?.accessToken) {
      api.setToken(data.accessToken);
    }
    return data;
  },

  forgotPassword: async (email) => 
    api.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  getMe: async () => api.request('/auth/me'),

  // Users
  updateProfile: async (data) => 
    api.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  upgradeToCreator: async () => 
    api.request('/users/me/upgrade-to-creator', {
      method: 'POST'
    }),

  getUserProfile: async (username) => api.request(`/users/${username}`),

  followUser: async (id) => 
    api.request(`/users/${id}/follow`, {
      method: 'POST'
    }),

  unfollowUser: async (id) => 
    api.request(`/users/${id}/follow`, {
      method: 'DELETE'
    }),

  isFollowing: async (id) => api.request(`/users/${id}/is-following`),

  blockUser: async (id) => 
    api.request(`/users/${id}/block`, {
      method: 'POST'
    }),

  unblockUser: async (id) => 
    api.request(`/users/${id}/unblock`, {
      method: 'POST'
    }),

  getUserFollowers: async (username) => api.request(`/users/${username}/followers`),
  getUserFollowing: async (username) => api.request(`/users/${username}/following`),
  getUserPosts: async (username) => api.request(`/users/${username}/posts`),
  getFeed: async (page = 1, limit = 10) => api.request(`/feed?page=${page}&limit=${limit}`),
  
  adminChangeRole: async (id, role) => 
    api.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    }),

  // Posts
  getPosts: async (page = 1, limit = 10) => api.request(`/posts?page=${page}&limit=${limit}`),
  getTrendingPosts: async (page = 1, limit = 10) => api.request(`/posts/trending?page=${page}&limit=${limit}`),
  getDrafts: async (page = 1, limit = 10) => api.request(`/posts/me/drafts?page=${page}&limit=${limit}`),
  getPost: async (idOrSlug) => api.request(`/posts/${idOrSlug}`),
  
  createPost: async (postData) => 
    api.request('/posts', {
      method: 'POST',
      body: JSON.stringify({
        ...postData,
        visibility: postData.visibility || 'PUBLIC',
        status: postData.status || 'PUBLISHED'
      })
    }),

  updatePost: async (id, data) => 
    api.request(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deletePost: async (id) => 
    api.request(`/posts/${id}`, {
      method: 'DELETE'
    }),

  sharePost: async (id, channel = 'TWITTER') => 
    api.request(`/posts/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ channel })
    }),

  getShareStats: async (id) => api.request(`/posts/${id}/share-stats`),
  toggleLike: async (postId) => api.request(`/posts/${postId}/like`, { method: 'POST' }),
  toggleCommentLike: async (commentId) => api.request(`/comments/${commentId}/like`, { method: 'POST' }),
  getPostLikes: async (postId) => api.request(`/posts/${postId}/likes`),
  toggleBookmark: async (postId) => api.request(`/bookmarks/${postId}`, { method: 'POST' }),
  getBookmarks: async () => api.request('/bookmarks'),

  // Feed
  getFeed: async (page = 1, limit = 10) => api.request(`/feed?page=${page}&limit=${limit}`),

  // Search
  searchPosts: async (query, page = 1, limit = 10) => api.request(`/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  // Comments
  getComments: async (postId) => api.request(`/posts/${postId}/comments`),
  
  addComment: async (postId, body) => 
    api.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),

  updateComment: async (id, body) => 
    api.request(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body })
    }),

  deleteComment: async (id) => 
    api.request(`/comments/${id}`, {
      method: 'DELETE'
    }),

  // Categories & Tags
  getCategories: async () => api.request('/categories'),
  getCategory: async (id) => api.request(`/categories/${id}`),
  
  createCategory: async (name, slug, description = '') => 
    api.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, slug, description })
    }),

  updateCategory: async (id, name, slug, description = '') => 
    api.request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, slug, description })
    }),

  deleteCategory: async (id) => 
    api.request(`/categories/${id}`, {
      method: 'DELETE'
    }),

  getTags: async () => api.request('/tags'),
  getPostsByTag: async (slug) => api.request(`/tags/${slug}/posts`),
  
  createTag: async (name, slug) => 
    api.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, slug })
    }),

  deleteTag: async (id) => 
    api.request(`/tags/${id}`, {
      method: 'DELETE'
    }),

  // Subscriptions
  getPlans: async () => api.request('/subscriptions/plans'),
  getSubscriptionStatus: async () => api.request('/subscriptions/me'),
  
  checkoutSubscription: async (planCode) => 
    api.request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planCode })
    }),

  cancelSubscription: async () => 
    api.request('/subscriptions/cancel', {
      method: 'POST'
    }),

  simulatePaymentWebhook: async (userId, planCode, transactionId, status = 'succeeded') => {
    const backendStatus = (status === 'SUCCESS' || status === 'succeeded') ? 'succeeded' : 'failed';
    return api.request('/webhooks/payment', {
      method: 'POST',
      body: JSON.stringify({ userId, status: backendStatus })
    });
  },

  // Notifications
  getNotifications: async () => api.request('/notifications'),
  getUnreadNotificationsCount: async () => api.request('/notifications/unread-count'),
  markNotificationRead: async (id) => api.request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: async () => api.request('/notifications/mark-all-read', { method: 'POST' }),

  // Reports
  createReport: async (targetId, targetType, reason) => 
    api.request('/reports', {
      method: 'POST',
      body: JSON.stringify({ targetId, targetType, reason })
    }),

  getReports: async (page = 1, limit = 20) => api.request(`/reports?page=${page}&limit=${limit}`),
  
  updateReportStatus: async (id, status) => 
    api.request(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Admin / Moderation
  getAdminStats: async () => api.request('/admin/stats'),
  
  adminBanUser: async (id) => 
    api.request(`/admin/users/${id}/ban`, {
      method: 'POST'
    }),

  getAuditLog: async (page = 1, limit = 20) => api.request(`/admin/audit-log?page=${page}&limit=${limit}`),
  
  modSuspendUser: async (id, durationHours = 24) => 
    api.request(`/moderation/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ durationHours })
    }),

  modHidePost: async (id) => 
    api.request(`/moderation/posts/${id}/hide`, {
      method: 'POST'
    })
};
