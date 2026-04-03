/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react';
import Container from '../../components/layout/Container';
import {
  FiClock,
  FiShield,
  FiCamera,
  FiUploadCloud,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { format } from 'date-fns';

// 🌟 분리한 Slide 컴포넌트 Import
import Slide from './components/Slide';

import v_sign from '../../assets/v_sign.png';
import fist from '../../assets/fist.png';
import palm from '../../assets/palm.png';
import thumbs_up from '../../assets/thumbs_up.png';
import { startCaptcha, verifyCaptcha } from '../../apis/captcha';
import axios from 'axios';
import { getPassToken, setPassToken } from '../../utils/captchaPassToken';
import { useNavigate } from 'react-router';

type Step = 'intro' | 'challenge' | 'evaluating' | 'success' | 'fail';

interface ChallengeData {
  text: string;
  pose: string;
}

interface FailureReason {
  type?: string;
  expectedPose?: string;
  detectedPose?: string;
  expectedText?: string;
  detectedText?: string;
  poseConfidence?: number;
  ocrConfidence?: number;
  aiErrorCode?: string;
  aiMessage?: string;
  aiDetail?: string;
  aiGuide?: string;
  ocrCandidates?: string[];
  inspection?: unknown;
  gpuServerUrl?: string;
}

interface VerifyCaptchaResponse {
  success: boolean;
  message?: string;
  passToken?: string;
  failureReason?: FailureReason;
}

const TOTAL_SECONDS = 5 * 60; // 300초

const EXAMPLES = [
  { id: 1, image: fist, pose: '주먹 ✊' },
  { id: 2, image: palm, pose: '손바닥 🖐️' },
  { id: 3, image: v_sign, pose: '브이 ✌️' },
  { id: 4, image: thumbs_up, pose: '따봉 👍' },
];

export default function HandOcrCaptcha() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('intro');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  // 서버로부터 받을 문제와 세션 ID 상태
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // 서버로 전송할 실제 파일 객체 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [currentExampleIdx, setCurrentExampleIdx] = useState(0);

  const [notice, setNotice] = useState<{
    type: 'error' | 'info' | 'success';
    title: string;
    message: string;
  } | null>(null);

  const [failMessage, setFailMessage] = useState('');
  const [failureDetail, setFailureDetail] = useState<FailureReason | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const passToken = getPassToken();

    if (passToken) {
      navigate('/party/create', { replace: true });
    }
  }, [navigate]);

  const resetForNewChallenge = () => {
    setNotice(null);
    setFailMessage('');
    setFailureDetail(null);
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const maskText = (text?: string) => {
    if (!text) return '-';
    if (text.length <= 2) return text;
    return `${text[0]}${'*'.repeat(Math.max(text.length - 2, 0))}${text[text.length - 1]}`;
  };

  const shouldShowExactTextComparison = (
    reason: FailureReason | null,
    currentStep: Step,
  ) => {
    if (!reason || currentStep !== 'fail') return false;

    // 운영 환경에서는 여기 조건을 더 보수적으로 가져가도 됩니다.
    // 예: reason.type === 'MISSION_MISMATCH'일 때만 true
    return reason.type === 'MISSION_MISMATCH';
  };

  const shouldShowDetailedGuide = (reason: FailureReason | null) => {
    if (!reason) return false;

    return (
      reason.type === 'AI_DETECTION_FAILED' ||
      reason.type === 'MISSION_MISMATCH' ||
      !!reason.aiDetail ||
      !!reason.aiGuide
    );
  };

  // API 호출: 문제 가져오기
  const fetchChallenge = async () => {
    try {
      const data = await startCaptcha();
      setSessionId(data.sessionId);
      setChallenge({ text: data.text, pose: data.pose });
      return true;
    } catch (error) {
      console.error('문제 출제 실패:', error);

      if (axios.isAxiosError(error) && error.response) {
        setNotice({
          type: 'error',
          title: '문제 불러오기 실패',
          message:
            error.response.data?.message || '문제를 불러오는 데 실패했습니다.',
        });
      } else {
        setNotice({
          type: 'error',
          title: '네트워크 오류',
          message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        });
      }
      return false;
    }
  };

  const handleStart = async () => {
    resetForNewChallenge();
    setTimeLeft(TOTAL_SECONDS);

    const isSuccess = await fetchChallenge();
    if (isSuccess) {
      setStep('challenge');
    }
  };

  const handleRefreshChallenge = async () => {
    resetForNewChallenge();
    await fetchChallenge();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const clearSelectedImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // API 호출: 제출 및 검증
  const handleSubmit = async () => {
    if (!selectedFile || !sessionId) return;

    setNotice(null);
    setFailMessage('');
    setFailureDetail(null);
    setStep('evaluating');

    try {
      const data = (await verifyCaptcha(
        sessionId,
        selectedFile,
      )) as VerifyCaptchaResponse;

      if (data.success && data.passToken) {
        setPassToken(data.passToken);
        navigate('/party/create', { replace: true });
        return;
      } else {
        setNotice({
          type: 'error',
          title: '인증 실패',
          message: data.message || '인증에 실패했습니다.',
        });
        setFailMessage(data.message || '인증에 실패했습니다.');
        setFailureDetail(data.failureReason ?? null);
        setStep('fail');
      }
    } catch (error) {
      console.error('검증 요청 실패:', error);

      let message = '검증 요청 중 오류가 발생했습니다. 다시 시도해주세요.';

      if (axios.isAxiosError(error) && error.response) {
        message =
          error.response.data?.message || '서버 오류로 검증에 실패했습니다.';
      }

      setNotice({
        type: 'error',
        title: '요청 실패',
        message,
      });
      setFailMessage(message);
      setFailureDetail(null);
      setStep('fail');
    }
  };

  // 타이머 로직
  useEffect(() => {
    if (step !== 'challenge') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailMessage('제한 시간(5분)이 초과되었습니다.');
          setFailureDetail(null);
          setStep('fail');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // object URL 메모리 정리
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

  const showExactTextComparison = shouldShowExactTextComparison(
    failureDetail,
    step,
  );
  const showDetailedGuide = shouldShowDetailedGuide(failureDetail);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Container className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* 상단 헤더 */}
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
            {notice && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-4 shadow-sm animate-fadeIn ${
                  notice.type === 'error'
                    ? 'border-red-200 bg-red-50'
                    : notice.type === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 shrink-0 ${
                      notice.type === 'error'
                        ? 'text-red-500'
                        : notice.type === 'success'
                          ? 'text-green-500'
                          : 'text-blue-500'
                    }`}
                  >
                    {notice.type === 'error' ? (
                      <FiAlertCircle size={20} />
                    ) : notice.type === 'success' ? (
                      <FiCheckCircle size={20} />
                    ) : (
                      <FiShield size={20} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 mb-1">
                      {notice.title}
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {notice.message}
                    </p>
                  </div>

                  <button
                    onClick={() => setNotice(null)}
                    className="text-sm text-gray-400 hover:text-gray-700"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

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
                    💡 예시: [ A1B2C ] 글씨와 [
                    {EXAMPLES[currentExampleIdx].pose}] 포즈가 담긴 사진
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
                  disabled={!previewImage}
                  className={`w-full py-4 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2
                    ${
                      previewImage
                        ? 'bg-linear-to-r from-purple-600 to-blue-500 text-white hover:opacity-90'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FiUploadCloud size={20} />
                  인증 제출하기
                </button>
              </div>
            )}

            {step === 'evaluating' && (
              <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
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
                <button className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors">
                  다음 단계로 이동
                </button>
              </div>
            )}

            {step === 'fail' && (
              <div className="flex flex-col items-center text-center py-8 animate-fadeIn">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <FiAlertCircle size={40} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  인증 실패
                </h3>

                <p className="text-gray-600 mb-4 whitespace-pre-line">
                  {timeLeft <= 0
                    ? '제한 시간(5분)이 초과되었습니다.'
                    : failMessage ||
                      '제시된 미션과 일치하지 않거나, 판독할 수 없습니다.'}
                </p>

                {failureDetail && (
                  <div className="w-full mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">
                      판독 상세
                    </h4>

                    <div className="space-y-3">
                      {(failureDetail.expectedPose ||
                        failureDetail.detectedPose ||
                        typeof failureDetail.poseConfidence === 'number') && (
                        <div className="rounded-xl bg-white border border-gray-200 p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            손 포즈 판독
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-500 mb-1">
                                요구 포즈
                              </p>
                              <p className="font-bold text-gray-900">
                                {failureDetail.expectedPose || '-'}
                              </p>
                            </div>

                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-500 mb-1">
                                인식 포즈
                              </p>
                              <p className="font-bold text-gray-900">
                                {failureDetail.detectedPose || '-'}
                              </p>
                            </div>
                          </div>

                          {typeof failureDetail.poseConfidence === 'number' && (
                            <p className="mt-3 text-xs text-gray-500">
                              손 포즈 신뢰도:{' '}
                              {failureDetail.poseConfidence.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {(failureDetail.expectedText ||
                        failureDetail.detectedText ||
                        typeof failureDetail.ocrConfidence === 'number') && (
                        <div className="rounded-xl bg-white border border-gray-200 p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            문자 판독
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-500 mb-1">
                                요구 문자열
                              </p>
                              <p className="font-mono font-bold text-gray-900 tracking-wider">
                                {showExactTextComparison
                                  ? failureDetail.expectedText || '-'
                                  : maskText(failureDetail.expectedText)}
                              </p>
                            </div>

                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-500 mb-1">
                                인식 문자열
                              </p>
                              <p className="font-mono font-bold text-gray-900 tracking-wider">
                                {showExactTextComparison
                                  ? failureDetail.detectedText || '-'
                                  : maskText(failureDetail.detectedText)}
                              </p>
                            </div>
                          </div>

                          {typeof failureDetail.ocrConfidence === 'number' && (
                            <p className="mt-3 text-xs text-gray-500">
                              OCR 신뢰도:{' '}
                              {failureDetail.ocrConfidence.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {showDetailedGuide && (
                        <div className="rounded-xl bg-white border border-gray-200 p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            안내
                          </p>

                          {failureDetail.aiErrorCode && (
                            <p className="text-sm text-gray-700 mb-1">
                              오류 코드: {failureDetail.aiErrorCode}
                            </p>
                          )}

                          {failureDetail.aiMessage && (
                            <p className="text-sm text-gray-700 mb-1 whitespace-pre-line">
                              {failureDetail.aiMessage}
                            </p>
                          )}

                          {failureDetail.aiDetail && (
                            <p className="text-sm text-gray-700 mb-1 whitespace-pre-line">
                              {failureDetail.aiDetail}
                            </p>
                          )}

                          {failureDetail.aiGuide && (
                            <p className="text-sm text-blue-600 whitespace-pre-line">
                              {failureDetail.aiGuide}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStart}
                  className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
                >
                  다시 시도하기
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
