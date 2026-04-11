import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1rem",
        lg: "1.25rem",
        xl: "1.25rem",
        "2xl": "1.25rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '0.75rem',   // 12px
        'base': '1rem',    // 16px
        'lg': '1.25rem',   // 20px
        'xl': '1.5rem',    // 24px
        '2xl': '2rem',    // 32px
        '3xl': '2.5rem',  // 40px
        '4xl': '3rem',    // 48px
        'macos': '8px',
        'macos-lg': '16px',
        'macos-xl': '24px'
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.45' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.55' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.15' }],
        '5xl': ['3rem', { lineHeight: '1.05' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        zinc: {
          '50': '#fafafa',
          '100': '#f4f4f5',
          '200': '#e4e4e7',
          '300': '#d4d4d8',
          '400': '#a1a1aa',
          '500': '#71717a',
          '600': '#52525b',
          '700': '#3f3f46',
          '800': '#27272a',
          '900': '#18181b',
          '950': '#09090b',
        },
        supabase: {
          black: 'var(--bg-default)',
          dark: 'var(--bg-surface)',
          border: 'var(--border-default)',
          hover: 'var(--bg-surface-hover)',
          text: {
            main: 'var(--text-primary)',
            muted: 'var(--text-muted)'
          }
        },
        navy: {
          start: '#1e40af',
          end: '#3b82f6'
        },
        macos: {
          blue: {
            '50': '#1e293b',
            '100': '#1e40af',
            '500': '#1e40af',
            '600': '#1e3a8a',
            '900': '#172554'
          },
          gray: {
            '50': 'var(--bg-default)',
            '100': 'var(--bg-surface)',
            '200': 'var(--border-default)',
            '300': 'var(--border-hover)',
            '400': 'var(--text-muted)',
            '500': 'var(--text-secondary)',
            '800': 'var(--text-primary)',
            '900': 'var(--text-primary)'
          }
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          '50': '#1e293b',
          '500': '#1e40af',
          '600': '#1e3a8a',
          '700': '#172554',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          '50': '#1c1917',
          '500': '#a855f7',
          '600': '#9333ea',
          '700': '#7c3aed',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          '50': 'rgba(250, 250, 250, 0.5)',
          '100': 'rgba(244, 244, 245, 0.3)',
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-xl, 12px)",
        '2xl': "var(--radius-2xl, 16px)",
        '3xl': "var(--radius-3xl, 32px)",
        macos: '12px',
        'macos-lg': '16px',
        'macos-xl': '20px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'zinc': '0 4px 24px -1px rgba(0, 0, 0, 0.03), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'zinc-lg': '0 10px 32px -4px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        macos: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
        'macos-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.06)',
        'macos-xl': '0 12px 48px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08)',
        'macos-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
        'macos-focus': '0 0 0 3px rgba(13, 126, 255, 0.2)'
      },
      backdropBlur: {
        xs: '2px',
        macos: '20px',
        'macos-lg': '40px'
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' }
        },
        tooltip: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-out': 'scaleOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        tooltip: 'tooltip 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 2s linear infinite'
      },
      fontFamily: {
        'thai': ['var(--font-thai)', 'sans-serif'],
        'sans': ['var(--font-dm-sans)', 'var(--font-ibm-plex-sans-thai)', 'Segoe UI', 'sans-serif'],
        'mono': ['"SF Mono"', 'Monaco', '"Cascadia Code"', '"Roboto Mono"', 'Consolas', '"Courier New"', 'monospace']
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
