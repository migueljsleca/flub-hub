import { DeckFerro, Hl, Img, Meta, Slide, Text } from "../kit";

const card = { y: 390, w: 560, h: 420 } as const;

/** One caption under a card: bold title, then a line of body copy. */
function Caption({ x, title, children }: { x: number; title: string; children: string }) {
  return (
    <>
      <Text x={x} y={840} w={560} className="text-[28px] leading-[1.28] font-bold whitespace-pre-wrap text-[#01161e]">
        <p>{title}</p>
      </Text>
      <Text x={x} y={884} w={540} className="text-[24px] leading-[1.28] font-normal text-[#01161e]">
        <p>{children}</p>
      </Text>
    </>
  );
}

/*
 * 13 · Why & how AI (Figma 337:737). Three cards: a Flora portrait, a live
 * ferrofluid from the Lab (drag it), and the system on a street poster.
 */
export function Slide13() {
  return (
    <Slide bg="rose">
      <Meta section="Why & how AI" n={13} className="text-[#01161e]/60" />
      <Hl x={80} y={140} size={120} color="aqua">
        I direct.
      </Hl>
      <Hl x={312} y={240} size={120} color="aqua">
        AI scales it.
      </Hl>
      <Text x={1280} y={146} w={560} className="text-[30px] leading-[1.28] font-normal text-[#01161e]">
        <p>
          Taste is one-off, so the campaign had to be too: hundreds of faces, shapes and formats, none repeated, from one
          designer.
        </p>
      </Text>

      {/* 01 · portraits: the fisheye cut-out on ink */}
      <div className="absolute overflow-hidden bg-[#01161e]" style={{ left: 80, top: card.y, width: card.w, height: card.h }}>
        <Img x={(card.w - 354.492) / 2} y={10} w={354.492} h={440} src="/deck/13/people-04.webp" alt="Fisheye portrait made in Flora" />
      </div>

      {/* 02 · shapes: a live ferrofluid on ink, clipped to the card */}
      <div className="absolute overflow-hidden bg-[#01161e]" style={{ left: 680, top: card.y, width: card.w, height: card.h }}>
        <DeckFerro x={93.62} y={10} w={372.754} h={400} look="spikes" />
      </div>

      {/* 03 · system: the street poster mockup */}
      <Img x={1280} y={card.y} w={card.w} h={card.h} src="/deck/11/wild-posting.webp" alt="FLUX posters on a street wall" />

      <Caption x={80} title="01  Flora shoots the portraits">
        Fisheye close-ups from one saved technique. Swap the person, keep the look.
      </Caption>
      <Caption x={680} title="02  Ferrofluid Lab makes the shapes">
        My own 3D tool, vibe-coded with Claude Code. Art-direct it live, export, done.
      </Caption>
      <Caption x={1280} title="03  I make the system">
        Type, logos and layouts stay mine in Figma. Custom actions drop them into mockups untouched.
      </Caption>

      <Hl x={80} y={1000} size={28} color="aqua">
        AI brings the scale. The idea, the type and the logos stay handmade.
      </Hl>
    </Slide>
  );
}
