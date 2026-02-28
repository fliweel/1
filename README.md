# Voyce - AV Channel Analytics Dashboard

A modern Next.js application for AV channel analytics and insights.

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then update `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── layout.tsx      # Root layout
├── page.tsx        # Home page
└── globals.css     # Global styles
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technologies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Supabase** - Backend & authentication
- **Tailwind CSS** - Styling (configured in globals.css)

## License

MIT
