import { Hl, Img, Meta, Slide, Text } from "../kit";

/* Moodboard grid (Figma "Moodboard · in flux", inside its slot at 680,140). */
const GRID_X = 680;
const GRID_Y = 140 + 23.28;
const COL = [0, 194.39, 388.79, 583.18, 777.58, 971.97];
const ROW = [0, 273.66, 547.31];
const NARROW = 186.294;
const WIDE = 380.688;
const TILE_H = 265.556;

/** [image, column, row, wide?] for each "ref" tile, in Figma layer order. */
const TILES: [string, number, number, boolean?][] = [
  ["ref-01", 0, 0],
  ["ref-02", 1, 0],
  ["ref-03", 2, 0],
  ["ref-04", 3, 0],
  ["ref-05", 4, 0],
  ["ref-06", 5, 0],
  ["ref-07", 0, 1],
  ["ref-08", 1, 1, true],
  ["ref-09", 3, 1],
  ["ref-10", 4, 1],
  ["ref-11", 5, 1],
  ["ref-12", 0, 2],
  ["ref-13", 1, 2],
  ["ref-14", 2, 2],
  ["ref-15", 3, 2, true],
  ["ref-16", 5, 2],
];

/** 07 · The world / "The look" (Figma 335:2486). */
export function Slide07() {
  return (
    <Slide bg="carrot">
      <Meta section="The look" n={7} className="text-[#01161e]/60" />
      <Hl x={80} y={140} size={120} color="periwinkle">
        The look.
      </Hl>

      <Text x={80} y={300} w={520} className="text-[30px] leading-[1.28] font-normal text-[#01161e]">
        Real people first: overhead fisheye portraits, colourful streetwear and chrome details.
      </Text>
      <Text x={80} y={442} w={520} className="text-[30px] leading-[1.28] font-normal text-[#01161e]">
        Black liquid shapes crown each person, smooth when calm and spiky on the drop.
      </Text>
      <Text x={80} y={546} w={520} className="text-[30px] leading-[1.28] font-normal text-[#01161e]">
        Loud type in highlight boxes ties it all together.
      </Text>

      {TILES.map(([name, c, r, wide]) => (
        <Img
          key={name}
          x={GRID_X + COL[c]}
          y={GRID_Y + ROW[r]}
          w={wide ? WIDE : NARROW}
          h={TILE_H}
          src={`/deck/07/${name}.webp`}
        />
      ))}
    </Slide>
  );
}
