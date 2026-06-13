import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element representing the new hand-drawn organic logo
      <div
        style={{
          background: '#F8F8F6',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%', // Premium organic squircle shape
          border: '14px solid #E8E8E8', // Soft border frame
        }}
      >
        <svg
          width="360"
          height="360"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#111111"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Double sketched circle with organic imperfections */}
          <path 
            d="M 50 8 C 73 7, 92 23, 90 49 C 88 74, 73 92, 48 91 C 24 90, 8 74, 10 49 C 12 25, 27 9, 50 8 Z" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <path 
            d="M 49 13 C 68 12, 85 27, 83 49 C 81 70, 68 85, 49 84 C 30 83, 16 70, 18 49 C 20 30, 31 14, 49 13 Z" 
            strokeWidth="1.8" 
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Sketched Lightning Bolt */}
          <path 
            d="M 54 26 L 36 53 L 48 53 L 42 74 L 62 45 L 50 45 Z" 
            fill="#111111"
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
