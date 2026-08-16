// The one signature device for the customer dashboard: a miniature version of
// the CMYK registration/colour-calibration bar printers run along the edge of
// every proof sheet, so a press operator can check ink density and alignment
// at a glance. Used sparingly — as a section divider, and as tick marks on
// the dashboard's charts — never as generic decoration.
const DOTS = [
  { color: '#3AAFD4', label: 'C' }, // cyan
  { color: '#D44A9B', label: 'M' }, // magenta
  { color: '#E0C23A', label: 'Y' }, // yellow
  { color: '#1C2530', label: 'K' }, // key (ink)
];

export default function RegistrationBar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden="true">
      {DOTS.map((dot) => (
        <span
          key={dot.label}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot.color }}
        />
      ))}
    </div>
  );
}
