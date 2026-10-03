import { useEffect, useState, useRef } from 'react';
import { Image as ImageIcon, Newspaper, Plus, X, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface Banner {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  photo: string;
  isActive: boolean;
}

interface NewsItem {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descriptionEn: string | null;
  photo: string | null;
  isActive: boolean;
}

export function AdminContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeTab, setActiveTab] = useState<'banners' | 'news'>('banners');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [bannersRes, newsRes] = await Promise.all([
        api.adminGetBanners(),
        api.adminGetNews(),
      ]);
      setBanners(bannersRes || []);
      setNews(newsRes || []);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setTitleEn('');
    setTitleUz('');
    setTitleRu('');
    setDescEn('');
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteBanner = async (b: Banner) => {
    if (!window.confirm(`Delete banner "${b.titleEn}"?`)) return;
    setDeletingId(b.id);
    try {
      await api.adminDeleteBanner(b.id);
      setBanners((prev) => prev.filter((item) => item.id !== b.id));
      showToast('Banner deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete banner', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteNews = async (n: NewsItem) => {
    if (!window.confirm(`Delete news item "${n.titleEn}"?`)) return;
    setDeletingId(n.id);
    try {
      await api.adminDeleteNews(n.id);
      setNews((prev) => prev.filter((item) => item.id !== n.id));
      showToast('News item deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete news', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn) {
      showToast('Title is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('titleEn', titleEn);
      data.append('titleUz', titleUz || titleEn);
      data.append('titleRu', titleRu || titleEn);
      data.append('descriptionEn', descEn);
      if (photoFile) data.append('photo', photoFile);

      if (activeTab === 'banners') {
        await api.adminCreateBanner(data);
        showToast('Banner created!', 'success');
      } else {
        await api.adminCreateNews(data);
        showToast('News posted!', 'success');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish content', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="loading-screen__spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
        <button
          className={`pill ${activeTab === 'banners' ? 'pill--active' : ''}`}
          onClick={() => setActiveTab('banners')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ImageIcon size={15} />
          <span>Banners ({banners.length})</span>
        </button>
        <button
          className={`pill ${activeTab === 'news' ? 'pill--active' : ''}`}
          onClick={() => setActiveTab('news')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Newspaper size={15} />
          <span>News & Announcements ({news.length})</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700 }}>
          {activeTab === 'banners' ? 'Promotional Banners' : 'News Articles'}
        </h3>
        <button
          className="btn btn--sm btn--primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Add {activeTab === 'banners' ? 'Banner' : 'News'}</span>
        </button>
      </div>

      {activeTab === 'banners' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {banners.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 'var(--space-2xl) var(--space-lg)',
                textAlign: 'center',
                borderRadius: '24px',
                border: '1.5px dashed var(--color-border)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(230, 0, 18, 0.08)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <ImageIcon size={30} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
                No Banners Created Yet
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 0 var(--space-lg)' }}>
                Upload promotional banners to showcase special deals and announcements on the shop home page.
              </p>
              <button
                className="btn btn--primary"
                onClick={handleOpenAdd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: 'var(--font-sm)',
                }}
              >
                <Plus size={16} />
                <span>Add First Banner</span>
              </button>
            </div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="card card--elevated"
                style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '100px',
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      background: b.photo ? `url(${b.photo}) center/cover` : 'var(--color-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {!b.photo && <ImageIcon size={20} color="var(--color-text-tertiary)" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.titleEn}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                      UZ: {b.titleUz} · RU: {b.titleRu}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn--sm"
                  onClick={() => handleDeleteBanner(b)}
                  disabled={deletingId === b.id}
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--font-xs)',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Delete banner"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {news.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 'var(--space-2xl) var(--space-lg)',
                textAlign: 'center',
                borderRadius: '24px',
                border: '1.5px dashed var(--color-border)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.08)',
                  color: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <Newspaper size={30} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
                No News Articles Posted
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 0 var(--space-lg)' }}>
                Publish announcements and updates about your shop directly to your customers.
              </p>
              <button
                className="btn btn--primary"
                onClick={handleOpenAdd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: 'var(--font-sm)',
                }}
              >
                <Plus size={16} />
                <span>Add First News</span>
              </button>
            </div>
          ) : (
            news.map((n) => (
              <div
                key={n.id}
                className="card card--elevated"
                style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: 'var(--radius-md)',
                      background: n.photo ? `url(${n.photo}) center/cover` : 'var(--color-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {!n.photo && <Newspaper size={20} color="var(--color-text-tertiary)" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.titleEn}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.descriptionEn || 'No description'}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn--sm"
                  onClick={() => handleDeleteNews(n)}
                  disabled={deletingId === n.id}
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--font-xs)',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Delete news"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--color-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 'var(--font-lg)' }}>
                  Add {activeTab === 'banners' ? 'Banner' : 'News Item'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {activeTab === 'banners'
                    ? 'Upload 16:9 or 2:1 image for home page header'
                    : 'Post announcement or shop updates'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title (EN) *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Ramadan Special Offers"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Title (UZ)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={titleUz}
                    onChange={(e) => setTitleUz(e.target.value)}
                    placeholder="Maxsus takliflar"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Title (RU)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={titleRu}
                    onChange={(e) => setTitleRu(e.target.value)}
                    placeholder="Специальные предложения"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Optional Text</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Leave empty if your image already includes text..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Photo / Banner Image
                  {activeTab === 'banners' && (
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginLeft: '6px', fontWeight: 500, textTransform: 'none' }}>
                      (Recommended 2:1 or 16:9 ratio, e.g. 1200x600)
                    </span>
                  )}
                </label>

                {photoPreview ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '140px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '2px solid var(--color-border)',
                      marginBottom: '8px',
                      background: 'var(--color-bg-secondary)',
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove photo"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 14px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      border: '1.5px dashed var(--color-border)',
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    <ImageIcon size={20} />
                    <span>No image selected yet</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="form-input"
                  style={{ paddingTop: '10px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  marginTop: '8px',
                  height: '48px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : 'Publish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
