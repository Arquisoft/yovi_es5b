import React from 'react';

interface HexagonProps {
  cx: number;
  cy: number;
  size: number;
  color?: string;
  onClick?: () => void;
}

export const Hexagon: React.FC<HexagonProps> = ({ cx, cy, size, color = '#eeeeee', onClick }) => {
  // Calculamos los 6 vértices del hexágono puntiagudo
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // -30 grados para que la punta mire hacia arriba
    const angle_rad = (Math.PI / 180) * angle_deg;
    const x = cx + size * Math.cos(angle_rad);
    const y = cy + size * Math.sin(angle_rad);
    points.push(`${x},${y}`);
  }

  return (
    <polygon
      points={points.join(' ')}
      fill={color}
      stroke="#333333"
      strokeWidth="2"
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
    />
  );
};