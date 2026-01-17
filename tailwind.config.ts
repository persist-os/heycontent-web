import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";
import tailwindScrollbar from "tailwind-scrollbar";

const config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		typography: {
  			DEFAULT: {
  				css: {
  					'--tw-prose-body': 'hsl(var(--foreground))',
  					'--tw-prose-headings': 'hsl(var(--foreground))',
  					'--tw-prose-links': 'hsl(var(--primary))',
  					'--tw-prose-bold': 'hsl(var(--foreground))',
  					'--tw-prose-counters': 'hsl(var(--muted-foreground))',
  					'--tw-prose-bullets': 'hsl(var(--muted-foreground))',
  					'--tw-prose-quotes': 'hsl(var(--foreground))',
  					'--tw-prose-code': 'hsl(var(--foreground))',
  					'--tw-prose-hr': 'hsl(var(--border))',
  					'--tw-prose-th-borders': 'hsl(var(--border))',
  					'--tw-prose-td-borders': 'hsl(var(--border))',
  				},
  			},
  			invert: {
  				css: {
  					'--tw-prose-body': 'hsl(var(--foreground))',
  					'--tw-prose-headings': 'hsl(var(--foreground))',
  					'--tw-prose-links': 'hsl(var(--primary))',
  					'--tw-prose-bold': 'hsl(var(--foreground))',
  					'--tw-prose-counters': 'hsl(var(--muted-foreground))',
  					'--tw-prose-bullets': 'hsl(var(--muted-foreground))',
  					'--tw-prose-quotes': 'hsl(var(--foreground))',
  					'--tw-prose-code': 'hsl(var(--foreground))',
  					'--tw-prose-hr': 'hsl(var(--border))',
  					'--tw-prose-th-borders': 'hsl(var(--border))',
  					'--tw-prose-td-borders': 'hsl(var(--border))',
  				},
  			},
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',           // Uses CSS variable - deep navy blue in light, bright blue in dark
				foreground: 'hsl(var(--primary-foreground))',        // Uses CSS variable - white in light, dark blue in dark
			},
  			secondary: {
  				DEFAULT: '#FFA312',           // Aldebaran - Brand orange
  				foreground: '#472A00',        // S0 dark - Dark brown (for text on secondary)
  				light: '#FFB963',             // S80 - Light amber
  				dark: '#F09700',              // S70 - Darker orange
  				darker: '#472A00'             // S0 dark - Darkest brown
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			heycontext: {
  				yellow: '#FFDF39',
  				purple: '#9046FF',
  				green: '#45E290',
  				'light-yellow': 'hsl(var(--light-yellow))',
  				'light-purple': 'hsl(var(--light-purple))',
  				'light-green': 'hsl(var(--light-green))'
  			},
  			text: {
  				gray: 'hsl(var(--gray-text))',
  				dark: 'hsl(var(--dark-text))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'bounce-delay-1': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-15%)' }
  			},
  			'bounce-delay-2': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-15%)' }
  			},
  			'bounce-delay-3': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-15%)' }
  			},
  			'pulse-slow': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.7' }
  			},
  			'shine': {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'bounce-delay-1': 'bounce-delay-1 1.2s infinite ease-in-out',
  			'bounce-delay-2': 'bounce-delay-2 1.2s infinite ease-in-out 0.25s',
  			'bounce-delay-3': 'bounce-delay-3 1.2s infinite ease-in-out 0.5s',
  			'pulse-slow': 'pulse-slow 2s infinite ease-in-out',
  			'shine': 'shine 2s infinite ease-in-out'
  		}
  	}
  },
  plugins: [tailwindcssAnimate, tailwindcssTypography, tailwindScrollbar],
} satisfies Config;

export default config;
