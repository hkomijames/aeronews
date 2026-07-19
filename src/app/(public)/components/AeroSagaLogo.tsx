export default function AeroSagaLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 60"
      className="logo-svg"
    >
      <defs>
        <linearGradient id="aeroSagaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1F3A" />
          <stop offset="55%" stopColor="#123A70" />
          <stop offset="100%" stopColor="#1D63C9" />
        </linearGradient>
      </defs>

      <text
        x="10"
        y="40"
        fill="url(#aeroSagaGradient)"
        style={{
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontWeight: 800,
          fontSize: '34px',
          letterSpacing: '-0.5px',
        }}
      >
        Aero
        <tspan
          dx="6"
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontWeight: 700,
            fontStyle: 'italic',
          }}
        >
          Saga
        </tspan>
      </text>
    </svg>
  );
}