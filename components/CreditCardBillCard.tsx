'use client'

import { useState } from 'react'
import { CreditCard } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatters'
import { CreditCard as CardIcon, Calendar, AlertCircle, CheckCircle2, Edit, Trash2, Receipt } from 'lucide-react'
import { useCreditCardBill } from '@/hooks/useCreditCardBill'
import { BillTransactionsModal } from '@/components/BillTransactionsModal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CreditCardBillCardProps {
  creditCard: CreditCard
  userId: string
  onPayBill?: (card: CreditCard) => void
  onEdit?: (card: CreditCard) => void
  onDeactivate?: (cardId: string) => void
}

export function CreditCardBillCard({
  creditCard,
  userId,
  onPayBill,
  onEdit,
  onDeactivate,
}: CreditCardBillCardProps) {
  const { currentBill, currentUsage, availableLimit, loading } = useCreditCardBill(
    creditCard,
    userId
  )
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = (currentUsage / creditCard.limit) * 100
  const isNearLimit = usagePercentage > 80
  const isOverLimit = usagePercentage > 100

  return (
    <Card 
      className="border-0 shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${creditCard.color}15 0%, ${creditCard.color}05 100%)`,
      }}
    >
      <div 
        className="h-1.5"
        style={{ background: creditCard.color }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: creditCard.color + '20' }}
            >
              {creditCard.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{creditCard.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                ••••{creditCard.lastFourDigits}
              </p>
            </div>
          </div>
          {currentBill && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p className="text-sm font-semibold">
                {format(currentBill.dueDate.toDate(), 'dd MMM', { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usado</span>
            <span className="font-semibold">{formatCurrency(currentUsage)}</span>
          </div>
          <div className={`rounded-full h-2 bg-gray-200 overflow-hidden`}>
            <div 
              className={`h-full transition-all ${
                isOverLimit 
                  ? 'bg-red-600' 
                  : isNearLimit 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {usagePercentage.toFixed(1)}% do limite
            </span>
            <span className={`font-semibold ${availableLimit < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.max(availableLimit, 0))} disponível
            </span>
          </div>
        </div>

        {/* Limit Display */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Limite Total</p>
            <p className="text-lg font-bold">{formatCurrency(creditCard.limit)}</p>
          </div>
          {currentBill && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fatura Atual</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(currentBill.totalAmount - currentBill.paidAmount)}
              </p>
            </div>
          )}
        </div>

        {/* Alerts */}
        {isOverLimit && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Limite excedido!</span>
          </div>
        )}

        {isNearLimit && !isOverLimit && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Próximo do limite</span>
          </div>
        )}

        {currentBill && currentBill.paidAmount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">
              Pago: {formatCurrency(currentBill.paidAmount)} de {formatCurrency(currentBill.totalAmount)}
            </span>
          </div>
        )}

        {/* Pay Bill Button */}
        {currentBill && currentBill.totalAmount > 0 && currentBill.paidAmount < currentBill.totalAmount && onPayBill && (
          <Button 
            onClick={() => onPayBill(creditCard)}
            className="w-full rounded-xl h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Pagar Fatura
          </Button>
        )}

        {/* View Transactions Button */}
        {currentBill && currentBill.totalAmount > 0 && (
          <Button 
            onClick={() => setShowTransactionsModal(true)}
            variant="outline"
            className="w-full rounded-xl h-11 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Ver Transações da Fatura
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <Button
              onClick={() => onEdit(creditCard)}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          )}
          {onDeactivate && creditCard.isActive && (
            <Button
              onClick={() => onDeactivate(creditCard.id)}
              variant="outline"
              size="sm"
              className="rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Transactions Modal */}
      {currentBill && (
        <BillTransactionsModal
          open={showTransactionsModal}
          onClose={() => setShowTransactionsModal(false)}
          creditCard={creditCard}
          bill={currentBill}
        />
      )}
    </Card>
  )
}
