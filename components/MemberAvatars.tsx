'use client'

import { HouseholdMember } from '@/types'
import { Users } from 'lucide-react'

interface MemberAvatarsProps {
  members: HouseholdMember[]
  maxVisible?: number
}

const avatarGradients = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
]

export function MemberAvatars({ members, maxVisible = 4 }: MemberAvatarsProps) {
  const visibleMembers = members.slice(0, maxVisible)
  const remainingCount = Math.max(0, members.length - maxVisible)

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-3">
        {visibleMembers.map((member, index) => {
          const gradient = avatarGradients[index % avatarGradients.length]
          const isOwner = member.role === 'owner'
          
          return (
            <div
              key={member.userId}
              className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${gradient} ring-2 ${isOwner ? 'ring-yellow-400 ring-offset-2' : 'ring-white dark:ring-slate-900'} flex items-center justify-center text-white font-bold shadow-lg hover:z-10 hover:scale-110 transition-transform cursor-pointer`}
              style={{ zIndex: visibleMembers.length - index }}
              title={`${member.displayName} (${member.role === 'owner' ? '👑 Proprietário' : member.role === 'admin' ? 'Admin' : 'Membro'})`}
            >
              <span className="text-sm">
                {member.displayName.charAt(0).toUpperCase()}
              </span>
              {isOwner && (
                <span className="absolute -top-1 -right-1 text-xs">👑</span>
              )}
            </div>
          )
        })}
        {remainingCount > 0 && (
          <div
            className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer"
            title={`+${remainingCount} ${remainingCount === 1 ? 'membro' : 'membros'}`}
          >
            <span className="text-xs">+{remainingCount}</span>
          </div>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="font-medium">{members.length}</span>
      </div>
    </div>
  )
}
