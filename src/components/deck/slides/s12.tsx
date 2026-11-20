import { Hl, Img, Meta, Slide, Text } from "../kit";

/** 12 · At the venue, and after (Figma 335:2895). */
export function Slide12() {
  const w = 369.333;
  const h = 432;
  return (
    <Slide bg="carrot">
      <Meta section="Venue & merch" n={12} className="text-[#01161e]/60" />
      <Hl x={80} y={140} size={88} color="periwinkle">
        At the venue,
      </Hl>
      <Hl x={134.12} y={217} size={88} color="periwinkle">
        and after.
      </Hl>
      <Text x={80} y={344} w={520} className="text-[28px] leading-[1.3] font-normal text-[#01161e]/85">
        <p>Passes for media, staff and artists, designed in Flux Pass. Wristbands for fans and a roll-up at the door.</p>
      </Text>
      <Text x={80} y={478} w={520} className="text-[28px] leading-[1.3] font-normal text-[#01161e]/85">
        <p>Then caps, totes and keyrings to take the night home.</p>
      </Text>

      <Img x={700} y={120} w={w} h={h} src="/deck/13/roll-up.webp" alt="FLUX roll-up at the venue" />
      <Img x={1085.33} y={120} w={w} h={h} src="/deck/13/id-badge.webp" alt="FLUX ID badge on a lanyard" />
      <Img x={1470.67} y={120} w={w} h={h} src="/deck/13/wristband.webp" alt="FLUX wristband" />
      <Img x={700} y={568} w={w} h={h} src="/deck/13/cap.webp" alt="FLUX cap" />
      <Img x={1085.33} y={568} w={w} h={h} src="/deck/13/tote-bag.webp" alt="FLUX tote bag" />
      <Img x={1470.67} y={568} w={w} h={h} src="/deck/13/keyring.webp" alt="FLUX keyring" />
    </Slide>
  );
}
