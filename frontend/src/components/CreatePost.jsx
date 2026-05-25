import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CreatePost({ user, onPostCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [status, setStatus] = useState('PUBLISHED');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch categories
    api.getCategories().then(cats => {
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setSelectedCategoryId(cats[0].id || cats[0]);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Parse tags: split by comma, trim whitespace
    const tags = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const selectedCategory = categories.find(c => c.id === selectedCategoryId || c === selectedCategoryId);
      const categoryName = typeof selectedCategory === 'object' ? selectedCategory.name : selectedCategory;

      const payload = {
        title,
        excerpt,
        contentMarkdown,
        category: categoryName || 'Technology',
        tags,
        visibility,
        status
      };

      await api.createPost(payload);
      onPostCreated();
    } catch (err) {
      setError(err.message || 'Error creating post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="modal-header">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>✍️ Write a New Story</h2>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '0.5rem' }}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            placeholder="Discovering WebSockets inside NestJS..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Short Excerpt Summary</label>
          <input
            type="text"
            placeholder="In this blog we explore WebSockets in real time..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Content (Markdown supported)</label>
          <textarea
            rows="8"
            placeholder="Write your amazing story here..."
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Category</label>
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              {categories.map((cat, idx) => {
                const id = cat.id || cat;
                const name = cat.name || cat;
                return (
                  <option key={id || idx} value={id}>{name}</option>
                );
              })}
              {categories.length === 0 && <option value="Technology">Technology</option>}
            </select>
          </div>

          <div className="form-group">
            <label>Tags (Comma separated)</label>
            <input
              type="text"
              placeholder="nest, websocket, realtime"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <div className="form-group">
            <label>Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="PUBLIC">PUBLIC (Everyone can read)</option>
              <option value="PREMIUM">PREMIUM (Requires active subscription)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Publish Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '1.75rem' }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Story'}
          </button>
        </div>
      </form>
    </div>
  );
}
