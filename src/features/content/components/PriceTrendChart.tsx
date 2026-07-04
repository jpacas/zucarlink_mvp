import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { PriceItem } from '../types'

function formatAxisDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

interface PriceTrendChartProps {
  history: PriceItem[]
  unit?: string
}

export function PriceTrendChart({ history, unit }: PriceTrendChartProps) {
  const points = history
    .filter((item) => typeof item.valueNumeric === 'number')
    .map((item) => ({
      observedAt: item.observedAt,
      value: item.valueNumeric as number,
    }))

  if (points.length < 2) {
    return null
  }

  return (
    <div className="price-trend-card__chart">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="observedAt"
            tickFormatter={formatAxisDate}
            stroke="var(--text-soft)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(value) => formatAxisDate(String(value))}
            formatter={(value) => [unit ? `${value} ${unit}` : String(value), 'Valor']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#priceTrendFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
