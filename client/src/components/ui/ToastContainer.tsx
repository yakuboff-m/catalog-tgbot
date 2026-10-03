import { useToast } from '../../hooks/useToast';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" />}
              {toast.type === 'error' && <XCircle size={18} color="#EF4444" />}
              {toast.type === 'info' && <Info size={18} color="#3B82F6" />}
              {toast.type === 'warning' && <AlertTriangle size={18} color="#F59E0B" />}
            </span>
            <span style={{ fontSize: '13px', lineHeight: 1.35, wordBreak: 'break-word' }}>{toast.message}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              borderRadius: '50%',
              flexShrink: 0,
              opacity: 0.8,
              transition: 'opacity 0.15s ease',
            }}
            title="Close notification"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
