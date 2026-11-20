import { DeckFerro, FluxBox, Hl, Meta, Slide, Text } from "../kit";

/** 14 · Thank you (Figma 335:2882). */
export function Slide14() {
  return (
    <Slide bg="blue">
      <DeckFerro x={-338.88} y={479} w={989.117} h={989.117} look="drop" />
      <DeckFerro x={1419.12} y={-287} w={809} h={809} look="spikes" />

      <Meta section="Thank you" n={14} className="text-white/60" />
      <FluxBox x={520} y={250} w={880} />
      <Hl x={535} y={578.57} size={110}>
        Strange attracts.
      </Hl>
      <Text x={0} y={761.57} w={1920} className="text-center text-[40px] leading-none font-normal text-white">
        <p>Thank you.</p>
      </Text>
    </Slide>
  );
}
