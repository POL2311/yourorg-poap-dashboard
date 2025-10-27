import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useAuth } from '../../hooks/useAuth'
import { Crown, Zap, Building, Check, ArrowRight } from 'lucide-react'

interface SubscriptionStatusProps {
  user?: any
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ user: propUser }) => {
  const { user } = useAuth()
  const userData = propUser || user

  if (!userData) {
    return null
  }

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          name: 'Free',
          icon: <Zap className="w-4 h-4" />,
          color: 'bg-gray-500',
          badgeVariant: 'secondary' as const,
          limit: 100,
          features: ['100 POAPs/month', 'Basic analytics', 'Standard support'],
        }
      case 'pro':
        return {
          name: 'Pro',
          icon: <Crown className="w-4 h-4" />,
          color: 'bg-blue-500',
          badgeVariant: 'default' as const,
          limit: 1000,
          features: ['1,000 POAPs/month', 'Advanced analytics', 'Custom branding', 'Priority support'],
        }
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: <Building className="w-4 h-4" />,
          color: 'bg-purple-500',
          badgeVariant: 'default' as const,
          limit: 10000,
          features: ['10,000+ POAPs/month', 'White-label solution', 'Dedicated support', 'Custom integrations'],
        }
      default:
        return {
          name: 'Unknown',
          icon: <Zap className="w-4 h-4" />,
          color: 'bg-gray-500',
          badgeVariant: 'secondary' as const,
          limit: 0,
          features: [],
        }
    }
  }

  const tierInfo = getTierInfo(userData.tier)
  const usagePercentage = (userData.usedPOAPsThisMonth / userData.monthlyPOAPLimit) * 100
  const isNearLimit = usagePercentage > 80
  const isOverLimit = usagePercentage > 100

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription Status</CardTitle>
          <Badge variant={tierInfo.badgeVariant} className="flex items-center gap-1">
            {tierInfo.icon}
            {tierInfo.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>POAPs this month</span>
            <span className={isOverLimit ? 'text-red-600 font-medium' : isNearLimit ? 'text-yellow-600 font-medium' : ''}>
              {userData.usedPOAPsThisMonth.toLocaleString()} / {userData.monthlyPOAPLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverLimit 
                  ? 'bg-red-500' 
                  : isNearLimit 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {isOverLimit && (
            <p className="text-xs text-red-600">
              ⚠️ You've exceeded your monthly limit. Upgrade to continue.
            </p>
          )}
          {isNearLimit && !isOverLimit && (
            <p className="text-xs text-yellow-600">
              ⚠️ You're approaching your monthly limit.
            </p>
          )}
        </div>

        {/* Current Plan Features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Current Plan Features</h4>
          <ul className="space-y-1">
            {tierInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3 h-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Account Info */}
        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Account created</span>
            <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Last login</span>
            <span>{new Date(userData.lastLoginAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Upgrade CTA */}
        {userData.tier !== 'enterprise' && (
          <div className="pt-2">
            <Button 
              className="w-full" 
              variant={isOverLimit ? "default" : "outline"}
              size="sm"
            >
              {isOverLimit ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </>
              ) : (
                <>
                  Upgrade Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* API Key Preview */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">API Key</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              View
            </Button>
          </div>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1 truncate">
            {userData.apiKey}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}