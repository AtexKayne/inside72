"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import styles from "./home-swiper.module.scss";

const slides = [
  {
    title: "Социальный хастл",
    text: "С нуля — под любую музыку и с разными партнёрами, без зажатости на танцполе.",
  },
  {
    title: "Преподаватели",
    text: "Основатели студии с многолетним опытом: система, прозрачность и внимание к каждому нюансу.",
  },
  {
    title: "Сообщество",
    text: "Тусовка, где танцуют, поддерживают друг друга и вместе выходят на социалы и опены.",
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
