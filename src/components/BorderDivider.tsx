/** The decorative flourish between sections — shown once, softly revealed on scroll. */
export default function BorderDivider() {
  return (
    <img
      src="/divider.webp"
      width={1000}
      height={144}
      className="lx-divider"
      alt=""
      loading="lazy"
      decoding="async"
      data-reveal="zoom"
    />
  );
}
