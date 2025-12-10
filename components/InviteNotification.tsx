'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getInvitationsByEmail, acceptInvitation, rejectInvitation } from '@/services/invitations'
import { Invitation } from '@/types'
import { Home, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToastAction } from '@/components/ui/toast'

export function InviteNotification() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([])
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return

    // Check for pending invitations
    const checkInvitations = async () => {
      try {
        const invites = await getInvitationsByEmail(user.email)
        const pending = invites.filter((inv) => inv.status === 'pending')
        setPendingInvites(pending)

        // Show toast for each pending invite
        pending.forEach((invite) => {
          showInviteToast(invite)
        })
      } catch (error) {
        console.error('Error checking invitations:', error)
      }
    }

    checkInvitations()
  }, [user?.email])

  const showInviteToast = (invite: Invitation) => {
    toast({
      variant: 'info',
      title: '🏠 Convite para Casa',
      description: (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold">{invite.inviterName}</span> convidou você para participar da casa{' '}
            <span className="font-semibold">{invite.householdName}</span>
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => handleAccept(invite.id)}
              disabled={processingInvite === invite.id}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 px-4"
            >
              <Check className="h-4 w-4 mr-1" />
              {processingInvite === invite.id ? 'Aceitando...' : 'Aceitar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(invite.id)}
              disabled={processingInvite === invite.id}
              className="rounded-lg h-9 px-4 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <X className="h-4 w-4 mr-1" />
              Recusar
            </Button>
          </div>
        </div>
      ),
      duration: Infinity, // Don't auto-dismiss
    })
  }

  const handleAccept = async (inviteId: string) => {
    if (!user?.email) return

    setProcessingInvite(inviteId)
    try {
      await acceptInvitation(inviteId, user.id, user.email, user.displayName)
      
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
      
      toast({
        variant: 'success',
        title: '✓ Convite aceito!',
        description: 'Você agora faz parte da casa. Recarregando...',
        duration: 2000,
      })

      // Reload page to update household data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao aceitar convite',
        description: error.message || 'Tente novamente mais tarde',
      })
    } finally {
      setProcessingInvite(null)
    }
  }

  const handleReject = async (inviteId: string) => {
    setProcessingInvite(inviteId)
    try {
      await rejectInvitation(inviteId)
      
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
      
      toast({
        variant: 'default',
        title: 'Convite recusado',
        description: 'O convite foi removido.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao recusar convite',
        description: error.message || 'Tente novamente mais tarde',
      })
    } finally {
      setProcessingInvite(null)
    }
  }

  return null // Component doesn't render anything, just manages toasts
}
