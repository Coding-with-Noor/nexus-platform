# Nexus Platform

Investor & Entrepreneur collaboration platform — connect startups with investors, schedule meetings, video call, manage documents with e-signatures, and handle wallet payments.

**Live demo:** [nexus-iota-five.vercel.app](https://nexus-iota-five.vercel.app/login)

## Features

| Module | Status | Description |
|--------|--------|-------------|
| Authentication | ✅ | JWT login/register, role-based dashboards (Investor / Entrepreneur) |
| Profiles | ✅ | Extended profiles stored in MongoDB |
| Meeting Scheduling | ✅ | Schedule/accept/reject meetings with conflict detection |
| Video Calling | ✅ | WebRTC + Socket.IO signaling (audio/video toggle, end call) |
| Document Chamber | ✅ | Upload, versioning, e-signature, preview |
| Payments | ✅ | Wallet with deposit/withdraw/transfer (Stripe sandbox or mock) |
| Security | ✅ | bcrypt, JWT, 2FA (email OTP), rate limiting, XSS/NoSQL sanitization |
| Real-time Chat | ✅ | Encrypted messaging via Socket.IO |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Entrepreneur | `EnDemo@gmail.com` | `Demo@123` |
| Investor | `InDemo@gmail.com` | `Demo@123` |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm install
npm run dev
```

Server runs at `http://localhost:5000`  
API docs at `http://localhost:5000/api/docs`

### Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Environment Variables

See [`.env.example`](.env.example) (frontend) and [`backend/.env.example`](backend/.env.example) (backend).

Key variables:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — token signing keys
- `FRONTEND_URL` — CORS origin (e.g. `http://localhost:5173`)
- `VITE_API_URL` — frontend API base (e.g. `http://localhost:5000/api`)
- `VITE_SOCKET_URL` — Socket.IO server (e.g. `http://localhost:5000`)

Optional: `CLOUDINARY_*` for cloud file storage, `STRIPE_SECRET_KEY` for real payments, `EMAIL_*` for OTP emails.

## API Documentation

Interactive Swagger UI: **`GET /api/docs`** when the backend is running.

Security details: [`backend/Security.md`](backend/Security.md)

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Set `VITE_API_URL` and `VITE_SOCKET_URL` to your backend URL |
| Backend | Render / Heroku / AWS | Set all env vars from `.env.example` |
| Database | MongoDB Atlas | Use connection string as `MONGODB_URI` |

Docker and Kubernetes manifests are in `Dockerfile` and `K8s/`.

## Project Structure

```
├── src/                  # React frontend (Vite + TypeScript + Tailwind)
│   ├── pages/            # Route pages
│   ├── components/       # UI components
│   ├── services/         # API layer
│   └── context/          # Auth, Socket, Notifications
├── backend/
│   ├── routes/           # Express API routes
│   ├── models/           # Mongoose schemas
│   ├── middleware/       # Auth, validation, security
│   ├── sockets/          # WebRTC + chat signaling
│   └── controllers/      # Payment logic
└── K8s/                  # Kubernetes deployment configs
```

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Socket.IO Client, Axios  
**Backend:** Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT, bcrypt, Stripe (optional)

## License

MIT
