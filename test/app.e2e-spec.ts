import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('InkStream Core Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let postId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) - Check Health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.db).toBe('ok');
      });
  });

  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    username: `testuser${Date.now()}`,
    displayName: 'Test User',
  };

  it('/auth/register (POST) - Register user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.username).toBe(testUser.username);
      });
  });

  it('/auth/login (POST) - Login user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        accessToken = res.body.accessToken;
      });
  });

  it('/users/me/upgrade-to-creator (POST) - Upgrade to CREATOR', () => {
    return request(app.getHttpServer())
      .post('/users/me/upgrade-to-creator')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  // IMPORTANT: Re-login to get a new token with the CREATOR role
  it('/auth/login (POST) - Login again after upgrade', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.role).toBe('CREATOR');
        accessToken = res.body.accessToken;
      });
  });

  const testPost = {
    title: `My E2E Post ${Date.now()}`,
    contentMarkdown: 'This is a test post content',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
  };

  it('/posts (POST) - Create a post', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testPost)
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe(testPost.title);
        expect(res.body.slug).toBeDefined();
        // @ts-expect-error - body property is not typed in supertest
        postId = res.body.id;
      });
  });

  it('/posts/:id/like (POST) - Like a post', () => {
    return request(app.getHttpServer())
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.liked).toBe(true);
        expect(res.body.count).toBe(1);
      });
  });

  it('/posts/:postId/comments (POST) - Comment on post', () => {
    return request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'This is an e2e test comment' })
      .expect(201)
      .expect((res) => {
        expect(res.body.body).toBe('This is an e2e test comment');
        commentId = res.body.id;
      });
  });
});
