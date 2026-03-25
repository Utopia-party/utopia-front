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

import example1 from '../../assets/example1.png';
import example2 from '../../assets/example2.png';
import example3 from '../../assets/example3.png';
import example4 from '../../assets/example4.png';
import example5 from '../../assets/example5.png';
import { startCaptcha, verifyCaptcha } from '../../apis/captcha';
import axios from 'axios';

type Step = 'intro' | 'challenge' | 'evaluating' | 'success' | 'fail';

interface ChallengeData {
  text: string;
  pose: string;
}

const TOTAL_SECONDS = 5 * 60; // 300초

const EXAMPLES = [
  { id: 1, image: example1, pose: '주먹 ✊' },
  { id: 2, image: example2, pose: '손바닥 🖐️' },
  { id: 3, image: example3, pose: '브이 ✌️' },
  { id: 4, image: example4, pose: '따봉 👍' },
  { id: 5, image: example5, pose: '손가락 3개 🤚' },
];

export default function HandOcrCaptcha() {
  const [step, setStep] = useState<Step>('intro');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  // 🌟 서버로부터 받을 문제와 세션 ID 상태
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // 🌟 서버로 전송할 실제 파일 객체 상태 추가
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [currentExampleIdx, setCurrentExampleIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🌟 API 호출: 문제 가져오기
  const fetchChallenge = async () => {
    try {
      const data = await startCaptcha();
      setSessionId(data.sessionId);
      setChallenge({ text: data.text, pose: data.pose });
      return true;
    } catch (error) {
      console.error('문제 출제 실패:', error);

      // Axios 에러인 경우 서버의 에러 메시지를 활용할 수 있습니다.
      if (axios.isAxiosError(error) && error.response) {
        alert(
          error.response.data?.message || '문제를 불러오는 데 실패했습니다.',
        );
      } else {
        alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
      return false;
    }
  };

  const handleStart = async () => {
    setTimeLeft(TOTAL_SECONDS);
    setPreviewImage(null);
    setSelectedFile(null);

    // 서버에서 문제 받아오기
    const isSuccess = await fetchChallenge();

    if (isSuccess) {
      setStep('challenge');
    }
  };

  const handleRefreshChallenge = async () => {
    setPreviewImage(null);
    setSelectedFile(null);

    // 시간은 초기화하지 않고 문제만 다시 받아오기
    await fetchChallenge();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // 서버 전송용 원본 파일 저장
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl); // 화면 표시용 미리보기 URL
    }
  };

  // 🌟 API 호출: 제출 및 검증
  const handleSubmit = async () => {
    if (!selectedFile || !sessionId) return;
    setStep('evaluating');

    try {
      const data = await verifyCaptcha(sessionId, selectedFile);

      if (data.success) {
        setStep('success');
      } else {
        // 서버에서 실패 메시지를 주면 alert나 상태로 띄워줄 수 있습니다.
        alert(data.message || '인증에 실패했습니다.');
        setStep('fail');
      }
    } catch (error) {
      console.error('검증 요청 실패:', error);
      if (axios.isAxiosError(error) && error.response) {
        alert(
          error.response.data?.message || '서버 오류로 검증에 실패했습니다.',
        );
      }
      setStep('fail');
    }
  };

  // 타이머 로직 유지
  useEffect(() => {
    if (step !== 'challenge') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('fail');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds: number) => {
    const helperDate = new Date(0);
    helperDate.setSeconds(seconds);
    return format(helperDate, 'mm:ss');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Container className="max-w-xl w-full">
        {/* 전체 카드 래퍼 */}
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
                    className={`flex items-center gap-2 font-bold text-lg ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}
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
                      onClick={() => {
                        setPreviewImage(null);
                        setSelectedFile(null);
                      }}
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
                <p className="text-gray-600 mb-8">
                  {timeLeft <= 0
                    ? '제한 시간(5분)이 초과되었습니다.'
                    : '제시된 미션과 일치하지 않거나, 판독할 수 없습니다.'}
                </p>
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
