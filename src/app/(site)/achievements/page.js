import pages from "@/styles/pages.module.scss";

export const metadata = {
  title: "Достижения учеников",
  description: "Награды и выступления учеников студии Inside по хастлу.",
  alternates: { canonical: "/achievements" },
};

const items = [
  {
    title: "Фестиваль социальных танцев",
    text: "Ученики студии заняли призовые места в номинации «дебют».",
  },
  {
    title: "Показ Inside",
    text: "Совместная постановка и сольные номера в чёрно-белой стилистике студии.",
  },
  {
    title: "Джек-энд-Джилл",
    text: "Участие пар в джек-энд-джилл и развитие импровизации на социалах.",
  },
];

export default function AchievementsPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <h1 className={pages.h2}>Достижения учеников</h1>
        <p className={pages.lead} style={{ marginBottom: "2rem" }}>
          Мы гордимся тем, как ученики выходят на сцену и растут в танце — от первых шагов до
          уверенных выступлений.
        </p>
        <div className={pages.timeline}>
          {items.map((it) => (
            <div key={it.title} className={pages.timelineItem}>
              <strong>{it.title}</strong>
              <span>{it.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
