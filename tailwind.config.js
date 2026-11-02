const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: v('brand'),
          strong: v('brand-strong'),
          ink: v('brand-ink'),
        },
        ink: v('ink'),
        cream: v('cream'),
        surface: v('surface'),
        line: v('line'),
        muted: v('muted'),
        mustard: v('mustard'),
        veg: v('veg'),
        nonveg: v('nonveg'),
        success: v('success'),
        warning: v('warning'),
        danger: v('danger'),
        info: v('info'),
        night: {
          DEFAULT: v('night'),
          raised: v('night-raised'),
          line: v('night-line'),
          muted: v('night-muted'),
          dine: v('night-dine'),
        },
      },
      fontFamily: {
        display: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
};
