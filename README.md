# Simple, Fast File Sharing

A small web app built with Next.js for quick, privacy-focused file transfers using short links or P2P sessions.

# Key Features

Send files via short links or rooms.

P2P transfer with WebRTC for fast, encrypted, server-free transfers.

Server-assisted fallback using socket signaling + blob storage if P2P fails.

No account required; ephemeral links and room-based sharing.

Large file handling with chunking, retries, and resumable transfers.

# How It Works

Sender selects files → generates a link or room.

Signaling: Clients exchange data via server (Socket.IO or serverless).

P2P: Files streamed via WebRTC if possible.

Fallback: Upload to server/blob store if P2P fails.

Cleanup: Ephemeral shares auto-expire.

# Tech Stack

Frontend: React 19, Tailwind CSS, Radix UI

Backend/Signaling: Next.js, Socket.IO

P2P: WebRTC DataChannels

Optional Services: Vercel Blob, Firebase

Utilities: nanoid, qrcode.react, jszip, uuid, date-fns

UI/UX: Framer Motion, Lucide icons, Sonner

# Benefits

Large file transfers without server limits.

Privacy-preserving and account-free sharing.

Reliable even behind restrictive networks.

Quick, ad-hoc collaboration.

