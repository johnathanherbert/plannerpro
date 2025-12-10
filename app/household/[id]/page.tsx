'use client'

// Household Settings - manage household name, members, and invitations
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteModal } from '@/components/InviteModal'
import { ArrowLeft, UserPlus, Trash2, Shield, Crown, Eye, EyeOff } from 'lucide-react'
import { updateHouseholdName, removeHouseholdMember, hasPermission, updateShowMemberTransactions } from '@/services/households'

export default function HouseholdSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { household, loading } = useHousehold(resolvedParams.id)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMemberTransactions, setShowMemberTransactions] = useState(false)
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)

  // Update local state when household loads
  useEffect(() => {
    if (household) {
      setHouseholdName(household.name)
      // Get current user's privacy setting
      const userSetting = household.showMemberTransactions?.[user?.id || ''] || false
      setShowMemberTransactions(userSetting)
    }
  }, [household, user?.id])

  const canManageMembers = household && user ? hasPermission(household, user.id, 'manage_members') : false

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!household) return

    setSavingName(true)
    setError(null)

    try {
      await updateHouseholdName(household.id, householdName)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar nome')
    } finally {
      setSavingName(false)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!household || !confirm(`Tem certeza que deseja remover ${userName}?`)) {
      return
    }

    try {
      await removeHouseholdMember(household.id, userId)
    } catch (err: any) {
      alert(err.message || 'Erro ao remover membro')
    }
  }

  const handleToggleShowTransactions = async (enabled: boolean) => {
    if (!household || !user) return

    setUpdatingPrivacy(true)
    try {
      await updateShowMemberTransactions(household.id, user.id, enabled)
      setShowMemberTransactions(enabled)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar configuração')
    } finally {
      setUpdatingPrivacy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!household || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="rounded-xl hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Casa</h1>
            <p className="text-muted-foreground mt-1">Gerencie os membros e configurações da sua casa</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Household Name */}
          <Card>
            <CardHeader>
              <CardTitle>Nome da Casa</CardTitle>
              <CardDescription>Atualize o nome da sua casa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="householdName">Nome</Label>
                  <Input
                    id="householdName"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="Nome da casa"
                    disabled={savingName || !canManageMembers}
                  />
                </div>
                {canManageMembers && (
                  <Button type="submit" disabled={savingName || householdName === household.name}>
                    {savingName ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Membros ({household.members.length})</CardTitle>
                  <CardDescription>Gerencie quem tem acesso à sua casa</CardDescription>
                </div>
                {canManageMembers && (
                  <Button onClick={() => setInviteModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {household.members.map((member) => {
                  const isCurrentUser = member.userId === user.id
                  const canRemove = canManageMembers && member.role !== 'owner' && !isCurrentUser

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{member.displayName}</span>
                            {isCurrentUser && (
                              <span className="text-xs bg-accent px-2 py-0.5 rounded">Você</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-sm">
                          {member.role === 'owner' && (
                            <>
                              <Crown className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-600">Proprietário</span>
                            </>
                          )}
                          {member.role === 'admin' && (
                            <>
                              <Shield className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-600">Admin</span>
                            </>
                          )}
                          {member.role === 'member' && (
                            <span className="text-muted-foreground">Membro</span>
                          )}
                        </div>

                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveMember(member.userId, member.displayName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Configurações de Privacidade
              </CardTitle>
              <CardDescription>
                Controle a visibilidade das suas transações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between space-x-4 p-4 bg-white rounded-xl border-2 border-blue-200">
                <div className="flex-1">
                  <Label htmlFor="show-transactions" className="text-base font-semibold text-blue-900">
                    Permitir que membros vejam minhas transações
                  </Label>
                  <p className="text-sm text-blue-700 mt-2">
                    Quando ativado, outros membros que também habilitaram esta opção poderão visualizar suas transações pessoais. 
                    Transações marcadas como "Despesa da Casa" são sempre visíveis para todos.
                  </p>
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">
                      💡 Como funciona:
                    </p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Suas transações pessoais são privadas por padrão</li>
                      <li>Se você e outro membro habilitarem esta opção, vocês poderão ver as transações um do outro</li>
                      <li>Você sempre vê suas próprias transações e as da casa</li>
                      <li>Use "Compartilhar com membros" no modal para compartilhamento seletivo</li>
                    </ul>
                  </div>
                </div>
                <Switch
                  id="show-transactions"
                  checked={showMemberTransactions}
                  onCheckedChange={handleToggleShowTransactions}
                  disabled={updatingPrivacy}
                  className="mt-1"
                />
              </div>

              {/* Members Privacy Status */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Status de compartilhamento dos membros:
                </Label>
                <div className="grid gap-2">
                  {household.members.map((member) => {
                    const isSharing = household.showMemberTransactions?.[member.userId] || false
                    const isCurrentUser = member.userId === user.id
                    
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {member.displayName}
                              {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(Você)</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSharing ? (
                            <>
                              <Eye className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-600">Compartilhando</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Privado</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {household.ownerId === user.id && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  Excluir Casa (em breve)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Esta ação excluirá permanentemente a casa e todas as transações
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        householdId={household.id}
        householdName={household.name}
        inviterId={user.id}
        inviterName={user.displayName}
      />
    </div>
  )
}
