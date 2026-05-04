This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Architecture
Browser
  │
  ├── /              Login page (Google OAuth via signInWithPopup)
  ├── /library       Audiobook list + PDF upload (admin only)
  └── /player/[id]   Audiobook player (browser speechSynthesis)

API Routes (Next.js)
  └── /api/auth/session   Verifies Firebase ID token, creates user doc

Backend Services
  ├── Firebase Auth        Google OAuth
  ├── Firebase Firestore   Metadata (users, audiobooks)
  └── Firebase Storage     PDF files


 ## Tech Stack

Layer	Technology
Frontend	Next.js 15 (App Router, TypeScript, Tailwind CSS)
UI Components	shadcn/ui (Badge, Button, Card, Dialog, Progress, Slider)
Auth	Firebase Auth — Google OAuth (signInWithPopup)
Database	Firebase Firestore
File Storage	Firebase Storage
Audio Playback	Browser Web Speech API (window.speechSynthesis)
PDF Parsing	pdf-parse (server-side), pdfReader.ts (client-side)
Deployment	Vercel (Hobby)

## Project Structure

src/
├── app/
│   ├── page.tsx                    Login page
│   ├── layout.tsx                  Root layout
│   ├── globals.css
│   ├── api/auth/session/route.ts   Session API — token verify + user creation
│   ├── library/
│   │   ├── page.tsx                Library listing + admin delete
│   │   └── UploadPDF.tsx           PDF upload + text extraction + speech controls
│   └── player/[id]/
│       └── page.tsx                Audiobook player (chunk-by-chunk speech)
├── lib/
│   ├── firebase.ts                 Firebase client SDK init
│   ├── firebase-admin.ts           Firebase Admin SDK (server-side)
│   ├── user.ts                     createUserIfNotExists helper
│   ├── pdfReader.ts                Client-side PDF text extraction
│   ├── pdfProcessor.ts             Server-side PDF text extraction (pdf-parse)
│   ├── textChunker.ts              Splits text into sentence chunks
│   ├── speechEngine.ts             Web Speech API wrapper
│   └── utils.ts                    shadcn/ui utility (cn)
├── components/ui/                  shadcn/ui components
└── middleware.off.ts               Route protection (currently disabled)

## Data Model

{
  uid: string
  email: string
  displayName: string
  isAdmin: boolean       // gates upload access
  createdAt: Timestamp
}
{
  title: string          // PDF filename
  pdfUrl: string         // Firebase Storage download URL
  owner: string          // uid of uploader
  fullText: string       // complete extracted text (used by player)
  textPreview: string    // first 500 chars (used in library list)
  createdAt: Timestamp
}

## Key Flows

Upload Flow
Admin selects PDF in UploadPDF.tsx
PDF uploaded to Firebase Storage at pdfs/{uid}/{filename}
Text extracted client-side via pdfReader.ts
Firestore doc created with fullText and textPreview
Browser speaks extracted text via speechEngine.ts
Playback Flow
player/[id] fetches Firestore doc by ID
fullText split into sentence chunks via inline chunker
Each chunk spoken sequentially via window.speechSynthesis
Prev/Next/Pause/Resume/Stop controls manage chunk index
Auth Flow
page.tsx calls signInWithPopup with Google provider
onAuthStateChanged fires → calls createUserIfNotExists
User doc created in Firestore if first login
Redirects to /library

## Environment Variables

Variable	Description
NEXT_PUBLIC_FIREBASE_API_KEY	Firebase web app API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN	<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID	Firebase project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET	<project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID	Firebase sender ID
NEXT_PUBLIC_FIREBASE_APP_ID	Firebase app ID
FIREBASE_SERVICE_ACCOUNT_JSON	Minified JSON of Firebase Admin service account key

## Known Limitations

Audio quality varies by browser/OS — Web Speech API uses the OS voice engine (Chrome, Safari, Windows all sound different)
No persistent audio — audio is generated live on playback; cannot be shared or downloaded
Middleware disabled — middleware.off.ts is not active; routes are unprotected at the Next.js level
No upload gating — any authenticated user can upload (admin check not enforced server-side)
fullText stored in Firestore — Firestore has a 1MB document size limit; very large PDFs may fail
