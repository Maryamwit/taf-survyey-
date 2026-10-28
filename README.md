# Welcome to this project

## Development

Prefer working locally? You need Node.js and npm — [install with nvm]

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Supabase setup

Connect the project to Supabase before using online survey submission or admin features. The app needs `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; for local Vite development, use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not use a service-role key in the browser.

Without these settings, the survey can still be filled out, saved on the current device, and printed, but it cannot be submitted online or use admin features.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
