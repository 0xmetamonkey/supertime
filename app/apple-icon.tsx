import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D652FF" />
              <stop offset="100%" stopColor="#CEFF1A" />
            </linearGradient>
          </defs>
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="url(#gradient)"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
