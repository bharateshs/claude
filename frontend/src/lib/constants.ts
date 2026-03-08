export const PLATFORM_CONFIG = {
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    gradient: ['#833AB4', '#E1306C', '#F77737'],
    icon: '📸',
    bgClass: 'from-purple-600 to-pink-500',
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    gradient: ['#1877F2', '#42B3FF'],
    icon: '👥',
    bgClass: 'from-blue-600 to-blue-400',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    gradient: ['#0A66C2', '#0084BF'],
    icon: '💼',
    bgClass: 'from-blue-800 to-blue-600',
  },
  twitter: {
    label: 'X / Twitter',
    color: '#000000',
    gradient: ['#14171A', '#657786'],
    icon: '🐦',
    bgClass: 'from-gray-900 to-gray-700',
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    gradient: ['#FF0000', '#FF4444'],
    icon: '▶️',
    bgClass: 'from-red-600 to-red-400',
  },
};

export const METRIC_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  reach: 'Reach',
  engagement: 'Engagement',
  followers: 'Followers',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  clicks: 'Clicks',
  video_views: 'Video Views',
};

export const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
];

export const formatNumber = (n: number | null | undefined): string => {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export const formatCurrency = (n: number | null | undefined): string => {
  if (n == null) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
};

export const formatPercent = (n: number | null | undefined): string => {
  if (n == null) return '0%';
  return `${n.toFixed(1)}%`;
};
