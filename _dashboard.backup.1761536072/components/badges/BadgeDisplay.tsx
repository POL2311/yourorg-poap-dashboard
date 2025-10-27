'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  unlocked: boolean
  progress?: number
  target?: number
}

interface BadgeDisplayProps {
  badges: BadgeData[]
  totalClaims: number
  level: {
    level: number
    name: string
    color: string
  }
}

export function BadgeDisplay({ badges, totalClaims, level }: BadgeDisplayProps) {
  const unlockedBadges = badges.filter(badge => badge.unlocked)
  const lockedBadges = badges.filter(badge => !badge.unlocked)

  const getRarityVariant = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'common'
      case 'uncommon': return 'uncommon'
      case 'rare': return 'rare'
      case 'epic': return 'epic'
      case 'legendary': return 'legendary'
      case 'mythic': return 'mythic'
      default: return 'default'
    }
  }

  const getLevelColor = (color: string) => {
    switch (color) {
      case 'purple': return 'text-purple-600 bg-purple-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'blue': return 'text-blue-600 bg-blue-100'
      case 'green': return 'text-green-600 bg-green-100'
      case 'orange': return 'text-orange-600 bg-orange-100'
      case 'gray': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Level Display */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getLevelColor(level.color)}`}>
              Nivel {level.level}
            </div>
            <span className="text-lg">{level.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {totalClaims} Claims
          </div>
          <p className="text-sm text-gray-600 mt-1">
            ¡Sigue reclamando tokens para desbloquear más badges!
          </p>
        </CardContent>
      </Card>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Badges Desbloqueados ({unlockedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <h3 className="font-semibold text-green-800">{badge.name}</h3>
                      <Badge variant={getRarityVariant(badge.rarity)} className="text-xs">
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">{badge.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Badges Bloqueados ({lockedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl opacity-50">{badge.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-600">{badge.name}</h3>
                      <Badge variant="locked" className="text-xs">
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{badge.description}</p>
                  {badge.progress !== undefined && badge.target && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progreso</span>
                        <span>{badge.progress}/{badge.target}</span>
                      </div>
                      <Progress 
                        value={(badge.progress / badge.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {badges.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              ¡Comienza tu colección!
            </h3>
            <p className="text-gray-500">
              Reclama tu primer token para desbloquear tu primer badge.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
