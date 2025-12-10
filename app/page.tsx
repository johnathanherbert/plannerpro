'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Wallet, Users, TrendingUp, Shield } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 backdrop-blur-sm">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PlannerPro
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" className="rounded-xl">Entrar</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Criar Conta
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-full border shadow-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">100% Gratuito • Sem Limites</span>
          </div>

          <h2 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              Planejamento Financeiro
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              para sua Família
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Gerencie suas finanças pessoais e familiares em um só lugar.
            Controle despesas, receitas e alcance seus objetivos financeiros juntos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-7 rounded-xl shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/50 transition-all duration-300">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-xl border-2 hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 max-w-6xl mx-auto">
          {[
            {
              icon: Wallet,
              title: 'Controle Completo',
              description: 'Acompanhe todas as suas receitas e despesas em tempo real',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              icon: Users,
              title: 'Financeiro Familiar',
              description: 'Gerencie as finanças da sua casa com todos os membros',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              icon: TrendingUp,
              title: 'Relatórios Visuais',
              description: 'Gráficos e resumos para entender seus gastos',
              gradient: 'from-emerald-500 to-teal-500',
            },
            {
              icon: Shield,
              title: 'Seguro e Privado',
              description: 'Seus dados protegidos com Firebase e criptografia',
              gradient: 'from-orange-500 to-red-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-primary/30 hover:-translate-y-2"
            >
              <div className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <p className="text-center text-gray-600">
          © 2025 PlannerPro. Desenvolvido com Next.js, Firebase e ❤️
        </p>
      </footer>
    </div>
  )
}

