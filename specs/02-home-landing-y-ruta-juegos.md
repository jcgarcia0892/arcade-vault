# SPEC 02 — Home landing, Biblioteca en `/juegos` y ruta `/about`

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-19
> **Objetivo:** Sustituir la Biblioteca de `/` por la landing de `resources/templates/home-about/home.jsx`, mover la Biblioteca a `/juegos` y crear `/about` como placeholder mínimo.

---

## Por qué existe esta spec

SPEC 01 puso la Biblioteca en `/` porque el template original no tenía portada.
El nuevo template `resources/templates/home-about/` añade una landing (`home.jsx`), una página Acerca de (`about.jsx`) y un Nav con cuatro enlaces (`nav.jsx`).
Esta spec porta solo la landing como réplica 1:1, reubica la Biblioteca y deja `/about` reservada para una spec futura.
Cambia rutas y enlaces definidos en SPEC 01; SPEC 01 no se edita, esta spec prevalece sobre ella en esos puntos.

---

## Alcance

**Dentro:**

- `/` → nueva Home landing, réplica 1:1 de `home.jsx`:
  - Hero con siluetas flotantes (8 SVG), eyebrow "▸ INSERTA UNA MONEDA_", título de tres líneas, subtítulo, CTAs "▶  EXPLORAR JUEGOS" y "✦  CREAR CUENTA", indicador "DESLIZA ▼".
  - `// 01` ¿POR QUÉ ARCADE VAULT? con 4 feature cards e iconos pixel.
  - `// 02` JUEGOS DISPONIBLES AHORA con 6 mini-cards (`GAMES.slice(0, 6)`) y botón "VER TODOS LOS JUEGOS →".
  - Bloque de stats (3 bloques).
  - `// 03` ACTIVIDAD EN VIVO: ticker de 7 puntuaciones y top 5 jugadores con enlace "VER SALÓN →".
  - `// 04` PRECIOS: tarjeta de plan, lista, botón "EMPEZAR GRATIS →", sello "FREE PLAY" y 3 FAQ.
  - CTA final "¿LISTO PARA JUGAR?" con botón "INSERTAR MONEDA →".
  - Animación `.reveal` con `IntersectionObserver` igual que `useReveal` del template.
- `/juegos` → la Biblioteca actual (`components/library.tsx`) sin cambios internos.
- `/about` → placeholder mínimo: kicker "▸ ACERCA DE" y título "ACERCA DE ARCADE VAULT" con las clases del template, nada más.
- Nav con cuatro enlaces en este orden: Inicio · Biblioteca · Salón de la Fama · Acerca de. El panel móvil añade además "Iniciar Sesión" / "Cuenta".
- Redirigir los botones "VOLVER AL VAULT" a `/juegos`.
- Portar a `app/globals.css` los bloques CSS de la Home (`HOME PAGE`, `ACTIVITY`, `PRICING`) y de ABOUT solo `.about`, `.about-hero`, `.about-hero .kicker` y `.about-title`.

**Fuera de alcance (para specs futuras):**

- Contenido real de `/about`: misión, highlights, divisor pixel y formulario de contacto de `about.jsx`.
- CSS de `GAMEPAD` y `Theme variants` (pertenecen al Reproductor).
- Abrir `/auth` directamente en la pestaña CREAR CUENTA.
- Datos reales en ticker, top jugadores o stats (son texto mock fijo).
- Que "12+ JUEGOS" coincida con los 8 juegos reales.
- Fallback sin JavaScript o con `prefers-reduced-motion` para `.reveal`.
- Metadata por página.
- Ocultar "CREAR CUENTA" cuando hay sesión.

---

## Modelo de datos

### Datos mock de la Home — `lib/home.ts`

```ts
import type { GameColor } from "@/lib/games";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export interface Feature { icon: FeatureIconKind; title: string; desc: string; color: GameColor }
export interface HomeStat { n: string; u: string; s: string }
export interface TickerRow { player: string; game: string; score: number; ago: string; color: GameColor }
export interface TopPlayer { rank: number; player: string; score: number }

export const FEATURES: Feature[];     // 4 entradas de home.jsx, mismo orden y textos
export const HOME_STATS: HomeStat[];  // 3 entradas: 12+/JUEGOS, MILES/DE PARTIDAS, GLOBAL/RANKING
export const TICKER: TickerRow[];     // 7 entradas: NEONFOX … CYBER_LU
export const TOP_PLAYERS: TopPlayer[]; // 5 entradas: NEONFOX 312840 … GLITCHA 138900
```

Los textos de precios y FAQ se quedan como JSX en el componente, igual que en el template.
Formato de números: `toLocaleString("es-ES")`, como en SPEC 01.
No hay persistencia nueva; se reutilizan `GAMES` de `lib/games.ts` y `useUser()` de `lib/session.ts` (este último solo en el Nav).

