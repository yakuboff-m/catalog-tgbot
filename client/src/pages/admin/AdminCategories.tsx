import { useEffect, useState, useRef } from 'react';
import { FolderTree, Plus, Edit3, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { useTelegramLongPressReorder } from '../../hooks/useTelegramLongPressReorder';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    nameEn: '',
    sortOrder: '1',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const data = await api.adminGetCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const { getItemProps } = useTelegramLongPressReorder({
    items: categories,
    enabled: true,
    onOrderChange: setCategories,
    onCommit: async (newCats) => {
      try {
        await api.adminReorderCategories(newCats.map((c) => c.id));
        showToast('Kategoriyalar tartibi saqlandi / Category order saved', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to reorder categories', 'error');
        loadCategories();
      }
    },
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ nameUz: '', nameRu: '', nameEn: '', sortOrder: (categories.length + 1).toString() });
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setFormData({
      nameUz: c.nameUz,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      sortOrder: c.sortOrder.toString(),
    });
    setPhotoFile(null);
    setPhotoPreview(c.photo || null);
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

  const handleDelete = async (c: Category) => {
    if (!window.confirm(`Delete category "${c.nameEn}"?`)) {
      return;
    }
    setDeletingId(c.id);
    try {
      await api.adminDeleteCategory(c.id);
      setCategories((prev) => prev.filter((item) => item.id !== c.id));
      showToast('Category deleted successfully', 'success');
      if (isModalOpen && editingCategory?.id === c.id) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn) {
      showToast('Name (EN) is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('nameUz', formData.nameUz || formData.nameEn);
      data.append('nameRu', formData.nameRu || formData.nameEn);
      data.append('nameEn', formData.nameEn);
      data.append('sortOrder', formData.sortOrder);
      if (photoFile) data.append('photo', photoFile);

      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, data);
        showToast('Category updated!', 'success');
      } else {
        await api.adminCreateCategory(data);
        showToast('Category created!', 'success');
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700 }}>
          Categories ({categories.length})
        </h3>
        <button
          className="btn btn--sm btn--primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Add Category</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {categories.length === 0 ? (
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
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <FolderTree size={30} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
              No Categories Found
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 0 var(--space-lg)' }}>
              Group your products into categories so customers can browse easily.
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
              <span>Add First Category</span>
            </button>
          </div>
        ) : (
          categories.map((cat, index) => {
            const itemProps = getItemProps(cat, index);

            return (
              <div
                key={cat.id}
                className="card card--elevated"
                {...itemProps}
                style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  position: 'relative',
                  cursor: 'pointer',
                  ...itemProps.style,
                }}
              >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: cat.photo ? `url(${cat.photo}) center/cover` : 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                {!cat.photo && <FolderTree size={20} color="var(--color-text-tertiary)" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.nameEn} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({cat.nameUz} / {cat.nameRu})</span>
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  Order: {cat.sortOrder} {cat._count?.products !== undefined && `· ${cat._count.products} products`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn--sm btn--outline"
                onClick={() => handleOpenEdit(cat)}
                style={{ padding: '6px 12px', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                className="btn btn--sm"
                onClick={() => handleDelete(cat)}
                disabled={deletingId === cat.id}
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
                title="Delete category"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>

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
              maxWidth: '460px',
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
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {editingCategory ? 'Modify category name or image' : 'Create new category for products'}
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
                <label className="form-label">Name (EN) *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Beverages"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Name (UZ)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nameUz}
                    onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                    placeholder="Ichimliklar"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name (RU)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nameRu}
                    onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                    placeholder="Напитки"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photo / Icon</label>
                {photoPreview ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '100px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '2px solid var(--color-border)',
                      marginBottom: '8px',
                      background: 'var(--color-bg-secondary)',
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
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
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      border: '1.5px dashed var(--color-border)',
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    <ImageIcon size={18} />
                    <span>No photo selected yet</span>
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {editingCategory && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleDelete(editingCategory)}
                    disabled={submitting}
                    style={{
                      height: '48px',
                      padding: '0 16px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      borderRadius: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
