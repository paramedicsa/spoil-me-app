import axios from 'axios';

export interface PayoutRequest {
  recipientEmail: string;
  amount: number;
  currency: string;
  note: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId?: string;
  error?: string;
}

class PayPalPayoutService {
  private baseUrl: string;

  constructor() {
    // In production, this would be your backend API URL
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  async createPayout(payoutData: PayoutRequest): Promise<PayoutResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/paypal/payouts`, {
        recipient_type: 'EMAIL',
        amount: {
          value: payoutData.amount.toFixed(2),
          currency: payoutData.currency
        },
        receiver: payoutData.recipientEmail,
        note: payoutData.note,
        sender_item_id: `payout_${Date.now()}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers as needed
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      return {
        success: true,
        payoutId: response.data.payoutId
      };
    } catch (error: any) {
      console.error('PayPal payout error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getPayoutStatus(payoutId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/paypal/payouts/${payoutId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payout status:', error);
      throw error;
    }
  }

  async getTransactionHistory(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await axios.get(`${this.baseUrl}/paypal/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      return response.data.transactions || [];
    } catch (error: any) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // In a real app, get the token from secure storage
    return localStorage.getItem('authToken') || '';
  }
}

export const paypalPayoutService = new PayPalPayoutService();
