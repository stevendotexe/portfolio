# Steven Simbolon — Portfolio (Next.js)

Personal portfolio of **Steven Simbolon**, rewritten as a [Next.js](https://nextjs.org) App Router project and ready to deploy on [Vercel](https://vercel.com).

> Interface. Outer Space.

## Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Plain CSS with design tokens (CSS custom properties)
- **Fonts:** [`next/font`](https://nextjs.org/docs/app/api-reference/components/font) — Plus Jakarta Sans + DM Serif Display
- **Images:** [`next/image`](https://nextjs.org/docs/app/api-reference/components/image) with AVIF/WebP
- **Deployment target:** Vercel (zero-config)

## Project structure

```
.
├── app/
│   ├── globals.css        # design tokens + section styles
│   ├── layout.tsx         # root layout, fonts, SEO metadata
│   └── page.tsx           # home page composition
├── components/
│   ├── Footer.tsx
│   ├── Navbar.tsx         # client component (scroll + mobile menu)
│   ├── Reveal.tsx         # scroll-reveal wrapper
│   ├── icons.tsx          # inline SVG icons
│   └── sections/
│       ├── About.tsx
│       ├── Certifications.tsx
│       ├── Contact.tsx
│       ├── Hero.tsx
│       ├── HeroStripes.tsx
│       ├── Projects.tsx
│       ├── SkillBar.tsx
│       └── Skills.tsx
├── lib/
│   └── data.ts            # projects / skills / nav data
├── public/                # static assets (images, favicon)
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Script         | Description                                |
| -------------- | ------------------------------------------ |
| `npm run dev`  | Start the local development server         |
| `npm run build`| Create a production build                  |
| `npm run start`| Run the production build locally           |
| `npm run lint` | Run ESLint with the Next.js preset         |

## Deploying to Vercel

This repo is zero-config for Vercel — it autodetects Next.js.

### Option 1 — Vercel CLI (recommended for first deploy)

```bash
npm i -g vercel
vercel        # preview deployment + project linking
vercel --prod # promote to production
```

### Option 2 — Git integration

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Accept defaults — Vercel will detect the Next.js framework and deploy.

### Environment variables (optional)

- `NEXT_PUBLIC_SITE_URL` — canonical site URL used for OG metadata. Defaults to `https://stevensimbolon.dev`.

Set it via the Vercel dashboard or `vercel env add NEXT_PUBLIC_SITE_URL`.

## Editing content

- **Projects, skills, certifications, nav items:** edit `lib/data.ts`.
- **Hero / About copy:** edit the respective components in `components/sections/`.
- **Colors, spacing, radii:** edit the CSS custom properties at the top of `app/globals.css`.
- **Images:** drop them in `public/` and reference them with an absolute path (e.g. `/frontpage.png`).

## License

© Steven Simbolon. All rights reserved.
