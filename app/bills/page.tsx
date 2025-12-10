'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { useUserBills } from '@/hooks/useCreditCardBill'
import { useCreditCards } from '@/hooks/useCreditCards'
import { BillTransactionsModal } from '@/components/BillTransactionsModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Receipt,
  CreditCard as CardIcon,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { BillStatus, CreditCardBill, CreditCard } from '@/types'

export default function BillsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { household } = useHousehold(user?.householdId)
  const { bills, loading } = useUserBills(user?.id)
  const { creditCards } = useCreditCards(user?.householdId, user?.id)
  const [filterStatus, setFilterStatus] = useState<BillStatus | 'all'>('all')
  const [selectedBill, setSelectedBill] = useState<{ bill: CreditCardBill; card: CreditCard } | null>(null)

  const handleDeleteAllBills = async () => {
    if (!user) return
    if (!confirm('⚠️ DEBUG: Deletar TODAS as faturas? Esta ação não pode ser desfeita!')) return
    
    try {
      const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const q = query(
        collection(db, 'creditCardBills'),
        where('userId', '==', user.id)
      )
      
      const billsSnapshot = await getDocs(q)
      console.log(`[DEBUG] Deletando ${billsSnapshot.docs.length} faturas...`)
      
      let deleted = 0
      for (const billDoc of billsSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'creditCardBills', billDoc.id))
          console.log(`[DEBUG] Deletada fatura: ${billDoc.id}`)
          deleted++
        } catch (err) {
          console.error(`[DEBUG] Erro ao deletar fatura ${billDoc.id}:`, err)
        }
      }
      
      alert(`✅ ${deleted} de ${billsSnapshot.docs.length} faturas deletadas!`)
      window.location.reload()
    } catch (error: any) {
      console.error('[DEBUG] Erro ao deletar faturas:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  if (!user || !household) {
    return null
  }

  // Remove duplicates based on bill ID
  const uniqueBills = bills.filter((bill, index, self) => 
    index === self.findIndex(b => b.id === bill.id)
  )
  
  console.log('[BillsPage] Bills:', uniqueBills.map(b => ({
    id: b.id,
    cardId: b.creditCardId,
    total: b.totalAmount,
    status: b.status,
    closingDate: b.closingDate.toDate().toISOString()
  })))

  const filteredBills = filterStatus === 'all' 
    ? uniqueBills 
    : uniqueBills.filter(bill => bill.status === filterStatus)

  const getCardForBill = (creditCardId: string) => {
    return creditCards.find(card => card.id === creditCardId)
  }

  const getStatusConfig = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paga',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-200',
          iconClassName: 'text-green-600',
        }
      case 'closed':
        return {
          label: 'Fechada',
          icon: Clock,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          iconClassName: 'text-blue-600',
        }
      case 'overdue':
        return {
          label: 'Vencida',
          icon: XCircle,
          className: 'bg-red-50 text-red-700 border-red-200',
          iconClassName: 'text-red-600',
        }
      case 'open':
      default:
        return {
          label: 'Aberta',
          icon: AlertCircle,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          iconClassName: 'text-yellow-600',
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="rounded-full hover:bg-white/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Receipt className="h-8 w-8 text-purple-600" />
                Histórico de Faturas
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe todas as suas faturas de cartão de crédito
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl"
            onClick={handleDeleteAllBills}
          >
            🗑️ DEBUG: Deletar Faturas
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className="rounded-xl"
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === 'open' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('open')}
            className="rounded-xl"
          >
            Abertas
          </Button>
          <Button
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('closed')}
            className="rounded-xl"
          >
            Fechadas
          </Button>
          <Button
            variant={filterStatus === 'paid' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('paid')}
            className="rounded-xl"
          >
            Pagas
          </Button>
          <Button
            variant={filterStatus === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('overdue')}
            className="rounded-xl"
          >
            Vencidas
          </Button>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando faturas...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' 
                ? 'Nenhuma fatura encontrada' 
                : `Nenhuma fatura ${getStatusConfig(filterStatus as BillStatus).label.toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground">
              {filterStatus === 'all'
                ? 'Suas faturas aparecerão aqui quando você usar seus cartões'
                : 'Tente selecionar outro filtro'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const card = getCardForBill(bill.creditCardId)
              const statusConfig = getStatusConfig(bill.status)
              const StatusIcon = statusConfig.icon
              const remainingAmount = bill.totalAmount - bill.paidAmount

              return (
                <Card key={bill.id} className="border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Card Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          <CardIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {card?.name || 'Cartão'} •••• {card?.lastFourDigits || '****'}
                          </h3>
                          
                          {/* Dates */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Fechamento: {format(bill.closingDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Vencimento: {format(bill.dueDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>

                          {/* Amounts */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valor Total</span>
                              <span className="font-semibold">{formatCurrency(bill.totalAmount)}</span>
                            </div>
                            
                            {bill.paidAmount > 0 && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Pago</span>
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(bill.paidAmount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-sm font-medium">Saldo Restante</span>
                                  <span className="font-bold text-purple-600">
                                    {formatCurrency(remainingAmount)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Payment Info */}
                          {bill.paidAt && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Pago em {format(bill.paidAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-col gap-2 items-end">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig.className}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.iconClassName}`} />
                          <span className="font-medium text-sm">{statusConfig.label}</span>
                        </div>
                        
                        {/* View Transactions Button */}
                        {card && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBill({ bill, card })}
                            className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Ver Transações
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Transactions Modal */}
        {selectedBill && (
          <BillTransactionsModal
            open={true}
            onClose={() => setSelectedBill(null)}
            creditCard={selectedBill.card}
            bill={selectedBill.bill}
          />
        )}
      </div>
    </div>
  )
}
