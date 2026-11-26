import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        mint: 'rgb(var(--mint) / <alpha-value>)',
        'mint-deep': 'rgb(var(--mint-deep) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
        amber: 'rgb(var(--amber) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Manrope', 'Aptos', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      maxWidth: {
        shell: '1440px',
        prose: '760px',
      },
      borderRadius: {
        hair: '2px',
        sharp: '4px',
        soft: '8px',
        panel: '12px',
      },
      boxShadow: {
        ledger: '0 1px 0 rgb(var(--ink) / 0.06), 0 12px 36px rgb(var(--ink) / 0.08)',
        lift: '0 18px 48px rgb(var(--ink) / 0.16)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        draw: {
          '0%': { strokeDashoffset: '280' },
          '100%': { strokeDashoffset: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        rise: 'rise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        draw: 'draw 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        blink: 'blink 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
