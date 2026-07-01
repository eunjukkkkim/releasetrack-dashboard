import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DASHBOARD_BLOCKS,
  DASHBOARD_LAYOUT_STORAGE_KEY,
  mergeLayout,
  reorder,
  type DashboardLayout,
} from './dashboardBlocks';

export function DashboardSettings({
  layout,
  onChange,
  onClose,
}: {
  layout: DashboardLayout;
  onChange: (next: DashboardLayout) => void;
  onClose: () => void;
}) {
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const labelById = useMemo(() => new Map(DASHBOARD_BLOCKS.map((b) => [b.id, b.label])), []);
  const hidden = new Set(layout.hidden);

  const toggleVisible = (id: string) => {
    const next = hidden.has(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id];
    onChange({ ...layout, hidden: next });
  };

  const move = (from: number, to: number) => {
    onChange({ ...layout, order: reorder(layout.order, from, to) });
  };

  const handleDrop = (to: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOver(null);
    if (from == null) {
      return;
    }
    move(from, to);
  };

  const restoreDefaults = () => {
    try {
      localStorage.removeItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    onChange(mergeLayout(DASHBOARD_BLOCKS, null));
  };

  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대시보드 블록 설정</DialogTitle>
          <DialogDescription>체크로 표시/숨김, 위/아래 버튼 또는 드래그로 순서를 바꿉니다.</DialogDescription>
        </DialogHeader>
        <ul className="rt-block-list">
          {layout.order.map((id, index) => {
            const label = labelById.get(id) ?? id;
            return (
              <li
                key={id}
                className={`rt-block-item${dragOver === index ? ' rt-block-item-over' : ''}`}
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(index);
                }}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  dragIndex.current = null;
                  setDragOver(null);
                }}
              >
                <span className="rt-block-grip" aria-hidden="true">
                  <GripVertical size={16} />
                </span>
                <label className="rt-block-label">
                  <input type="checkbox" checked={!hidden.has(id)} onChange={() => toggleVisible(id)} />
                  <span>{label}</span>
                </label>
                <div className="rt-block-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`${label} 위로 이동`}
                  >
                    <ChevronUp size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, index + 1)}
                    disabled={index === layout.order.length - 1}
                    aria-label={`${label} 아래로 이동`}
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={restoreDefaults}>
            기본값 복원
          </Button>
          <Button type="button" onClick={onClose}>
            완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
