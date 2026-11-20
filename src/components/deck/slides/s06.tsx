import { Hl, Img, Meta, Slide, Text } from "../kit";

const num = "text-[22px] leading-none font-medium whitespace-nowrap text-[#01161e]";
const body = "text-[30px] leading-[1.25] font-normal text-[#01161e]";

/** 06 · The event (Figma 335:2466). */
export function Slide06() {
  return (
    <Slide bg="rose">
      <Hl x={80} y={140} size={104} color="aqua">
        Two days
      </Hl>
      <Hl x={80} y={228} size={104} color="aqua">
        of music for
      </Hl>
      <Hl x={80} y={316} size={104} color="aqua">
        weird taste.
      </Hl>

      <Text x={80} y={470} className={num}>
        01
      </Text>
      <Text x={150.12} y={464} w={436} className={body}>
        Walk through rooms where the liquid moves with live sets.
      </Text>
      <Text x={80} y={610} className={num}>
        02
      </Text>
      <Text x={150.12} y={604} w={388} className={body}>
        Play your own song and watch it take your shape.
      </Text>
      <Text x={80} y={750} className={num}>
        03
      </Text>
      <Text x={150.12} y={744} w={447} className={body}>
        Stay as the night turns into a club where the whole floor moves.
      </Text>

      <Hl x={80} y={910} size={40} color="aqua">
        {"4 & 5 November  ·  New York City"}
      </Hl>

      <Img x={800} y={140} w={1040} h={420} src="/deck/06/two-friends-phone.webp" alt="Two friends filming the ferrofluid window on a phone" />
      <Img x={800} y={580} w={1040} h={420} src="/deck/06/hand-on-the-glass.webp" alt="A hand pressed against the glass as the ferrofluid spikes toward it" />

      <Meta section="The event" n={6} className="text-[#01161e]/60" />
    </Slide>
  );
}
