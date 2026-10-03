import { useEffect, useState } from 'react';
import { Plus, Edit3, X } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface Unit {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  isActive: boolean;
}

export function AdminUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    nameEn: '',
  });

  const loadUnits = async () => {
    try {
      const data = await api.adminGetUnits();
      setUnits(data || []);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setFormData({ nameUz: '', nameRu: '', nameEn: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Unit) => {
    setEditingUnit(u);
    setFormData({ nameUz: u.nameUz, nameRu: u.nameRu, nameEn: u.nameEn });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn) {
      showToast('Unit name (EN) is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nameUz: formData.nameUz || formData.nameEn,
        nameRu: formData.nameRu || formData.nameEn,
        nameEn: formData.nameEn,
      };

      if (editingUnit) {
        await api.adminUpdateUnit(editingUnit.id, payload);
        showToast('Unit updated!', 'success');
      } else {
        await api.adminCreateUnit(payload);
        showToast('Unit created!', 'success');
      }

      setIsModalOpen(false);
      await loadUnits();
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
          Measurement Units ({units.length})
        </h3>
        <button
          className="btn btn--sm btn--primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Add Unit</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {units.map((unit) => (
          <div
            key={unit.id}
            className="card card--elevated"
            style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                {unit.nameEn}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                UZ: {unit.nameUz} · RU: {unit.nameRu}
              </div>
            </div>

            <button
              className="btn btn--sm btn--outline"
              onClick={() => handleOpenEdit(unit)}
              style={{ padding: '6px 12px', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
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
              maxWidth: '420px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>
                {editingUnit ? 'Edit Unit' : 'Add Unit'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                  Name (EN) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. bottle, pack, kg"
                />
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                  Name (UZ)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nameUz}
                  onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                  placeholder="shisha, dona, kg"
                />
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                  Name (RU)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="бут, шт, кг"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)' }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingUnit ? 'Save Changes' : 'Create Unit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
