# SPEC 01 — MVP visual: pantallas del template en Next.js

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-19
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `resources/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) como réplica visual 1:1 con datos mock, sin implementar ningún juego.

---

## Por qué existe esta spec

El template en `resources/templates/` es una SPA en React 18 que se carga con Babel en el navegador y enruta con `location.hash`.
El proyecto es Next.js 16 con App Router y Cache Components.
Esta spec traduce ese prototipo a la arquitectura real del proyecto sin cambiar lo que se ve.
Los estilos ya están portados en `app/globals.css`, así que el trabajo es de markup, rutas y estado cliente.

---

## Alcance

**Dentro:**

- Cinco pantallas con URL propia:
  - `/` → Biblioteca (hero, buscador, chips de categoría, grilla de tarjetas, estado vacío "NO HAY RESULTADOS").
  - `/juegos/[id]` → Detalle (portada, tags, descripción, stat-strip, acciones, leaderboard de 10 filas).
  - `/juegos/[id]/jugar` → Reproductor (HUD, arena CRT decorativa, pausa, modal de fin de juego).
  - `/auth` → Acceso (pestañas INICIAR SESIÓN / CREAR CUENTA, campo de correo solo en "crear", botón invitado, botones sociales decorativos).
  - `/salon` → Salón de la Fama (pestañas por juego, podio, tabla de 12 filas, fila "TU MEJOR MARCA" si hay sesión).
- Nav global con logo, enlaces activos según la ruta, contador "CRÉDITOS · 03" fijo, botón de sesión, menú hamburguesa y panel móvil.
- Footer global con el texto `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`.
- Página 404 (`app/not-found.tsx`) con la estética arcade y un botón VOLVER AL VAULT.
- Datos mock tipados (los 8 juegos, las categorías y `seededScores`) idénticos a `data.jsx`.
- Sesión mock en `localStorage`: login falso, nombre en el Nav, cerrar sesión con un clic en el nombre.
- Simulación del Reproductor igual que el template: la puntuación sube por intervalo, el nivel sube, PAUSA/REANUDAR, FIN abre el modal, GUARDAR PUNTUACIÓN escribe en `localStorage`, JUGAR DE NUEVO reinicia.
- Efecto tilt 3D de las tarjetas de la Biblioteca al mover el ratón.
- Eliminar el contenido scaffold de Create Next App de `app/page.tsx`.

**Fuera de alcance (para specs futuras):**

- Cualquier juego real (lógica, canvas, controles de teclado o táctiles).
- Autenticación real, validación de formularios, OAuth de Google o GitHub.
- Backend, base de datos o API de puntuaciones.
- Leer `av_scores` para mostrarlo en leaderboards (hoy se escribe y nada lo lee).
- Menú desplegable de cuenta. El clic en el nombre cierra la sesión directamente.
- Sistema de créditos funcional (el contador es texto fijo).
- Filtros de la Biblioteca persistidos en la URL (`searchParams`).
- Rediseños o mejoras visuales sobre el template.
- Metadata por página (títulos de pestaña distintos por ruta).
- Borrar los SVG de scaffold de `public/`.

---

## Modelo de datos

### Juegos — `lib/games.ts`

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;          // slug, se usa en la URL: "bloque-buster"
  title: string;       // "BLOQUE BUSTER"
  short: string;       // descripción de la tarjeta
  long: string;        // descripción del detalle
  cat: GameCategory;
  cover: string;       // clase CSS de la portada: "cover-bricks"
  color: GameColor;
  best: number;        // 28450
  plays: string;       // "12.4K"
}

export const GAMES: Game[];                                   // los 8 juegos de data.jsx, mismo orden y valores
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export function getGame(id: string): Game | undefined;

export interface ScoreRow { rank: number; name: string; score: number; date: string } // date: "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[];             // mismo algoritmo que data.jsx
```

Semillas (iguales al template, para que los rankings coincidan):

