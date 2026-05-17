import Link from "next/link";
import pages from "@/styles/pages.module.scss";

/**
 * @param {{ images?: string[]; linkTo?: string; className?: string }} props
 */
export function NewsImages({ images, linkTo, className }) {
  if (!images?.length) return null;

  const mediaClass = [pages.newsMedia, className].filter(Boolean).join(" ");

  const figures = images.map((src) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={src} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
  ));

  if (linkTo && images.length === 1) {
    return (
      <Link href={linkTo} className={`${mediaClass} ${pages.newsMediaLink}`}>
        {figures}
      </Link>
    );
  }

  return <div className={mediaClass}>{figures}</div>;
}
