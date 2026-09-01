/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#0c0e0c',
        surface: '#131714',
        raised: '#1a1f1b',
        moss: '#274a35',
        mosslight: '#325c43',
        brass: '#c2a373',
        bone: '#e4e8e5',
        ash: '#8d9690',
        line: '#212823',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      typography: () => ({
        stone: {
          css: {
            '--tw-prose-body': '#e4e8e5cc',
            '--tw-prose-headings': '#e4e8e5',
            '--tw-prose-lead': '#e4e8e5',
            '--tw-prose-links': '#c2a373',
            '--tw-prose-bold': '#e4e8e5',
            '--tw-prose-counters': '#8d9690',
            '--tw-prose-bullets': '#c2a373',
            '--tw-prose-hr': '#212823',
            '--tw-prose-quotes': '#e4e8e5',
            '--tw-prose-quote-borders': '#c2a373',
            '--tw-prose-captions': '#8d9690',
            '--tw-prose-code': '#e4e8e5',
            '--tw-prose-pre-code': '#e4e8e5',
            '--tw-prose-pre-bg': '#131714',
            '--tw-prose-th-borders': '#212823',
            '--tw-prose-td-borders': '#212823',
            fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            h1: { fontFamily: '"Cormorant Garamond", Georgia, serif' },
            h2: { fontFamily: '"Cormorant Garamond", Georgia, serif' },
            h3: { fontFamily: '"Cormorant Garamond", Georgia, serif' },
            h4: { fontFamily: '"Cormorant Garamond", Georgia, serif' },
            'a:hover': { color: '#e4e8e5' },
            img: { borderRadius: '0' },
          },
        },
      }),
    }
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
