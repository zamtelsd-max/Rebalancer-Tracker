import React from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  colour?: 'green' | 'pink' | 'amber' | 'red' | 'blue' | 'gray';
  onClick?: () => void;
}

const colourMap = {
  green: 'bg-green-50 border-green-200 text-green-700',
  pink: 'bg-pink-50 border-pink-200 text-pink-700',
  amber: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

export const KpiCard: React.FC<Props> = ({ label, value, sub, icon, colour = 'green', onClick }) => {
  return (
    <div
      className={`card border ${colourMap[colour]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
};
