'use client'

// Credit Cards Management Page - view and manage all credit cards
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useUserBills } from '@/hooks/useCreditCardBill'
import { CreditCardModal } from '@/components/CreditCardModal'
import { CreditCardBillCard } from '@/components/CreditCardBillCard'
import { PayBillModal } from '@/components/PayBillModal'
import { MemberAvatars } from '@/components/MemberAvatars'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from '@/types'
import { deactivateCreditCard } from '@/services/creditCards'
import { Plus, Edit, Trash2, CreditCard as CardIcon, ArrowLeft, Settings, LogOut, Bell, Receipt } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { signOut } from '@/services/auth'
import { useCreditCardBill } from '@/hooks/useCreditCardBill'
import { differenceInDays } from 'date-fns'

export default function CreditCardsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { household } = useHousehold(user?.householdId)
  const { creditCards, loading } = useCreditCards(user?.householdId, user?.id)
  const { bills } = useUserBills(user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [payBillModalOpen, setPayBillModalOpen] = useState(false)
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<CreditCard | null>(null)

  const handleEdit = (card: CreditCard) => {
    setEditingCard(card)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingCard(null)
  }

  const handleDeactivate = async (cardId: string) => {
    if (!confirm('Deseja realmente desativar este cartão?')) return
    
    try {
      await deactivateCreditCard(cardId)
    } catch (error) {
      console.error('Error deactivating card:', error)
      alert('Erro ao desativar cartão. Tente novamente.')
    }
  }

  const handlePayBill = (card: CreditCard) => {
    setSelectedCardForPayment(card)
    setPayBillModalOpen(true)
  }

  const handleClosePayBillModal = () => {
    setPayBillModalOpen(false)
    setSelectedCardForPayment(null)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeleteAllBills = async () => {
    if (!user) return
    if (!confirm('⚠️ DEBUG: Deletar TODAS as faturas? Esta ação não pode ser desfeita!')) return
    
    try {
      const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      // Delete only user's bills
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
      window.location.reload() // Reload to update UI
    } catch (error: any) {
      console.error('[DEBUG] Erro ao deletar faturas:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  if (!user || !household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  const activeCards = creditCards.filter(c => c.isActive)

  // Calculate bill notifications
  const today = new Date()
  const overdueBills = bills.filter(bill => {
    if (bill.status === 'paid') return false
    const dueDate = bill.dueDate.toDate()
    return dueDate < today
  })
  const upcomingBills = bills.filter(bill => {
    if (bill.status === 'paid') return false
    const dueDate = bill.dueDate.toDate()
    const daysUntilDue = differenceInDays(dueDate, today)
    return daysUntilDue >= 0 && daysUntilDue <= 7
  })
  const hasNotifications = overdueBills.length > 0 || upcomingBills.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-primary/10"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Cartões de Crédito
                </h1>
                <p className="text-sm text-muted-foreground font-medium">{household.name}</p>
              </div>
              <div className="hidden md:block h-8 w-px bg-border"></div>
              <MemberAvatars members={household.members} maxVisible={5} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl"
                onClick={handleDeleteAllBills}
              >
                🗑️ DEBUG: Deletar Faturas
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                onClick={() => router.push(`/household/${household.id}`)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Summary Card */}
        <div className="mb-8 p-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl text-white">
          <p className="text-sm font-medium opacity-90 mb-2">Total de Cartões</p>
          <p className="text-5xl font-bold">{activeCards.length}</p>
          <p className="text-sm opacity-75 mt-3">
            {activeCards.length === 1 ? 'cartão ativo' : 'cartões ativos'}
          </p>
        </div>

        {/* Add Card Button */}
        <div className="mb-6 flex justify-end gap-3">
          <Button
            onClick={() => router.push('/bills')}
            variant="outline"
            className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm relative"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Ver Todas as Faturas
            {hasNotifications && (
              <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {overdueBills.length + upcomingBills.length}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Cartão
          </Button>
        </div>

        {/* Bill Notifications */}
        {hasNotifications && (
          <Card className="mb-6 border-0 shadow-lg overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Bell className="h-5 w-5" />
                Faturas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueBills.length > 0 && (
                <div className="p-4 bg-red-100 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">
                        {overdueBills.length} {overdueBills.length === 1 ? 'Fatura Vencida' : 'Faturas Vencidas'}
                      </h4>
                      <p className="text-sm text-red-700">
                        Total: {formatCurrency(overdueBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0))}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/bills')}
                      className="bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Ver Faturas
                    </Button>
                  </div>
                </div>
              )}
              {upcomingBills.length > 0 && (
                <div className="p-4 bg-orange-100 border border-orange-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-1">
                        {upcomingBills.length} {upcomingBills.length === 1 ? 'Fatura' : 'Faturas'} Vencendo em 7 Dias
                      </h4>
                      <p className="text-sm text-orange-700">
                        Total: {formatCurrency(upcomingBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0))}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/bills')}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-lg"
                    >
                      Ver Faturas
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando cartões...</p>
          </div>
        ) : creditCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Adicione seu primeiro cartão para começar a gerenciar suas despesas
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Primeiro Cartão
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.map((card) => (
              <CreditCardBillCard
                key={card.id}
                creditCard={card}
                userId={user!.id}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
                onPayBill={handlePayBill}
              />
            ))}
          </div>
        )}

        {/* Credit Card Modal */}
        <CreditCardModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
          userId={user.id}
          householdId={household.id}
          editCard={editingCard}
        />

        {/* Pay Bill Modal */}
        {selectedCardForPayment && (
          <PayBillModalWrapper
            open={payBillModalOpen}
            onClose={handleClosePayBillModal}
            onSuccess={handleClosePayBillModal}
            creditCard={selectedCardForPayment}
            userId={user.id}
            householdId={household.id}
          />
        )}
      </div>
    </div>
  )
}

// Wrapper component to fetch bill data
function PayBillModalWrapper({
  open,
  onClose,
  onSuccess,
  creditCard,
  userId,
  householdId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  creditCard: CreditCard
  userId: string
  householdId: string
}) {
  const { currentBill, loading } = useCreditCardBill(creditCard, userId)

  if (!currentBill || loading) {
    return null
  }

  return (
    <PayBillModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      creditCard={creditCard}
      bill={currentBill}
      userId={userId}
      householdId={householdId}
    />
  )
}
