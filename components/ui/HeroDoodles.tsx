// Faint hand-drawn line-art scattered across hero backgrounds that have no
// photo of their own (the "all" / events / sports / branding portfolio
// categories). Three motifs pulled from the studio's own vocabulary — a
// quill feather (echoes the logo mark), a botanical sprig (reads for both
// wedding and memorial work), and a calligraphic flourish (stationery) —
// scattered at low opacity so they read as texture, not illustration.
export default function HeroDoodles() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-accent-gold"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <symbol id="doodle-feather" viewBox="0 0 100 100" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,5 C30,15 20,45 25,75 C30,90 40,95 50,95 C60,95 70,90 75,75 C80,45 70,15 50,5 Z" />
          <path d="M50,10 L50,90" />
          <path d="M50,25 L35,32 M50,25 L65,32" />
          <path d="M50,40 L33,48 M50,40 L67,48" />
          <path d="M50,55 L35,62 M50,55 L65,62" />
          <path d="M50,70 L38,76 M50,70 L62,76" />
        </symbol>
        <symbol id="doodle-sprig" viewBox="0 0 100 100" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,95 C48,70 46,45 45,10" />
          <path d="M48,80 C60,75 65,65 55,58 C50,65 46,72 48,80 Z" />
          <path d="M46,60 C34,55 28,45 38,38 C43,45 47,52 46,60 Z" />
          <path d="M45,38 C57,33 62,23 52,16 C47,23 43,30 45,38 Z" />
        </symbol>
        <symbol id="doodle-flourish" viewBox="0 0 100 100" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10,70 C30,50 20,30 40,25 C55,21 60,35 48,42 C40,47 35,38 42,33" />
        </symbol>
      </defs>

      <use href="#doodle-feather" x="1180" y="60" width="130" height="130" stroke="currentColor" strokeWidth="1.1" opacity="0.1" transform="rotate(18 1245 125)" />
      <use href="#doodle-sprig" x="1380" y="260" width="110" height="110" stroke="currentColor" strokeWidth="1.1" opacity="0.09" transform="rotate(-12 1435 315)" />
      <use href="#doodle-flourish" x="1250" y="420" width="150" height="150" stroke="currentColor" strokeWidth="1.1" opacity="0.08" transform="rotate(6 1325 495)" />
      <use href="#doodle-feather" x="60" y="40" width="90" height="90" stroke="currentColor" strokeWidth="1" opacity="0.07" transform="rotate(-24 105 85)" />
      <use href="#doodle-sprig" x="820" y="30" width="80" height="80" stroke="currentColor" strokeWidth="1" opacity="0.07" transform="rotate(30 860 70)" />
      <use href="#doodle-flourish" x="1420" y="90" width="120" height="120" stroke="currentColor" strokeWidth="1" opacity="0.07" transform="rotate(-30 1480 150)" />
      <use href="#doodle-feather" x="1050" y="330" width="70" height="70" stroke="currentColor" strokeWidth="1" opacity="0.06" transform="rotate(40 1085 365)" />
    </svg>
  );
}
