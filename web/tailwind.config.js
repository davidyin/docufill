/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        docufill: {
          orange: '#FF6A1A',
          yellow: '#FFB000',
          red: '#FF2D2D',
        },
        confidence: {
          high: '#00E869',
          medium: '#FFB000',
          low: '#FF2D2D',
        },
        bg: {
          primary: '#0A0A0C',
          secondary: '#121214',
          elevated: '#141416',
          card: '#1E1E22',
          slate: '#2A2A30',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.1)',
          active: 'rgba(255,106,26,0.3)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.6)',
          tertiary: 'rgba(255,255,255,0.38)',
          disabled: 'rgba(255,255,255,0.24)',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', '-apple-system', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scan': 'scan 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,106,26,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255,106,26,0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    }
  },
  plugins: []
};
