import React from 'react';
import { cn } from '../utils/helpers';

export function Section({ title, right, children, className = '' }) {
  return (
    <div className={cn('panel', className)}>
      <div className="section-head">
        <h3>{title}</h3>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Button({ children, onClick, variant = 'default', type = 'button', disabled = false, className = '' }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cn('btn', `btn-${variant}`, className)}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = 'text', placeholder = '', min, max }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={(e) => onChange(type === 'file' ? e.target.files?.[0] : e.target.value)} />
    </label>
  );
}

export function FileInput({ label, accept, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0])} />
    </label>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <button className={cn('toggle', checked && 'toggle-on')} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <b>{checked ? 'Bật' : 'Tắt'}</b>
    </button>
  );
}

export function Range({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <label className="field">
      <span>{label}: {value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function MessageToast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
