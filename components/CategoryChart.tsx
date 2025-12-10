'use client'

import { useMemo } from 'react'
import { Transaction } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/utils/formatters'

interface CategoryChartProps {
  transactions: Transaction[]
  loading?: boolean
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // violet
  '#6366f1', // indigo
  '#ef4444', // red
  '#84cc16', // lime
]

export function CategoryChart({ transactions, loading }: CategoryChartProps) {
  const categoryData = useMemo(() => {
    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense')
    
    // Group by category
    const categories = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Sem categoria'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += transaction.amount
      return acc
    }, {} as Record<string, number>)

    // Convert to array and sort by amount
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalExpenses = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.value, 0)
  }, [categoryData])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (categoryData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Nenhuma despesa encontrada</p>
            <p className="text-sm">Adicione transações para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return null // Legend now rendered outside chart for better mobile support
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-md opacity-50" />
              <div className="relative h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-lg md:text-xl">
              Despesas por Categoria
            </span>
          </CardTitle>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground font-medium">Total de Despesas</p>
            <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <defs>
                {categoryData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${index})`}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ display: 'none' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-40px' }}>
            <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1">Total Gasto</p>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryData.length} {categoryData.length === 1 ? 'categoria' : 'categorias'}
            </p>
          </div>
        </div>

        {/* Mobile-friendly legend outside chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-4 md:mt-6">
          {categoryData.map((entry, index) => {
            const percentage = ((entry.value / totalExpenses) * 100).toFixed(1)
            return (
              <div 
                key={`legend-mobile-${index}`} 
                className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-slate-100 transition-all duration-200 cursor-pointer group"
              >
                <div 
                  className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 shadow-md group-hover:scale-110 transition-transform" 
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                    boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}40`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs md:text-sm truncate group-hover:text-primary transition-colors">{entry.name}</p>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                    <p className="text-xs font-bold text-primary">
                      {formatCurrency(entry.value)}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground font-medium">
                      {percentage}%
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
