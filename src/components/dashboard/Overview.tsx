"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

interface OverviewDataItem {
  name: string
  Pemasukan: number
  Pengeluaran: number
}

interface OverviewProps {
  data: OverviewDataItem[]
}

export function Overview({ data }: OverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `Rp${(value / 1000000).toFixed(0)}Jt`}
        />
        <Tooltip 
          formatter={(value: any) => [
            typeof value === 'number' ? formatCurrency(value) : value,
            ''
          ]}
        />
        <Legend />
        <Bar dataKey="Pemasukan" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Pengeluaran" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}