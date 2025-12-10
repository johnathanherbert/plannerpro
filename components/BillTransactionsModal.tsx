'use client'

import { useState, useEffect } from 'react'
import { CreditCard, CreditCardBill, Transaction } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  CreditCard as CardIcon, 
  Calendar, 
  Receipt,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Heart,
  Utensils,
  Smartphone,
  Briefcase,
  DollarSign
} from 'lucide-react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface BillTransactionsModalProps {
  open: boolean
  onClose: () => void
  creditCard: CreditCard
  bill: CreditCardBill
}

const categoryIcons: Record<string, any> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Coffee,
  health: Heart,
  home: Home,
  work: Briefcase,
  technology: Smartphone,
  other: Receipt,
}

export function BillTransactionsModal({
  open,
  onClose,
  creditCard,
  bill,
}: BillTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !bill) {
      setTransactions([])
      return
    }

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const startDate = Timestamp.fromDate(
          new Date(bill.closingDate.toDate().getFullYear(), 
                   bill.closingDate.toDate().getMonth() - 1, 
                   bill.closingDate.toDate().getDate() + 1)
        )
        const endDate = bill.closingDate

        const q = query(
          collection(db, 'transactions'),
          where('createdBy', '==', bill.userId),
          where('creditCardId', '==', creditCard.id),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        )

        const snapshot = await getDocs(q)
        const txs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

        // Sort by date descending
        txs.sort((a, b) => b.date.toMillis() - a.date.toMillis())
        
        setTransactions(txs)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [open, bill, creditCard.id])

  const getCategoryIcon = (category?: string) => {
    const IconComponent = categoryIcons[category || 'other'] || Receipt
    return IconComponent
  }

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CardIcon className="h-5 w-5 text-purple-600" />
            Detalhes da Fatura
          </DialogTitle>
          <DialogDescription>
            {creditCard.name} •••• {creditCard.lastFourDigits}
          </DialogDescription>
        </DialogHeader>

        {/* Bill Summary */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Período de Fechamento</span>
            <span className="font-medium">
              {format(bill.closingDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Vencimento</span>
            <span className="font-medium">
              {format(bill.dueDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total da Fatura</span>
            <span className="text-lg font-bold text-purple-600">
              {formatCurrency(bill.totalAmount)}
            </span>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-3 text-sm text-muted-foreground">Carregando transações...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma transação neste período</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {transactions.length} {transactions.length === 1 ? 'Transação' : 'Transações'}
                </h3>
                <span className="text-sm font-medium">
                  Total: {formatCurrency(totalAmount)}
                </span>
              </div>
              
              {transactions.map((transaction) => {
                const CategoryIcon = getCategoryIcon(transaction.category)
                return (
                  <Card key={transaction.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'income' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          <CategoryIcon className={`h-4 w-4 ${
                            transaction.type === 'income' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {transaction.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(transaction.date.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              {transaction.category && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {transaction.category}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <span className={`font-bold ${
                                transaction.type === 'income' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </div>
                          
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>

        {/* Footer Summary */}
        {!loading && transactions.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Compras realizadas entre{' '}
                {format(
                  new Date(bill.closingDate.toDate().getFullYear(), 
                           bill.closingDate.toDate().getMonth() - 1, 
                           bill.closingDate.toDate().getDate() + 1),
                  "dd/MM",
                  { locale: ptBR }
                )}{' '}
                e {format(bill.closingDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
