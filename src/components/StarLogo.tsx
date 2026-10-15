export default function StarLogo({ size = 40 }: { size?: number }) {
  const points = "50,5 61,38 95,38 67,59 78,92 50,72 22,92 33,59 5,38 39,38";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {/* black offset shadow, like the brand logo */}
      <polygon points={points} fill="#111" transform="translate(7 5)" />
      <polygon points={points} fill="#7a0a0a" stroke="#111" strokeWidth="3" />
    </svg>
  );
}
