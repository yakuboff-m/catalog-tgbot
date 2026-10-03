import { useEffect, useState, useRef } from 'react';
import { Tag, Plus, Edit3, Trash2, X, Image as ImageIcon, Package } from 'lucide-react';
import { useStore } from '../../store';
import { getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  photo: string | null;
  price: number;
  status: string;
  stockQuantity: number;
  categoryId: string;
  unitId: string;
  category: { id: string; nameUz: string; nameRu: string; nameEn: string };
  unit: { id: string; nameUz: string; nameRu: string; nameEn: string };
}

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
}

interface Unit {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
}

export function AdminProducts() {
  const language = useStore((s) => s.language);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    nameEn: '',
    descriptionUz: '',
    descriptionRu: '',
    descriptionEn: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
    unitId: '',
    status: 'ACTIVE',
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const loadAll = async () => {
    try {
      const [prodsRes, catsRes, unitsRes] = await Promise.all([
        api.adminGetProducts({ limit: '100' }),
        api.adminGetCategories(),
        api.adminGetUnits(),
      ]);
      setProducts(prodsRes.products || []);
      setCategories(catsRes || []);
      setUnits(unitsRes || []);
    } catch (err) {
      console.error('Failed to load products/metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      nameUz: '',
      nameRu: '',
      nameEn: '',
      descriptionUz: '',
      descriptionRu: '',
      descriptionEn: '',
      price: '',
      stockQuantity: '50',
      categoryId: categories[0]?.id || '',
      unitId: units[0]?.id || '',
      status: 'ACTIVE',
    });
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      nameUz: p.nameUz,
      nameRu: p.nameRu,
      nameEn: p.nameEn,
      descriptionUz: p.descriptionUz || '',
      descriptionRu: p.descriptionRu || '',
      descriptionEn: p.descriptionEn || '',
      price: p.price.toString(),
      stockQuantity: p.stockQuantity.toString(),
      categoryId: p.categoryId,
      unitId: p.unitId,
      status: p.status,
    });
    setSelectedPhotoFile(null);
    setPhotoPreview(p.photo || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${p.nameEn}"?`)) {
      return;
    }
    setDeletingId(p.id);
    try {
      await api.adminDeleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      showToast('Product deleted successfully', 'success');
      if (isModalOpen && editingProduct?.id === p.id) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn || !formData.price || !formData.categoryId || !formData.unitId) {
      showToast('Please fill required fields (Name, Price, Category, Unit)', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('nameUz', formData.nameUz || formData.nameEn);
      data.append('nameRu', formData.nameRu || formData.nameEn);
      data.append('nameEn', formData.nameEn);
      data.append('descriptionUz', formData.descriptionUz);
      data.append('descriptionRu', formData.descriptionRu);
      data.append('descriptionEn', formData.descriptionEn);
      data.append('price', formData.price);
      data.append('stockQuantity', formData.stockQuantity);
      data.append('categoryId', formData.categoryId);
      data.append('unitId', formData.unitId);
      data.append('status', formData.status);

      if (selectedPhotoFile) {
        data.append('photo', selectedPhotoFile);
      }

      if (editingProduct) {
        await api.adminUpdateProduct(editingProduct.id, data);
        showToast('Product updated!', 'success');
      } else {
        await api.adminCreateProduct(data);
        showToast('Product created!', 'success');
      }

      setIsModalOpen(false);
      await loadAll();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameRu.toLowerCase().includes(q) ||
      p.nameUz.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="loading-screen__spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Top Bar: Search & Add */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn--primary"
          onClick={handleOpenAdd}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-xs)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`pill ${selectedCategory === 'ALL' ? 'pill--active' : ''}`}
          style={{ fontSize: 'var(--font-xs)' }}
        >
          All ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`pill ${selectedCategory === c.id ? 'pill--active' : ''}`}
            style={{ fontSize: 'var(--font-xs)', whiteSpace: 'nowrap' }}
          >
            {getName(c)} ({products.filter((p) => p.categoryId === c.id).length})
          </button>
        ))}
      </div>

      {/* Products List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filtered.length === 0 ? (
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
              <Package size={30} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
              {selectedCategory === 'ALL' ? 'No Products Added Yet' : 'No Products in this Category'}
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 0 var(--space-lg)' }}>
              {selectedCategory === 'ALL'
                ? 'Your inventory is empty. Add your first product to display it to customers in the mini app.'
                : 'There are no products listed under this category yet.'}
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
              <span>Add New Product</span>
            </button>
          </div>
        ) : (
          filtered.map((prod) => (
            <div
              key={prod.id}
              className="card card--elevated"
              style={{
                padding: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: prod.photo
                    ? `url(${prod.photo}) center/cover`
                    : 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                {!prod.photo && <Tag size={20} color="var(--color-text-tertiary)" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-sm)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getName(prod)}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: prod.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                      color: prod.status === 'ACTIVE' ? '#059669' : '#DC2626',
                    }}
                  >
                    {prod.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-xs)',
                    color: 'var(--color-text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {getName(prod.category)} · {formatPrice(prod.price)} / {getName(prod.unit)}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-xs)',
                    color: prod.stockQuantity > 0 ? 'var(--color-success)' : 'var(--color-error)',
                    fontWeight: 600,
                  }}
                >
                  Stock: {prod.stockQuantity}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="btn btn--sm btn--outline"
                  onClick={() => handleOpenEdit(prod)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 'var(--font-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  className="btn btn--sm"
                  onClick={() => handleDelete(prod)}
                  disabled={deletingId === prod.id}
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
                  title="Delete product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
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
              maxWidth: '560px',
              maxHeight: '90vh',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              padding: '24px',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {editingProduct ? 'Modify details or photo' : 'Add product to your store catalog'}
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

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div className="form-group">
                <label className="form-label">Name (EN) *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Coca Cola 500ml"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Name (RU)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nameRu}
                    onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                    placeholder="e.g. Кока-Кола 500мл"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name (UZ)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nameUz}
                    onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                    placeholder="e.g. Coca Cola 500ml"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₩ Won) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 2500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getName(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select
                    className="form-input"
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getName(u)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Photo Upload with Live Preview */}
              <div className="form-group">
                <label className="form-label">Product Photo</label>
                {photoPreview ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '140px',
                      height: '140px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '2px solid var(--color-border)',
                      marginBottom: '10px',
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
                        top: '6px',
                        right: '6px',
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
                      padding: '10px 14px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      border: '1.5px dashed var(--color-border)',
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    <ImageIcon size={20} />
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {editingProduct && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleDelete(editingProduct)}
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
                  {submitting
                    ? 'Saving...'
                    : editingProduct
                    ? 'Save Changes'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
