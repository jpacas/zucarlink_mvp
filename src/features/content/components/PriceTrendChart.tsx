import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { PriceItem } from '../types'

const MAX_CHART_POINTS = 320
const LONG_RANGE_DAYS = 200

function spanInDays(first: string, last: string) {
  return (new Date(last).getTime() - new Date(first).getTime()) / 86_400_000
}

function makeAxisDateFormatter(withYear: boolean) {
  const formatter = new Intl.DateTimeFormat('es-SV', {
    month: 'short',
    day: withYear ? undefined : 'numeric',
    year: withYear ? '2-digit' : undefined,
  })
  return (value: string) => formatter.format(new Date(value))
}

const formatTooltipDate = (value: string) =>
  new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

// Series diarias de varios años superan lo que vale la pena dibujar; se
// conserva siempre el primer y el último punto.
function downsample<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) {
    return points
  }
  const step = (points.length - 1) / (maxPoints - 1)
  const sampled: T[] = []
  for (let index = 0; index < maxPoints; index += 1) {
    sampled.push(points[Math.round(index * step)])
  }
  return sampled
}

interface PriceTrendChartProps {
  history: PriceItem[]
  unit?: string
}

export function PriceTrendChart({ history, unit }: PriceTrendChartProps) {
  const allPoints = history
    .filter((item) => typeof item.valueNumeric === 'number')
    .map((item) => ({
      observedAt: item.observedAt,
      value: item.valueNumeric as number,
    }))

  if (allPoints.length < 2) {
    return null
  }

  const points = downsample(allPoints, MAX_CHART_POINTS)
  const isLongRange =
    spanInDays(points[0].observedAt, points[points.length - 1].observedAt) > LONG_RANGE_DAYS
  const formatAxisDate = makeAxisDateFormatter(isLongRange)

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
            minTickGap={28}
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(value) => formatTooltipDate(String(value))}
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