---

## Plan de implementación

Cada paso deja `npm run build` en verde.

1. **CSS.** Copiar a `app/globals.css`, dentro de `@layer components`, los bloques `HOME PAGE` (líneas 930–1069 de `home-about/styles.css`, incluye `.reveal`), `ACTIVITY` y `PRICING`, y de `ABOUT PAGE` solo `.about`, `.about-hero`, `.about-hero .kicker` y `.about-title`. Nada lo usa todavía.
2. **Datos.** Crear `lib/home.ts` con los tipos y las cuatro constantes. Nada los consume todavía.
3. **Biblioteca en `/juegos`.** Crear `app/juegos/page.tsx` que renderiza `<Library />`. `/` sigue mostrando la Biblioteca en este paso.
4. **Enlaces a `/juegos`.** Cambiar a `/juegos` los "VOLVER AL VAULT" de `app/juegos/[id]/page.tsx`, `components/game-player.tsx`, `components/hall-of-fame.tsx` y `app/not-found.tsx`. `components/auth-form.tsx` sigue enviando a `/`.
5. **About.** Crear `app/about/page.tsx` (Server Component) con `<div className="about fade-in">` → `<section className="about-hero">` → kicker y título.
6. **Nav.** Actualizar `components/nav.tsx` (escritorio y panel móvil) con Inicio (`/`), Biblioteca (`/juegos`), Salón de la Fama (`/salon`) y Acerca de (`/about`). Reglas de activo:
   - Inicio: solo `pathname === "/"`.
   - Biblioteca: `/juegos` y cualquier ruta bajo `/juegos/`.
   - Salón de la Fama: `/salon`.
   - Acerca de: `/about`.
   - El logo sigue llevando a `/`.
7. **Iconos.** Crear `components/home-art.tsx` con `FloatingSilhouettes` y `FeatureIcon`, copiando los SVG de `home.jsx` (props `strokeWidth` en camelCase).
8. **Reveal.** Crear `components/reveal-observer.tsx` (`"use client"`) que en un `useEffect` observa `.reveal`, añade `.in` al entrar con `threshold: 0.12` y desconecta en el cleanup. Renderiza `null`.
9. **Home.** Crear `components/home.tsx` (Server Component) con todas las secciones y `<RevealObserver />`. Los botones de navegación son `next/link` con las clases `.btn` del template:
   - "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" → `/juegos`.
   - "CREAR CUENTA" y "EMPEZAR GRATIS →" → `/auth`.
   - Cada mini-card → `/juegos/[id]`.
   - "VER SALÓN →" → `/salon`.
   - Los `style` inline del template pasan a utilidades Tailwind, salvo los valores calculados por índice (`transitionDelay`, `animationDelay`, `width` de `.tp-fill`).
10. **Ruta raíz.** Reemplazar `app/page.tsx` para que renderice `<Home />` en vez de `<Library />`.
11. **Limpieza.** Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` y corregir lo que salga.

---

## Criterios de aceptación

**Build y calidad**

- [ ] `npm run build` termina sin errores y lista `/`, `/juegos` y `/about` como rutas estáticas.
- [ ] `npm run lint` termina sin errores.
- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] Ni `/`, ni `/juegos`, ni `/about` muestran errores ni advertencias de hidratación en la consola.

**Rutas y navegación**

- [ ] `/` muestra la Home con el título "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA".
- [ ] `/juegos` muestra la Biblioteca con las 8 tarjetas, el buscador y los chips de SPEC 01 funcionando igual.
- [ ] `/about` muestra solo "▸ ACERCA DE" y "ACERCA DE ARCADE VAULT".
- [ ] El Nav de escritorio muestra, en orden, Inicio · Biblioteca · Salón de la Fama · Acerca de.
- [ ] En `/` solo "Inicio" tiene la clase `active`; en `/juegos` y `/juegos/caida` solo "Biblioteca"; en `/salon` solo "Salón de la Fama"; en `/about` solo "Acerca de".
- [ ] A 375 px el panel móvil muestra los cuatro enlaces más "Iniciar Sesión" (o "Cuenta" con sesión).
- [ ] "VOLVER AL VAULT" en `/juegos/caida`, `/juegos/caida/jugar`, `/salon` y en la 404 lleva a `/juegos`.
- [ ] Iniciar sesión en `/auth` y "JUGAR COMO INVITADO" llevan a `/`.

**Home**

- [ ] "▶  EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" llevan a `/juegos`.
- [ ] "✦  CREAR CUENTA" y "EMPEZAR GRATIS →" llevan a `/auth`.
- [ ] La sección `// 02` muestra 6 mini-cards con los 6 primeros juegos de `GAMES`, y pulsar "CAÍDA" lleva a `/juegos/caida`.
- [ ] "VER SALÓN →" lleva a `/salon`.
- [ ] El ticker tiene 7 filas y la primera es "NEONFOX ▸ Caída +184.220 hace 2 min".
- [ ] El top tiene 5 filas; las tres primeras tienen las clases `top1`, `top2` y `top3`, y "#01 NEONFOX 312.840" es la primera.
- [ ] Al cargar, las secciones con `.reveal` bajo el hero no tienen la clase `in`; al hacer scroll hasta cada una, la reciben y se vuelven visibles.
- [ ] Se ven 8 siluetas flotantes en el hero.

