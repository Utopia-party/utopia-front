// 마이페이지 - 프로필 수정
export type UpdateMyProfilePayload = {
  nickname: string;
  phone: string;
  profileImage?: File | null;
  removeProfileImage?: boolean;
};

export type UpdateMyProfileResponse = {
  message?: string;
  user?: {
    user_id?: string;
    email?: string;
    nickname?: string;
    phone?: string;
    provider?: string;
    role?: string;
    trust_score?: number;
    profile_image?: string | null;
    created_at?: string;
  };
};
