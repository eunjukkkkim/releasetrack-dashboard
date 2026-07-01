import type {
  DeploymentEnvironment,
  DeploymentStatus,
  ServiceResponse,
} from "../../api/types";
import { DateTimePicker } from "../../components/ui/date-picker";
import { Field, Input, Textarea } from "../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  numberToSelectValue,
} from "../../components/ui/select";
import {
  DEPLOYMENT_ENVIRONMENT_OPTIONS,
  DEPLOYMENT_STATUS_OPTIONS,
} from "../../constants/options";

export function ServiceSelectField({
  services,
  value,
  onChange,
}: {
  services: ServiceResponse[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label="서비스">
      <Select
        value={numberToSelectValue(value)}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger aria-label="서비스">
          <SelectValue placeholder="서비스 선택" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={String(service.id)}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function EnvironmentField({
  value,
  onChange,
}: {
  value: DeploymentEnvironment;
  onChange: (value: DeploymentEnvironment) => void;
}) {
  return (
    <Field label="환경">
      <Select
        value={value}
        onValueChange={(val) => onChange(val as DeploymentEnvironment)}
      >
        <SelectTrigger aria-label="환경">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEPLOYMENT_ENVIRONMENT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function DeploymentStatusField({
  value,
  onChange,
}: {
  value: DeploymentStatus;
  onChange: (value: DeploymentStatus) => void;
}) {
  return (
    <Field label="배포 상태">
      <Select
        value={value}
        onValueChange={(val) => onChange(val as DeploymentStatus)}
      >
        <SelectTrigger aria-label="배포 상태">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEPLOYMENT_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function BranchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="브랜치">
      <Input
        maxLength={200}
        placeholder="develop"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function CommitField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="커밋 SHA">
      <Input
        maxLength={100}
        placeholder="a1b2c3d"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function DeploymentTimingFields({
  startedAt,
  finishedAt,
  onStartedAtChange,
  onFinishedAtChange,
}: {
  startedAt: string;
  finishedAt: string;
  onStartedAtChange: (value: string) => void;
  onFinishedAtChange: (value: string) => void;
}) {
  return (
    <>
      <Field label="시작 시각">
        <DateTimePicker
          aria-label="시작 시각"
          value={startedAt}
          onChange={onStartedAtChange}
        />
      </Field>
      <Field label="종료 시각">
        <DateTimePicker
          aria-label="종료 시각"
          value={finishedAt}
          onChange={onFinishedAtChange}
        />
      </Field>
    </>
  );
}

export function SummaryField({
  value,
  onChange,
  className,
  label = "요약",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}) {
  return (
    <Field label={label} className={className}>
      <Textarea
        rows={3}
        maxLength={500}
        placeholder="이번 배포의 주요 변경점"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function FailureReasonField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Field label="실패 사유" className={className}>
      <Textarea
        rows={3}
        placeholder="실패 원인"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function RollbackField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="rt-checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      롤백 여부
    </label>
  );
}
