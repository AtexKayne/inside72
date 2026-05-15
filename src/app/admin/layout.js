import styles from "./admin.module.scss";

export const metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div className={styles.shell}>{children}</div>;
}
