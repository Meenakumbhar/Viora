// Hero illustration for the "all categories" portfolio view ("Print That
// Speaks"). Unlike HeroDoodles (faint scattered texture used as a fallback
// for events/sports/branding), this is a deliberate composed visual — a
// ribboned, wax-sealed stationery stack with the studio's quill mark resting
// across it — sitting in the right ~40% of the frame so the headline on the
// left keeps its clear space, mirroring how the wedding/funeral hero photos
// are composed.
export default function PortfolioPrintArt() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full xl:block"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {/* Stack — shifted well into the right side of the frame so it stays
          clear of the headline/description column, which is left-aligned
          but can run past the frame's midpoint on narrower desktop widths. */}
      <g transform="translate(95,0)">
        {/* Ground shadow */}
        <ellipse cx="1270" cy="580" rx="210" ry="24" fill="#1C2530" opacity="0.07" />

        {/* Back card */}
        <rect
          x="1100" y="150" width="300" height="420" rx="18"
          fill="#F0DCCF"
          transform="rotate(-8 1250 360)"
        />

        {/* Front card — envelope with ribbon + wax seal */}
        <g transform="rotate(6 1300 340)">
          <rect x="1150" y="140" width="300" height="400" rx="18" fill="#FDFCFA" stroke="#C6A85C" strokeWidth="2.5" />
          <path d="M1150,140 L1300,260 L1450,140" stroke="#C6A85C" strokeWidth="1.5" opacity="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="1284" y="140" width="32" height="400" fill="#D9A79E" opacity="0.92" />
          <rect x="1150" y="324" width="300" height="32" fill="#D9A79E" opacity="0.92" />

          <path d="M1288,540 L1280,590 L1300,570 Z" fill="#D9A79E" />
          <path d="M1312,540 L1320,590 L1300,570 Z" fill="#D9A79E" />

          <circle cx="1300" cy="340" r="44" fill="#C6A85C" stroke="#A88A40" strokeWidth="2.5" />
          <path d="M1300,362 C1299,352 1298,342 1297,326" stroke="#FDFCFA" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M1298,348 C1304,346 1307,341 1302,337 C1299,341 1297,345 1298,348 Z" fill="#FDFCFA" opacity="0.9" />
          <path d="M1297,334 C1291,331 1288,326 1293,322 C1296,326 1298,330 1297,334 Z" fill="#FDFCFA" opacity="0.9" />
        </g>

        {/* Botanical sprig tucked beside the stack */}
        <g transform="translate(970,460) scale(1.4) rotate(-18 45 50)">
          <path d="M50,95 C48,70 46,45 45,10" stroke="#7C9270" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48,80 C60,75 65,65 55,58 C50,65 46,72 48,80 Z" fill="#AEC29E" stroke="#7C9270" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M46,60 C34,55 28,45 38,38 C43,45 47,52 46,60 Z" fill="#AEC29E" stroke="#7C9270" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45,38 C57,33 62,23 52,16 C47,23 43,30 45,38 Z" fill="#AEC29E" stroke="#7C9270" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Quill — the studio mark — resting diagonally across the stack */}
        <g transform="translate(950,60) scale(2.6) rotate(-32 50 50)">
          <path
            d="M50,5 C30,15 20,45 25,75 C30,90 40,95 50,95 C60,95 70,90 75,75 C80,45 70,15 50,5 Z"
            fill="#FBF7EE" stroke="#1C2530" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
          />
          <path d="M50,10 L50,90" stroke="#1C2530" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M50,25 L35,32 M50,25 L65,32" stroke="#C6A85C" strokeWidth="1" opacity="0.75" strokeLinecap="round" />
          <path d="M50,40 L33,48 M50,40 L67,48" stroke="#C6A85C" strokeWidth="1" opacity="0.75" strokeLinecap="round" />
          <path d="M50,55 L35,62 M50,55 L65,62" stroke="#C6A85C" strokeWidth="1" opacity="0.75" strokeLinecap="round" />
          <path d="M50,70 L38,76 M50,70 L62,76" stroke="#C6A85C" strokeWidth="1" opacity="0.75" strokeLinecap="round" />
        </g>
      </g>

      {/* Scattered accents */}
      <circle cx="1500" cy="110" r="5" fill="#C6A85C" opacity="0.5" />
      <circle cx="1540" cy="170" r="3.5" fill="#9FB393" opacity="0.5" />
      <circle cx="1470" cy="200" r="4" fill="#D9A79E" opacity="0.5" />
    </svg>
  );
}
