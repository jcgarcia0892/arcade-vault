"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/session";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);

  const homeActive = pathname === "/";
  const libraryActive = pathname === "/juegos" || pathname.startsWith("/juegos/");
  const salonActive = pathname === "/salon";
  const aboutActive = pathname === "/about";
  const authActive = pathname === "/auth";
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={homeActive ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/juegos" className={libraryActive ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={salonActive ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={aboutActive ? "active" : ""}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <button className="btn auth-btn" onClick={() => router.push("/auth")}>
            Iniciar Sesión
          </button>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan mb-4 text-[11px]">MENÚ</div>
        <Link href="/" className={homeActive ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link href="/juegos" className={libraryActive ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={salonActive ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/about" className={aboutActive ? "active" : ""} onClick={close}>
          Acerca de
        </Link>
        <Link href="/auth" className={authActive ? "active" : ""} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div className="flex-1"></div>
        <div className="pixel text-[9px] tracking-[0.16em] text-ink-faint">CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
