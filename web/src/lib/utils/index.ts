// DocuFill Web — Utility Functions

import { format, formatDistanceToNow } from 'date-fns';

// MARK: - Date/Time

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d');
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
}

// MARK: - File

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'IMG';
  return 'FILE';
}

// MARK: - Confidence

export function confidenceLevel(confidence: number | null): 'high' | 'medium' | 'low' {
  if (confidence === null) return 'low';
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

export function confidenceColor(confidence: number | null): string {
  const level = confidenceLevel(confidence);
  if (level === 'high') return 'text-confidence-high';
  if (level === 'medium') return 'text-confidence-medium';
  return 'text-confidence-low';
}

export function confidenceBgColor(confidence: number | null): string {
  const level = confidenceLevel(confidence);
  if (level === 'high') return 'bg-confidence-high';
  if (level === 'medium') return 'bg-confidence-medium';
  return 'bg-confidence-low';
}

// MARK: - Document Status

export function statusLabel(status: string): string {
  if (status === 'uploaded') return 'Uploaded';
  if (status === 'processing') return 'Processing';
  if (status === 'extracted') return 'Extracted';
  if (status === 'error') return 'Error';
  return status;
}

export function statusColor(status: string): string {
  if (status === 'extracted') return 'text-confidence-high';
  if (status === 'processing') return 'text-docufill-yellow';
  if (status === 'error') return 'text-docufill-red';
  return 'text-text-secondary';
}

// MARK: - ID Generator

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// MARK: - Generic

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
