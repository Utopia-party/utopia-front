import axios from 'axios';

export function getAdminErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(', ');
    }
    if (
      typeof detail === 'string' &&
      detail.includes('value out of int32 range')
    ) {
      return '가격은 2,147,483,647원 이하로 입력해야 합니다.';
    }
    return (
      detail ||
      error.response?.data?.message ||
      error.message ||
      '관리자 요청 처리 중 오류가 발생했습니다.'
    );
  }
  if (error instanceof Error) return error.message;
  return '관리자 요청 처리 중 오류가 발생했습니다.';
}
