# Losty — Sahrdaya College Lost & Found Management System

A full-stack web application for managing lost and found items on the Sahrdaya College campus. Built with Vue 3, Nuxt 4, and PostgreSQL.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Development](#development)

---

## 🎯 Project Overview

**Losty** is a comprehensive lost and found management system designed specifically for Sahrdaya College. It allows students and staff to:

- **Report Lost Items**: Post items they've lost with detailed descriptions, images, and location information
- **Report Found Items**: Post items they've found to help reunite them with owners
- **Search & Browse**: Browse all lost and found items filtered by category and location
- **Claim Items**: Submit claims on items with explanations for why they believe they own/found the item
- **Admin Dashboard**: Comprehensive admin panel to monitor all items, claims, and platform activity
- **Google OAuth Authentication**: Secure login using Sahrdaya College email accounts

**Key Constraint**: Only users with `@sahrdaya.ac.in` email addresses can access the platform.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Vue 3** | Progressive JavaScript framework for UI | ^3.5.30 |
| **Nuxt 4** | Vue framework with SSR and static site generation | ^4.3.1 |
| **TailwindCSS** | Utility-first CSS framework | ^4.2.1 |
| **Radix Vue** | Unstyled, accessible Vue component primitives | ^1.9.17 |
| **Lucide Vue Next** | Beautiful SVG icon library | ^0.577.0 |
| **@VueUse/Core** | Composition utilities for Vue 3 | ^14.2.1 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Nuxt 4 Server Routes** | Server-side API endpoints | ^4.3.1 |
| **nuxt-auth-utils** | Authentication middleware and utilities | ^0.5.29 |
| **Node.js** | Runtime environment | Latest |

### Database & ORM
| Technology | Purpose | Version |
|-----------|---------|---------|
| **PostgreSQL** | Relational database | 12+ |
| **Drizzle ORM** | TypeScript-first ORM with type safety | ^0.45.1 |
| **drizzle-kit** | Drizzle migration and schema tools | ^0.31.9 |
| **pg** | PostgreSQL client for Node.js | ^8.20.0 |

### Authentication
| Technology | Purpose | Provider |
|-----------|---------|----------|
| **Google OAuth 2.0** | Authentication provider | accounts.google.com |
| **Session Management** | Secure session handling | nuxt-auth-utils |

### Development & Build
| Technology | Purpose |
|-----------|---------|
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Next generation frontend tooling |
| **pnpm** | Fast, disk space-efficient package manager |

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ITEMS : "creates"
    USERS ||--o{ CLAIMS : "submits"
    CATEGORIES ||--o{ ITEMS : "categorizes"
    LOCATIONS ||--o{ ITEMS : "pinpoints"
    ITEMS ||--o| ITEM_IMAGES : "has"
    ITEMS ||--o| REWARDS : "offers"
    ITEMS ||--o{ CLAIMS : "receives"

    USERS {
        uuid id PK
        varchar google_id UK
        varchar email UK
        varchar name
        text avatar
        varchar phone
        boolean is_admin
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        varchar name UK
        timestamp created_at
    }

    LOCATIONS {
        uuid id PK
        varchar name UK
        timestamp created_at
    }

    ITEMS {
        uuid id PK
        enum type "lost|found"
        varchar title
        text description
        uuid category_id FK
        uuid location_id FK
        varchar date
        enum status "open|claimed|resolved|closed"
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }

    ITEM_IMAGES {
        uuid id PK
        uuid item_id FK
        text image_data
        varchar mime_type
        timestamp created_at
    }

    REWARDS {
        uuid id PK
        uuid item_id FK
        varchar description
        timestamp created_at
    }

    CLAIMS {
        uuid id PK
        uuid item_id FK
        uuid claimer_id FK
        text message
        enum status "pending|accepted|rejected"
        timestamp created_at
    }
```

### Table Descriptions

#### **Users**
Stores user account information and authentication data.
- `id`: Unique identifier (UUID)
- `google_id`: Google OAuth ID (unique)
- `email`: User email (unique, verified @sahrdaya.ac.in)
- `name`: User's display name
- `avatar`: Google profile avatar URL
- `phone`: Optional phone number
- `is_admin`: Admin privileges flag
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

#### **Categories**
Predefined item categories (e.g., Electronics, Accessories, Documents, etc.)
- `id`: Unique identifier (UUID)
- `name`: Category name (unique)
- `created_at`: Creation timestamp

#### **Locations**
Campus locations where items are lost/found (e.g., Library, Cafeteria, Parking Lot)
- `id`: Unique identifier (UUID)
- `name`: Location name (unique)
- `created_at`: Creation timestamp

#### **Items**
Core table for all lost and found item listings.
- `id`: Unique identifier (UUID)
- `type`: Enum - "lost" or "found"
- `title`: Item title (min. 3 characters)
- `description`: Detailed description
- `category_id`: FK to Categories table
- `location_id`: FK to Locations table
- `date`: Date when item was lost/found
- `status`: Enum - "open", "claimed", "resolved", or "closed"
- `user_id`: FK to Users table (item creator)
- `created_at`: Listing creation timestamp
- `updated_at`: Last modification timestamp

#### **ItemImages**
Stores images for items (one image per item currently).
- `id`: Unique identifier (UUID)
- `item_id`: FK to Items table (unique)
- `image_data`: Base64 or binary image data
- `mime_type`: Image MIME type (e.g., image/jpeg)
- `created_at`: Upload timestamp

#### **Rewards**
Optional reward information for lost items.
- `id`: Unique identifier (UUID)
- `item_id`: FK to Items table (unique)
- `description`: Reward description
- `created_at`: Creation timestamp

#### **Claims**
User claims on items (e.g., someone claiming they found the lost item).
- `id`: Unique identifier (UUID)
- `item_id`: FK to Items table
- `claimer_id`: FK to Users table (person making the claim)
- `message`: Claim description/explanation
- `status`: Enum - "pending", "accepted", or "rejected"
- `created_at`: Claim submission timestamp
- **Unique Constraint**: (item_id, claimer_id) - prevents duplicate claims from same user on same item

### Enums

| Enum | Values | Usage |
|------|--------|-------|
| `item_type` | `'lost'`, `'found'` | Identifies if item is lost or found |
| `item_status` | `'open'`, `'claimed'`, `'resolved'`, `'closed'` | Item status lifecycle |
| `claim_status` | `'pending'`, `'accepted'`, `'rejected'` | Claim resolution status |

### Foreign Key Relationships

- **Items → Users**: cascade delete (deleting user deletes their items)
- **Items → Categories**: restrict delete (protect categories from accidental deletion)
- **Items → Locations**: restrict delete (protect locations from accidental deletion)
- **ItemImages → Items**: cascade delete (delete images when item is deleted)
- **Rewards → Items**: cascade delete (delete rewards when item is deleted)
- **Claims → Items**: cascade delete (delete claims when item is deleted)
- **Claims → Users**: cascade delete (delete claims when user is deleted)

---

## ✨ Features

### User Features
- ✅ Google OAuth authentication (Sahrdaya email only)
- ✅ Report lost items with details, images, and location
- ✅ Report found items
- ✅ Browse all items with filters (category, location, status)
- ✅ Search functionality
- ✅ Submit claims on items
- ✅ View personal dashboard with items and claims
- ✅ Update profile and phone number
- ✅ View claim status and history

### Admin Features
- ✅ Admin dashboard with system statistics
- ✅ View all items and claims across the platform
- ✅ Filter items by status and type
- ✅ Manage item statuses
- ✅ Review and manage user claims
- ✅ Monitor platform health

### Technical Features
- ✅ Rate limiting on API routes
- ✅ Image compression and optimization
- ✅ Dark/Light theme support
- ✅ Responsive design
- ✅ Type-safe database queries (Drizzle ORM)
- ✅ Error handling and validation
- ✅ Toast notifications

---

## 📁 Project Structure

```
lost-and-found/
├── app/                          # Frontend application (Nuxt)
│   ├── pages/                   # Route pages
│   │   ├── index.vue            # Home/Browse items
│   │   ├── login.vue            # Login page
│   │   ├── dashboard.vue        # User dashboard
│   │   ├── profile.vue          # User profile
│   │   ├── admin.vue            # Admin dashboard
│   │   ├── report.vue           # Report new item
│   │   └── items/[id].vue       # Item detail page
│   ├── components/              # Vue components
│   │   └── ui/                  # UI component library
│   ├── layouts/                 # Layout templates
│   ├── middleware/              # Route middleware (auth, admin)
│   ├── composables/             # Vue composition utilities
│   ├── assets/                  # Static assets (CSS, images)
│   └── app.vue                  # Root component
│
├── server/                       # Backend (Nuxt Server Routes)
│   ├── api/                     # API endpoints
│   │   ├── user/                # User endpoints
│   │   ├── items/               # Item management endpoints
│   │   ├── admin/               # Admin endpoints
│   │   └── ...                  # Other API routes
│   ├── routes/                  # Server routes
│   │   └── auth/                # OAuth routes
│   ├── middleware/              # Backend middleware
│   │   ├── auth.ts              # Authentication check
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── plugins/                 # Server plugins
│   │   └── db.ts                # Database initialization
│   └── utils/                   # Server utilities
│
├── db/                          # Database
│   ├── schema.ts                # Drizzle ORM schema definitions
│   └── migrations/              # Database migrations
│
├── shared/                      # Shared code
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Shared utilities
│
├── scripts/                     # Utility scripts
│   ├── migrate-db.ts            # Database migration script
│   ├── backup-db.ts             # Database backup script
│   └── clear-db.ts              # Database clear script
│
├── nuxt.config.ts               # Nuxt configuration
├── drizzle.config.ts            # Drizzle ORM configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── package.json                 # Node.js dependencies
└── base.sql                     # Base database schema (CockroachDB)
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18+ (recommended v20+)
- **pnpm**: v9+ (or npm/yarn)
- **PostgreSQL**: 12+ running locally or remote
- **Google OAuth Credentials**: From Google Cloud Console

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd lost-and-found
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in the values:
```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) section below.

### Step 4: Set Up Database
```bash
# Push schema to database
pnpm db:push

# (Optional) Generate migration files
pnpm db:generate
```

### Step 5: Run Development Server
```bash
pnpm dev
```

Navigate to `http://localhost:3000` in your browser.

### Step 6: Build for Production
```bash
pnpm build
pnpm preview
```

---

## 🔒 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/losty_db

# Session
NUXT_SESSION_PASSWORD=your-very-secure-random-string-min-32-chars

# Google OAuth
NUXT_OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Admin Configuration
ADMIN_EMAILS=admin1@sahrdaya.ac.in,admin2@sahrdaya.ac.in

# Node Environment
NODE_ENV=development
```

### Environment Variable Details

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/dbname` |
| `NUXT_SESSION_PASSWORD` | Session encryption key (min 32 chars) | Random hex or hash |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth secret | From Google Cloud Console |
| `ADMIN_EMAILS` | Comma-separated admin email addresses | `admin@sahrdaya.ac.in` |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 🔌 API Routes

### Authentication
- `GET /api/user/me` - Get current user profile
- `GET /auth/google` - Initiate Google OAuth flow
- `POST /auth/logout` - Logout user

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/[id]` - Get item details
- `POST /api/items` - Create new item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `GET /api/items/[id]/image` - Get item image

### Claims
- `GET /api/items/[id]/claims` - Get all claims for an item
- `POST /api/items/[id]/claim` - Submit a claim
- `PUT /api/items/[id]/claims/[claimId]` - Update claim status

### Categories & Locations
- `GET /api/categories` - Get all categories
- `GET /api/locations` - Get all locations

### User
- `PUT /api/user/phone` - Update phone number
- `GET /api/user/dashboard` - Get user dashboard data

### Admin
- `GET /api/admin/items` - Get all items (admin view)
- `PUT /api/admin/items/[id]` - Update item (admin)

---

## 💻 Development

### Available Commands
```bash
# Development
pnpm dev              # Start dev server

# Build & Preview
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm generate         # Generate static site

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio (DB browser)

# Scripts
pnpm migrate-db       # Run custom migration script
pnpm backup-db        # Backup database
pnpm clear-db         # Clear database (dev only)
```

### Key Middleware
- **`middleware/auth.ts`** (Server): Validates user session on protected routes
- **`middleware/admin.ts`** (Server): Validates admin privileges
- **`middleware/rateLimiter.ts`** (Server): Rate limits API requests

### Styling & Components
The project uses a custom component library built with **Radix Vue** and **TailwindCSS v4**. Components are located in `app/components/ui/` and follow a modular pattern:

- `Button.vue` - Interactive buttons
- `Input.vue` - Form inputs
- `Select.vue` - Dropdown selects
- `Dialog.vue` - Modal dialogs
- `Textarea.vue` - Multi-line text inputs
- `Tabs.vue` - Tabbed interfaces
- `Card.vue` - Container cards
- `Badge.vue` - Labels and badges
- `Alert.vue` - Alert messages
- `Avatar.vue` - User avatars
- `DropdownMenu.vue` - Dropdown menus
- `Separator.vue` - Visual separators

---

## 📊 Database Workflow

### Item Lifecycle
1. **User creates item** (status: "open")
2. **Other users browse** and can submit claims
3. **Item owner reviews claims** (claims get status: "accepted" or "rejected")
4. **Item resolved** (status: "claimed" or "resolved")
5. **Item closed** by owner or admin (status: "closed")

### Claim Workflow
1. **User submits claim** on an item (status: "pending")
2. **Item owner reviews** claim details
3. **Owner accepts** or **rejects** claim (status changes)
4. If accepted, item's status updates accordingly

---

## 🔐 Security Features

- ✅ Email domain validation (`@sahrdaya.ac.in` only)
- ✅ Session-based authentication with CSRF protection
- ✅ Rate limiting on sensitive endpoints
- ✅ Server-side validation of all inputs
- ✅ SQL injection prevention via Drizzle ORM
- ✅ Cascade delete protections for related data
- ✅ Admin-only endpoint protection
- ✅ Unique constraints on user-item claims (no duplicates)

---

## 📝 Notes for Developers

- The project uses **TypeScript** for type safety throughout
- Database queries use **Drizzle ORM** for type-safe SQL
- Frontend follows **Vue 3 Composition API** patterns
- Images are compressed before storage (see `composables/useImageCompress.ts`)
- Dark mode is supported via `@nuxtjs/color-mode`
- The project is deployed on **Vercel** (see `vercel.json`)

---

## 📄 License

This project is proprietary to Sahrdaya College. Unauthorized reproduction or distribution is prohibited.

---

## 👥 Contact & Support

For questions or issues, please reach out to the development team or create an issue in the repository.

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Status**: Active Development
