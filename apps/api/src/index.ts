import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import courtsRouter from './routes/courts';
import availabilityRouter from './routes/availability';
import bookingsRouter from './routes/bookings';
import pricingRouter from './routes/pricing';
import eventsRouter from './routes/events';
import infoRouter from './routes/info';
import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import analyticsRouter from './routes/analytics';
import conversationsRouter from './routes/conversations';
import whatsappWebhook from './routes/webhooks/whatsapp';
import aiTestRouter from './routes/ai-test';
import { connectRedis } from './config/redis';

const app = express();

// Middleware
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Al Daoud Courts API',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/v1/courts', courtsRouter);
app.use('/api/v1/availability', availabilityRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/pricing', pricingRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/conversations', conversationsRouter);
app.use('/api/v1/webhooks/whatsapp', whatsappWebhook);
app.use('/api/v1/info', infoRouter);
app.use('/api/v1/ai', aiTestRouter);

// Connect to Redis then start server
connectRedis()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Al Daoud Courts API running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Redis:', err);
    // Start anyway — conversations will work without persistence
    app.listen(env.port, () => {
      console.log(`Al Daoud Courts API running on port ${env.port} (without Redis)`);
    });
  });

export default app;
