import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';

interface ExampleData {
  id: number;
  image: string;
  pose: string;
}

interface SlideProps {
  examples: ExampleData[];
  onSlideChange: (index: number) => void;
}

export default function Slide({ examples, onSlideChange }: SlideProps) {
  return (
    <div className="mb-4 w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        onSlideChange={(swiper) => onSlideChange(swiper.realIndex)}
        className="h-44 w-full rounded-xl bg-gray-100 sm:h-52"
      >
        {examples.map((example) => (
          <SwiperSlide key={example.id}>
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <img
                src={example.image}
                alt={example.pose}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
