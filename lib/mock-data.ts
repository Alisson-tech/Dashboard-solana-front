import type { Bounty, Submission, ActivityItem, DashboardStats } from '@/types/bounty'

export const mockBounties: Bounty[] = [
  {
    id: '1',
    title: 'Apex Legends Insane Clips',
    hostName: 'SolCuts HQ',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeBxXGfjNrxWckRKGfaK6fqhizpFWzzuJETbzEcPFE41Zz12mz27uIXnd90ji1mtSwCeMJu7PdyOjo0_FSxEfMzsajRklIV0tSsAGHC92QaWlUpD-OW-yPqbwdpTbuF-FpaWHPZYN9_GxMRqeX5DoSqVYpSpC4p9yhpSxKtbHL_y5XTsQCH2Vc9jLSXgapd8gZV3SY6oupQS1bj8w8f3hKdRBniUr2iSTqobX8-EFp1yIgbYsrctWhaS6mQ1YexNow1j4P_a8MoFB7',
    hashtag: 'ApexClips',
    prizePool: 50.0,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    totalClips: 422,
    status: 'active',
    videoUrl: 'https://youtube.com/watch?v=example1',
    category: 'gaming',
    description: 'Submeta seus melhores clips de Apex Legends e ganhe SOL!',
  },
  {
    id: '2',
    title: 'Web3 Education Thread',
    hostName: 'SolCuts HQ',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeBxXGfjNrxWckRKGfaK6fqhizpFWzzuJETbzEcPFE41Zz12mz27uIXnd90ji1mtSwCeMJu7PdyOjo0_FSxEfMzsajRklIV0tSsAGHC92QaWlUpD-OW-yPqbwdpTbuF-FpaWHPZYN9_GxMRqeX5DoSqVYpSpC4p9yhpSxKtbHL_y5XTsQCH2Vc9jLSXgapd8gZV3SY6oupQS1bj8w8f3hKdRBniUr2iSTqobX8-EFp1yIgbYsrctWhaS6mQ1YexNow1j4P_a8MoFB7',
    hashtag: 'Web3Education',
    prizePool: 120.0,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    totalClips: 1205,
    status: 'active',
    videoUrl: 'https://youtube.com/watch?v=example2',
    category: 'education',
    description: 'Crie conteudo educativo sobre Web3 e Solana.',
  },
  {
    id: '3',
    title: 'Comedy Roast Highlights',
    hostName: 'SolCuts HQ',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeBxXGfjNrxWckRKGfaK6fqhizpFWzzuJETbzEcPFE41Zz12mz27uIXnd90ji1mtSwCeMJu7PdyOjo0_FSxEfMzsajRklIV0tSsAGHC92QaWlUpD-OW-yPqbwdpTbuF-FpaWHPZYN9_GxMRqeX5DoSqVYpSpC4p9yhpSxKtbHL_y5XTsQCH2Vc9jLSXgapd8gZV3SY6oupQS1bj8w8f3hKdRBniUr2iSTqobX8-EFp1yIgbYsrctWhaS6mQ1YexNow1j4P_a8MoFB7',
    hashtag: 'ComedyRoast',
    prizePool: 15.5,
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000),
    totalClips: 89,
    status: 'active',
    videoUrl: 'https://youtube.com/watch?v=example3',
    category: 'entertainment',
    description: 'Os melhores momentos de comedy roasts.',
  },
  {
    id: '4',
    title: 'The Great Migration Clips',
    hostName: 'SolCuts HQ',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeBxXGfjNrxWckRKGfaK6fqhizpFWzzuJETbzEcPFE41Zz12mz27uIXnd90ji1mtSwCeMJu7PdyOjo0_FSxEfMzsajRklIV0tSsAGHC92QaWlUpD-OW-yPqbwdpTbuF-FpaWHPZYN9_GxMRqeX5DoSqVYpSpC4p9yhpSxKtbHL_y5XTsQCH2Vc9jLSXgapd8gZV3SY6oupQS1bj8w8f3hKdRBniUr2iSTqobX8-EFp1yIgbYsrctWhaS6mQ1YexNow1j4P_a8MoFB7',
    hashtag: 'GreatMigration',
    prizePool: 25.5,
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000 + 48 * 60 * 1000),
    totalClips: 142,
    status: 'active',
    videoUrl: 'https://youtube.com/watch?v=example4',
    category: 'social',
    description: 'Viral Clip Challenge #42',
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: '1',
    bountyId: '4',
    clipperAddress: 'So1Sn1p3r...x4kL',
    clipperName: '@SolSniper',
    clipperAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB15R_39Bfe4UaJ1t--amQLz3jznOaBe6NM4nxck_AgqqoMZ4K_i5q3Z5CN1tukLVe506TbPQ1PuWcBaa_LXcaTsH9Lc2QRx40yHswsiCwtuRx_BWijHkarpUM7TFc14TTLBFiGruUvCbA-_9ZASA_EPK_Ejfz8XvNUaLwhJExSPVY1SDb9yg421_ItyH6wKzPZz0x_BzqdBg3W8VMuyqHFChAFaU_fwmHDBuw4MfjbTuU4oLbx1V4ZecY8O1I7zx_GG2s0wL6mg8QL',
    videoUrl: 'https://tiktok.com/@solsniper/video/123',
    views: 482000,
    likes: 42000,
    comments: 1500,
    engagementScore: 98.4,
    qualityMultiplier: 1.2,
    rank: 1,
    earnings: 12.75,
    submittedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '2',
    bountyId: '4',
    clipperAddress: 'CrYpT0Qu33n...y7zM',
    clipperName: '@Crypto_Queen',
    clipperAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX2sPd8fqZynhkqyNnB7IzpXFwGTAfSk03tUHS4n2apKLk1eK9nmvG0r1tmmMM1F5xFiEjXdF2KWt7Ye_0iwogBOn1Tfy9rqi0U_YJwEEhFuRL4gBTNFOxtxXLcFK7tL9uDsOFAKlJu9yZpqKZj5gH8EVVMqoT7443Mxug25c53YzbJ8pcytoCJCmEM-MvPT63_387lWr7XfVsC1w6cZ92P-WS_tXDHaWUeL4UlOYHak2sEtZlqwIrr9IChFgMa2IjlqTpVM4uBc67',
    videoUrl: 'https://tiktok.com/@cryptoqueen/video/456',
    views: 315000,
    likes: 28000,
    comments: 980,
    engagementScore: 82.1,
    qualityMultiplier: 1.1,
    rank: 2,
    earnings: 7.65,
    submittedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '3',
    bountyId: '4',
    clipperAddress: 'B0unTyHuNt3r...k2pQ',
    clipperName: '@BountyHunterX',
    clipperAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-e4R4utmMqngWw88HICWxsO1c3KT27pXrjfvwgu28IueBN-FcFzR_YeQdRxv7FyqMIciHn1jJ8OMSRmI7aJ4myaepBd1icNYdXv5JeKldfENlnoa213C3knzTQXxR8a2sx0lv7gINwLE4cFiVb5XObB8N9R-w3c--mFJc8QoHnCeVTOo7XLOqiOCT1x19xq57JLmu7wZA1_alysP961C-xJBwX1ELbhkCu_O3YveFkZ4-JkV7PiD9VHgPxVVG2lcEdH3w8lH72J9W',
    videoUrl: 'https://tiktok.com/@bountyhunterx/video/789',
    views: 290000,
    likes: 22000,
    comments: 750,
    engagementScore: 75.8,
    qualityMultiplier: 1.0,
    rank: 3,
    earnings: 5.1,
    submittedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '4',
    bountyId: '4',
    clipperAddress: 'M00nM1ss10n...p8rL',
    clipperName: '@MoonMission',
    clipperAvatar: '',
    videoUrl: 'https://tiktok.com/@moonmission/video/012',
    views: 140000,
    likes: 12000,
    comments: 420,
    engagementScore: 42.4,
    qualityMultiplier: 1.0,
    rank: 4,
    earnings: 0,
    submittedAt: new Date(Date.now() - 45 * 60 * 1000),
  },
]

