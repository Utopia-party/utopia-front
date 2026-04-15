import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Container from '../../components/layout/Container';
import {
  FiClock,
  FiShield,
  FiCamera,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { format } from 'date-fns';
import Slide from './components/Slide';
import fist from '../../assets/fist.png';
import palm from '../../assets/palm.png';
import v_sign from '../../assets/v_sign.png';
import thumbs_up from '../../assets/thumbs_up.png';
import { startCaptcha, verifyCaptcha } from '../../apis/captcha';
import type { CaptchaFailureReason } from '../../types/captcha';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { captchaTokenStorage } from '../../apis/captchaToken';

type Step = 'intro' | 'challenge' | 'evaluating' | 'success';

interface ChallengeData {
  text: string;
  pose: string;
}

interface CaptchaErrorModalState {
  title: string;
  description: string;
  tips?: string[];
  buttonText?: string;
  onConfirm?: () => void;
}

type CaptchaUiFailureReason =
  | CaptchaFailureReason
  | {
      type: 'TIME_EXPIRED';
    };

const TOTAL_SECONDS = 5 * 60;

const EXAMPLES = [
  { id: 1, image: fist, pose: '주먹 ✊' },
  { id: 2, image: palm, pose: '손바닥 🖐️' },
  { id: 3, image: v_sign, pose: '브이 ✌️' },
  { id: 4, image: thumbs_up, pose: '따봉 👍' },
];

const formatRetryTime = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '잠시 후';

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (minutes > 0 && remainSeconds > 0) {
    return `${minutes}분 ${remainSeconds}초 후`;
  }

  if (minutes > 0) {
    return `${minutes}분 후`;
  }

  return `${remainSeconds}초 후`;
};

const getRetryAfterSeconds = (
  failureReason?: CaptchaUiFailureReason,
): number | undefined => {
  if (
    failureReason &&
    'retryAfterSeconds' in failureReason &&
    typeof failureReason.retryAfterSeconds === 'number'
  ) {
    return failureReason.retryAfterSeconds;
  }

  return undefined;
};

const getAiErrorCode = (
  failureReason?: CaptchaUiFailureReason,
): string | undefined => {
  if (
    failureReason &&
    'aiErrorCode' in failureReason &&
    typeof failureReason.aiErrorCode === 'string'
  ) {
    return failureReason.aiErrorCode;
  }

  return undefined;
};

