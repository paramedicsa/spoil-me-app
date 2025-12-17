import fetch from 'node-fetch';

// Test webhook payloads for different PayPal events
const testEvents = {
  paymentCompleted: {
    id: 'WH-1234567890',
    event_type: 'PAYMENT.SALE.COMPLETED',
    resource: {
      id: 'PAY-123456789',
      state: 'completed',
      amount: {
        total: '5.00',
        currency: 'USD'
      },
      custom: 'user_123', // User ID
      invoice_id: 'user_123'
    }
  },

  paymentFailed: {
    id: 'WH-1234567891',
    event_type: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
    resource: {
      id: 'I-123456789',
      custom_id: 'user_123',
      status: 'SUSPENDED'
    }
  },

  subscriptionCancelled: {
    id: 'WH-1234567892',
    event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
    resource: {
      id: 'I-123456789',
      custom_id: 'user_123',
      status: 'CANCELLED'
    }
  },

  payoutFailed: {
    id: 'WH-1234567893',
    event_type: 'PAYMENT.PAYOUTS-ITEM.FAILED',
    resource: {
      payout_item_id: '123456789',
      transaction_status: 'FAILED',
      payout_item: {
        recipient_type: 'EMAIL',
        amount: {
          value: '50.00',
          currency: 'USD'
        }
      }
    }
  }
};

async function sendTestWebhook(eventType: keyof typeof testEvents) {
  const webhookUrl = 'http://localhost:3001/api/webhooks/paypal';
  const payload = testEvents[eventType];

  try {
    console.log(`Sending test webhook: ${eventType}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, PayPal sends these headers automatically
        // For testing, we're skipping signature verification
        'paypal-transmission-sig': 'test_signature',
        'paypal-transmission-time': new Date().toISOString(),
        'paypal-webhook-id': process.env.PAYPAL_WEBHOOK_ID || 'test_webhook_id',
        'paypal-event-type': payload.event_type
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response: ${result}`);
    console.log('---\n');

  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

// Test all webhook events
async function runAllTests() {
  console.log('🧪 Starting PayPal Webhook Tests\n');

  await sendTestWebhook('paymentCompleted');
  await sendTestWebhook('paymentFailed');
  await sendTestWebhook('subscriptionCancelled');
  await sendTestWebhook('payoutFailed');

  console.log('✅ All webhook tests completed');
}

// Allow running specific tests
const eventType = process.argv[2] as keyof typeof testEvents;
if (eventType && testEvents[eventType]) {
  sendTestWebhook(eventType);
} else if (process.argv[2] === 'all') {
  runAllTests();
} else {
  console.log('Usage:');
  console.log('  npm run test:webhooks all          # Test all webhooks');
  console.log('  npm run test:webhooks paymentCompleted');
  console.log('  npm run test:webhooks paymentFailed');
  console.log('  npm run test:webhooks subscriptionCancelled');
  console.log('  npm run test:webhooks payoutFailed');
}
