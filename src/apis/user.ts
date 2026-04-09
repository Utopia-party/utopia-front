import { api } from './api';
import type {
  UpdateMyProfilePayload,
  UpdateMyProfileResponse,
} from '../types/user';

// 마이페이지 프로필 이미지/닉네임/휴대전화 수정
export async function updateMyProfile(
  payload: UpdateMyProfilePayload,
): Promise<UpdateMyProfileResponse> {
  const formData = new FormData();

  formData.append('nickname', payload.nickname);
  formData.append('phone', payload.phone);

  if (payload.profileImage) {
    formData.append('profile_image', payload.profileImage);
  }

  if (payload.removeProfileImage) {
    formData.append('remove_profile_image', 'true');
  }

  const { data } = await api.patch<UpdateMyProfileResponse>(
    '/api/users/me/profile',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}