- Detalle: `seededScores(id.length * 17 + 3, 10)`.
- Salón: `seededScores(id.length * 23 + 7, 12)`.

Formato de números: `toLocaleString("es-ES")` en todas las puntuaciones.

### Sesión y puntuaciones — `lib/session.ts` (solo cliente)

```ts
export interface User { name: string }  // MAYÚSCULAS, máximo 10 caracteres, "PLAYER1" si el campo está vacío

export interface SavedScore {
  game: string;   // Game.id
  score: number;
  name: string;
  at: number;     // Date.now()
}
```

Claves de `localStorage` (las mismas del template):

- `av_user` → `User` serializado, o ausente si no hay sesión.
- `av_scores` → `SavedScore[]` serializado.

El hook `useUser()` expone `{ user, login(user), logout() }`.
Se implementa con `useSyncExternalStore` sobre `localStorage`.
El snapshot del servidor es `null`, así que el HTML prerenderizado siempre muestra el estado "sin sesión".
`login` y `logout` notifican a los suscriptores para que el Nav y el Salón se actualicen sin recargar.
Toda lectura y escritura va dentro de `try/catch`; si `localStorage` falla, la app se comporta como "sin sesión".

---

## Plan de implementación

Cada paso deja `npm run build` en verde.

1. **Datos mock.** Crear `lib/games.ts` con los tipos, `GAMES`, `CATS`, `getGame` y `seededScores` copiados de `data.jsx`. Nada los consume todavía.
2. **Sesión.** Crear `lib/session.ts` con `User`, `SavedScore`, `useUser()` y `saveScore(entry)` sobre las claves `av_user` y `av_scores`.
3. **Footer.** Crear `components/footer.tsx` (Server Component) y convertir su `style` inline a utilidades Tailwind (`border-t border-line`, `text-ink-faint`, `font-mono`, etc.).
4. **Nav.** Crear `components/nav.tsx` (`"use client"`). Usa `next/link`, `usePathname()` para el estado activo y `useUser()` para el botón de sesión. Reglas de enlace activo:
   - Biblioteca: `/` y cualquier ruta bajo `/juegos/`.
   - Salón de la Fama: `/salon`.
   - "Iniciar Sesión" / "Cuenta" del panel móvil: `/auth`.
   - Abrir el panel con ≡, cerrarlo al pulsar el fondo o un enlace.
5. **Layout.** Modificar `app/layout.tsx` para renderizar dentro de `#root`: `<Nav />`, `<main className="av-main">{children}</main>` y `<Footer />`. Mantener `.av-bg`, `.av-noise`, las fuentes y la metadata actuales.
6. **Biblioteca.** Crear `components/game-card.tsx` (`"use client"`, tilt con `useRef`) y `components/library.tsx` (`"use client"`, búsqueda y chips con estado local). Reemplazar `app/page.tsx` por la Biblioteca. La tarjeta y su botón JUGAR enlazan a `/juegos/[id]`.
7. **404.** Crear `app/not-found.tsx` con la estética arcade (`pixel`, `neon-magenta`, `.btn`) y un enlace VOLVER AL VAULT a `/`. Es la única pieza que se diseña con el skill `frontend-design`, porque el template no la tiene.
8. **Detalle.** Crear `components/leaderboard.tsx` y `app/juegos/[id]/page.tsx`. La página es Server Component, exporta `generateStaticParams` con los 8 ids y llama a `notFound()` si `getGame(id)` es `undefined`. JUGAR AHORA enlaza a `/juegos/[id]/jugar` y VOLVER AL VAULT a `/`.
9. **Reproductor.** Crear `components/game-player.tsx` (`"use client"`) con la simulación de `reproductor.jsx` (intervalo de 220 ms, subida de nivel, pausa, modal, guardar con `saveScore`, reiniciar). Crear `app/juegos/[id]/jugar/page.tsx` con `generateStaticParams` y `notFound()`, que pasa el `Game` al componente. SALIR va a `/juegos/[id]` y VOLVER AL VAULT a `/`. El nombre inicial es `user.name` o `"INVITADO"`.
10. **Acceso.** Crear `components/auth-form.tsx` (`"use client"`) y `app/auth/page.tsx`. Enviar el formulario llama a `login({ name })` y hace `router.push("/")`. JUGAR COMO INVITADO llama a `logout()` y navega a `/`. GOOGLE y GITHUB no hacen nada.
11. **Salón.** Crear `components/hall-of-fame.tsx` (`"use client"`, pestaña activa en estado local, `GAMES[0]` por defecto) y `app/salon/page.tsx`. Con sesión, la fila "TU MEJOR MARCA" usa la fórmula del template: rango `8 + (id.length % 4)` y puntuación `rows[5].score - 2400`.
12. **Limpieza.** Quitar imports e imágenes del scaffold que ya no se usen en `app/`. Ejecutar `npm run lint` y `npx tsc --noEmit` y corregir lo que salga.

