'use client'

// Transaction Modal - create/edit transactions with validation
import { useState, useEffect } from 'react'
import { Transaction, TransactionFormData, TransactionTarget, DEFAULT_CATEGORIES, HouseholdMember, Account, CreditCard } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createTransaction, updateTransaction } from '@/services/transactions'
import { validateSplitRules, createEqualSplit } from '@/utils/splitLogic'
import { format } from 'date-fns'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  userId: string
  householdId: string
  householdMembers?: HouseholdMember[]
  onSuccess?: () => void
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  userId,
  householdId,
  householdMembers = [],
  onSuccess,
}: TransactionModalProps) {
  const { accounts } = useAccounts(householdId, userId)
  const { creditCards } = useCreditCards(householdId, userId)
  
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    title: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'food',
    notes: '',
    target: 'personal',
    isHouseholdExpense: false,
    sharedWithUsers: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        title: transaction.title,
        amount: (transaction.amount / 100).toString(),
        date: format(transaction.date.toDate(), 'yyyy-MM-dd'),
        category: transaction.category,
        notes: transaction.notes || '',
        target: transaction.target,
        sharedWith: transaction.sharedWith,
        isHouseholdExpense: transaction.isHouseholdExpense || false,
        sharedWithUsers: transaction.sharedWithUsers || [],
        accountId: transaction.accountId,
        creditCardId: transaction.creditCardId,
        isPaid: transaction.isPaid,
      })
    } else {
      // Reset form for new transaction
      setFormData({
        type: 'expense',
        title: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'food',
        notes: '',
        target: 'personal',
        isHouseholdExpense: false,
        sharedWithUsers: [],
      })
    }
    setError(null)
  }, [transaction, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('O valor deve ser maior que zero')
      }

      if (!formData.title.trim()) {
        throw new Error('O título é obrigatório')
      }

      // Validate split rules if target is shared
      if (formData.target === 'shared') {
        if (!formData.sharedWith || formData.sharedWith.length === 0) {
          throw new Error('Selecione pelo menos um membro para compartilhar')
        }
        const validation = validateSplitRules(formData.sharedWith)
        if (!validation.valid) {
          throw new Error(validation.error)
        }
      }

      // Auto-share household expenses with all members
      const dataToSave = { ...formData }
      
      console.log('📋 Form data before processing:', {
        isHouseholdExpense: dataToSave.isHouseholdExpense,
        sharedWithUsers: dataToSave.sharedWithUsers,
        target: dataToSave.target
      })
      
      // If target is 'household' OR isHouseholdExpense checkbox is checked
      if (dataToSave.target === 'household' || dataToSave.isHouseholdExpense) {
        // Get all member IDs except current user
        const allMemberIds = householdMembers
          .map(m => m.userId)
          .filter(id => id !== userId)
        dataToSave.sharedWithUsers = allMemberIds
        dataToSave.isHouseholdExpense = true
        
        console.log('🏠 Household expense detected:', {
          target: dataToSave.target,
          isHouseholdExpense: dataToSave.isHouseholdExpense,
          householdMembers: householdMembers.length,
          allMemberIds,
          sharedWithUsers: dataToSave.sharedWithUsers
        })
      } else {
        console.log('❌ NOT a household expense - target:', dataToSave.target, 'isHouseholdExpense:', dataToSave.isHouseholdExpense)
      }

      if (transaction) {
        // Update existing transaction
        await updateTransaction(transaction.id, dataToSave)
      } else {
        // Create new transaction
        await createTransaction(dataToSave, userId, householdId)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  const handleTargetChange = (target: TransactionTarget) => {
    setFormData((prev) => ({
      ...prev,
      target,
      sharedWith: target === 'shared' ? createEqualSplit(householdMembers.map((m) => m.userId)) : undefined,
    }))
  }

  const categories = DEFAULT_CATEGORIES.filter(
    (cat) => cat.type === formData.type || cat.type === 'both'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {transaction ? 'Atualize os dados da transação' : 'Adicione uma nova receita ou despesa'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 rounded-lg p-4 text-sm font-medium shadow-sm">
              {error}
            </div>
          )}

          {/* Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'income' | 'expense') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="expense" className="cursor-pointer">💸 Despesa</SelectItem>
                <SelectItem value="income" className="cursor-pointer">💰 Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold text-muted-foreground">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Compras no supermercado"
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-semibold text-muted-foreground">Valor (R$)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">R$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                className="h-12 pl-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors text-lg font-semibold"
                required
              />
            </div>
          </div>

          {/* Account Selection for Income */}
          {formData.type === 'income' && accounts.length > 0 && (
            <div className="space-y-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <Label className="text-sm font-semibold text-green-900">
                💰 Depositar na conta (opcional)
              </Label>
              <p className="text-xs text-green-700 mb-2">
                Selecione uma conta para registrar o depósito desta receita
              </p>
              <Select
                value={formData.accountId || 'none'}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    accountId: value === 'none' ? undefined : value,
                    isPaid: value !== 'none'
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-xl border-2 bg-white hover:border-green-300 transition-colors">
                  <SelectValue placeholder="Nenhuma conta" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span>❌</span>
                      <span>Não depositar</span>
                    </span>
                  </SelectItem>
                  {accounts.filter(acc => acc.isActive).map((account) => (
                    <SelectItem key={account.id} value={account.id} className="cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-3">
            <Label htmlFor="date" className="text-sm font-semibold text-muted-foreground">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="capitalize">{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Atribuir a</Label>
            <Select value={formData.target} onValueChange={handleTargetChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="personal" className="cursor-pointer">👤 Pessoal</SelectItem>
                <SelectItem value="household" className="cursor-pointer">
                  <div className="flex flex-col items-start">
                    <span>🏠 Casa</span>
                    <span className="text-xs text-muted-foreground">Visível para todos os membros</span>
                  </div>
                </SelectItem>
                {householdMembers.length > 1 && (
                  <SelectItem value="shared" className="cursor-pointer">👥 Compartilhado (dividir)</SelectItem>
                )}
              </SelectContent>
            </Select>
            {formData.target === 'household' && (
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                💡 Esta despesa será automaticamente compartilhada com todos os membros da casa
              </p>
            )}
          </div>

          {/* Share with Members - only for personal transactions */}
          {formData.target === 'personal' && householdMembers.length > 1 && (

            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <Label className="text-sm font-semibold text-muted-foreground">
                👥 Compartilhar com membros (opcional)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione membros que podem visualizar esta transação pessoal
              </p>
              <div className="space-y-2">
                {householdMembers
                  .filter((member) => member.userId !== userId)
                  .map((member) => (
                    <div key={member.userId} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.userId}`}
                        checked={formData.sharedWithUsers?.includes(member.userId)}
                        onCheckedChange={(checked) => {
                          const currentShared = formData.sharedWithUsers || []
                          const newShared = checked
                            ? [...currentShared, member.userId]
                            : currentShared.filter((id) => id !== member.userId)
                          setFormData({ ...formData, sharedWithUsers: newShared })
                        }}
                      />
                      <Label 
                        htmlFor={`member-${member.userId}`} 
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{member.displayName}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-semibold text-muted-foreground">Observações (opcional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione detalhes..."
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Payment Method - Account or Credit Card */}
          {formData.type === 'expense' && (
            <div className="space-y-3 border-t pt-5">
              <Label className="text-sm font-semibold text-muted-foreground">Forma de Pagamento</Label>
              
              {/* Account Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Conta Bancária</Label>
                <Select
                  value={formData.accountId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, accountId: value === 'none' ? undefined : value, creditCardId: undefined })}
                >
                  <SelectTrigger className="h-11 rounded-lg border hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Sem conta</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span>{account.icon}</span>
                          <span>{account.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Card Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cartão de Crédito</Label>
                <Select
                  value={formData.creditCardId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, creditCardId: value === 'none' ? undefined : value, accountId: undefined })}
                >
                  <SelectTrigger className="h-11 rounded-lg border hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Sem cartão</SelectItem>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span>{card.icon}</span>
                          <span>{card.name} (••••{card.lastFourDigits})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-12 px-6 hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-xl h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Salvando...' : transaction ? '✓ Atualizar' : '+ Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
