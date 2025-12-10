'use client'

// Sign Up page - create account with option to create or join household
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUpWithEmail, signInWithGoogle } from '@/services/auth'
import { createHousehold } from '@/services/households'
import { getPendingInvitations, acceptInvitation } from '@/services/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Invitation } from '@/types'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')

  const [step, setStep] = useState<'account' | 'household'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const user = await signUpWithEmail(email, password, displayName)
      setUserId(user.id)

      // Check for pending invitations
      const invitations = await getPendingInvitations(email)
      setPendingInvitations(invitations)

      if (invitations.length > 0) {
        // Auto-accept first invitation
        await acceptInvitation(invitations[0].id, user.id, user.email, user.displayName)
        router.push('/dashboard')
      } else {
        // No invitations - proceed to household creation
        setStep('household')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      await createHousehold(householdName, userId, email, displayName)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar casa')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = await signInWithGoogle()
      
      // Check for pending invitations
      const invitations = await getPendingInvitations(user.email)
      
      if (invitations.length > 0) {
        await acceptInvitation(invitations[0].id, user.id, user.email, user.displayName)
      }
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta com Google')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'household') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl" />
          <CardHeader className="space-y-3 pb-8 pt-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Crie sua Casa
            </CardTitle>
            <CardDescription className="text-base">
              Uma casa é onde você gerencia suas finanças com sua família
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateHousehold} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="householdName" className="text-sm font-semibold text-muted-foreground">
                  Nome da Casa
                </Label>
                <Input
                  id="householdName"
                  type="text"
                  placeholder="ex: Família Silva"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Casa'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl" />
        <CardHeader className="space-y-3 pt-8">
          <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PlannerPro
          </CardTitle>
          <CardDescription className="text-center text-base">
            Crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="displayName" className="text-sm font-semibold text-muted-foreground">Nome</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="h-12 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">Ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300 transition-colors font-semibold"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <div className="text-sm text-center text-muted-foreground pb-4">
            Já tem uma conta?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
