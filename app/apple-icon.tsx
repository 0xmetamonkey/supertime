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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 100,
            height: 100,
          }}
        >
          {/* Signal Waves */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                width: 40 + i * 30,
                height: 40 + i * 30,
                borderTop: `${10 - i * 2}px solid #CEFF1A`,
                borderRadius: '50%',
                opacity: 1 - (i * 0.2),
              }}
            />
          ))}
          {/* Base Dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              width: 20,
              height: 20,
              background: '#D652FF',
              borderRadius: '50%',
              boxShadow: '0 0 10px #D652FF',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
