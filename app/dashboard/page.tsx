'use client'

// Dashboard - main view with balances, transactions, and quick actions
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useUserBills } from '@/hooks/useCreditCardBill'
import { BalanceCards } from '@/components/BalanceCards'
import { TransactionList } from '@/components/TransactionList'
import { TransactionModal } from '@/components/TransactionModal'
import { AccountModal } from '@/components/AccountModal'
import { CreditCardModal } from '@/components/CreditCardModal'
import { AccountsSummary } from '@/components/AccountsSummary'
import { MemberAvatars } from '@/components/MemberAvatars'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, LogOut, Settings, Receipt, Bell } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { differenceInDays } from 'date-fns'
import { signOut } from '@/services/auth'
import { deleteTransaction } from '@/services/transactions'
import { Transaction } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { household, loading: householdLoading } = useHousehold(user?.householdId)
  const { transactions, balance, loading: transactionsLoading } = useTransactions(
    user?.householdId,
    user?.id,
    {
      showMemberTransactions: household?.showMemberTransactions,
    }
  )
  const { accounts, totalBalance, loading: accountsLoading } = useAccounts(household?.id, user?.id)
  const { creditCards, loading: cardsLoading } = useCreditCards(household?.id, user?.id)
  const { bills } = useUserBills(user?.id)

  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [authLoading, user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      await deleteTransaction(transactionId)
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir transação')
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setTransactionModalOpen(true)
  }

  const handleModalClose = () => {
    setTransactionModalOpen(false)
    setEditingTransaction(null)
  }

  // Redirect if no household
  if (!authLoading && !householdLoading && user && !user.householdId) {
    router.push('/auth/signup')
    return null
  }

  // Loading state
  if (authLoading || householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-medium">Carregando seu dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !household) {
    return null
  }

  // Calculate overdue and upcoming bills
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PlannerPro
                </h1>
                <p className="text-sm text-muted-foreground font-medium">{household.name}</p>
              </div>
              <div className="hidden md:block h-8 w-px bg-border"></div>
              <MemberAvatars members={household.members} maxVisible={5} />
            </div>
            <div className="flex items-center gap-2">
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
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Olá, {user.displayName}! 👋
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Aqui está um resumo das suas finanças
              </p>
            </div>
            <Button 
              onClick={() => setTransactionModalOpen(true)} 
              size="lg"
              className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Transação
            </Button>
          </div>

          {/* Balance Cards */}
          <BalanceCards balance={balance} loading={transactionsLoading} />

          {/* Bill Notifications */}
          {hasNotifications && (
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
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

          {/* Accounts and Credit Cards Summary */}
          <AccountsSummary
            accounts={accounts}
            creditCards={creditCards}
            totalBalance={totalBalance}
            loading={accountsLoading || cardsLoading}
            onCreateAccount={() => setAccountModalOpen(true)}
            onCreateCard={() => setCreditCardModalOpen(true)}
          />

          {/* Transactions List */}
          <TransactionList
            transactions={transactions}
            loading={transactionsLoading}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            maxItems={5}
            members={household?.members || []}
            currentUserId={user?.id}
            showFilters={true}
          />

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Transações Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {transactions.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-green-600">{transactions.filter((t) => t.type === 'income').length} receitas</span>
                  {' • '}
                  <span className="font-semibold text-red-600">{transactions.filter((t) => t.type === 'expense').length} despesas</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Meta de Economia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-muted-foreground/40 mb-2">Em breve</div>
                <p className="text-sm text-muted-foreground">
                  Defina metas e acompanhe seu progresso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        open={transactionModalOpen}
        onOpenChange={handleModalClose}
        transaction={editingTransaction}
        userId={user.id}
        householdId={household.id}
        householdMembers={household.members}
        onSuccess={() => {
          // Transactions will update automatically via realtime listener
        }}
      />

      {/* Account Modal */}
      <AccountModal
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        userId={user.id}
        householdId={household.id}
        onSuccess={() => {
          // Accounts will update automatically via realtime listener
        }}
      />

      {/* Credit Card Modal */}
      <CreditCardModal
        open={creditCardModalOpen}
        onClose={() => setCreditCardModalOpen(false)}
        userId={user.id}
        householdId={household.id}
        onSuccess={() => {
          // Cards will update automatically via realtime listener
        }}
      />
    </div>
  )
}
