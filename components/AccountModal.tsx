'use client'

import { useState, useEffect } from 'react'
import { Account, AccountFormData, AccountType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createAccount, updateAccount } from '@/services/accounts'

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  userId: string
  householdId: string
  onSuccess?: () => void
}

const accountIcons = ['💳', '💰', '🏦', '💵', '📊', '🪙', '💸', '🎯']
const accountColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
]

export function AccountModal({
  open,
  onOpenChange,
  account,
  userId,
  householdId,
  onSuccess,
}: AccountModalProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'checking',
    initialBalance: '0',
    color: accountColors[0],
    icon: accountIcons[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        initialBalance: (account.initialBalance / 100).toString(),
        color: account.color,
        icon: account.icon,
      })
    } else {
      setFormData({
        name: '',
        type: 'checking',
        initialBalance: '0',
        color: accountColors[0],
        icon: accountIcons[0],
      })
    }
    setError(null)
  }, [account, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name.trim()) {
        throw new Error('O nome da conta é obrigatório')
      }

      const balance = parseFloat(formData.initialBalance)
      if (isNaN(balance)) {
        throw new Error('Saldo inicial inválido')
      }

      if (account) {
        await updateAccount(account.id, formData)
      } else {
        await createAccount(formData, userId, householdId)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {account ? 'Editar Conta' : 'Nova Conta Bancária'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {account ? 'Atualize as informações da conta' : 'Adicione uma nova conta para gerenciar seus recursos'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 rounded-lg p-4 text-sm font-medium shadow-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground">Nome da Conta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nubank, Itaú, Dinheiro"
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Tipo de Conta</Label>
            <Select
              value={formData.type}
              onValueChange={(value: AccountType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="checking" className="cursor-pointer">🏦 Conta Corrente</SelectItem>
                <SelectItem value="savings" className="cursor-pointer">💰 Poupança</SelectItem>
                <SelectItem value="investment" className="cursor-pointer">📊 Investimento</SelectItem>
                <SelectItem value="cash" className="cursor-pointer">💵 Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Initial Balance */}
          <div className="space-y-3">
            <Label htmlFor="balance" className="text-sm font-semibold text-muted-foreground">
              {account ? 'Saldo Atual' : 'Saldo Inicial'}
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">R$</span>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                placeholder="0,00"
                className="h-12 pl-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors text-lg font-semibold"
                required
              />
            </div>
            {account && (
              <p className="text-xs text-muted-foreground">
                💡 Ajuste o saldo manualmente quando necessário
              </p>
            )}
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {accountIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`h-12 rounded-xl border-2 text-2xl hover:scale-110 transition-transform ${
                    formData.icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Cor</Label>
            <div className="grid grid-cols-8 gap-2">
              {accountColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-12 rounded-xl border-2 hover:scale-110 transition-transform ${
                    formData.color === color ? 'border-primary ring-2 ring-primary' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

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
              {loading ? 'Salvando...' : account ? '✓ Atualizar' : '+ Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
