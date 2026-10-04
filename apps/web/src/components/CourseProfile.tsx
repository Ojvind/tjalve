// Ported from the animated SVG course-profile graphic in the original
// salen-mora-plan.html (simplified elevation + checkpoint markers along the
// 90 km Öppet Spår route). Both plans track progress toward that same race,
// so this is shared rather than specific to one plan.
const PROFILE: [number, number][] = [
  [0, 390],
  [2, 450],
  [4, 515],
  [8, 520],
  [11, 505],
  [16, 470],
  [24, 470],
  [30, 440],
  [35, 430],
  [40, 445],
  [47, 470],
  [52, 420],
  [58, 330],
  [62, 280],
  [67, 265],
  [71, 250],
  [76, 230],
  [81, 200],
  [86, 180],
  [90, 165],
];

const CHECKPOINTS: [string, number][] = [
  ['Sälen', 0],
  ['Smågan', 11],
  ['Mångsbodarna', 24],
  ['Risberg', 35],
  ['Evertsberg', 47],
  ['Oxberg', 62],
  ['Hökberg', 71],
  ['Eldris', 81],
  ['Mora', 90],
];

const X = (km: number) => 20 + km * 9.4;
const Y = (elevation: number) => 150 - (elevation - 150) * 0.3;

function elevationAt(km: number): number {
  for (let i = 1; i < PROFILE.length; i++) {
    if (km <= PROFILE[i][0]) {
      const [a, b] = [PROFILE[i - 1], PROFILE[i]];
      return a[1] + ((b[1] - a[1]) * (km - a[0])) / (b[0] - a[0]);
    }
  }
  return 165;
}

export function CourseProfile({ km }: { km: number }) {
  const clamped = Math.max(0, Math.min(90, km));
  const points = PROFILE.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const area = `M${X(0)},170 L${PROFILE.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' L')} L${X(90)},170 Z`;
  const markerX = X(clamped);
  const markerY = Y(elevationAt(clamped));

  return (
    <div className="course">
      <svg viewBox="0 0 900 205" role="img" aria-label={`Förenklad banprofil Sälen–Mora. Du har kommit ${Math.round(clamped)} av 90 km i planen.`}>
        <defs>
          <clipPath id="course-clip">
            <rect x="0" y="0" width={markerX} height="205" />
          </clipPath>
        </defs>
        <path d={area} fill="var(--accent-ice)" opacity="0.35" />
        <polyline points={points} fill="none" stroke="var(--accent-ice)" strokeWidth="4" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="var(--mark)" strokeWidth="5" strokeLinejoin="round" clipPath="url(#course-clip)" />
        {CHECKPOINTS.map(([name, km0], i) => {
          const x = X(km0);
          const y = Y(elevationAt(km0));
          const up = i % 2 === 0;
          const passed = clamped >= km0;
          return (
            <g key={name}>
              <line x1={x} y1={y} x2={x} y2={up ? y - 14 : 178} stroke="var(--accent-ice)" strokeWidth={1} />
              <text
                className={`lbl${passed ? ' passed' : ''}`}
                x={x}
                y={up ? y - 20 : 194}
                textAnchor={km0 === 0 ? 'start' : km0 === 90 ? 'end' : 'middle'}
              >
                {name}
              </text>
            </g>
          );
        })}
        <circle cx={markerX} cy={markerY} r={9} fill="var(--mark)" stroke="var(--surface)" strokeWidth={3} />
      </svg>
    </div>
  );
}
