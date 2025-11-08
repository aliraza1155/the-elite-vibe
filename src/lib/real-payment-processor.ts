'use client';

export interface RealPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  client_secret?: string;
  modelId: string;
  modelName: string;
  buyerId: string;
  createdAt: string;
}

export class RealPaymentProcessor {
  private static baseURL = 'https://api.stripe.com/v1'; // Mock Stripe API
  
  // Create a real payment intent
  static async createPaymentIntent(
    modelId: string, 
    modelName: string, 
    amount: number, 
    buyerId: string
  ): Promise<{ success: boolean; paymentIntent?: RealPaymentIntent; error?: string }> {
    try {
      // Simulate API call to Stripe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const paymentIntent: RealPaymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 16)}`,
        modelId,
        modelName,
        buyerId,
        createdAt: new Date().toISOString()
      };
      
      // Save payment intent to localStorage
      this.savePaymentIntent(paymentIntent);
      
      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: 'Failed to create payment intent' };
    }
  }
  
  // Process payment with card details
  static async processPayment(
    paymentIntentId: string,
    cardDetails: {
      number: string;
      exp_month: string;
      exp_year: string;
      cvc: string;
      name: string;
    }
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Validate card (basic validation)
      if (!this.validateCard(cardDetails)) {
        return { success: false, error: 'Invalid card details' };
      }
      
      // Get payment intent
      const paymentIntent = this.getPaymentIntent(paymentIntentId);
      if (!paymentIntent) {
        return { success: false, error: 'Payment intent not found' };
      }
      
      // Simulate payment success (in real app, this would communicate with Stripe)
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        status: 'succeeded',
        processedAt: new Date().toISOString(),
        cardLast4: cardDetails.number.slice(-4)
      };
      
      // Update payment intent status
      this.updatePaymentIntentStatus(paymentIntentId, 'succeeded');
      
      // Record the transaction
      this.saveTransaction(transaction);
      
      return { success: true, transaction };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }
  
  // Validate card details
  private static validateCard(cardDetails: any): boolean {
    const { number, exp_month, exp_year, cvc } = cardDetails;
    
    // Basic validation
    if (!number || number.replace(/\s/g, '').length !== 16) return false;
    if (!exp_month || !exp_year) return false;
    if (!cvc || cvc.length !== 3) return false;
    
    // Check if card is not expired
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expYear = parseInt(exp_year);
    const expMonth = parseInt(exp_month);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  }
  
  // Utility methods
  private static savePaymentIntent(paymentIntent: RealPaymentIntent) {
    const paymentIntents = this.getPaymentIntents();
    paymentIntents.push(paymentIntent);
    localStorage.setItem('realPaymentIntents', JSON.stringify(paymentIntents));
  }
  
  private static getPaymentIntent(id: string): RealPaymentIntent | undefined {
    const paymentIntents = this.getPaymentIntents();
    return paymentIntents.find(pi => pi.id === id);
  }
  
  private static updatePaymentIntentStatus(id: string, status: RealPaymentIntent['status']) {
    const paymentIntents = this.getPaymentIntents();
    const updatedIntents = paymentIntents.map(pi => 
      pi.id === id ? { ...pi, status } : pi
    );
    localStorage.setItem('realPaymentIntents', JSON.stringify(updatedIntents));
  }
  
  private static getPaymentIntents(): RealPaymentIntent[] {
    return JSON.parse(localStorage.getItem('realPaymentIntents') || '[]');
  }
  
  private static saveTransaction(transaction: any) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('realTransactions', JSON.stringify(transactions));
  }
  
  private static getTransactions(): any[] {
    return JSON.parse(localStorage.getItem('realTransactions') || '[]');
  }
}