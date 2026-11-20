import { Hl, Img, Meta, Slide, Text } from "../kit";

/**
 * Key visuals, each exported whole from its full-size Figma master (scaled to
 * fill its "slot ·" frame): [image, x, y, w, h].
 */
const VISUALS: [string, number, number, number, number][] = [
  ["rollup-orange", 80, 360, 148.767, 350],
  ["design-blue-fans", 244.77, 360, 233.333, 350],
  ["design-pink-group-chat", 494.1, 360, 233.333, 350],
  ["design-orange-strange", 743.43, 360, 233.333, 350],
  ["design-pink-algorithm", 992.77, 360, 233.333, 350],
  ["design-blue-fan", 1242.1, 360, 233.333, 350],
  ["design-orange-spike", 1491.43, 360, 350, 350],
  ["miami-wall", 80, 726, 872.42, 241],
  ["nashville-billboard", 968.42, 726, 872.42, 241],
];

/** 09 · The campaign set / "Key visuals" (Figma 335:2537). */
export function Slide09() {
  return (
    <Slide bg="ink">
      <Meta section="Key visuals" n={9} className="text-white/60" />
      <Hl x={80.12} y={140} size={96} className="h-[98px]">
        The campaign set.
      </Hl>
      <Text x={1040} y={146} w={800} className="text-[28px] leading-[1.3] font-normal text-white/85">
        Posters, banners and giant screens from one system: a real fan, a one-off shape and a loud line in a highlight box.
      </Text>

      {VISUALS.map(([name, x, y, w, h]) => (
        <Img key={name} x={x} y={y} w={w} h={h} src={`/deck/09/${name}.webp`} />
      ))}
    </Slide>
  );
}
