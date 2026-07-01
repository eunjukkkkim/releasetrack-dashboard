import { getErrorMessage } from '../api/client';
import { Alert, EmptyState, Spinner } from './ui/state';

export function LoadingBox() {
  return <Spinner />;
}

export function ErrorBox({ error }: { error: unknown }) {
  return <Alert variant="danger" title="데이터를 불러오지 못했습니다." description={getErrorMessage(error)} />;
}

export function EmptyBox({ description = '데이터가 없습니다.' }: { description?: string }) {
  return <EmptyState description={description} />;
}
