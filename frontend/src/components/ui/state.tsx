import { X } from 'lucide-react';
import { Alert as AlertRoot, AlertDescription, AlertTitle } from './alert';

export function Spinner() {
  return (
    <div className="rt-state">
      <div className="rt-spinner" />
    </div>
  );
}

export function EmptyState({ description = '데이터가 없습니다.' }: { description?: string }) {
  return <div className="rt-empty">{description}</div>;
}

/**
 * Props-based Alert wrapper. Internally it composes the shadcn Alert primitives
 * (ui/alert.tsx) while exposing a simple `{ title, description, variant, onClose }`
 * signature. 사용처: StateBox.ErrorBox, DashboardHome 운영 주의 알림.
 */
export function Alert({
  title,
  description,
  variant = 'default',
  onClose,
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'warning' | 'danger';
  onClose?: () => void;
}) {
  return (
    <AlertRoot variant={variant} className={onClose ? 'rt-alert-has-close' : undefined}>
      {onClose && (
        <button
          type="button"
          className="rt-alert-close"
          onClick={onClose}
          aria-label="알림 닫기"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </AlertRoot>
  );
}
