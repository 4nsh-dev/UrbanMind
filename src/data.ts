import { Issue, Achievement, LeaderboardUser } from './types';

export const INITIAL_STATS = {
  reported: 342,
  resolved: 289,
  volunteers: 1250,
  impactScore: 94, // Out of 100
};

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'issue-1',
    title: 'Severe Pothole on Left Lane',
    description: 'A deep, dangerous pothole has developed on the left lane of El Camino Real, right before the Oregon Expressway exit. Multiple cars have had to swerve or brake abruptly to avoid it, creating a major hazard.',
    category: 'pothole',
    status: 'verified',
    severity: 'high',
    lat: 37.7839,
    lng: -122.4012,
    locationName: 'El Camino Real & Oregon Expressway',
    imageUrl: 'https://images.unsplash.com/photo-1599740831119-94b15c9f518e?auto=format&fit=crop&q=80&w=400',
    reportedBy: 'Devon Keats',
    reporterId: 'user-02',
    reportedAt: '2026-06-22T14:30:00Z',
    upvotes: 38,
    downvotes: 1,
    comments: [
      {
        id: 'c-1',
        author: 'Marcus Vance',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Marcus',
        text: 'I hit this last night, absolutely massive hole! Glad someone logged it.',
        timestamp: '2026-06-22T15:05:00Z',
        reputationScore: 450,
        badge: 'Street Warden'
      },
      {
        id: 'c-2',
        author: 'Elena Rostova',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Elena',
        text: 'Upvoted and verified. It is right in the path when you merge lanes.',
        timestamp: '2026-06-22T16:10:00Z',
        reputationScore: 820,
        badge: 'Neighborhood Sage'
      }
    ],
    aiAnalysis: {
      categorySuggested: 'pothole',
      descriptionRefined: 'Primary asphalt degradation causing a deep pothole approximately 12 inches deep and 3 feet wide. High risk of tire damage and vehicle alignment disruption.',
      severityPrediction: 'high',
      urgencyScore: 85,
      resolutionEstimate: 'Approved for rapid cold-patch treatment within 24-48 hours.'
    },
    history: [
      {
        status: 'reported',
        timestamp: '2026-06-22T14:30:00Z',
        note: 'Reported by Citizen via Google Lens scan.',
        updatedBy: 'Devon Keats'
      },
      {
        status: 'verified',
        timestamp: '2026-06-22T16:15:00Z',
        note: 'Community verification threshold exceeded (10+ upvotes). Escalated to Public Works Dept.',
        updatedBy: 'Civic Engine AI'
      }
    ],
    verifications: [
      {
        id: 'v-1',
        issueId: 'issue-1',
        verifierName: 'Marcus Vance',
        verifierId: 'user-06',
        type: 'confirm',
        evidence: 'Confirming first-hand. Pothole is massive, hit it last night driving under 35mph.',
        distanceMeters: 45,
        reputationAtVerification: 450,
        createdAt: '2026-06-22T15:05:00Z'
      },
      {
        id: 'v-2',
        issueId: 'issue-1',
        verifierName: 'Elena Rostova',
        verifierId: 'user-07',
        type: 'confirm',
        evidence: 'Active danger. Saw two cars swerve around it this morning.',
        distanceMeters: 12,
        reputationAtVerification: 820,
        createdAt: '2026-06-22T16:10:00Z'
      }
    ],
    trustScore: 94
  },
  {
    id: 'issue-2',
    title: 'Overflowing Public Recycling Bin',
    description: 'The green communal recycling container next to Dolores Park entrance is completely overflowing. Plastic bottles, cardboard boxes, and soda cans are spilling onto the public sidewalk, attracting raccoons and blocking pedestrian clearance.',
    category: 'garbage',
    status: 'in_progress',
    severity: 'medium',
    lat: 37.7599,
    lng: -122.4269,
    locationName: 'Dolores Park Entrance (19th St)',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400',
    reportedBy: 'Chloe Mercer',
    reporterId: 'user-05',
    reportedAt: '2026-06-21T09:15:00Z',
    upvotes: 24,
    downvotes: 0,
    comments: [
      {
        id: 'c-3',
        author: 'Siddharth Roy',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Siddhart',
        text: 'This park gets incredibly busy over the weekend. They definitely need to optimize the collection frequency here.',
        timestamp: '2026-06-21T11:45:00Z',
        reputationScore: 320,
        badge: 'Park Guardian'
      }
    ],
    aiAnalysis: {
      categorySuggested: 'garbage',
      descriptionRefined: 'communal waste compartment filled past capacity. Litter overflow spreads into active pedestrian lanes, creating biological/safety concerns and public transit obstructions.',
      severityPrediction: 'medium',
      urgencyScore: 62,
      resolutionEstimate: 'Sanitation contractor notified. Pick-up scheduled.'
    },
    history: [
      {
        status: 'reported',
        timestamp: '2026-06-21T09:15:00Z',
        note: 'Reported by Citizen using visual categorizer.',
        updatedBy: 'Chloe Mercer'
      },
      {
        status: 'verified',
        timestamp: '2026-06-21T10:00:00Z',
        note: 'Validated by community review.',
        updatedBy: 'Community Mod'
      },
      {
        status: 'in_progress',
        timestamp: '2026-06-21T15:30:00Z',
        note: 'Sanitation dispatch crew assigned (Order Ref: #SAN-998A). Expected resolution: Monday morning.',
        updatedBy: 'Public Works Dispatch'
      }
    ],
    verifications: [
      {
        id: 'v-3',
        issueId: 'issue-2',
        verifierName: 'Siddharth Roy',
        verifierId: 'user-08',
        type: 'confirm',
        evidence: 'Still overflowing on my Sunday run. Need higher frequency bins.',
        distanceMeters: 8,
        reputationAtVerification: 320,
        createdAt: '2026-06-21T11:45:00Z'
      }
    ],
    trustScore: 82
  },
  {
    id: 'issue-3',
    title: 'Major Clean Water Pipe Leakage',
    description: 'A pressurized water main appears to have ruptured underground. Clean potable water is gushing up through a crack in the pavement on 4th & Mission St. It has been running continuously for at least three hours, flooding the crosswalk.',
    category: 'water_leak',
    status: 'reported',
    severity: 'critical',
    lat: 37.7854,
    lng: -122.4011,
    locationName: '4th & Mission Street Intersection',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
    reportedBy: 'Kofi Mensah',
    reporterId: 'user-03',
    reportedAt: '2026-06-23T06:45:00Z',
    upvotes: 61,
    downvotes: 0,
    comments: [
      {
        id: 'c-4',
        author: 'Alistair Vance',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alistair',
        text: 'This is flowing super fast! It is going to undermine the road foundation if they do not shut off the valve soon.',
        timestamp: '2026-06-23T07:15:00Z',
        reputationScore: 1100,
        badge: 'City Counsel'
      },
      {
        id: 'c-5',
        author: 'Linnea Lindqvist',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Linnea',
        text: 'Just reported to the Metropolitan Water Services. They said they have flagged it on our Urban Mind platform!',
        timestamp: '2026-06-23T07:30:00Z',
        reputationScore: 540,
        badge: 'Water Watcher'
      }
    ],
    aiAnalysis: {
      categorySuggested: 'water_leak',
      descriptionRefined: 'Pressurized water main failure. Gushing water flow rate of approximately 45 gallons/min. Flooding active vehicular lanes, posing hydroplaning risks and foundational erosion risks.',
      severityPrediction: 'critical',
      urgencyScore: 98,
      resolutionEstimate: 'Urgent emergency repair initiated. Utility shut-off crew dispatched with high-priority status.'
    },
    history: [
      {
        status: 'reported',
        timestamp: '2026-06-23T06:45:00Z',
        note: 'Urgent citizen report with live location tagging.',
        updatedBy: 'Kofi Mensah'
      }
    ],
    verifications: [],
    trustScore: 68
  },
  {
    id: 'issue-4',
    title: 'Flickering / Non-functional Streetlight',
    description: 'The streetlight on the corner of 24th and Noe Street is completely out, and the adjacent bulb has a rapid strobe/flicker. It makes this highly traversed intersection extremely dark, creating safety concerns for children and pets crossing.',
    category: 'broken_streetlight',
    status: 'resolved',
    severity: 'low',
    lat: 37.7516,
    lng: -122.4332,
    locationName: '24th St & Noe St Corner',
    imageUrl: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&q=80&w=400',
    reportedBy: 'Aisha Yusuf',
    reporterId: 'user-09',
    reportedAt: '2026-06-18T21:00:00Z',
    upvotes: 14,
    downvotes: 1,
    comments: [],
    aiAnalysis: {
      categorySuggested: 'broken_streetlight',
      descriptionRefined: 'Single luminaire bulb burned out, secondary lamp suffering from ballast failure causing intermittent strobe behavior. Low immediate structural risk but moderate evening pedestrian hazard.',
      severityPrediction: 'low',
      urgencyScore: 35,
      resolutionEstimate: 'Standard luminaire replacement work order assigned.'
    },
    history: [
      {
        status: 'reported',
        timestamp: '2026-06-18T21:00:00Z',
        note: 'Report filed during night watch patrol.',
        updatedBy: 'Aisha Yusuf'
      },
      {
        status: 'verified',
        timestamp: '2026-06-19T08:00:00Z',
        note: 'Community verified.',
        updatedBy: 'Civic Engine AI'
      },
      {
        status: 'in_progress',
        timestamp: '2026-06-20T10:00:00Z',
        note: 'Repair crew queued (Ref: #LUM-1102B).',
        updatedBy: 'City Lighting Dept'
      },
      {
        status: 'resolved',
        timestamp: '2026-06-22T11:45:00Z',
        note: 'High-efficiency LED bulb physical replacement complete. Live optical check successful.',
        updatedBy: 'Grid Technicians'
      }
    ],
    verifications: [
      {
        id: 'v-4',
        issueId: 'issue-4',
        verifierName: 'Devon Keats',
        verifierId: 'user-02',
        type: 'confirm',
        evidence: 'Confirming it is dark as a cave out here.',
        distanceMeters: 5,
        reputationAtVerification: 1200,
        createdAt: '2026-06-19T01:10:00Z'
      }
    ],
    trustScore: 98
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'First Responder',
    description: 'Submit your first community issue report.',
    icon: 'Radio',
    unlocked: true,
    progress: 1,
    maxProgress: 1,
    color: '#4285F4' // Google Blue
  },
  {
    id: 'ach-2',
    title: 'Civic Validator',
    description: 'Verify and upvote 5 authentic community issues reported by other citizens.',
    icon: 'ShieldCheck',
    unlocked: true,
    progress: 5,
    maxProgress: 5,
    color: '#34A853' // Google Green
  },
  {
    id: 'ach-3',
    title: 'Neighborhood Sentinel',
    description: 'Maintain a perfect report accuracy rating by filing verified issues.',
    icon: 'Activity',
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    color: '#FBBC05' // Google Yellow
  },
  {
    id: 'ach-4',
    title: 'Resolution Advocate',
    description: 'Provide comments that directly lead to issue resolutions.',
    icon: 'Award',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    color: '#EA4335' // Google Red
  },
  {
    id: 'ach-5',
    title: 'Water Keeper',
    description: 'Report or verify 3 pipe ruptures or drainage leaks.',
    icon: 'Droplet',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    color: '#4285F4'
  }
];

