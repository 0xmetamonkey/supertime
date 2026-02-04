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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 250,
            height: 250,
          }}
        >
          {/* Signal Waves */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                width: 100 + i * 80,
                height: 100 + i * 80,
                borderTop: `${25 - i * 4}px solid #CEFF1A`,
                borderRadius: '50%',
                opacity: 1 - (i * 0.2),
              }}
            />
          ))}
          {/* Base Dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              width: 50,
              height: 50,
              background: '#D652FF',
              borderRadius: '50%',
              boxShadow: '0 0 30px #D652FF',
            }}
          />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
