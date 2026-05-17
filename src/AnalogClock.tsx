const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 90;

function hand(angle: number, len: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x2: cx + len * Math.cos(rad), y2: cy + len * Math.sin(rad) };
}

function hourMarkers() {
  const markers = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const rad = ((angle - 90) * Math.PI) / 180;
    const isCardinal = i % 3 === 0;
    const inner = isCardinal ? R - 16 : R - 14;
    const outer = R - 4;
    markers.push(
      <line
        key={`h${i}`}
        x1={CX + inner * Math.cos(rad)} y1={CY + inner * Math.sin(rad)}
        x2={CX + outer * Math.cos(rad)} y2={CY + outer * Math.sin(rad)}
        stroke="#FF8C00" strokeWidth={isCardinal ? 3 : 2} strokeLinecap="round"
      />
    );
  }
  return markers;
}

function minuteDots() {
  const dots = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const angle = i * 6;
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = R - 3;
    dots.push(
      <circle key={`m${i}`} cx={CX + r * Math.cos(rad)} cy={CY + r * Math.sin(rad)} r={1.5} fill="#3D2200" />
    );
  }
  return dots;
}

export default function AnalogClock({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) {
  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hrAngle = (hours % 12) * 30 + minutes * 0.5;

  const sec = hand(secAngle, 80, CX, CY);
  const min = hand(minAngle, 75, CX, CY);
  const hr = hand(hrAngle, 50, CX, CY);

  // No fixed width/height — the SVG fills its container while preserving the
  // 200x200 internal coordinate system via the viewBox.
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <circle cx={CX} cy={CY} r={CX - 2} fill="#111" stroke="#1A1A1A" strokeWidth={2} />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2A1800" strokeWidth={1} />
      {hourMarkers()}
      {minuteDots()}
      <line x1={CX} y1={CY} x2={hr.x2} y2={hr.y2} stroke="#FF8C00" strokeWidth={4} strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={min.x2} y2={min.y2} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={sec.x2} y2={sec.y2} stroke="#C0C0C0" strokeWidth={1} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={4} fill="#FF8C00" />
      <circle cx={CX} cy={CY} r={2} fill="#0A0A0A" />
    </svg>
  );
}
