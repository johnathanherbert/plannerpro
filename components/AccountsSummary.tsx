'use client'

// Accounts Summary - displays bank accounts and credit cards overview
import { Account, CreditCard } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatters'
import { Wallet, CreditCard as CreditCardIcon, ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccountsSummaryProps {
  accounts: Account[]
  creditCards: CreditCard[]
  totalBalance: number
  loading?: boolean
  onCreateAccount?: () => void
  onCreateCard?: () => void
}

export function AccountsSummary({
  accounts,
  creditCards,
  totalBalance,
  loading = false,
  onCreateAccount,
  onCreateCard,
}: AccountsSummaryProps) {
  const router = useRouter()

  const activeAccounts = accounts.filter(a => a.isActive)
  const activeCards = creditCards.filter(c => c.isActive)

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-48 bg-muted animate-pulse rounded mb-4" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-48 bg-muted animate-pulse rounded mb-4" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Saldo Total em Contas</p>
              <p className="text-5xl font-bold text-white tracking-tight">
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-sm text-white/70">
                {activeAccounts.length} {activeAccounts.length === 1 ? 'conta ativa' : 'contas ativas'}
              </p>
            </div>
            <div className="hidden md:block">
              <Wallet className="w-20 h-20 text-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts and Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bank Accounts */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Contas Bancárias
              </CardTitle>
              {activeAccounts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-xs hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => router.push('/accounts')}
                >
                  Ver todas
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeAccounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma conta cadastrada
                </p>
                <Button
                  onClick={onCreateAccount}
                  size="sm"
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Conta
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAccounts.slice(0, 3).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/accounts')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center text-xl shadow-md`}>
                        {account.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                ))}
                {activeAccounts.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-lg hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => router.push('/accounts')}
                  >
                    Ver mais {activeAccounts.length - 3} {activeAccounts.length - 3 === 1 ? 'conta' : 'contas'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Cards */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4" />
                Cartões de Crédito
              </CardTitle>
              {activeCards.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-xs hover:bg-purple-50 hover:text-purple-600"
                  onClick={() => router.push('/cards')}
                >
                  Ver todos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeCards.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                  <CreditCardIcon className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhum cartão cadastrado
                </p>
                <Button
                  onClick={onCreateCard}
                  size="sm"
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Cartão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCards.slice(0, 3).map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/cards')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-xl shadow-md`}>
                        {card.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{card.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">••••  {card.lastFourDigits}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Limite</p>
                      <p className="font-bold text-purple-600">
                        {formatCurrency(card.limit)}
                      </p>
                    </div>
                  </div>
                ))}
                {activeCards.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-lg hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => router.push('/cards')}
                  >
                    Ver mais {activeCards.length - 3} {activeCards.length - 3 === 1 ? 'cartão' : 'cartões'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
