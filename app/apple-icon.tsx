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
        <div
          style={{
            background: 'linear-gradient(to right, #D652FF, #CEFF1A)',
            backgroundClip: 'text',
            color: 'transparent',
            fontWeight: 900,
            fontFamily: 'sans-serif',
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size }
  )
}
