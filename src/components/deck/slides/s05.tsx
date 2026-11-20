import { FerroCanvas } from "@/components/os/ferro-stage";
import type { FerroParams } from "@/lib/ferro/ferro-params";
import { FluxBox, Hl, Meta, Slide, Text } from "../kit";
import { DECK_LOOKS } from "../looks";

const label = "text-[20px] leading-none font-medium tracking-[1.2px] whitespace-nowrap text-[#01161e] uppercase";
const body = "text-[30px] leading-[1.28] font-normal text-[#01161e]";

/*
 * The deck's "pool" look is framed for a square slot, so DeckFerro would draw
 * this wide mound too big and clip it at the canvas edges. Same look and view,
 * camera pulled back so the mound spans `w` (on a 1.5x canvas, centred on the
 * box) like the Figma render (ferrofluid/17).
 */
const POOL_LOOK: FerroParams = { ...(DECK_LOOKS.pool.look as FerroParams), distance: 1.2 };

function WidePool({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const side = Math.max(w, h) * 1.5;
  return (
    <FerroCanvas
      look={POOL_LOOK}
      view={DECK_LOOKS.pool.view}
      className="absolute"
      style={{ left: x + w / 2 - side / 2, top: y + h / 2 - side / 2, width: side, height: side }}
    />
  );
}

/** 05 · The name (Figma 335:2450). */
export function Slide05() {
  return (
    <Slide bg="carrot">
      {/*
       * "pool · strange attracts" (330, 560.15, 1500 x 838.475): the mound in
       * that render spans x 405-1800, y 730-1324, bleeding off the bottom edge.
       */}
      <WidePool x={405} y={730} w={1395} h={594} />

      <Meta section="The name" n={5} className="text-[#01161e]" />

      <FluxBox x={80} y={160} w={1040} color="periwinkle" />
      <Hl x={80} y={560} size={120} color="periwinkle">
        Strange attracts.
      </Hl>

      <Text x={1336} y={160} className={label}>
        FLUX
      </Text>
      <Text x={1336} y={200} w={540} className={body}>
        Always changing, never fixed. Like your taste, and like the shapes.
      </Text>
      <Text x={1336} y={364} className={label}>
        Strange attracts
      </Text>
      <Text x={1336} y={404} w={540} className={body}>
        The weirder your taste, the more it pulls people in. Weird is magnetic.
      </Text>
    </Slide>
  );
}
