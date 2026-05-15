"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import styles from "./home-swiper.module.scss";

const slides = [
  {
    title: "Хастл в Inside",
    text: "Современный социальный танец: музыкальность, партнёрство и свобода на паркете.",
  },
  {
    title: "Группы с нуля",
    text: "Понятная методика, внимание к деталям и комфортный темп освоения.",
  },
  {
    title: "Атмосфера студии",
    text: "Чёрно-белая эстетика пространства — фокус на теле, музыке и движении.",
  },
];

export function HomeHeroSwiper() {
  return (
    <div className={styles.wrap}>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        // effect="fade"
        loop
        speed={900}
        autoplay={{ delay: 5200, disableOnInteraction: false }}
        // slideClass={styles.slideW}
        // slideActiveClass={styles.activeSlide}
        pagination={{ clickable: true }}
        className={styles.swiper}
      >
        {slides.map((s) => (
          <SwiperSlide key={s.title}>
            <div className={styles.slide}>
              <p className={styles.slideTitle}>{s.title}</p>
              <p className={styles.slideText}>{s.text}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
