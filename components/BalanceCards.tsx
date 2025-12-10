'use client'

// Balance Cards - displays personal, household, and total balances
import { Balance } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet, Home, DollarSign } from 'lucide-react'

interface BalanceCardsProps {
  balance: Balance | null
  loading?: boolean
}

export function BalanceCards({ balance, loading }: BalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 mb-3 animate-pulse"></div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!balance) {
    return null
  }

  const balanceData = [
    {
      title: 'Pessoal',
      icon: Wallet,
      balance: balance.personal.balance,
      income: balance.personal.income,
      expenses: balance.personal.expenses,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Casa',
      icon: Home,
      balance: balance.household.balance,
      income: balance.household.income,
      expenses: balance.household.expenses,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total',
      icon: DollarSign,
      balance: balance.total.balance,
      income: balance.total.income,
      expenses: balance.total.expenses,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {balanceData.map((data) => {
        const Icon = data.icon
        const isPositive = data.balance >= 0

        return (
          <Card key={data.title} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`h-1 bg-gradient-to-r ${data.gradient}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{data.title}</CardTitle>
              <div className={`${data.iconBg} p-2.5 rounded-xl backdrop-blur-sm`}>
                <Icon className={`h-5 w-5 ${data.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-3 bg-gradient-to-r ${data.gradient} bg-clip-text text-transparent`}>
                {formatCurrency(data.balance)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">{formatCurrency(data.income)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">{formatCurrency(data.expenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
