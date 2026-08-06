import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AHW Architects',
    short_name: 'AHW Architects',
    description: 'Multidisciplinary architecture, interior design, and design-build fit-out practice serving Egypt, Kuwait, and the wider GCC.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F1115',
    theme_color: '#14171A',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
