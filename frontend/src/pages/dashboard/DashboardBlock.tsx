import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

/** 표(테이블) 블록 공통 카드 래퍼 — 제목 헤더 + 본문 보일러플레이트를 한 곳으로. */
export function DashboardBlock({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** 카드 헤더 우측 컨트롤용 Select 래퍼 — 트리거 스타일·aria 보일러플레이트 공통화. */
export function CardControlSelect({
  value,
  onValueChange,
  ariaLabel,
  placeholder,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="rt-card-control" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
