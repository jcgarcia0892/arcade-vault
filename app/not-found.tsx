import Link from "next/link";

// Not in the template: a cabinet with no cartridge loaded, reusing the player's CRT frame.
export default function NotFound() {
  return (
    <section className="fade-in mx-auto my-16 max-w-[560px] px-6 text-center">
      <div className="crt">
        <div className="crt-screen">
          <div className="crt-content flex-col gap-5">
            <div
              aria-hidden="true"
              className="pixel neon-magenta flicker text-[clamp(48px,14vw,112px)] motion-reduce:animate-none"
            >
              404
            </div>
            <h1 className="pixel m-0 text-[clamp(10px,2.4vw,14px)] tracking-[0.16em] text-yellow">
              NIVEL NO ENCONTRADO <span className="animate-[blink_1.2s_steps(1,end)_infinite] motion-reduce:animate-none">_</span>
            </h1>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led before:bg-magenta before:shadow-[0_0_6px_var(--magenta)]">SIN SEÑAL</span>
          <span>ARCADE VAULT</span>
        </div>
      </div>

      <p className="mx-auto mt-8 mb-6 max-w-[44ch] text-ink-dim">
        Esta dirección no lleva a ningún juego del vault. Elige otro desde la biblioteca.
      </p>
      <Link href="/" className="btn magenta lg">
        VOLVER AL VAULT
      </Link>
    </section>
  );
}
