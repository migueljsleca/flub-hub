import { Hl, Meta, Slide, Text, Video } from "../kit";

/** 10 · Motion & social (Figma 336:706). Five moving formats in one row. */
export function Slide10() {
  const y = 400;
  const h = 460.184;
  return (
    <Slide bg="rose">
      <Meta section="Motion & social" n={10} className="text-[#01161e]/60" />
      <Hl x={80} y={140} size={120} color="aqua">
        It moves.
      </Hl>
      <Text x={1040} y={146} w={800} className="text-[28px] leading-[1.3] font-normal text-[#01161e]/85">
        <p>The shapes react to sound, so posters, light boxes, posts and stories move too. Every format has a moving version.</p>
      </Text>

      <Video x={80} y={y} w={306.789} h={h} src="/deck/10/poster-blue.mp4" poster="/deck/10/poster-blue-poster.webp" />
      <Video x={402.79} y={y} w={343.604} h={h} src="/deck/10/lightbox-subway.mp4" poster="/deck/10/lightbox-subway-poster.webp" />
      <Video x={762.39} y={y} w={343.604} h={h} src="/deck/10/street-pole.mp4" poster="/deck/10/street-pole-poster.webp" />
      <Video x={1122} y={y} w={358.399} h={h} src="/deck/12/instagram-post.mp4" poster="/deck/12/instagram-post-poster.webp" />
      <Video x={1496.4} y={y} w={343.604} h={h} src="/deck/12/phone-in-hand.mp4" poster="/deck/12/phone-in-hand-poster.webp" />
    </Slide>
  );
}
