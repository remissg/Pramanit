# CertiFlow 🚀
> The World's Most Advanced AI-Native Certification Platform.

CertiFlow is a production-ready SaaS platform that allows organizations to design, generate, and verify tamper-proof digital credentials at scale. Built for the AI era, it combines cryptographic security with a beautiful, user-centric design.

## 🌟 Key Features

### 🎨 AI-Powered Design
- **Drag-and-Drop Editor**: Intuitive canvas based on Fabric.js.
- **Dynamic Variables**: Personalize every certificate with `{name}`, `{date}`, `{course}`, etc.
- **Smart Templates**: Professional layouts ready to go.

### 🔐 Security & Trust
- **Digital Fingerprinting**: Every certificate has a unique ID and cryptographic has.
- **Tamper-Proof Verification**: Public verification page with instant improved validity checks.
- **DPDPA Compliance**: Built-in consent flows for data privacy.
- **Open Badges 3.0**: Ready for global interoperability.

### 📈 Scalability & Distribution
- **Batch Processing**: Generate 1,000+ certificates in minutes.
- **Email Automation**: Built-in SMTP support with custom templates.
- **Queue System**: Architected with BullMQ for reliable high-volume sending.

### 📱 Social Viral Loops
- **Unified Share Hub**: One-click sharing to LinkedIn, X (Twitter), WhatsApp, and Instagram.
- **Open Graph Previews**: Beautiful link previews on all social platforms.
- **"Add to Profile"**: One-click LinkedIn certification addition.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Imaging**: Node Canvas (Server-side generation), HTML5 Canvas (Client-side design).
- **Queues**: Redis + BullMQ (Ready for scale).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Redis (Required for Queues)

### ⚡ Redis Quick Setup (Choose One)

**Option A: Cloud (Easiest)**
1.  Sign up for free at [Upstash](https://upstash.com/) or [Redis Cloud](https://redis.com/try-free/).
2.  Create a database and copy the `REDIS_URL` (starts with `rediss://`).
3.  Add it to your `server/.env` file: `REDIS_URL=rediss://...`

**Option B: Local (Docker)**
1.  Run: `docker run -d -p 6379:6379 redis`
2.  No config needed (defaults to localhost:6379).

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/certiflow.git
    cd certiflow
    ```

2.  **Install Dependencies**
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Environment Setup**
    - Create `.env` in `server/` and `client/` based on `.env.example`.
    - Set your `MONGO_URI`, `JWT_SECRET`, and `CLOUDINARY_URL`.

4.  **Run the App**
    ```bash
    # Terminal 1: Server
    cd server
    npm run dev

    # Terminal 2: Client
    cd client
    npm run dev
    ```

## 🗺️ Roadmap & Vision

- **Phase 1**: Core MVP (Done) ✅
- **Phase 2**: Advanced Editor & Verification (Done) ✅
- **Phase 3**: Social Viral Loops (Done) ✅
- **Phase 4**: Compliance & Accessibility (Done) ✅
- **Future**: AI Design Critic, Mobile App for On-Site Issue. See full [Vision 2026 Roadmap](./docs/ROADMAP_2026.md).

## 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for details.

## 📄 License

MIT License. Built with ❤️ for the Open Source Community.