const getCaptchaErrorContent = (
  failureReason?: CaptchaUiFailureReason,
  fallbackMessage?: string,
): Omit<CaptchaErrorModalState, 'onConfirm'> => {
  const type = failureReason?.type;
  const retryAfterSeconds = getRetryAfterSeconds(failureReason);
  const aiErrorCode = getAiErrorCode(failureReason);

  switch (type) {
    case 'TIME_EXPIRED':
      return {
        title: '인증 시간이 종료되었어요',
        description:
          '제한 시간 5분이 지나 현재 문제는 더 이상 제출할 수 없어요.',
        tips: ['새 문제를 받아 처음부터 다시 진행해주세요.'],
        buttonText: '확인',
      };

    case 'MISSION_MISMATCH':
      return {
        title: '미션이 정확히 확인되지 않았어요',
        description:
          '손 포즈 또는 종이에 적은 5자리 문자를 정확하게 인식하지 못했어요.',
        tips: [
          '손 1개와 종이를 한 장의 사진 안에 함께 담아주세요.',
          '문자 5자리가 흐리지 않게 선명하게 보여야 해요.',
          '손 포즈가 가려지지 않도록 손 전체를 보여주세요.',
        ],
        buttonText: '확인',
      };

    case 'AI_DETECTION_FAILED':
      switch (aiErrorCode) {
        case 'HAND_NOT_DETECTED':
        case 'HAND_TOO_SMALL':
          return {
            title: '손이 잘 보이지 않아요',
            description: '사진에서 손을 찾기 어렵거나 너무 작게 보였어요.',
            tips: [
              '손이 화면에서 더 크게 보이도록 가까이에서 촬영해주세요.',
              '손 전체가 잘 보이게 해주세요.',
            ],
            buttonText: '확인',
          };

        case 'MULTIPLE_HANDS_DETECTED':
          return {
            title: '손이 여러 개 보여요',
            description: '한 장의 사진에는 손 1개만 보여야 해요.',
            tips: [
              '다른 손이나 다른 사람의 손이 보이지 않게 다시 촬영해주세요.',
            ],
            buttonText: '확인',
          };

        case 'TEXT_NOT_DETECTED':
        case 'TEXT_LENGTH_INVALID':
        case 'OCR_FAILED':
          return {
            title: '문자를 읽기 어려워요',
            description:
              '종이에 적은 5자리 문자와 숫자가 선명하게 보이지 않았어요.',
            tips: [
              '글씨를 진하게 써주세요.',
              '종이가 접히거나 가려지지 않게 해주세요.',
              '빛 반사 없이 정면에서 찍어주세요.',
            ],
            buttonText: '확인',
          };

        case 'LOW_CONFIDENCE':
          return {
            title: '사진이 조금 더 선명해야 해요',
            description:
              '손 포즈나 문자가 흐리게 보여서 확실하게 판별하지 못했어요.',
            tips: [
              '밝은 곳에서 촬영해주세요.',
              '손과 문자가 모두 흔들리지 않게 찍어주세요.',
            ],
            buttonText: '확인',
          };

        default:
          return {
            title: '사진을 다시 확인해주세요',
            description:
              '손 포즈 또는 문자를 정확히 판독하지 못했어요. 사진을 다시 촬영해 주세요.',
            tips: ['손 1개와 5자리 문자가 함께 선명하게 보여야 해요.'],
            buttonText: '확인',
          };
      }

    case 'SESSION_EXPIRED':
      return {
        title: '인증 시간이 만료되었어요',
        description:
          '문제를 받은 뒤 시간이 지나 현재 문제는 더 이상 사용할 수 없어요.',
        tips: ['새 문제를 받아 다시 시작해주세요.'],
        buttonText: '확인',
      };

    case 'MAX_SESSION_ATTEMPTS_EXCEEDED':
      return {
        title: '이 문제의 시도 횟수를 모두 사용했어요',
        description: '같은 문제는 더 이상 제출할 수 없어요.',
        tips: ['새 문제를 받아 다시 진행해주세요.'],
        buttonText: '확인',
      };

    case 'IP_BLOCKED':
      return {
        title: '잠시 후 다시 시도해주세요',
        description: `반복된 요청 또는 실패로 인해 일시적으로 제한되었어요. ${formatRetryTime(
          retryAfterSeconds,
        )} 다시 시도할 수 있어요.`,
        tips: ['잠시 기다린 뒤 다시 시작해주세요.'],
        buttonText: '확인',
      };

    case 'SESSION_IP_MISMATCH':
      return {
        title: '요청 환경이 변경되었어요',
        description:
          '문제를 시작한 기기 또는 네트워크와 현재 요청 환경이 달라 인증을 계속할 수 없어요.',
        tips: ['같은 기기에서 새 문제로 다시 시작해주세요.'],
        buttonText: '확인',
      };

    case 'EMPTY_IMAGE':
      return {
        title: '이미지를 다시 업로드해주세요',
        description: '사진이 비어 있거나 정상적으로 첨부되지 않았어요.',
        tips: ['사진을 다시 찍거나 파일을 다시 선택해주세요.'],
        buttonText: '확인',
      };

    default:
      return {
        title: '인증에 실패했어요',
        description:
          fallbackMessage || '사진을 다시 확인한 뒤 한 번 더 시도해주세요.',
        tips: ['손 1개와 5자리 문자가 함께 선명하게 보여야 해요.'],
        buttonText: '확인',
      };
  }
};

