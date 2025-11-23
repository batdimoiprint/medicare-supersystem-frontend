import React from 'react'

interface RadialDataItem {
  value: number
  color?: string
  label?: string
}

interface ChartRadialSimpleProps {
  data: RadialDataItem[]
  size?: number
  thickness?: number
  gap?: number
}

const ChartRadialSimple: React.FC<ChartRadialSimpleProps> = ({ data, size = 220, thickness = 12, gap = 8 }) => {
  const cx = size / 2
  const cy = size / 2

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radial-bg" x1="0" x2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const r = (size / 2) - i * (thickness + gap) - thickness / 2
          const circumference = 2 * Math.PI * r
          const percent = Math.max(0, Math.min(1, d.value / maxValue))
          const dash = circumference * percent
          const remainder = circumference - dash
          const color = d.color || '#00a8a8'

          return (
            <g key={`radial-${i}`} transform={`rotate(-90 ${cx} ${cy})`}>
              {/* Background track */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="#111827"
                strokeOpacity={0.06}
                strokeWidth={thickness}
                fill="none"
              />
              {/* Foreground arc */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                stroke={color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${remainder}`}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dasharray 0.4s ease 0s' }}
              />
            </g>
          )
        })}
        {/* Inner hole */}
        <circle cx={cx} cy={cy} r={(size / 2) - data.length * (thickness + gap)} fill="#07121a" />
      </svg>
    </div>
  )
}

export default ChartRadialSimple
