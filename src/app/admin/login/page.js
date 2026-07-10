"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../admin.module.scss";

function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка входа");
        return;
      }
      const next = search.get("from") || "/admin";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Сеть недоступна");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <p className={styles.kicker}>INSIDE · Админ</p>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.lead}>Панель управления новостями, галереей и сторис студии.</p>
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="user">Логин</label>
            <input
              id="user"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="pass">Пароль</label>
            <input
              id="pass"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Вход…" : "Войти"}
          </button>
          {error ? <p className={styles.error}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className={styles.loginWrap} aria-busy="true" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
