'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

// ─────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────

interface ModalButton {
  label: string;
  cls?: string;
  onClick: () => void;
}

interface ModalState {
  open: boolean;
  title: string;
  body: ReactNode;
  buttons: ModalButton[];
}

interface ModalContextValue {
  openModal: (title: string, body: ReactNode, buttons?: ModalButton[]) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be inside UIProvider');
  return ctx;
}

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warn' | 'info';
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside UIProvider');
  return ctx;
}

// ─────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', body: null, buttons: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const openModal = useCallback((title: string, body: ReactNode, buttons: ModalButton[] = []) => {
    setModal({ open: true, title, body, buttons });
  }, []);

  const closeModal = useCallback(() => {
    setModal(m => ({ ...m, open: false }));
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  const toastIcon = { success: <CheckCircle2 size={15} />, error: <XCircle size={15} />, warn: <AlertTriangle size={15} />, info: <Info size={15} /> };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <ToastContext.Provider value={{ toast }}>
        {children}

        {/* ── Modal ── */}
        {modal.open && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">{modal.title}</span>
                <button className="modal-close" onClick={closeModal}><X size={16} /></button>
              </div>
              <div className="modal-body">{modal.body}</div>
              {modal.buttons.length > 0 && (
                <div className="modal-footer">
                  {modal.buttons.map((btn, i) => (
                    <button key={i} className={`btn ${btn.cls ?? 'btn-ghost'}`} onClick={btn.onClick}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Toasts ── */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : t.type === 'warn' ? 'warn' : t.type === 'info' ? 'info' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', color: t.type === 'success' ? 'var(--color-success)' : t.type === 'error' ? 'var(--color-danger)' : t.type === 'warn' ? 'var(--color-warning)' : 'var(--color-info)' }}>
                {toastIcon[t.type]}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </ModalContext.Provider>
  );
}
