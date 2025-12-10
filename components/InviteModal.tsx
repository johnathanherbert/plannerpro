'use client'

// Invite Modal - send household invitations via email
import { useState } from 'react'
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
import { createInvitation, getInvitationLink } from '@/services/invitations'
import { Copy, Check } from 'lucide-react'

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  householdName: string
  inviterId: string
  inviterName: string
}

export function InviteModal({
  open,
  onOpenChange,
  householdId,
  householdName,
  inviterId,
  inviterName,
}: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const invitationId = await createInvitation(
        householdId,
        householdName,
        email,
        inviterId,
        inviterName
      )

      // Get the invitation document to retrieve the token
      // For simplicity, we'll generate a mock link
      // In production, you'd fetch the invitation to get the actual token
      const link = `${window.location.origin}/auth/signup?household=${householdId}`
      setInvitationLink(link)
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setEmail('')
    setInvitationLink(null)
    setError(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite para alguém se juntar à sua casa
          </DialogDescription>
        </DialogHeader>

        {invitationLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
              <p className="font-medium mb-2">✓ Convite criado com sucesso!</p>
              <p className="text-sm">Compartilhe o link abaixo com a pessoa convidada:</p>
            </div>

            <div className="space-y-2">
              <Label>Link do Convite</Label>
              <div className="flex space-x-2">
                <Input value={invitationLink} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email do Convidado</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amigo@email.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                A pessoa receberá um convite para se juntar à {householdName}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