export default function HandOcrCaptcha() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentExampleIdx, setCurrentExampleIdx] = useState(0);
  const [errorModal, setErrorModal] = useState<CaptchaErrorModalState | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearSelectedImage = useCallback(() => {
    setPreviewImage(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const resetChallengeState = useCallback(() => {
    setChallenge(null);
    setSessionId('');
    setTimeLeft(TOTAL_SECONDS);
    clearSelectedImage();
  }, [clearSelectedImage]);

  const openErrorModal = useCallback(
    (
      failureReason?: CaptchaUiFailureReason,
      fallbackMessage?: string,
      onConfirm?: () => void,
    ) => {
      setErrorModal({
        ...getCaptchaErrorContent(failureReason, fallbackMessage),
        onConfirm,
      });
    },
    [],
  );

  const closeErrorModal = useCallback(() => {
    const onConfirm = errorModal?.onConfirm;
    setErrorModal(null);
    onConfirm?.();
  }, [errorModal]);

  const fetchChallenge = async (): Promise<boolean> => {
    try {
      const data = await startCaptcha();

      if (!data.success) {
        if (data.failureReason?.type === 'IP_BLOCKED') {
          toast.error(
            data.message ||
              `요청이 차단되었습니다. ${
                data.failureReason.retryAfterSeconds ?? 0
              }초 후 다시 시도해주세요.`,
          );
        } else {
          toast.error(data.message || '문제를 불러오는 데 실패했습니다.');
        }
        return false;
      }

      if (!data.sessionId || !data.text || !data.pose) {
        toast.error('문제 정보가 올바르지 않습니다.');
        return false;
      }

      setSessionId(data.sessionId);
      setChallenge({ text: data.text, pose: data.pose });
      setTimeLeft(TOTAL_SECONDS);

      return true;
    } catch (error) {
      console.error('문제 출제 실패:', error);

      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || '문제를 불러오는 데 실패했습니다.',
        );
      } else {
        toast.error('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }

      return false;
    }
  };

  const handleStart = async () => {
    resetChallengeState();
    setErrorModal(null);

    const isSuccess = await fetchChallenge();
    if (isSuccess) {
      setStep('challenge');
    } else {
      setStep('intro');
    }
  };

  const handleRefreshChallenge = async () => {
    resetChallengeState();
    setErrorModal(null);

    const isSuccess = await fetchChallenge();
    if (isSuccess) {
      setStep('challenge');
    } else {
      setStep('intro');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile || !sessionId) return;

    setStep('evaluating');

    try {
      const data = await verifyCaptcha(sessionId, selectedFile);

      if (data.success) {
        if (!data.passToken) {
          setStep('challenge');
          openErrorModal(
            undefined,
            '인증 토큰이 없어 다음 단계로 진행할 수 없어요. 다시 시도해주세요.',
          );
          return;
        }

        captchaTokenStorage.set(data.passToken);
        setStep('success');

        setTimeout(() => {
          navigate('/party/create');
        }, 1000);
        return;
      }

      if (data.failureReason?.type === 'SESSION_EXPIRED') {
        setStep('challenge');
        openErrorModal(data.failureReason, data.message, () => {
          resetChallengeState();
          setStep('intro');
        });
        return;
      }

      if (
        data.failureReason?.type === 'IP_BLOCKED' ||
        data.failureReason?.type === 'MAX_SESSION_ATTEMPTS_EXCEEDED' ||
        data.failureReason?.type === 'SESSION_IP_MISMATCH'
      ) {
        setStep('challenge');
        openErrorModal(data.failureReason, data.message, () => {
          resetChallengeState();
          setStep('intro');
        });
        return;
      }

      setStep('challenge');
      openErrorModal(data.failureReason, data.message);
    } catch (error) {
      console.error('검증 요청 실패:', error);
      setStep('challenge');
      openErrorModal(
        undefined,
        '서버와 통신하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
      );
    }
  };

  useEffect(() => {
    const passToken = captchaTokenStorage.get();
    if (passToken) {
      navigate('/party/create', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (step !== 'challenge') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          openErrorModal({ type: 'TIME_EXPIRED' }, undefined, () => {
            resetChallengeState();
            setStep('intro');
          });

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, openErrorModal, resetChallengeState]);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const formatTime = (seconds: number) => {
    const helperDate = new Date(0);
    helperDate.setSeconds(seconds);
    return format(helperDate, 'mm:ss');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Toaster position="top-center" />

      <Container className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-purple-600 to-blue-500 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white mb-4 backdrop-blur-sm">
              <FiShield size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              AI 행동 기반 인증
            </h2>
            <p className="text-blue-100 text-sm">
              안전한 서비스 이용을 위해 봇이 아님을 증명해주세요.
            </p>
          </div>

          <div className="p-8">
            {step === 'intro' && (
              <div className="flex flex-col items-center text-center animate-fadeIn">
                <div className="bg-gray-50 p-6 rounded-2xl w-full mb-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3">인증 방법</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    화면에 제시되는 5자리 문자를 종이에 적고, <br />
                    요구하는 손 포즈와 함께 사진을 찍어주세요.
                  </p>

                  <Slide
                    examples={EXAMPLES}
                    onSlideChange={setCurrentExampleIdx}
                  />

                  <p className="text-xs text-gray-700 bg-blue-50/50 py-2 px-3 rounded-lg font-medium">
                    💡 예시: [ A1B2C ] 글씨와 [{' '}
                    {EXAMPLES[currentExampleIdx].pose} ] 포즈가 담긴 사진
                  </p>
                </div>

                <button
                  onClick={handleStart}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl"
                >
                  문제 풀기 시작
                </button>
              </div>
            )}

            {step === 'challenge' && challenge && (
              <div className="flex flex-col items-center animate-fadeIn">
                <div className="flex justify-between items-center w-full mb-6">
                  <div
                    className={`flex items-center gap-2 font-bold text-lg ${
                      timeLeft <= 60
                        ? 'text-red-500 animate-pulse'
                        : 'text-gray-700'
                    }`}
                  >
                    <FiClock />
                    <span>{formatTime(timeLeft)}</span>
                  </div>

                  <button
                    onClick={handleRefreshChallenge}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    <FiRefreshCw size={14} />
                    다른 문제 풀기
                  </button>
                </div>

                <div className="w-full bg-linear-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-6 text-center mb-6">
                  <p className="text-sm text-gray-500 font-medium mb-2">
                    다음 미션을 수행해주세요
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm font-mono text-3xl font-extrabold text-gray-800 tracking-widest border border-gray-100">
                      {challenge.text}
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm text-xl font-bold text-blue-600 border border-gray-100">
                      {challenge.pose}
                    </div>
                  </div>
                </div>

                {previewImage ? (
                  <div className="w-full relative mb-6 rounded-2xl overflow-hidden border-2 border-purple-500">
                    <img
                      src={previewImage}
                      alt="미리보기"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={clearSelectedImage}
                      className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs hover:bg-black/80 backdrop-blur-sm"
                    >
                      다시 선택
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer mb-6"
                  >
                    <FiCamera size={40} className="mb-3 text-gray-400" />
                    <p className="font-medium text-gray-600">
                      클릭하여 사진 촬영 또는 업로드
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile}
                  className="w-full py-4 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-blue-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  인증 제출하기
                </button>
              </div>
            )}

            {step === 'evaluating' && (
              <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  AI 모델 분석 중...
                </h3>
                <p className="text-gray-500 text-sm">
                  제출하신 사진을 판독하고 있습니다.
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center text-center py-8 animate-fadeIn">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <FiCheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  인증 완료!
                </h3>
                <p className="text-gray-600 mb-8">사람으로 확인되었습니다.</p>
                <button
                  onClick={() => navigate('/party/create')}
                  className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
                >
                  다음 단계로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      {errorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                <FiAlertCircle size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {errorModal.title}
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {errorModal.description}
                </p>

                {errorModal.tips && errorModal.tips.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      다시 시도할 때 확인해주세요
                    </p>

                    <ul className="space-y-1.5 text-sm text-gray-600">
                      {errorModal.tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={closeErrorModal}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3.5 font-bold text-white transition-colors hover:bg-gray-800"
            >
              {errorModal.buttonText ?? '확인'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