---

## Criterios de aceptación

**Build y calidad**

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] El build lista `/juegos/[id]` y `/juegos/[id]/jugar` prerenderizadas para los 8 ids.
- [ ] Ninguna pantalla muestra errores ni advertencias de hidratación en la consola del navegador.

**Navegación**

- [ ] `/`, `/juegos/bloque-buster`, `/juegos/bloque-buster/jugar`, `/auth` y `/salon` cargan cada una su pantalla.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la página 404 arcade con un enlace a `/`.
- [ ] En `/` y en `/juegos/*` el enlace "Biblioteca" del Nav tiene la clase `active`; en `/salon` la tiene "Salón de la Fama".
- [ ] Pulsar el logo lleva a `/`.
- [ ] Con un ancho de 375 px el botón ≡ abre el panel móvil, y pulsar el fondo o un enlace lo cierra.

**Biblioteca**

- [ ] Se ven 8 tarjetas en el orden de `data.jsx`.
- [ ] Escribir "ca" en el buscador deja solo "CAÍDA".
- [ ] El chip PUZZLE deja solo "CAÍDA"; el chip TODOS vuelve a mostrar las 8.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Mover el ratón sobre una tarjeta la inclina, y al salir vuelve a su posición.

**Detalle**

- [ ] `/juegos/caida` muestra el título "CAÍDA", 31.8K partidas, mejor global 184.220 y 10 filas de leaderboard.
- [ ] Las tres primeras filas del leaderboard tienen las clases `top1`, `top2` y `top3`.

**Reproductor**

- [ ] La puntuación sube sola cada ~220 ms.
- [ ] PAUSA congela la puntuación y muestra "EN PAUSA"; REANUDAR la vuelve a mover.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] GUARDAR PUNTUACIÓN añade una entrada `{ game, score, name, at }` a `av_scores` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] JUGAR DE NUEVO deja puntuación 0, 3 vidas y nivel 01.

**Acceso y sesión**

- [ ] La pestaña CREAR CUENTA muestra el campo "Correo electrónico"; INICIAR SESIÓN lo oculta.
- [ ] Enviar con usuario "px_kai" redirige a `/`, el Nav muestra "PX_KAI ▾" y `av_user` vale `{"name":"PX_KAI"}`.
- [ ] Enviar con el usuario vacío inicia sesión como "PLAYER1".
- [ ] Pulsar "PX_KAI ▾" borra `av_user` y el Nav vuelve a mostrar "Iniciar Sesión".
- [ ] Recargar la página con sesión iniciada mantiene el nombre en el Nav.

**Salón de la Fama**

- [ ] Se ven 8 pestañas, una por juego, y "BLOQUE BUSTER" está activa al entrar.
- [ ] Cambiar de pestaña cambia el podio y las 12 filas de la tabla.
- [ ] Sin sesión no aparece la fila "TU MEJOR MARCA"; con sesión aparece con el nombre del usuario en amarillo.

