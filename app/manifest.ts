import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Supertime Studio',
    short_name: 'Supertime',
    description: 'Get paid for your global time via video & audio calls.',
    start_url: '/studio',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['lifestyle', 'business', 'social'],
    screenshots: [
      {
        src: '/abstract_energy_bg.png', // Placeholder or real screenshot
        type: 'image/png',
        sizes: '664x664',
      }
    ]
  }
}
