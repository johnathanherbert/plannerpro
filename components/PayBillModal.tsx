'use client'

import { useState, useEffect } from 'react'
import { CreditCard, CreditCardBill } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/utils/formatters'
import { payBill } from '@/services/creditCardBills'
import { useAccounts } from '@/hooks/useAccounts'
import { CreditCard as CardIcon, DollarSign, AlertCircle } from 'lucide-react'

interface PayBillModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  creditCard: CreditCard
  bill: CreditCardBill
  userId: string
  householdId: string
}

export function PayBillModal({
  open,
  onClose,
  onSuccess,
  creditCard,
  bill,
  userId,
  householdId,
}: PayBillModalProps) {
  const { accounts } = useAccounts(householdId, userId)
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
  })
  const [loading, setLoading] = useState(false)

  const activeAccounts = accounts.filter(acc => acc.isActive)
  const remainingAmount = bill.totalAmount - bill.paidAmount
  const maxPayment = remainingAmount

  useEffect(() => {
    if (open) {
      setFormData({
        accountId: '',
        amount: (remainingAmount / 100).toFixed(2),
      })
    }
  }, [open, remainingAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.accountId) {
      alert('Selecione uma conta para pagamento')
      return
    }

    const amountInCents = Math.round(parseFloat(formData.amount) * 100)

    if (isNaN(amountInCents) || amountInCents <= 0) {
      alert('Valor inválido')
      return
    }

    if (amountInCents > remainingAmount) {
      alert('Valor maior que o saldo devedor')
      return
    }

    const selectedAccount = activeAccounts.find(acc => acc.id === formData.accountId)
    if (!selectedAccount) {
      alert('Conta não encontrada')
      return
    }

    if (selectedAccount.balance < amountInCents) {
      alert('Saldo insuficiente na conta')
      return
    }

    setLoading(true)

    try {
      await payBill(bill.id, formData.accountId, amountInCents)
      alert('Pagamento realizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error paying bill:', error)
      alert('Erro ao realizar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const filtered = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = filtered.split('.')
    if (parts.length > 2) return
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return
    
    setFormData(prev => ({ ...prev, amount: filtered }))
  }

  const setMaxAmount = () => {
    setFormData(prev => ({
      ...prev,
      amount: (remainingAmount / 100).toFixed(2)
    }))
  }

  const selectedAccount = activeAccounts.find(acc => acc.id === formData.accountId)
  const amountInCents = Math.round(parseFloat(formData.amount || '0') * 100)
  const hasInsufficientFunds = selectedAccount && selectedAccount.balance < amountInCents

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CardIcon className="h-5 w-5 text-purple-600" />
            Pagar Fatura
          </DialogTitle>
          <DialogDescription>
            {creditCard.name} •••• {creditCard.lastFourDigits}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Summary */}
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total da Fatura</span>
              <span className="font-semibold">{formatCurrency(bill.totalAmount)}</span>
            </div>
            {bill.paidAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Já Pago</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(bill.paidAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Saldo Devedor</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Payment Account */}
          <div className="space-y-2">
            <Label htmlFor="accountId">Conta para Pagamento</Label>
            {activeAccounts.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                Nenhuma conta ativa disponível
              </div>
            ) : (
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="ml-4 text-sm text-muted-foreground">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Valor do Pagamento</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setMaxAmount}
                className="h-6 text-xs text-purple-600 hover:text-purple-700"
              >
                Pagar Total
              </Button>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
                className="rounded-xl pl-9"
                required
              />
            </div>
            {formData.amount && (
              <p className="text-sm text-muted-foreground">
                Valor: {formatCurrency(amountInCents)}
              </p>
            )}
          </div>

          {/* Insufficient Funds Warning */}
          {hasInsufficientFunds && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Saldo insuficiente</p>
                <p className="text-xs mt-1">
                  A conta selecionada possui saldo de {formatCurrency(selectedAccount.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || activeAccounts.length === 0 || hasInsufficientFunds}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
