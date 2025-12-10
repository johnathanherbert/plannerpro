'use client'

// Accounts Management Page - view and manage all bank accounts
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { useAccounts } from '@/hooks/useAccounts'
import { AccountModal } from '@/components/AccountModal'
import { MemberAvatars } from '@/components/MemberAvatars'
import { Button } from '@/components/ui/button'
import { Account } from '@/types'
import { deactivateAccount } from '@/services/accounts'
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Settings, LogOut } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { signOut } from '@/services/auth'

export default function AccountsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { household } = useHousehold(user?.householdId)
  const { accounts, loading, totalBalance } = useAccounts(household?.id, user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingAccount(null)
  }

  const handleDeactivate = async (accountId: string) => {
    if (!confirm('Deseja realmente desativar esta conta?')) return
    
    try {
      await deactivateAccount(accountId)
    } catch (error) {
      console.error('Error deactivating account:', error)
      alert('Erro ao desativar conta. Tente novamente.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user || !household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Contas Bancárias
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
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Total Balance Card */}
        <div className="mb-8 p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl text-white">
          <p className="text-sm font-medium opacity-90 mb-2">Saldo Total</p>
          <p className="text-5xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-sm opacity-75 mt-3">
            {accounts.filter(a => a.isActive).length} {accounts.filter(a => a.isActive).length === 1 ? 'conta ativa' : 'contas ativas'}
          </p>
        </div>

        {/* Add Account Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Accounts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando contas...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira conta para começar a gerenciar suas finanças
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Conta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden ${
                  !account.isActive ? 'opacity-50' : ''
                }`}
              >
                {/* Card Header with gradient */}
                <div className={`h-24 bg-gradient-to-br ${account.color} flex items-center justify-center`}>
                  <span className="text-6xl">{account.icon}</span>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{account.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                    </div>
                    {!account.isActive && (
                      <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Inativa
                      </span>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                    <p className={`text-3xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleEdit(account)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    {account.isActive && (
                      <Button
                        onClick={() => handleDeactivate(account.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Desativar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account Modal */}
        <AccountModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleCloseModal}
          userId={user.id}
          householdId={household.id}
          account={editingAccount}
        />
      </div>
    </div>
  )
}
