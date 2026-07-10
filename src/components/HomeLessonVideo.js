"use client";

import { useCallback, useRef } from "react";
import { getHomePageVideos } from "@/lib/home-video";
import pages from "@/styles/pages.module.scss";

export function HomeLessonVideo() {
  const videos = getHomePageVideos();
  const videoRefs = useRef([]);

  const handlePlay = useCallback((activeIndex) => {
    videoRefs.current.forEach((el, index) => {
      if (index !== activeIndex && el && !el.paused) {
        el.pause();
      }
    });
  }, []);

  return (
    <section
      className={`${pages.sectionTight} ${pages.lessonVideoSection}`}
      aria-labelledby="home-videos-heading"
    >
      <div className={pages.inner}>
        <h2 id="home-videos-heading" className={pages.h2}>
          Видео о нас
        </h2>
        <div className={pages.lessonVideoGrid}>
          {videos.map((video, index) => (
            <figure key={video.id} className={pages.lessonVideo}>
              <div className={pages.lessonVideoMedia}>
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  className={pages.lessonVideoPlayer}
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                  onPlay={() => handlePlay(index)}
                />
              </div>
              <figcaption className={pages.lessonVideoCaption}>{video.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
