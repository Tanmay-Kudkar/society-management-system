/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          overlay: 'var(--bg-overlay)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          light: 'var(--border-light)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          light: 'var(--accent-light)',
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 0 rgba(0,0,0,0.5)',
        'sm': '0 1px 3px rgba(0,0,0,0.5)',
        'md': '0 3px 6px rgba(0,0,0,0.4)',
        'lg': '0 8px 24px rgba(0,0,0,0.5)',
        'xl': '0 12px 28px rgba(0,0,0,0.5)',
        '2xl': '0 16px 48px rgba(0,0,0,0.6)',
        'glow-subtle': '0 0 12px rgba(47, 129, 247, 0.08)',
        'glow-card': '0 0 20px rgba(47, 129, 247, 0.06)',
        'glow-accent': '0 0 16px rgba(47, 129, 247, 0.15)',
      },
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'modal-backdrop': '300',
        'modal': '400',
        'tooltip': '500',
        'toast': '600',
      },
      transitionDuration: {
        'fast': '80ms',
        'normal': '150ms',
        'slow': '250ms',
      },
      keyframes: {
        mesh: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(28px, -20px) scale(1.08)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-140%)' },
          '100%': { transform: 'translateX(160%)' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0)' },
          '50%': { boxShadow: '0 0 0 5px rgba(37, 99, 235, 0.12)' },
        },
      },
      animation: {
        'mesh-slow': 'mesh 12s ease-in-out infinite',
        shimmer: 'shimmer 2.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'pulse-blue': 'pulseBlue 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
