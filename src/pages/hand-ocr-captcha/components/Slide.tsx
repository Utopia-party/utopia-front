// src/components/Slide.tsx (경로는 프로젝트에 맞게 수정하세요)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';

// 상위 컴포넌트와 동일한 타입 정의
interface ExampleData {
  id: number;
  image: string;
  pose: string;
}

// Props 타입 정의
interface SlideProps {
  examples: ExampleData[];
  onSlideChange: (index: number) => void;
}

export default function Slide({ examples, onSlideChange }: SlideProps) {
  return (
    <div className="w-full bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-4">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        // 상위 컴포넌트에서 넘겨받은 onSlideChange 함수를 실행하여 인덱스 전달
        onSlideChange={(swiper) => onSlideChange(swiper.realIndex)}
        className="w-full h-48 rounded-lg bg-gray-100"
      >
        {examples.map((example) => (
          <SwiperSlide key={example.id}>
            <img
              src={example.image}
              alt={example.pose}
              className="w-full h-full object-contain"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
