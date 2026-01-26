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
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 300,
          background: 'linear-gradient(to bottom right, #000000, #111111)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%', // iOSish squircle
          border: '10px solid #333',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(to right, #D652FF, #CEFF1A)',
            backgroundClip: 'text',
            color: 'transparent',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            marginBottom: 20
          }}
        >
          S
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
