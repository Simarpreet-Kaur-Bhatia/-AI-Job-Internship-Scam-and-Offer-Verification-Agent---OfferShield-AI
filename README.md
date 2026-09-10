# 🛡 OfferShield AI

**Verify Before You Trust.**

An AI-powered Job and Internship Offer Verification Platform that helps students and job seekers analyze suspicious job offers, recruitment messages, offer letters, and URLs before accepting an offer, making a payment, or sharing sensitive information.

---

## Problem Statement

Students and job seekers receive job and internship offers via email, WhatsApp, LinkedIn, Telegram, and job portals. Some offers contain indicators that warrant careful verification:

- Upfront registration, training, or security fees
- Suspicious or personal email domains used for official communication
- Urgency and pressure tactics ("respond within 24 hours")
- Company and recruiter information mismatches
- Requests for unnecessary sensitive information
- Vague or unverifiable company details

Most users lack the tools to systematically verify these offers.

---

## Solution: Evidence-Based Verification

OfferShield AI follows an **evidence-based verification workflow**:

```
User submits an offer
      ↓
Extract important information
      ↓
Analyze company and recruiter information
      ↓
Detect suspicious patterns
      ↓
Check information consistency
      ↓
Calculate explainable risk score (0–100)
      ↓
Show detailed evidence and reasoning
      ↓
Generate verification trail
      ↓
Provide recommended actions
```

The core product identity: **Evidence → Verification → Explainable Risk Assessment → Recommended Action**

---

## Features

- **Document Upload** — PDF, DOC, DOCX, JPG, JPEG, PNG
- **Message Analysis** — Paste WhatsApp, email, LinkedIn, or Telegram messages
- **URL Input** — Submit a job posting URL
- **Multi-Agent Verification Workflow** — 6 specialized AI agents
- **Scam / Warning Pattern Detection** — Payment requests, urgency, suspicious links, etc.
- **Company & Contact Consistency Analysis** — Email domains, website consistency
- **Explainable Risk Score** — 0–100 with full transparent breakdown
- **Verification Trail** — Step-by-step reasoning trail showing how the score was reached
- **Evidence-Based Explanations** — Every indicator shows evidence + why it matters
- **Personalized Recommendations** — Based on detected indicators
- **User Dashboard** — Verification history, stats, risk distribution charts
- **Report Download** — Full text report with all findings
- **Demo Offers** — 3 fictional demo offers (High Risk, Needs Verification, Low Risk)
- **Responsive UI** — Desktop, tablet, mobile
- **Auth Optional** — Demo mode without registration; full history with account

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit |

---

## System Architecture

```
frontend/
├── index.html          ← Landing page
├── verify.html         ← Verification workspace
├── dashboard.html      ← User dashboard
├── how-it-works.html   ← Platform explanation
├── login.html          ← Authentication
├── register.html       ← Account creation
├── css/
│   ├── style.css       ← Main styles
│   ├── dashboard.css   ← Dashboard-specific styles
│   └── responsive.css  ← Responsive breakpoints
└── js/
    ├── api.js          ← REST API client
    ├── main.js         ← Shared utilities, nav
    ├── auth.js         ← Login/register logic
    ├── verify.js       ← Verification page logic
    ├── dashboard.js    ← Dashboard logic
    └── report.js       ← Report rendering + download

backend/
├── server.js           ← Express app entry point
├── config/
│   ├── config.js       ← Environment configuration
│   └── database.js     ← MongoDB connection
├── models/
│   ├── User.js         ← User schema
│   └── Verification.js ← Verification result schema
├── routes/
│   ├── authRoutes.js
│   ├── verificationRoutes.js
│   └── dashboardRoutes.js
├── controllers/
│   ├── authController.js
│   ├── verificationController.js
│   └── dashboardController.js
├── middleware/
│   ├── authMiddleware.js   ← JWT protection
│   ├── uploadMiddleware.js ← Multer file upload
│   └── errorMiddleware.js  ← Global error handler
├── agents/
│   ├── documentAnalysisAgent.js    ← Agent 1: Extract info
│   ├── companyVerificationAgent.js ← Agent 2: Analyze company
│   ├── scamPatternAgent.js         ← Agent 3: Detect patterns
│   ├── offerConsistencyAgent.js    ← Agent 4: Check consistency
│   ├── riskAssessmentAgent.js      ← Agent 5: Calculate score
│   └── recommendationAgent.js     ← Agent 6: Generate actions
├── services/
│   ├── verificationOrchestrator.js ← Central workflow coordinator
│   └── sessionStore.js             ← In-memory store (no-DB mode)
└── utils/
    └── jwtUtils.js
```

