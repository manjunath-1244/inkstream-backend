# Project Retrospective — InkStream Backend

## 1. Project Overview & Deliverables
This retrospective reflects on the development and completion of the **InkStream Backend**, a production-ready creator content platform built using NestJS, TypeScript, PostgreSQL, TypeORM, Redis, MinIO, MailHog, and Socket.io. 

We successfully completed 100% of the functional and non-functional requirements specified in the project brief. In addition, we completed **all 7 advanced stretch goals**:
1. **S3 Presigned URLs**: Enabled secure image uploads via local MinIO.
2. **SMTP Transactional Mail**: Integrated MailHog to intercept password resets and real-time emails.
3. **Redis Caching Layer**: Implemented to support high-performance reading of trending posts.
4. **GraphQL Endpoint**: Exposed a read-only schema of categories, posts, tags, and profiles.
5. **Real-Time WebSockets**: Set up a Socket.io gateway to push real-time notifications.
6. **GitHub Actions CI/CD**: Automatic linting, testing, compiling, and container registry publishing.
7. **Kubernetes Manifest Set**: Designed Deployment, Service, ConfigMap, and Secret blueprints.

---

## 2. What Went Well?
* **Strict Modular Architecture**: The codebase is segmented into highly focused, single-responsibility domain modules (Auth, Users, Posts, Comments, Subscriptions, etc.). Circular dependencies were entirely avoided through clean exports.
* **Securing & Gating Content**: Designed dynamic guards (`JwtAuthGuard`, `RolesGuard`, `OwnershipGuard`, and `SubscriptionGuard`) allowing clean, fine-grained access control on writing and reading premium content.
* **Transactional Counter Updates**: Implemented database transactions using `DataSource.transaction` when toggling likes and comments to ensure that counters (`likeCount`, `commentCount`) are updated safely without race conditions.
* **Meaningful Test Coverage**: Avoided "coverage theater" by writing unit test suites that validate return values, state changes, and error assertions for all services and controllers.

---

## 3. What Was Challenging & How It Was Resolved?
* **Raw Sorting Limitation in TypeORM**: Selecting trending posts based on mathematical scores (`likes * 3 + comments * 2 + shares * 4`) initially crashed due to TypeORM parsing raw query builders. We resolved this by adding a SELECT expression alias (`.addSelect(..., 'post_score')`) and sorting cleanly by the alias.
* **GraphQL Exceptions in REST Filters**: Our global `HttpExceptionFilter` crashed when processing GraphQL resolver requests because it tried to access REST context (`switchToHttp`). We solved this by adding type guards to ignore non-HTTP resolvers:
  ```typescript
  if (host.getType() !== 'http') { throw exception; }
  ```
* **Real-Time WebSocket Handshakes**: Managing JWT token authentication on socket handshakes across different client patterns (headers, query parameters, auth token) was complex. We implemented a robust gateway parsing all three channels to extract and verify the user payload cleanly before storing their active connection.

---

## 4. Learnings Across Concepts

### Modules & Services
* **Learning**: NestJS module configuration acts as the dependency graph of your application. Keeping services highly isolated and strictly defining the API of each module through exports makes large codebases incredibly clean and maintainable.

### Route Guards & Custom Decorators
* **Learning**: Guards (`CanActivate`) allow separating authorization logic completely from controller routes. Custom decorators (like `@CurrentUser` and `@Public`) keep controllers clean and readable while transferring validation logic to reusable layers.

### WebSockets & Real-Time Gateway
* **Learning**: Traditional REST APIs are strictly request-response. WebSockets open a two-way persistent connection. Implementing client tracking (`userId` mapped to `Socket`) is essential to avoid broadcasting private events to unauthorized clients.

### Caching with Redis
* **Learning**: Heavy database operations (like trending post calculations) can cause high latency under load. Introducing a Redis caching layer that gets invalidated dynamically on post updates/likes dramatically drops response times to sub-milliseconds.

---

## 5. Conclusion
InkStream has been an exceptional exercise in architecting modern microservices. By combining strict type safety, automatic testing, custom validation, and automated deployment pipelines, the codebase is structurally robust, highly scalable, and completely ready for code review and production deployment!
