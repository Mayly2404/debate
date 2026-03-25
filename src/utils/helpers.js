export const STORAGE_KEY = 'debate-raccoon-v2';
export const CREDIT_DEFAULT = 'Thí sinh đang trình bày các luận điểm ủng hộ hoặc phản đối kiến nghị được giao, không phải ý kiến cá nhân.';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function formatTime(totalSec) {
  const sec = Math.max(0, Math.round(totalSec));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function now() {
  return Date.now();
}

export function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function normalizeScore(value, fromScale, toScale) {
  if (!fromScale || !toScale) return value;
  return (value / fromScale) * toScale;
}