export const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'submission',
    title: '@clippermaster submitted a video',
    description: '"Check out this 360-no-scope with the Kraber!"',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYnYdXEohghXHwVZDPKfE_yvZSEHXxi9xQaYWXCu3H4zpBdndBrNGQXVhDd863UBd-dYVaIY5LtrsTcth2JaRPmf7G5qMIe4NKwGPJd3SpnyQzbno8oBwhv71JMIF6z88sA7EPR165KwqusNlzWdan2yOHBQP6EZoA3aDLTbN-NPRTGVA8gyFmmbRSIGj-ywpCtp2RLV8WPw54V8FHCZns94yzf4Vh0OOwZMV51U4-5Aq4WxBNUNR96uTyMkIC9Ifwiu2szgHmhpLD',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    bountyTitle: 'Apex Legends Challenge',
  },
  {
    id: '2',
    type: 'claim',
    title: 'Reward Claimed',
    description: '@sol_clipper claimed reward',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqqSZ0RE3NbeD28YkJK-mxJdGl4gX5TpB6s2o_VTsqh7gvL8ZYZwtiymjbyRUEkZwmOSSXBXpM2p3cUGUkLMOqa3PNqEIr2v9uySz7s0dPcGKdpWQqIkxX_h0Ve6culzFW21MfCR4tQ9WuTOvirngq0EKV8KcOfjnnRVSSqkDidviUip3tmKrkzWADbK9yU8YBKvqanho7Cpq6d_7wrDNrxFe-D39psqWTB1UPjiCSFqm3k0kqcW6lo-11KhuvyyJBgbld5snObgSv',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    amount: 4.2,
  },
  {
    id: '3',
    type: 'comment',
    title: '@nova_clips left a question',
    description: 'Question on Web3 Education Thread',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOn6sPiv_3Zj3WqFnN5y6MALz8iQZtRenTwJiZWJPMK-Dt_pK7p6MSkOq4LClyd4D6jXOA9_WIM-9YrySy-8LylP_i9wFnRYK_C1-6r6elTozhciCxo9BrE9LfjEVLLbLK7QwLqns2ycdV4QvYtWo3-joGFoz1QikvUyNvZ_f_pdjgAyGBQcdIhYfu8_sW7v15DHftjMgBKyRqtwVD4o3aA5lCis9K2RwEn8HDZlOlVC_NYr_s7MMMB9dJlPuIDtnq2RiJb1iTS-Sq',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    bountyTitle: 'Web3 Education Thread',
  },
  {
    id: '4',
    type: 'bounty_created',
    title: 'New Bounty Created',
    description: 'Podcast Snippet King',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
]

export const mockDashboardStats: DashboardStats = {
  totalSolLocked: 1248.5,
  activeChallenges: 14,
  totalSubmissions: 8432,
  uniqueClippers: 942,
  solChange: 12.5,
  endingSoonCount: 4,
}

export function formatTimeLeft(deadline: Date): string {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export function getCategoryColor(category: Bounty['category']): string {
  const colors = {
    gaming: 'bg-secondary/10 text-secondary',
    social: 'bg-tertiary/10 text-tertiary',
    entertainment: 'bg-primary/10 text-primary',
    education: 'bg-tertiary/10 text-tertiary',
    other: 'bg-outline/10 text-outline',
  }
  return colors[category]
}
