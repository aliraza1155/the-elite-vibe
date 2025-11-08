'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vibeAgent } from '@/lib/gemini-utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'greeting' | 'suggestion';
  isTyping?: boolean;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VibeAI({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  // Initialize with user data and personalized greeting
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (isOpen && messages.length === 0) {
      const greeting = vibeAgent.generatePersonalizedGreeting(user);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        type: 'greeting'
      }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        // Auto-send voice messages
        setTimeout(() => {
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
        }, 500);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addMessage('assistant', 'Even the best listeners sometimes need a second take! 🎤 Try typing your message - I\'m all ears.', 'text');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'voice' | 'greeting' | 'suggestion' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = async (duration: number = 1000) => {
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      type: 'text',
      isTyping: true
    };
    
    setMessages(prev => [...prev, typingMessage]);
    await new Promise(resolve => setTimeout(resolve, duration));
    setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
  };

  const handleSendMessage = async (voiceMessage?: string) => {
    const messageToSend = voiceMessage || inputMessage;
    
    if (!messageToSend.trim() || isLoading) return;

    if (!voiceMessage) {
      setInputMessage('');
    }
    
    addMessage('user', messageToSend, voiceMessage ? 'voice' : 'text');
    setIsLoading(true);

    try {
      // Add slight typing delay for natural feel
      await simulateTyping(600 + Math.random() * 800);

      const result = await vibeAgent.generateResponse(messageToSend, currentUser);
      
      if (result.success && result.response) {
        addMessage('assistant', result.response, 'text');
        
        // Handle navigation actions
        if (result.action && result.action.type === 'navigate') {
          setTimeout(() => {
            router.push(result.action.data.path);
            
            // Add journey-specific follow-up messages
            if (result.action.data.journey) {
              setTimeout(() => {
                const journeyFollowUps = {
                  'upload-model': "After uploading, don't forget to approve your model in the seller dashboard to list it in the marketplace! 📈",
                  'seller-dashboard': "From here you can manage all your models, track earnings, and approve new listings! 💰",
                  'buyer-dashboard': "Your dashboard is where you'll find all your purchased models and can explore new ones! 🔍",
                  'view-purchases': "All your purchased models are here! You can download them anytime. 📦"
                };
                
                if (journeyFollowUps[result.action.data.journey as keyof typeof journeyFollowUps]) {
                  addMessage('assistant', journeyFollowUps[result.action.data.journey as keyof typeof journeyFollowUps], 'suggestion');
                }
              }, 2000);
            }
          }, 1500);
        }
        
        // Occasionally add follow-up suggestions
        if (Math.random() > 0.6 && messages.length < 6) {
          setTimeout(() => {
            showContextualSuggestions();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'The creative energy is surging a bit too powerfully right now! 🔥 Let me recalibrate and try that again.', 'text');
    } finally {
      setIsLoading(false);
    }
  };

  const showContextualSuggestions = () => {
    const suggestions = [
      {
        label: '🚀 Upload Models',
        prompt: 'How do I upload my AI models and become a creator?'
      },
      {
        label: '💎 View Pricing',
        prompt: 'Show me the subscription plans and pricing'
      },
      {
        label: '🛍️ Browse Marketplace',
        prompt: 'Take me to the marketplace to browse AI models'
      },
      {
        label: '📊 Seller Dashboard',
        prompt: 'I want to see my creator dashboard'
      }
    ];
    
    const selected = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    addMessage('assistant', `While we're on this creative wavelength... want to explore "${selected.label.replace(/[🚀💎🛍️📊]/g, '').trim()}"?`, 'suggestion');
  };

  const handleVoiceMessage = () => {
    if (!recognitionRef.current) {
      addMessage('assistant', 'Voice conversations add such a personal touch! 🎤 For now, let\'s continue our creative dialogue through text.', 'text');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      icon: '🚀',
      label: 'Start Selling',
      prompt: 'How do I upload my AI models and become a creator?'
    },
    {
      icon: '🛍️',
      label: 'Browse Models',
      prompt: 'Take me to the marketplace to browse AI models'
    },
    {
      icon: '💎',
      label: 'View Pricing',
      prompt: 'Show me the subscription plans and pricing'
    },
    {
      icon: '❓',
      label: 'What is this?',
      prompt: 'What is The Elite Vibe platform?'
    }
  ];

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Platform statistics for engagement
  const platformStats = [
    { icon: '🤖', value: '10K+', label: 'AI Models' },
    { icon: '👥', value: '5K+', label: 'Active Creators' },
    { icon: '📥', value: '50K+', label: 'Downloads' },
    { icon: '💰', value: '$2M+', label: 'Creator Earnings' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-gradient-to-br from-slate-900/95 to-purple-900/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-2xl shadow-cyan-500/30 flex flex-col transform transition-all duration-300 hover:shadow-cyan-500/40">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg animate-pulse-slow">
              ⚡
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-30 animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-white bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              VibeAgent
            </h3>
            <p className="text-xs text-cyan-300/80">The Elite Vibe Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 flex items-center justify-center text-cyan-300/70 hover:text-cyan-300 transition-all duration-200 hover:bg-cyan-500/20 rounded-lg"
          >
            {isMinimized ? '➕' : '➖'}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-cyan-300/70 hover:text-rose-400 transition-all duration-200 hover:bg-rose-500/20 rounded-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Enhanced Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                  message.type === 'greeting' ? 'animate-fade-in' : ''
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 backdrop-blur-sm transition-all duration-300 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white shadow-lg shadow-cyan-500/25'
                      : message.type === 'greeting'
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-200 shadow-lg shadow-purple-500/20'
                      : message.type === 'suggestion'
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-200 shadow-lg shadow-amber-500/20'
                      : 'bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-cyan-500/20 text-cyan-100'
                  } ${message.isTyping ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && !message.isTyping && (
                      <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 shadow-lg">
                        ⚡
                      </div>
                    )}
                    <div className="flex-1">
                      {message.isTyping ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-cyan-300/70 text-sm ml-2">VibeAgent is thinking...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-60">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.type === 'voice' && (
                              <span className="text-xs opacity-60">🎤 Voice</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 shadow-lg">
                        👤
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Platform Stats Showcase - Only show when conversation is minimal */}
            {messages.length <= 2 && (
              <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl p-4 mt-4">
                <p className="text-xs text-cyan-300/80 mb-3 text-center font-medium">Join Our Thriving Community 🌟</p>
                <div className="grid grid-cols-2 gap-3">
                  {platformStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg">{stat.icon}</div>
                      <div className="text-cyan-300 font-bold text-sm">{stat.value}</div>
                      <div className="text-cyan-300/70 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions - Show when conversation starts or is minimal */}
          {messages.length <= 3 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-cyan-300/80 mb-3 font-medium">Quick start your journey:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="px-3 py-2 bg-slate-800/40 border border-cyan-500/20 text-cyan-300/90 text-xs rounded-xl hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm text-left group"
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-xs">{action.icon}</span>
                      <span className="font-medium group-hover:text-cyan-200">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="p-4 border-t border-cyan-500/20 bg-gradient-to-t from-slate-900/50 to-transparent">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about The Elite Vibe platform..."
                  className="w-full px-4 py-3 pr-12 bg-slate-800/40 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none text-sm"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleVoiceMessage}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                    isListening 
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse shadow-lg shadow-rose-500/25' 
                      : 'bg-cyan-500/20 text-cyan-300/70 border border-cyan-500/30 hover:bg-cyan-500/30 hover:text-cyan-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/25'
                  }`}
                  title="Voice message"
                >
                  🎤
                </button>
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:shadow-none flex items-center justify-center transform hover:scale-105 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '⚡'
                )}
              </button>
            </div>
            <p className="text-xs text-cyan-300/60 mt-2 text-center">
              Your AI marketplace journey starts here! 🚀
            </p>
          </div>
        </>
      )}
    </div>
  );
}