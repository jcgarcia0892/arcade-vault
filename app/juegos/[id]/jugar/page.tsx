import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// `params` is URL data: it must be read inside <Suspense> so navigations stay instant.
export default function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense>
      <GamePlayerLoader params={params} />
    </Suspense>
  );
}

async function GamePlayerLoader({ params }: { params: PageProps<"/juegos/[id]/jugar">["params"] }) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
