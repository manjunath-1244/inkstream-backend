# InkStream — Creator Content Platform (Backend)

InkStream is a production-grade NestJS backend for a creator-centric content platform. This project serves as a comprehensive integration of advanced NestJS concepts, including modular architecture, RBAC, TypeORM migrations, automated testing, and containerization.

## 1. Project Overview
InkStream is designed to facilitate a Substack-like environment where Creators publish content, Readers interact through likes and comments, and a tiered Subscription model gates premium content. The system also includes robust Moderation and Administration tools to ensure platform integrity.

### Why this project exists
This project acts as an integration test for the full NestJS building blocks: modules, guards, pipes, filters, JWT, RBAC, TypeORM, Docker, Jest, and Swagger. It demonstrates the ability to translate complex domain requirements into a clean, scalable, and secure backend architecture.

## 2. Personas & RBAC Matrix

| Persona | Description | Key Actions |
| :--- | :--- | :--- |
| **Reader (USER)** | Standard user | Browses posts, likes, comments, follows, bookmarks. |
| **Subscriber** | Paid user | A USER with an active subscription. Can access PREMIUM posts. |
| **Creator** | Content producer | A USER upgraded to publish posts and set paywalls. |
| **Moderator** | Content police | Reviews reports, hides flagged content, suspends users. |
| **Admin** | Platform owner | Full control, manages roles, views metrics and audit logs. |

### RBAC Matrix (Permissions)
| Action | USER | CREATOR | MODERATOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Create Post | N | Y | N | Y |
| Edit/Delete Own Post | N | Y | N | Y |
| Edit/Delete Any Post | N | N | Delete Only | Y |
| Comment/Like/Follow | Y | Y | Y | Y |
| Hide Post/Suspend User | N | N | Y | Y |
| Resolve Report | N | N | Y | Y |
| Manage Roles/Audit Logs | N | N | N | Y |

## 3. Technology Stack

- **Runtime**: Node.js 20 LTS + TypeScript (Strict mode enabled)
- **Framework**: NestJS (v11+)
- **Database**: PostgreSQL 15+ (TypeORM with Migrations)
- **Auth**: Passport.js + JWT + Bcrypt (Cost 10)
- **Validation**: `class-validator` + `class-transformer` (Global ValidationPipe)
- **Config**: `@nestjs/config` + `Joi` (Boot-time env validation)
- **Containerization**: Docker (Multi-stage) + Docker Compose
- **Testing**: Jest (Unit & E2E)
- **Documentation**: Swagger / OpenAPI (Available at `/api/docs`)

## 4. Functional Requirements

### 4.1 Authentication & Authorization
- **Register/Login**: Secure onboarding with hashed passwords and JWT issuance.
- **Token Lifecycle**: 15m Access Tokens + 7d Refresh Tokens (hashed and stored in DB).
- **Password Reset**: Token-based reset flow with links logged to console.
- **Guards**: Global `JwtAuthGuard` with `@Public()` support and `RolesGuard` for RBAC.

### 4.2 Content Management (Posts & Comments)
- **Posts**: Markdown support, auto-generated slugs, reading time calculation.
- **Visibility**: PUBLIC vs. PREMIUM content gating.
- **Comments**: Threaded comments (1-level nesting) with a 15-minute edit window.
- **Soft Deletes**: Posts and comments are never permanently deleted from the DB.

### 4.3 Interactions & Social Graph
- **Likes**: Idempotent toggle behavior for posts and comments.
- **Follows**: User-to-user follow graph with block-list enforcement.
- **Bookmarks**: Private list of saved posts.
- **Feed**: Personalized timeline of posts from followed creators.

### 4.4 Subscriptions & Gating
- **Plans**: Tiered pricing (FREE, BASIC, PREMIUM).
- **Payment Lifecycle**: Simulated checkout and webhook-based renewal/cancellation.
- **SubscriptionGuard**: Enforces `@RequiresPlan` requirements on premium content.

### 4.5 Safety & Moderation
- **Reporting**: User-generated reports for posts, comments, or users.
- **Moderation Actions**: Post hiding, user suspension (24h/7d), and permanent bans.
- **Audit Logs**: Comprehensive tracking of all administrative actions.

## 5. Local Setup & DevOps

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (if running without Docker)

### Setup Instructions
1.  **Clone the Repository**:
    ```bash
    git clone <repo-url>
    cd inkstream-backend
    ```
2.  **Environment Configuration**:
    ```bash
    cp .env.example .env
    ```
3.  **Start the Stack**:
    ```bash
    docker compose up --build
    ```
    *This command brings up the App, PostgreSQL, and pgAdmin. The app is reachable at `http://localhost:3000`.*

### Database Operations
- **Seed Data**: `npm run seed:categories` (Run after the first boot to populate essential data).
- **Migrations**: TypeORM migrations are used to manage schema. Schema sync is only permitted in local dev.

## 6. Testing & Quality
- **Unit Tests**: `npm run test` (Service and Controller level mocks).
- **Coverage**: `npm run test:cov` (Target: 80% Statements, 75% Branches).
- **Linting**: `npm run lint` and `npm run format:check`.

## 7. Definition of Done (Project Acceptance Criteria)
- [ ] `docker compose up --build` works from a fresh clone.
- [ ] All migrations run cleanly on a fresh database.
- [ ] Swagger documentation is complete for every endpoint.
- [ ] Test coverage meets thresholds (80% Stmt / 75% Branch).
- [ ] Zero lint/format warnings.
- [ ] No N+1 queries on list endpoints.
- [ ] No secrets in source; `.env.example` is current.
- [ ] Every guard, pipe, and decorator has corresponding unit tests.
- [ ] README and ARCHITECTURE.md are accurate.

## 8. API Documentation
The interactive API documentation is available at:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**


