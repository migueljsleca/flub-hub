import { DECK_COLORS, FluxBox, Hl, Meta, Slide, Text, type DeckColor } from "../kit";

/*
 * The FLUX lockup as drawn in this Figma frame. Each instance is the FLUX box
 * plus its "presented by Spotify" tag at the tag's own Figma offset (relative
 * to the lockup's top-left), so the tag sits where Figma puts it: slightly
 * in from the box's right edge for Stacked, beside it for Inline, and a small
 * two-line tag for the orange one. Tag proportions match the 900-wide master.
 */
type LockupProps = {
  x: number;
  y: number;
  /** FLUX box width and its x offset inside the lockup. */
  w: number;
  logoX?: number;
  /** Tag top-left inside the lockup. */
  tagX: number;
  tagY: number;
  color: DeckColor;
};

function Spotify({ w, h }: { w: number; h: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/deck/spotify.svg" alt="Spotify" className="max-w-none shrink-0" style={{ width: w, height: h }} />;
}

/** Tag on one row: "PRESENTED BY" then the Spotify logo. */
function Lockup({ x, y, w, logoX = 0, tagX, tagY, color }: LockupProps) {
  const k = w / 900;
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <FluxBox x={logoX} y={0} w={w} color={color} />
      <div
        className="absolute flex items-center"
        style={{
          left: tagX,
          top: tagY,
          width: 654.93 * k,
          height: 126.374 * k,
          padding: 12.604 * k,
          gap: 30.25 * k,
          background: DECK_COLORS[color],
        }}
      >
        <p
          className="font-bold whitespace-nowrap text-[#01161e] uppercase [text-box:trim-both_cap_alphabetic]"
          style={{ fontSize: 31.098 * k }}
        >
          presented by
        </p>
        <Spotify w={369.274 * k} h={101.165 * k} />
      </div>
    </div>
  );
}

/** Small two-line tag ("PRESENTED BY" over the Spotify logo), right-aligned. */
function LockupSmallTag({ x, y, w, logoX = 0, tagX, tagY, color }: LockupProps) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <FluxBox x={logoX} y={0} w={w} color={color} />
      <div
        className="absolute flex flex-col items-end"
        style={{ left: tagX, top: tagY, padding: 3.071, gap: 3.992, background: DECK_COLORS[color] }}
      >
        <p
          className="font-bold whitespace-nowrap text-[#01161e] uppercase [text-box:trim-both_cap_alphabetic]"
          style={{ fontSize: 7.577 }}
        >
          presented by
        </p>
        <Spotify w={89.979} h={24.649} />
      </div>
    </div>
  );
}

const RULES: [string, string, number][] = [
  ["01  Lockup", "FLUX in a highlight box, with the presented by Spotify tag tucked under its right edge.", 322],
  ["02  Flexible", "The tag can sit under or beside the logo, or drop off when Spotify is already on screen.", 434],
  ["03  Colour", "The boxes follow the mood: lime on blue, ice on pink, lilac on orange. Type is always ink.", 546],
  ["04  Never", "Stretch it, outline it, or pull the tag away from the box.", 658],
];

/** 08 · The logo (Figma 335:2513). */
export function Slide08() {
  return (
    <Slide bg="ink">
      <Meta section="The logo" n={8} className="text-white/60" />
      <Hl x={80.12} y={140} size={120} className="h-[121px]">
        The logo.
      </Hl>

      {/* main lockup on its black panel */}
      <div className="absolute bg-black" style={{ left: 80, top: 320, width: 1100, height: 440 }} />
      <Lockup x={350} y={408.87} w={560} logoX={-0.37} tagX={98.664} tagY={179.417} color="lime" />

      {RULES.map(([label, body, y]) => (
        <div key={label}>
          <Text
            x={1240}
            y={y}
            className="text-[18px] leading-none font-medium tracking-[1.08px] whitespace-pre text-[#d7fb41] uppercase"
          >
            {label}
          </Text>
          <Text x={1240} y={y + 32} w={600} className="text-[24px] leading-[1.3] font-normal text-white/85">
            {body}
          </Text>
        </div>
      ))}

      {/* the lockup in each mood */}
      <div className="absolute overflow-hidden" style={{ left: 80, top: 800, width: 576, height: 200, background: DECK_COLORS.blue }}>
        <Lockup x={168} y={43.8} w={240} logoX={-0.16} tagX={42.286} tagY={76.611} color="lime" />
      </div>
      <div className="absolute overflow-hidden" style={{ left: 672, top: 800, width: 576, height: 200, background: DECK_COLORS.rose }}>
        <Lockup x={98} y={63.94} w={219.946} logoX={0.077} tagX={217.493} tagY={41.011} color="aqua" />
      </div>
      <div className="absolute overflow-hidden" style={{ left: 1264, top: 800, width: 576, height: 200, background: DECK_COLORS.carrot }}>
        <LockupSmallTag x={166.121} y={54} w={211.484} logoX={0.357} tagX={152.42} tagY={68} color="periwinkle" />
      </div>
    </Slide>
  );
}
