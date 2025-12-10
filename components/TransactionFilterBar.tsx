'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User2, Home, Users, Filter } from 'lucide-react'
import { HouseholdMember } from '@/types'

interface TransactionFilterBarProps {
  currentFilter: 'mine' | 'household' | 'all' | string
  onFilterChange: (filter: 'mine' | 'household' | 'all' | string) => void
  members: HouseholdMember[]
  currentUserId: string
}

export function TransactionFilterBar({
  currentFilter,
  onFilterChange,
  members,
  currentUserId,
}: TransactionFilterBarProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
      </div>

      {/* Mine Button */}
      <Button
        variant={currentFilter === 'mine' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('mine')}
        className="gap-2"
      >
        <User2 className="h-4 w-4" />
        Minhas
      </Button>

      {/* Household Button */}
      <Button
        variant={currentFilter === 'household' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('household')}
        className="gap-2"
      >
        <Home className="h-4 w-4" />
        Da Casa
      </Button>

      {/* All Button */}
      <Button
        variant={currentFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="gap-2"
      >
        <Users className="h-4 w-4" />
        Todas
      </Button>

      {/* Member Dropdown */}
      <Select
        value={currentFilter !== 'mine' && currentFilter !== 'household' && currentFilter !== 'all' ? currentFilter : ''}
        onValueChange={onFilterChange}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Por membro..." />
        </SelectTrigger>
        <SelectContent>
          {members
            .filter((member) => member.userId !== currentUserId)
            .map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span>{member.displayName}</span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