---

## AI Multi-Agent Workflow

```
USER INPUT (text / file / URL / demo)
           ↓
 [Agent 1] Document Analysis Agent
   → Extracts: company, recruiter, email, salary, URLs, payment mentions
           ↓
 [Agent 2] Company Verification Agent
   → Checks: email domain, free email providers, domain consistency
           ↓
 [Agent 3] Scam Pattern Detection Agent
   → Detects: payment requests, urgency, suspicious links, sensitive info requests
           ↓
 [Agent 4] Offer Consistency Agent
   → Cross-checks: email vs company name, URLs vs email domain, missing info
           ↓
 [Agent 5] Risk Assessment Agent
   → Calculates: transparent 0–100 score with full breakdown
           ↓
 [Agent 6] Recommendation Agent
   → Generates: prioritized evidence-based action recommendations
           ↓
       FINAL VERIFICATION REPORT
```

### Risk Levels

| Score | Level | Label |
|-------|-------|-------|
| 0–29 | `low` | Low Risk |
| 30–59 | `needs_verification` | Needs Verification |
| 60–79 | `high` | High Risk |
| 80–100 | `very_high` | Very High Risk |

---

## API Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login
GET    /api/auth/profile           Get current user profile (protected)

POST   /api/verify/text            Verify pasted text offer
POST   /api/verify/upload          Verify uploaded file offer
POST   /api/verify/url             Verify offer URL
POST   /api/verify/demo            Run a demo verification

GET    /api/verifications          Get all verifications for current user/session
GET    /api/verifications/:id      Get a specific verification by ID
DELETE /api/verifications/:id      Delete a verification

GET    /api/dashboard/stats        Get dashboard statistics

GET    /api/health                 Health check
```

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd OfferShield-AI

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy .env.example and fill in your values:
#   PORT=5000
#   MONGODB_URI=mongodb://localhost:27017/offershield
#   JWT_SECRET=your_secure_secret_here
#   JWT_EXPIRES_IN=7d
#   NODE_ENV=development
#   MAX_FILE_SIZE=10485760
#   UPLOAD_PATH=./uploads
#   FRONTEND_URL=http://localhost:3000

# 4. Create uploads directory (auto-created on first run)
mkdir -p uploads

# 5. Start the development server
npm run dev

# OR for production:
npm start
```

### MongoDB Setup

**Option A — Local MongoDB:**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath ./data
```

**Option B — MongoDB Atlas (Cloud):**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Set `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/offershield`

> **Note:** The application runs in demo mode even without a MongoDB connection. All features work; verification history is stored in memory and cleared on server restart.

---

## Running the Application

```bash
# Start backend (serves frontend too)
npm run dev
# → Backend API: http://localhost:5000/api
# → Frontend:    http://localhost:5000

# Or serve frontend separately (e.g. with Live Server in VS Code):
# Open frontend/index.html directly or use any static file server
# Backend must be running on port 5000
```

---

## Demo Mode

The application includes three fictional demo offers for immediate demonstration without setup:

| Demo | Company | Expected Result |
|------|---------|-----------------|
| High Risk | NextGen Career Solutions | 80+ / Very High Risk |
| Needs Verification | InnovateTech Solutions | 30-59 / Needs Verification |
| Low Risk | TechBridge India Pvt. Ltd. | 0-29 / Low Risk |

Access via: **Verify an Offer → Demo Offers tab**

Or directly: `http://localhost:5000/verify.html?demo=high_risk`

> All demo companies, names, and offer details are entirely fictional and created for demonstration purposes only.

---

## Responsible Use

OfferShield AI uses responsible, evidence-based language:

- ✅ "Multiple high-risk indicators detected — independent verification recommended."
- ✅ "Could not independently verify."
- ✅ "Needs further verification."
- ❌ Never: "This company is definitely a scam."
- ❌ Never: "Do not respond to this offer."

**Disclaimer:** OfferShield AI provides automated risk analysis based on available information and detected indicators. Results are advisory and should not replace independent verification or professional/legal guidance.

---

## License

MIT License — For demonstration and educational purposes.
