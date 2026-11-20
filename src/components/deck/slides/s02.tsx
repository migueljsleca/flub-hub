import { DECK_COLORS, DeckFerro, Hl, Meta, Slide, Text } from "../kit";

const label = "text-[18px] leading-none font-medium tracking-[1.08px] whitespace-nowrap text-[#d7fb41] uppercase";
const body = "text-[26px] leading-[1.35] font-normal text-white/75";

/** 02 · The brief (Figma 335:2377). */
export function Slide02() {
  return (
    <Slide bg="ink">
      <div className="absolute" style={{ left: 1240, top: 0, width: 680, height: 1080, background: DECK_COLORS.blue }} />

      <Meta section="The brief" n={2} className="text-white/60" />

      <Hl x={80} y={140} size={140}>
        Make sound
      </Hl>
      <Hl x={320.12} y={254} size={140}>
        visible.
      </Hl>
      <Text x={80.12} y={410} w={680} className="text-[32px] leading-[1.3] font-normal text-white">
        Spotify wants a bold, personal campaign for 2026. One that shows it’s more than streaming: a place where music,
        artists and taste come together.
      </Text>

      <Text x={80} y={640} className={label}>
        Client
      </Text>
      <Text x={80} y={678} w={470} className={body}>
        Spotify, global brand campaign 2026.
      </Text>
      <Text x={620} y={640} className={label}>
        Theme
      </Text>
      <Text x={620} y={678} w={470} className={body}>
        See What You Hear. An immersive event where sound becomes visual.
      </Text>
      <Text x={80} y={830} className={label}>
        The ask
      </Text>
      <Text x={80} y={868} w={470} className={body}>
        A disruptive identity mixing real people, 3D and loud type.
      </Text>
      <Text x={620} y={830} className={label}>
        Deliverables
      </Text>
      <Text x={620} y={868} w={470} className={body}>
        Event name and line, key visuals, mockups for print, OOH, social and merch.
      </Text>

      {/* "THE CHALLENGE" chip is set in 65 Medium with tracking, not the usual bold */}
      <Hl x={1302.12} y={140} size={22} className="[&>p]:font-medium [&>p]:tracking-[1.32px]">
        THE CHALLENGE
      </Hl>
      <Text x={1302.23} y={212} w={556} className="text-[38px] leading-[1.18] font-normal text-white">
        Make something as personal as taste visible, and keep it flexible enough for posters, screens, merch and a live
        event.
      </Text>

      {/* slot · ferrofluid/13 clips at its box (992.12, 311, 1331.883 square); the render sits inside it */}
      <div className="absolute overflow-hidden" style={{ left: 992.12, top: 311, width: 1331.883, height: 1331.883 }}>
        <DeckFerro x={45.36} y={0} w={1241.161} h={1331.883} look="spikes" />
      </div>
    </Slide>
  );
}
