import { ResponseController } from './response-controller';
import { platformKnowledge } from './platform-knowledge';

// Enhanced Gemini AI Integration with strict platform focus
class EliteVibeAI {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private responseController = ResponseController.getInstance();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(
    userMessage: string, 
    currentUser: any = null
  ): Promise<{success: boolean; response?: string; action?: any; error?: string}> {
    
    // First, try our strict response controller
    const controlledResponse = this.responseController.generateResponse(userMessage, currentUser);
    
    // If we have a direct response, use it immediately
    if (controlledResponse.response && !this.requiresAIAssistance(userMessage)) {
      return {
        success: true,
        response: controlledResponse.response,
        action: controlledResponse.action
      };
    }

    // For complex questions, use Gemini but with strict platform context
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const systemPrompt = this.createStrictPlatformPrompt();
      const fullPrompt = `${systemPrompt}

USER QUESTION: "${userMessage}"

YOUR RESPONSE (STRICTLY PLATFORM-FOCUSED, MAX 3 SENTENCES):`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150, // SHORT responses
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return {
        success: true,
        response: this.shortenResponse(aiResponse.trim()),
        action: controlledResponse.action
      };

    } catch (error) {
      console.error('VibeAgent AI Error:', error);
      
      // Fallback to controlled response
      return {
        success: true,
        response: controlledResponse.response,
        action: controlledResponse.action
      };
    }
  }

  private requiresAIAssistance(message: string): boolean {
    const complexTriggers = [
      'compare', 'difference between', 'which is better', 'should i',
      'recommend', 'suggest', 'advice on', 'how to choose',
      'best way to', 'strategies for', 'tips for'
    ];
    
    return complexTriggers.some(trigger => message.toLowerCase().includes(trigger));
  }

  private createStrictPlatformPrompt(): string {
    return `You are VibeAgent, the official AI assistant for The Elite Vibe AI Model Marketplace.

STRICT RULES:
1. ONLY discuss The Elite Vibe platform, its features, and user guidance
2. Keep responses SHORT (1-3 sentences maximum)
3. Always be enthusiastic and helpful
4. Redirect off-topic questions back to platform features
5. Use emojis sparingly (1 per response max)
6. Focus on practical, actionable information

PLATFORM KNOWLEDGE:
- Name: The Elite Vibe - World's Largest AI Model Marketplace
- Purpose: Connect AI creators with users, 80-90% revenue share
- User roles: Explorer (free), Creator/Visionary (paid)
- Key features: Marketplace, Upload system, Analytics, Secure payments
- Pricing: Explorer free, Creator $29.99, Pro $79.99, Enterprise $199.99
- Upload requirements: 4+ SFW/NSFW images, 1+ SFW/NSFW videos, $50 min price

RESPONSE STYLE:
- Be concise and direct
- Focus on platform value
- Encourage exploration
- Maintain professional enthusiasm

NEVER:
- Discuss other platforms or general AI topics
- Give lengthy explanations
- Provide personal opinions
- Discuss non-platform related content

ALWAYS redirect to: model uploads, marketplace exploration, subscription benefits, or platform features.`;
  }

  private shortenResponse(response: string): string {
    // Ensure response is brief
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) {
      return sentences.slice(0, 2).join('. ') + '.';
    }
    return response;
  }

  generatePersonalizedGreeting(user: any = null): string {
    const greetings = [
      `Welcome to ${platformKnowledge.identity.name}! 🚀 I'm ${platformKnowledge.chatbot.name}, your guide to the world's largest AI model marketplace. Ready to explore or create?`,
      `Hey there! 👋 I'm ${platformKnowledge.chatbot.name} from ${platformKnowledge.identity.name}. Let's unlock your AI potential together!`,
      `Hello visionary! 💫 Welcome to ${platformKnowledge.identity.fullName}. I'm ${platformKnowledge.chatbot.name}, here to help you succeed!`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

export const vibeAgent = new EliteVibeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');