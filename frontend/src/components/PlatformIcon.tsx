import React from 'react'; // eslint-disable-line

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
}

const icons: Record<string, React.FC<{ size: number }>> = {
  instagram: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="17.5" cy="6.5" r="1" fill="white" />
    </svg>
  ),
  facebook: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#1877F2" />
      <path d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z" fill="white" />
    </svg>
  ),
  linkedin: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path d="M7 10h2v7H7v-7zm1-3a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 8 7zm4 3h2v1h.03C14.5 10.4 15.4 10 16.5 10c2.2 0 2.5 1.5 2.5 3.4V17h-2v-3c0-.8 0-2-1.2-2-1.3 0-1.5 1-1.5 2v3h-2v-7z" fill="white" />
    </svg>
  ),
  twitter: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#000" />
      <path d="M18 6 13.5 11.5 18.5 18h-3l-3.5-4.5L8 18H5l4.7-5.5L5 6h3l3.2 4.1L16 6h2z" fill="white" />
    </svg>
  ),
  youtube: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#FF0000" />
      <path d="M20 8s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C15.2 5 12 5 12 5s-3.2 0-5.2.1c-.4.1-1.3.1-2 .9-.6.6-.8 2-.8 2S4 9.6 4 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.7.8 1.7.7 2.1.8C8.4 19 12 19 12 19s3.2 0 5.2-.1c.4-.1 1.3-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C20.2 9.6 20 8 20 8zm-11 6V10l5.5 2-5.5 2z" fill="white" />
    </svg>
  ),
};

export default function PlatformIcon({ platform, size = 24, className = '' }: PlatformIconProps) {
  const Icon = icons[platform.toLowerCase()];
  if (!Icon) return <span className={className} style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.75 }}>📊</span>;
  return (
    <span className={`inline-flex ${className}`}>
      <Icon size={size} />
    </span>
  );
}
