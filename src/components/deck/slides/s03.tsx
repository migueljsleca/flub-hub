import { Hl, Meta, Slide, Text } from "../kit";

/** Struck-through genre chips: the Hl box with a from-font line-through. */
const strike = "[&>p]:line-through [&>p]:decoration-from-font [&>p]:[text-decoration-skip-ink:none]";
const GENRES: [string, number, number][] = [
  ["Pop", 1360.12, 157],
  ["Indie", 1536.12, 326],
  ["Top 50", 1174.12, 393],
  ["Hip-hop", 1454.12, 540],
  ["Rock", 1160.12, 650],
  ["Electronic", 1324.12, 772],
  ["Chill", 1080, 890],
];

/** 03 · The problem (Figma 335:2400). */
export function Slide03() {
  return (
    <Slide bg="rose">
      <Meta section="The problem" n={3} className="text-[#01161e]" />

      <Hl x={80} y={150} size={160} color="aqua" className="py-[7.2px]">
        Taste is
      </Hl>
      <Hl x={159.12} y={278.4} size={160} color="aqua" className="py-[7.2px]">
        unmatched.
      </Hl>
      <Text x={80} y={480} w={640} className="text-[34px] leading-[1.25] font-normal text-[#01161e]">
        Nobody’s taste fits one genre anymore. It changes by the hour, and people are proud of the parts that don’t make
        sense.
      </Text>
      <Text x={80} y={643} w={640} className="text-[34px] leading-[1.25] font-normal text-[#01161e]">
        Yet music campaigns still talk in genres, charts and stars, flattening the one thing people care about most.
      </Text>

      {GENRES.map(([genre, x, y]) => (
        <Hl key={genre} x={x} y={y} size={84} color="aqua" className={strike}>
          {genre}
        </Hl>
      ))}
    </Slide>
  );
}
