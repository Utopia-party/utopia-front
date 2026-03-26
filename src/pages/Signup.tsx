import { useState, type ChangeEvent, type FormEvent } from 'react';
import { api } from '../libs/api';
import { useNavigate } from 'react-router';
import { CaptchaWidget } from '../components/captcha';

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    email_code: '',
    password: '',
    confirm_password: '',
    name: '',
    nickname: '',
    birth_date: '',
    phone_number: '',
  });

  const [isEmailChecked, setisEmailChecked] = useState(false);
  const [isNicknameChecked, setisNicknameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'email') {
      setisEmailChecked(false);
      setIsEmailVerified(false);
    }
    if (name === 'nickname') setisNicknameChecked(false);
  };

  const handleCheckEmail = async () => {
    if (!form.email) return alert('이메일을 입력해주세요.');
    try {
      const response = await api.get('/users/check-email', {
        params: { email: form.email },
      });
      if (response.data.exists) {
        alert('이미 사용 중인 이메일입니다.');
        setisEmailChecked(false);
      } else {
        alert('사용 가능한 이메일입니다. 이제 인증번호를 요청하세요.');
        setisEmailChecked(true);
      }
    } catch (_error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleEmailRequest = async () => {
    if (!isEmailChecked) return alert('먼저 이메일 중복 확인을 해주세요.');
    try {
      await api.post('/email-request', null, { params: { email: form.email } });
      alert('인증 메일이 발송되었습니다. 메일함을 확인해주세요!');
    } catch (_error) {
      alert('인증 메일 발송에 실패했습니다.');
    }
  };

  const handleEmailVerify = async () => {
    if (!form.email_code) return alert('인증번호를 입력해주세요.');
    try {
      const response = await api.post('/email-verify', null, {
        params: { email: form.email, code: form.email_code },
      });
      if (response.data.success) {
        alert('이메일 인증에 성공했습니다!');
        setIsEmailVerified(true);
      }
    } catch (_error) {
      alert('인증번호가 틀렸거나 만료되었습니다.');
    }
  };

  const isPasswordMatch = form.password === passwordConfirm;

  const handleCheckNickname = async () => {
    if (!form.nickname) return alert('닉네임을 입력해주세요.');
    try {
      const response = await api.get('/users/check-nickname', {
        params: { nickname: form.nickname },
      });
      if (response.data.exists) {
        alert('이미 사용 중인 닉네임입니다.');
        setisNicknameChecked(false);
      } else {
        alert('사용 가능한 닉네임입니다.');
        setisNicknameChecked(true);
      }
    } catch (_error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified || !isNicknameChecked) {
      alert('이메일 인증과 닉네임 중복 확인을 완료해주세요.');
      return;
    }
    if (!captchaToken) {
      alert('캡챠 인증을 완료해주세요.');
      return;
    }

    try {
      const response = await api.post('/users', form, {
        headers: { 'X-Captcha-Token': captchaToken },
      });
      if (response.status === 200 || response.status === 201) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        navigate('/login');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMsg =
        axiosError.response?.data?.detail || '회원가입에 실패했습니다.';
      alert(errorMsg);
    }
  };

  const isFormValid =
    form.email &&
    isEmailVerified &&
    form.password.length >= 8 &&
    isPasswordMatch &&
    passwordConfirm !== '' &&
    form.name &&
    form.nickname &&
    isNicknameChecked &&
    captchaToken;

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-gray-100 bg-white p-10 shadow-lg">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">회원가입</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 이메일 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이메일
          </label>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              placeholder="name@email.com"
              className={`w-full rounded-lg border p-3 focus:outline-none ${isEmailVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
              onChange={handleChange}
              disabled={isEmailVerified}
              required
            />
            <button
              type="button"
              onClick={handleCheckEmail}
              disabled={isEmailVerified}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              중복검사
            </button>
            <button
              type="button"
              onClick={handleEmailRequest}
              disabled={!isEmailChecked || isEmailVerified}
              className="shrink-0 rounded-lg bg-gray-800 text-white px-4 py-2 font-medium hover:bg-gray-700 disabled:bg-gray-300"
            >
              인증요청
            </button>
          </div>
        </div>

        {/* 이메일 인증번호 */}
        {!isEmailVerified && isEmailChecked && (
          <div className="flex gap-2">
            <input
              name="email_code"
              type="text"
              placeholder="인증번호 6자리"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={handleEmailVerify}
              className="shrink-0 rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
            >
              인증확인
            </button>
          </div>
        )}
        {isEmailVerified && (
          <p className="text-xs text-green-600 font-medium ml-1">
            이메일 인증이 완료되었습니다.
          </p>
        )}

        {/* 비밀번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호
          </label>
          <input
            name="password"
            type="password"
            placeholder="8자 이상"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        {/* 비밀번호 재확인 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            비밀번호 재확인
          </label>
          <input
            type="password"
            placeholder="비밀번호 다시 입력"
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              passwordConfirm === ''
                ? 'border-gray-300'
                : isPasswordMatch
                  ? 'border-green-500'
                  : 'border-red-500'
            }`}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
          {passwordConfirm !== '' && !isPasswordMatch && (
            <p className="mt-1 text-xs text-red-500">
              비밀번호가 일치하지 않습니다.
            </p>
          )}
          {passwordConfirm !== '' && isPasswordMatch && (
            <p className="mt-1 text-xs text-green-600">
              비밀번호가 일치합니다.
            </p>
          )}
        </div>

        {/* 이름 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            이름
          </label>
          <input
            name="name"
            type="text"
            placeholder="실명 입력"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            닉네임
          </label>
          <div className="flex gap-2">
            <input
              name="nickname"
              type="text"
              placeholder="닉네임 입력"
              className={`w-full rounded-lg border p-3 focus:outline-none ${isNicknameChecked ? 'border-green-500' : 'border-gray-300 focus:border-blue-500'}`}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
            >
              중복검사
            </button>
          </div>
        </div>

        {/* 휴대폰 번호 (선택) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            휴대폰 번호 (선택)
          </label>
          <input
            name="phone_number"
            type="tel"
            placeholder="010-0000-0000"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={handleChange}
          />
        </div>

        {/* 캡챠 인증 */}
        <div className="flex justify-center py-2">
          <CaptchaWidget
            onSuccess={(token) => setCaptchaToken(token)}
            triggerType="register"
          />
        </div>

        {/* 버튼 */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full rounded-xl py-4 font-bold text-white transition ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            회원가입 완료
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl border border-blue-600 py-4 font-bold text-blue-600 hover:bg-blue-50 transition"
          >
            이미 계정이 있어요(로그인)
          </button>
        </div>
      </form>
    </div>
  );
}