**Fidelidad visual**

- [ ] Abriendo `resources/templates/home-about/arcade-vault-standalone.html` al lado, la Home tiene los mismos textos, el mismo orden de secciones y las mismas clases CSS.
- [ ] `components/home.tsx` no contiene `style={{…}}` salvo `transitionDelay`, `animationDelay` y el `width` de `.tp-fill`.
- [ ] `app/globals.css` no contiene reglas `.gp`, `.gp-*`, `.contact-*` ni `.highlight*`.

---

## Decisiones

- **Sí:** Biblioteca en `/juegos`. Encaja con `/juegos/[id]` y `/juegos/[id]/jugar`, que quedan "debajo" de la lista.
- **No:** `/game` o `/biblioteca`. La primera mezcla idiomas; la segunda separa la lista de su detalle.
- **Sí:** etiqueta "Biblioteca" en el Nav, igual que `home-about/nav.jsx`.
- **No:** etiqueta "Juegos". Se aparta del template.
- **Sí:** `/about` en inglés porque así lo pidió el usuario, aunque el texto visible es "Acerca de".
- **Sí:** `/about` como placeholder con kicker y título. Evita una pantalla en blanco bajo el Nav.
- **No:** portar ya `about.jsx` completo. Va en su propia spec.
- **Sí:** "VOLVER AL VAULT" → `/juegos`. Volver al vault significa volver a la lista de juegos.
- **Sí:** login e invitado siguen yendo a `/`. Tras entrar se llega al nuevo Home.
- **Sí:** `.reveal` 1:1 con un componente cliente aislado (`RevealObserver`). La Home sigue siendo Server Component y solo hidrata el observer.
- **No:** fallback sin JS para `.reveal`. Se aparta del template; se acepta que el contenido bajo el hero esté oculto hasta hidratar.
- **No:** quitar la animación reveal. Pierde fidelidad.
- **Sí:** datos mock en `lib/home.ts` tipados, como `lib/games.ts`.
- **No:** arrays literales dentro del JSX.
- **Sí:** "CREAR CUENTA" enlaza a `/auth` tal cual, en la pestaña INICIAR SESIÓN, igual que el template.
- **No:** `/auth?modo=crear`. Obliga a tocar `auth-form.tsx` y leer `searchParams` dentro de `<Suspense>`.
- **Sí:** portar solo el CSS que se usa (Home, Activity, Pricing y el mínimo de About).
- **No:** portar GAMEPAD y Theme variants. Son del Reproductor y no se usan aquí.
- **Sí:** botones de navegación como `next/link` con clases `.btn`, igual que en SPEC 01.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Con `.reveal` en `opacity: 0`, las secciones quedan invisibles si el JS falla o tarda en hidratar. | Decisión aceptada. El hero no lleva `.reveal`, así que lo primero que se ve siempre está visible. |
| El observer no ve los `.reveal` si se ejecuta antes de que existan en el DOM. | `RevealObserver` se renderiza dentro de `components/home.tsx`, después de las secciones, y su `useEffect` corre tras montar. |
| Al navegar entre `/` y otra ruta y volver, las secciones vuelven a montarse sin `.in`. | El `useEffect` se ejecuta en cada montaje y desconecta el observer en el cleanup. |
| Las reglas nuevas de `globals.css` pisan clases existentes (`.kicker`, `.top1`, `.stat-*`). | Las reglas del template van con selectores anidados (`.section-head .kicker`, `.top-row.top1`); verificar con el criterio de fidelidad que Detalle y Salón no cambian. |
| Preflight está desactivado y `next/link` dentro de `.lb-link` o `.mini-card` hereda estilos de `<a>`. | Usar las mismas clases del template sobre `Link` y revisar subrayados y colores en la comparación visual. |

---

## Lo que **no** está en esta spec

- Contenido real de Acerca de y formulario de contacto.
- CSS del gamepad y variantes de tema.
- Abrir `/auth` en la pestaña CREAR CUENTA.
- Datos reales en ticker, top y stats.
- Fallback sin JS para las animaciones reveal.
- Metadata por página.

Cada uno, si llega, va en su propia spec.
