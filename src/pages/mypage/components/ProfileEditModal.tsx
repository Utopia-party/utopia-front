import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { updateMyProfile } from '../../../apis/user';
import { useAuthStore } from '../../../stores/authStore';

type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  initialValues: {
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
    profileImage?: string | null;
  };
};

type ProfileEditForm = {
  nickname: string;
  phone: string;
};

function getProfileInitial(nickname?: string | null) {
  if (!nickname) return 'PU';
  return nickname.trim().slice(0, 2).toUpperCase();
}

export default function ProfileEditModal({
  open,
  onClose,
  initialValues,
}: ProfileEditModalProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [form, setForm] = useState<ProfileEditForm>({
    nickname: initialValues.nickname ?? '',
    phone: initialValues.phone ?? '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setForm({
      nickname: initialValues.nickname ?? '',
      phone: initialValues.phone ?? '',
    });
    setImagePreview(initialValues.profileImage ?? null);
    setSelectedImageFile(null);
    setImageName('');
    setRemoveImage(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [
    open,
    initialValues.nickname,
    initialValues.phone,
    initialValues.profileImage,
  ]);

  if (!open) return null;

  const profileInitial = getProfileInitial(form.nickname);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : null);
      setSelectedImageFile(file);
      setImageName(file.name);
      setRemoveImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
    setImageName('');
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      await updateMyProfile({
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        profileImage: selectedImageFile,
        removeProfileImage: removeImage,
      });

      await checkAuth();

      alert('프로필이 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error(error);
      alert('프로필 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">프로필 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-slate-500">
          회원 정보를 수정할 수 있습니다.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-600">
              프로필 이미지
            </label>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-extrabold text-white">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileInitial
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">
                  {imageName || '선택된 이미지가 없습니다.'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  JPG, PNG, WEBP 등 이미지 파일 업로드 가능
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleImageButtonClick}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-primary transition hover:bg-blue-100"
                  >
                    이미지 선택
                  </button>

                  {(imagePreview || selectedImageFile) && (
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              닉네임
            </label>
            <input
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={handleChange}
              placeholder="닉네임 입력"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              전화번호
            </label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