export const LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: 'user-01',
    name: 'Linnea Lindqvist',
    reputation: 1480,
    reportsCount: 18,
    verifiedCount: 42,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Linnea',
    rank: 1
  },
  {
    id: 'user-02',
    name: 'Michael Chen',
    reputation: 1195,
    reportsCount: 12,
    verifiedCount: 35,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Michael',
    rank: 2
  },
  {
    id: 'user-03',
    name: 'Sarah Jenkins',
    reputation: 980,
    reportsCount: 9,
    verifiedCount: 22,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah',
    rank: 3
  },
  {
    id: 'user-04',
    name: 'Kofi Mensah',
    reputation: 845,
    reportsCount: 11,
    verifiedCount: 18,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Kofi',
    rank: 4
  },
  {
    id: 'user-05',
    name: 'Chloe Mercer',
    reputation: 790,
    reportsCount: 8,
    verifiedCount: 15,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Chloe',
    rank: 5
  }
];

export const PREDICTIVE_CITY_ZONES = [
  { name: 'Mission District', riskScore: 82, majorConcern: 'Water Leakage', riskTrend: 'rising' as const, reportedLastMonth: 48 },
  { name: 'SoMa (South of Market)', riskScore: 68, majorConcern: 'Asphalt Degradation', riskTrend: 'falling' as const, reportedLastMonth: 35 },
  { name: 'Castro & Noe Valley', riskScore: 35, majorConcern: 'Street Lighting', riskTrend: 'stable' as const, reportedLastMonth: 12 },
  { name: 'Tenderloin', riskScore: 89, majorConcern: 'Refuse Overflow', riskTrend: 'rising' as const, reportedLastMonth: 64 },
  { name: 'Financial District', riskScore: 42, majorConcern: 'Infrastructure Aging', riskTrend: 'falling' as const, reportedLastMonth: 19 },
];
