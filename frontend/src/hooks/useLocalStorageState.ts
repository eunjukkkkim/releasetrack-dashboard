import { useState } from "react";
import { safeStorage } from "../lib/storage";

/**
 * localStorage 에 지속되는 문자열 상태 훅.
 * 초기값은 마운트 시 저장값을 한 번만 읽고(lazy), 없으면 initialValue 를 쓴다.
 * set 은 React 상태와 localStorage 를 함께 갱신하며, null 을 넘기면 키를 제거한다.
 * 모든 저장소 접근은 safeStorage 로 감싸 예외에 안전하다.
 */
export function useLocalStorageState(
  key: string,
  initialValue: string | null = null,
): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(
    () => safeStorage.get(key) ?? initialValue,
  );

  const set = (next: string | null) => {
    setValue(next);
    if (next == null) {
      safeStorage.remove(key);
    } else {
      safeStorage.set(key, next);
    }
  };

  return [value, set];
}
