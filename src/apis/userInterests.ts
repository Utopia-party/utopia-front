import { api } from '../libs/api';

// 상원: 관심사 관련 API 응답은 items 문자열 배열 하나만 받도록 타입을 정의합니다.
type UserInterestsResponse = {
  // 상원: 서버가 저장하거나 조회한 관심사 목록이 이 필드로 내려옵니다.
  items: string[];
};

// 상원: 이 함수는 현재 로그인한 사용자의 관심사를 서버에서 읽어옵니다.
export async function getMyInterests() {
  // 상원: 회원 전용 관심사 조회 엔드포인트로 GET 요청을 보냅니다.
  const response = await api.get<UserInterestsResponse>(
    '/api/users/me/interests',
  );
  // 상원: 응답에 items가 없을 수도 있으니 빈 배열을 기본값으로 돌려줍니다.
  return response.data.items ?? [];
}

// 상원: 이 함수는 현재 선택된 관심사 배열을 서버에 통째로 저장합니다.
export async function saveMyInterests(items: string[]) {
  // 상원: PUT 요청 바디에 현재 선택 배열을 넣어 최신 상태 전체를 저장합니다.
  const response = await api.put<UserInterestsResponse>(
    '/api/users/me/interests',
    {
      items,
    },
  );
  // 상원: 서버가 확정한 관심사 배열을 그대로 돌려줘 프론트가 동기화할 수 있게 합니다.
  return response.data.items ?? [];
}
