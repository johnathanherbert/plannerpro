'use client'

// Credit Card Modal - create/edit credit cards
import { useState, useEffect } from 'react'
import { CreditCard, CreditCardFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCreditCard, updateCreditCard } from '@/services/creditCards'

// 8 credit card icons to choose from
const CARD_ICONS = ['💳', '💎', '⭐', '🎯', '🔥', '⚡', '🏆', '✨']

// 8 gradient color options (same as accounts)
const CARD_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-green-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
]

interface CreditCardModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
  householdId: string
  editCard?: CreditCard | null
}

export function CreditCardModal({ open, onClose, onSuccess, userId, householdId, editCard }: CreditCardModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreditCardFormData>({
    name: '',
    lastFourDigits: '',
    limit: '',
    closingDay: 1,
    dueDay: 10,
    color: CARD_COLORS[0],
    icon: CARD_ICONS[0],
  })

  // Initialize form when editing
  useEffect(() => {
    if (editCard) {
      setFormData({
        name: editCard.name,
        lastFourDigits: editCard.lastFourDigits,
        limit: (editCard.limit / 100).toString(), // Convert cents to currency string
        closingDay: editCard.closingDay,
        dueDay: editCard.dueDay,
        color: editCard.color,
        icon: editCard.icon,
      })
    } else {
      setFormData({
        name: '',
        lastFourDigits: '',
        limit: '',
        closingDay: 1,
        dueDay: 10,
        color: CARD_COLORS[0],
        icon: CARD_ICONS[0],
      })
    }
    setErrors({})
  }, [editCard, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (formData.lastFourDigits.length !== 4 || !/^\d{4}$/.test(formData.lastFourDigits)) {
      newErrors.lastFourDigits = 'Digite os 4 últimos dígitos'
    }

    const limitValue = parseFloat(formData.limit)
    if (!formData.limit || isNaN(limitValue) || limitValue <= 0) {
      newErrors.limit = 'Limite deve ser maior que zero'
    }

    if (formData.closingDay < 1 || formData.closingDay > 31) {
      newErrors.closingDay = 'Dia deve ser entre 1 e 31'
    }

    if (formData.dueDay < 1 || formData.dueDay > 31) {
      newErrors.dueDay = 'Dia deve ser entre 1 e 31'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (editCard) {
        await updateCreditCard(editCard.id, formData)
      } else {
        await createCreditCard(formData, userId, householdId)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving credit card:', error)
      setErrors({ submit: 'Erro ao salvar cartão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-2xl border-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        
        <DialogHeader className="space-y-3 pt-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {editCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {editCard ? 'Atualize as informações do cartão.' : 'Configure um novo cartão de crédito.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground">Nome do Cartão *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nubank, Inter, C6..."
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Last 4 Digits */}
          <div className="space-y-3">
            <Label htmlFor="lastFourDigits" className="text-sm font-semibold text-muted-foreground">Últimos 4 Dígitos *</Label>
            <Input
              id="lastFourDigits"
              value={formData.lastFourDigits}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setFormData({ ...formData, lastFourDigits: value })
              }}
              placeholder="1234"
              maxLength={4}
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
            />
            {errors.lastFourDigits && <p className="text-sm text-red-500">{errors.lastFourDigits}</p>}
          </div>

          {/* Credit Limit */}
          <div className="space-y-3">
            <Label htmlFor="limit" className="text-sm font-semibold text-muted-foreground">Limite (R$) *</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
              placeholder="5000.00"
              className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
            />
            {errors.limit && <p className="text-sm text-red-500">{errors.limit}</p>}
          </div>

          {/* Billing Cycle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="closingDay" className="text-sm font-semibold text-muted-foreground">Dia de Fechamento *</Label>
              <Input
                id="closingDay"
                type="number"
                min="1"
                max="31"
                value={formData.closingDay}
                onChange={(e) => setFormData({ ...formData, closingDay: parseInt(e.target.value) || 1 })}
                className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
              {errors.closingDay && <p className="text-sm text-red-500">{errors.closingDay}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="dueDay" className="text-sm font-semibold text-muted-foreground">Dia de Vencimento *</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 10 })}
                className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
              {errors.dueDay && <p className="text-sm text-red-500">{errors.dueDay}</p>}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {CARD_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`h-12 rounded-xl border-2 text-2xl hover:scale-110 transition-all ${
                    formData.icon === icon
                      ? 'border-primary bg-primary/10 scale-110 shadow-lg'
                      : 'border-border hover:border-primary/50'
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
            <div className="grid grid-cols-4 gap-3">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-14 rounded-xl bg-gradient-to-r ${color} hover:scale-105 transition-all shadow-md ${
                    formData.color === color ? 'ring-4 ring-primary scale-105 shadow-lg' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl hover:bg-muted transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Salvando...' : editCard ? 'Atualizar' : 'Criar Cartão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
