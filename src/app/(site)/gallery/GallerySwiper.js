"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import pages from "@/styles/pages.module.scss";
import g from "./gallery-swiper.module.scss";

export function GallerySwiper({ items }) {
  if (items.length === 0) return null;

  return (
    <div className={`${pages.gallerySwiper} ${g.wrap}`}>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={0}
        slidesPerView={1}
        className={g.swiper}
      >
        {items.map((p) => (
          <SwiperSlide key={p.id}>
            <figure className={pages.figure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption} className={g.img} sizes="100vw" loading="lazy" />
              <figcaption className={pages.caption}>{p.caption}</figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
