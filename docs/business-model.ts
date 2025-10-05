// Business Model Configuration
export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    monthlyPOAPs: 100,
    features: [
      'Up to 100 POAPs per month',
      'Basic templates',
      'Standard widget',
      'Basic analytics',
      'Email support'
    ],
    limitations: [
      'POAP Infrastructure branding',
      'No custom domain',
      'Limited customization'
    ]
  },
  
  PRO: {
    name: 'Pro',
    price: 29,
    monthlyPOAPs: 1000,
    features: [
      'Up to 1,000 POAPs per month',
      'Custom branding',
      'Advanced widgets',
      'Detailed analytics',
      'Email & chat support',
      'QR code generation',
      'Whitelist management',
      'Export data'
    ],
    popular: true
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99,
    monthlyPOAPs: 10000,
    features: [
      'Up to 10,000 POAPs per month',
      'White-label solution',
      'Custom domain',
      'Advanced analytics & insights',
      'Priority support',
      'API access',
      'Bulk operations',
      'Custom integrations',
      'Dedicated account manager'
    ]
  },
  
  CUSTOM: {
    name: 'Custom',
    price: 'Contact us',
    monthlyPOAPs: 'Unlimited',
    features: [
      'Unlimited POAPs',
      'Full white-label',
      'Custom development',
      'On-premise deployment',
      'SLA guarantees',
      'Custom integrations',
      'Dedicated infrastructure'
    ]
  }
};

export const REVENUE_PROJECTIONS = {
  // Conservative estimates
  year1: {
    freeUsers: 1000,
    proUsers: 50,
    enterpriseUsers: 5,
    monthlyRevenue: 50 * 29 + 5 * 99, // $1,945/month
    annualRevenue: 23340
  },
  
  year2: {
    freeUsers: 5000,
    proUsers: 200,
    enterpriseUsers: 20,
    monthlyRevenue: 200 * 29 + 20 * 99, // $7,780/month
    annualRevenue: 93360
  },
  
  year3: {
    freeUsers: 15000,
    proUsers: 500,
    enterpriseUsers: 50,
    monthlyRevenue: 500 * 29 + 50 * 99, // $19,450/month
    annualRevenue: 233400
  }
};

export const TARGET_MARKETS = {
  primary: [
    'Web3 conferences and events',
    'Gaming communities',
    'Educational institutions',
    'Corporate events',
    'Art and culture events'
  ],
  
  secondary: [
    'Sports events',
    'Music festivals',
    'Meetup organizers',
    'Online communities',
    'Certification programs'
  ]
};

export const COMPETITIVE_ADVANTAGES = [
  'Gasless minting (users pay $0)',
  'Solana-based (fast & cheap)',
  'Easy integration (embeddable widgets)',
  'Multi-tenant SaaS platform',
  'Real-time analytics',
  'Custom branding options',
  'Developer-friendly API',
  'Scalable infrastructure'
];