**Fidelidad visual**

- [ ] Abriendo `resources/templates/Arcade Vault.html` al lado, cada pantalla tiene los mismos textos, el mismo orden de elementos y las mismas clases CSS.
- [ ] El código de `app/` y `components/` no contiene atributos `style={{…}}`, salvo el `animationDelay` calculado por fila del Salón y el `transform` del tilt.

---

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). Permiten enlazar cada pantalla y prerenderizarla.
- **No:** SPA con el estado en `location.hash` como el template. Desaprovecha el App Router y Cache Components.
- **Sí:** la ruta del detalle en español (`/juegos/[id]`), en línea con el resto del producto.
- **Sí:** réplica 1:1 del template. La spec se puede verificar comparando con el original.
- **No:** mejoras visuales con `frontend-design`. Solo se usa para la 404, que no existe en el template.
- **Sí:** mantener la simulación del Reproductor. Sin ella la pantalla se ve muerta y no se puede revisar el modal de fin de juego.
- **No:** HUD estático.
- **Sí:** sesión mock en `localStorage` con las claves del template (`av_user`, `av_scores`). Deja la UI de sesión lista para conectar auth real después.
- **Sí:** `useSyncExternalStore` con snapshot de servidor `null`. Evita errores de hidratación y sincroniza Nav y Salón sin un Context Provider.
- **No:** React Context para la sesión. Añade un provider en el layout sin ganar nada sobre el store externo.
- **Sí:** clic en el nombre del Nav cierra la sesión, igual que el template.
- **No:** menú desplegable de cuenta. Es UI nueva que no está en el template.
- **Sí:** `notFound()` y `app/not-found.tsx` para ids inexistentes, con `generateStaticParams` para los 8 ids válidos.
- **No:** redirigir a `/` cuando el id no existe. Oculta el error.
- **Sí:** datos en `lib/` y componentes en `components/`, en la raíz y accesibles con `@/*`.
- **No:** carpetas privadas `app/_lib` y `app/_components`.
- **Sí:** convertir los `style` inline a utilidades Tailwind con los tokens de `@theme`. Las clases del template (`.btn`, `.card`, `.av-nav`…) se usan tal cual.
- **No:** copiar los `style` inline. Mezcla dos sistemas de estilos.
- **Sí:** filtros de la Biblioteca y pestaña del Salón en estado local, como el template.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Con `cacheComponents: true`, leer `params` sin `generateStaticParams` o sin `<Suspense>` rompe el build. | Las dos rutas dinámicas exportan `generateStaticParams` con los 8 ids. Consultar `node_modules/next/dist/docs/` antes de escribirlas. |
| Desajuste de hidratación al leer `localStorage` durante el render. | `useSyncExternalStore` con snapshot de servidor `null`. Nunca leer `localStorage` fuera de ese hook ni de los handlers. |
| `toLocaleString("es-ES")` da un formato distinto en Node y en el navegador. | Node 20 trae ICU completo. Si aparece un desajuste, sustituirlo por un formateador propio en `lib/games.ts`. |
| Preflight está desactivado, así que `<a>` y `<button>` de `next/link` pueden heredar estilos distintos a los del template. | Usar las mismas clases del template sobre `Link`. Verificarlo en el criterio de fidelidad visual. |
| El intervalo del Reproductor sigue corriendo tras salir de la pantalla. | Limpiar el intervalo en el cleanup del `useEffect`, como el template. |

---

## Lo que **no** está en esta spec

- Juegos reales.
- Autenticación real, validación de formularios y OAuth.
- Backend o API de puntuaciones, y leer `av_scores` en los rankings.
- Menú de cuenta desplegable.
- Créditos funcionales.
- Filtros en la URL.
- Mejoras visuales sobre el template.
- Metadata por página.

Cada uno, si llega, va en su propia spec.
