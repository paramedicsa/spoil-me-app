import express from 'express';
import cors from 'cors';
import paypalWebhookHandler from './paypalWebhookHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ verify: (req, res, buf) => (req as any).rawBody = buf })); // Keep raw body for signature verification

// Routes
app.use('/api/webhooks', paypalWebhookHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`PayPal webhook server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`PayPal webhook endpoint: http://localhost:${PORT}/api/webhooks/paypal`);
});

export default app;
