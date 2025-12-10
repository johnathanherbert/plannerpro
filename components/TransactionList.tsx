'use client'

// Transaction List - displays list of transactions with filtering and editing
import { useState } from 'react'
import { Transaction, HouseholdMember } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { formatDate } from '@/lib/date'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpCircle, ArrowDownCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '@/types'
import { TransactionFilterBar } from '@/components/TransactionFilterBar'

interface TransactionListProps {
  transactions: Transaction[]
  loading?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
  maxItems?: number // Limit number of transactions shown
  members?: HouseholdMember[] // Household members for avatars and filters
  currentUserId?: string // Current user ID for filtering
  showFilters?: boolean // Whether to show filter bar
}

export function TransactionList({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete, 
  maxItems,
  members = [],
  currentUserId,
  showFilters = false,
}: TransactionListProps) {
  const [currentFilter, setCurrentFilter] = useState<'mine' | 'household' | 'all' | string>('all')

  // Apply filter to transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (currentFilter === 'all') return true
    if (currentFilter === 'mine') return transaction.createdBy === currentUserId
    if (currentFilter === 'household') {
      // Show both: transactions marked as household expense OR with target='household'
      const isHousehold = transaction.isHouseholdExpense === true || transaction.target === 'household'
      console.log('🔍 Checking transaction:', {
        title: transaction.title,
        target: transaction.target,
        isHouseholdExpense: transaction.isHouseholdExpense,
        type: typeof transaction.isHouseholdExpense,
        result: isHousehold
      })
      return isHousehold
    }
    // Filter by specific user
    return transaction.createdBy === currentFilter
  })
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Nenhuma transação encontrada</div>
            <p className="text-sm text-muted-foreground">Adicione sua primeira transação para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Transações Recentes</CardTitle>
        </div>
        {showFilters && members.length > 0 && currentUserId && (
          <div className="mt-4 pt-4 border-t">
            <TransactionFilterBar
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              members={members}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {(maxItems ? filteredTransactions.slice(0, maxItems) : filteredTransactions).map((transaction) => {
            const category = DEFAULT_CATEGORIES.find((c) => c.id === transaction.category)
            const isIncome = transaction.type === 'income'
            const amount = transaction.amount / 100
            const creator = members.find((m) => m.userId === transaction.createdBy)
            const showAvatar = transaction.createdBy !== currentUserId && creator

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-200 group bg-gradient-to-r from-background to-transparent"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Category Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ring-1 ring-black/5"
                    style={{ backgroundColor: category?.color + '15' }}
                  >
                    {category?.icon || '📝'}
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate mb-0.5 flex items-center gap-2">
                      {transaction.title}
                      {(transaction.isHouseholdExpense || transaction.target === 'household') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          🏠 Casa
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{formatDate(transaction.date.toDate())}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="capitalize">{category?.name || transaction.category}</span>
                      {transaction.target !== 'personal' && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {transaction.target === 'household' ? 'Casa' : 'Compartilhado'}
                          </span>
                        </>
                      )}
                      {/* Creator Avatar */}
                      {showAvatar && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
                              title={creator.displayName}
                            >
                              {creator.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium">{creator.displayName}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(amount)}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-red-50 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
