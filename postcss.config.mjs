const config = {
  plugins: {
    '@tailwindcss/postcss': {
      content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
        './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
        './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
      ],
    },
  },
};

export default config;
