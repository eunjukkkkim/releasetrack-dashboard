export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function toLocalDateTimeInputValue(value?: string | null) {
  if (!value) {
    return '';
  }
  return value.slice(0, 16);
}

export function fromLocalDateTimeInputValue(value?: string) {
  if (!value) {
    return '';
  }
  return `${value}:00`;
}

/**
 * optional 텍스트 입력값을 정규화한다. 빈 문자열/공백만 있으면 undefined 를 반환하여
 * PATCH(null=미변경) 에서는 미변경, POST 에서는 미저장(null)으로 처리되게 한다.
 */
export function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * 배포 소요시간(초)을 읽기 쉬운 한국어 형태로 변환한다.
 * null/undefined 또는 음수이면 '-'. 60초 미만은 "45초", 그 이상은 "3분 4초"(초가 0이면 "3분"),
 * 1시간 이상은 "1시간 5분"(분이 0이면 "1시간").
 */
export function formatDuration(durationSec?: number | null) {
  if (durationSec == null || durationSec < 0) {
    return '-';
  }
  if (durationSec < 60) {
    return `${durationSec}초`;
  }
  if (durationSec < 3600) {
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
  }
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  return minutes === 0 ? `${hours}시간` : `${hours}시간 ${minutes}분`;
}
