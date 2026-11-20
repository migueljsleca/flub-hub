import { Hl, Img, Meta, Slide, Text } from "../kit";

/** 11 · Out of home (Figma 335:2773). */
export function Slide11() {
  return (
    <Slide bg="blue">
      <Meta section="Out of home" n={11} className="text-white/60" />
      <Hl x={80} y={140} size={96}>
        Big, loud,
      </Hl>
      <Hl x={129.12} y={223} size={96}>
        everywhere.
      </Hl>
      <Text x={1040} y={146} w={800} className="text-[28px] leading-[1.3] font-normal text-white/85">
        <p>Billboards, rooftops, kiosks and wild posting across New York. The same system, scaled to every screen.</p>
      </Text>

      <Img x={80} y={360} w={576} h={321.488} src="/deck/11/billboard-a1.webp" alt="FLUX billboard against a cloudy sky" />
      <Img x={672} y={360} w={576} h={321.488} src="/deck/11/billboard-a8.webp" alt="FLUX billboard on a building at dusk" />
      <Img x={1264} y={360} w={576} h={321.488} src="/deck/11/rooftop.webp" alt="FLUX rooftop billboard at night" />
      <Img x={80} y={697.49} w={576} h={321.488} src="/deck/11/penn-plaza.webp" alt="FLUX screens at Penn Plaza" />
      <Img x={672} y={697.49} w={576} h={321.488} src="/deck/11/billboard-a3.webp" alt="FLUX posters on a street kiosk" />
      <Img x={1264} y={697.49} w={576} h={321.488} src="/deck/11/wild-posting.webp" alt="FLUX wild posting on a wall" />
    </Slide>
  );
}
