export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontSize: {
        'xs-mobile': ['0.688rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.813rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['0.875rem', { lineHeight: '1.375rem' }],
      },
      keyframes: {
        dropdown: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
      },
      animation: {
        dropdown: 'dropdown 0.2s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        slideInUp: 'slideInUp 0.3s ease-out'
      }
    },
  },
  plugins: [],
}