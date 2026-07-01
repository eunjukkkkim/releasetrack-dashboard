/**
 * localStorage 안전 접근 래퍼.
 * SSR/프라이빗 모드/쿼터 초과 등 localStorage 접근이 예외를 던지는 환경에서도
 * 앱이 죽지 않도록 get/set/remove 를 try/catch 로 감싼다. 읽기 실패는 null,
 * 쓰기 실패는 조용히 무시(메모리 상태만 유지)하는 것이 호출부의 기존 동작과 동일하다.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* localStorage 사용 불가 환경은 무시 */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 무시 */
    }
  },
};
