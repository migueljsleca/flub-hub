import { DeckFerro, Hl, Meta, Slide, Text } from "../kit";

/*
 * 04 · The idea (Figma 335:2424). One live shape on the right keeps morphing
 * into the next: calm blob, spiky pyramid, spike ball, lobed blob, and round
 * again. Drag it to turn it.
 */
export function Slide04() {
  return (
    <Slide bg="blue">
      <Meta section="The idea" n={4} className="text-white/60" />

      <Hl x={80} y={150} size={120}>
        A shape that
      </Hl>
      <Hl x={168} y={250} size={120}>
        changes with you.
      </Hl>

      <Text x={80} y={420} w={620} className="text-[32px] leading-[1.28]">
        A magnetic liquid has no shape of its own. It rises into spikes when something pulls it.
      </Text>
      <Text x={80} y={532} w={620} className="text-[32px] leading-[1.28]">
        At FLUX, that force is sound, so you see what you hear. Calm music keeps it smooth, the drop makes it spike.
        Just like taste, it becomes whatever moves it.
      </Text>

      <DeckFerro x={1100} y={230} w={760} h={760} look="morph" />
    </Slide>
  );
}
