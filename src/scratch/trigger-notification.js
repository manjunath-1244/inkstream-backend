const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { EventEmitter2 } = require('@nestjs/event-emitter');

async function bootstrap() {
  console.log('Connecting to Inkstream NestJS Application...');
  
  // Initialize Nest application context (without starting a HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('Emitting mock "user.followed" event to trigger notification...');
  
  const eventEmitter = app.get(EventEmitter2);
  
  // Emitting a mock follow event targeting the user ID connected to WebSockets
  eventEmitter.emit('user.followed', {
    followerId: '550e8400-e29b-41d4-a716-446655440000', // Mock Follower UUID
    followingId: '47ef3538-4b28-421d-a56a-8700ec13e38d' // The recipient user ID (from your token)
  });
  
  console.log('Event emitted successfully! Check your browser window now.');
  
  // Wait 1 second and exit context cleanly
  setTimeout(async () => {
    await app.close();
    process.exit(0);
  }, 1000);
}

bootstrap().catch(err => {
  console.error('Error triggering notification:', err);
  process.exit(1);
});
