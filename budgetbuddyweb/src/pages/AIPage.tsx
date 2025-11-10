import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { mlPredict, mlAllocate, type PredictBody, type AllocateBody } from '../api/ml';

type BudgetEntry = {
  id: number;
  month: number;
  monthly_Income: number;
  rent: number;
  loan_Repayment: number;
  insurance: number;
  subscriptions: number;
  groceries: number;
  travel: number;
  going_Out: number;
  entertainment: number;
  utilities: number;
  healthcare: number;
  education: number;
  miscellaneous: number;
  total_Expenses: number;
  debt: number;
};

/**
 * Type definitions for AI page components
 */
type SavedRec = { id: number; recommendationText: string; generatedAt: string };

type ChatMessage = {
  isUser: boolean;
  message: string;
  timestamp: Date;
};

/**
 * Formats numbers as GBP currency with locale-specific formatting
 */
function fmtGBP(n: number | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

/**
 * Converts dollar signs to pound signs for UK currency display
 */
function convertCurrencySymbols(text: string): string {
  return text.replace(/\$/g, '£');
}

/**
 * Local AI assistant that provides financial advice when cloud AI is unavailable
 * Uses rule-based logic and budget data analysis for contextual responses
 * 
 * @param query - User's question or request
 * @param budgetData - Optional user budget data for personalized advice
 * @returns Formatted financial advice string
 */
function generateLocalAIResponse(query: string, budgetData?: BudgetEntry): string {
  const lower = query.toLowerCase();

  // Budget-specific responses
  if (budgetData) {
    const income = budgetData.monthly_Income;
    const expenses = budgetData.total_Expenses;
    const spare = income - expenses;
    const savingsRate = ((spare / income) * 100).toFixed(1);

    if (lower.includes('spending') || lower.includes('expense')) {
      const categories = [
        { name: 'Rent', value: budgetData.rent },
        { name: 'Groceries', value: budgetData.groceries },
        { name: 'Going Out', value: budgetData.going_Out },
        { name: 'Entertainment', value: budgetData.entertainment },
        { name: 'Travel', value: budgetData.travel },
      ].sort((a, b) => b.value - a.value);

      return `📊 **Your Spending Analysis**\n\nYour biggest expense categories are:\n1. ${categories[0].name}: ${fmtGBP(categories[0].value)}\n2. ${categories[1].name}: ${fmtGBP(categories[1].value)}\n3. ${categories[2].name}: ${fmtGBP(categories[2].value)}\n\n💡 **Tip**: Focus on reducing your top 2 categories by 10-15% to significantly improve your savings!`;
    }

    if (lower.includes('budget') || lower.includes('within budget')) {
      if (spare > 0) {
        return `✅ **Great Job!**\n\nYou're staying within budget! Here's your breakdown:\n\n💰 Income: ${fmtGBP(income)}\n💸 Expenses: ${fmtGBP(expenses)}\n💵 Spare Cash: ${fmtGBP(spare)}\n📈 Savings Rate: ${savingsRate}%\n\n🎯 **Recommendation**: Try to maintain at least 20% savings rate. You're currently at ${savingsRate}%!`;
      } else {
        return `⚠️ **Budget Alert**\n\nYou're overspending by ${fmtGBP(Math.abs(spare))}.\n\n💰 Income: ${fmtGBP(income)}\n💸 Expenses: ${fmtGBP(expenses)}\n\n🔧 **Action Plan**:\n1. Review discretionary spending (entertainment, going out)\n2. Look for subscription services to cancel\n3. Set spending limits for each category`;
      }
    }

    if (lower.includes('save') || lower.includes('saving')) {
      return `💰 **Savings Strategies for You**\n\nBased on your ${fmtGBP(income)} income:\n\n1. **50/30/20 Rule**:\n   • Needs: ${fmtGBP(income * 0.5)}\n   • Wants: ${fmtGBP(income * 0.3)}\n   • Savings: ${fmtGBP(income * 0.2)}\n\n2. **Your Current Situation**:\n   • You're saving: ${fmtGBP(spare)}/month\n   • That's ${savingsRate}% savings rate\n\n3. **Quick Wins**:\n   • Reduce going out by 20%: Save ${fmtGBP(budgetData.going_Out * 0.2)}\n   • Cut entertainment by 15%: Save ${fmtGBP(budgetData.entertainment * 0.15)}`;
    }
  }

  // General responses
  if (lower.includes('reduce') && lower.includes('expense')) {
    return `💡 **Expense Reduction Tips**\n\n1. **Track Everything**: Use the Dashboard to monitor daily spending\n2. **The 30-Day Rule**: Wait 30 days before big purchases\n3. **Subscriptions Audit**: Cancel unused services\n4. **Meal Planning**: Reduce grocery costs by 20-30%\n5. **Smart Shopping**: Use cashback apps and compare prices\n\n🎯 Start with one category and aim for 10% reduction!`;
  }

  if (lower.includes('debt') || lower.includes('loan')) {
    return `💳 **Debt Management Strategy**\n\n**Two Popular Methods:**\n\n1. **Avalanche Method** (Best for math):\n   • Pay minimums on all debts\n   • Extra money to highest interest rate\n   • Saves most money long-term\n\n2. **Snowball Method** (Best for motivation):\n   • Pay minimums on all debts\n   • Extra money to smallest balance\n   • Quick wins keep you motivated\n\n💡 **Pro Tip**: Try negotiating lower interest rates with your lenders!`;
  }

  if (lower.includes('invest') || lower.includes('investment')) {
    return `📈 **Investment Basics**\n\n**Getting Started:**\n1. Emergency fund first (3-6 months expenses)\n2. Pay off high-interest debt\n3. Then start investing\n\n**Options for UK:**\n• **ISA**: Tax-free up to £20,000/year\n• **Pension**: Tax relief + employer matching\n• **Index Funds**: Low-cost, diversified\n\n⚠️ **Important**: Always do your own research or consult a financial advisor before investing!`;
  }

  // Default helpful response
  return `👋 **How Can I Help?**\n\nI can assist you with:\n\n💰 **Budget Analysis** - "Analyze my spending patterns"\n📊 **Expense Tracking** - "What's my biggest expense?"\n💵 **Savings Tips** - "How can I save more money?"\n🎯 **Goal Planning** - "Help me set financial goals"\n💳 **Debt Management** - "Best way to pay off debt?"\n\nTry asking a specific question about your finances!`;
}

/**
 * AI Financial Assistant page with three main features:
 * 1. Chat interface with Gemini AI (fallback to local AI)
 * 2. ML predictions for expenses and spare cash allocation
 * 3. Saved recommendations history
 * 
 * Provides intelligent financial advice using user's budget data
 */
export default function AIPage() {
  const qc = useQueryClient();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      isUser: false,
      message: "👋 Hello! I'm your AI Financial Assistant. I can help you analyze your budget, reduce expenses, and improve your financial health. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'ml' | 'recommendations'>('chat');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCountRef = useRef(0);

  const budgets = useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<BudgetEntry[]> => (await api.get('/api/BudgetEntries')).data,
  });

  const recs = useQuery({
    queryKey: ['ai-recs'],
    queryFn: async (): Promise<SavedRec[]> => (await api.get('/api/AIRecommendations')).data,
  });

  const latest = useMemo(() => {
    if (!budgets.data || budgets.data.length === 0) return null;
    return budgets.data.reduce((prev, cur) => (cur.month > prev.month ? cur : prev));
  }, [budgets.data]);

  const month = useMemo(() => {
    if (!latest) return '';
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][latest.month - 1];
    return m || '';
  }, [latest]);

  const predict = useMutation({
    mutationFn: async () => {
      if (!latest) throw new Error('No budget data yet. Add a month on the Dashboard first.');
      const body: PredictBody = {
        month: latest.month,
        monthly_income: Number(latest.monthly_Income ?? 0),
        rent: Number(latest.rent ?? 0),
        loan_repayment: Number(latest.loan_Repayment ?? 0),
        insurance: Number(latest.insurance ?? 0),
        subscriptions: Number(latest.subscriptions ?? 0),
        groceries: Number(latest.groceries ?? 0),
        travel: Number(latest.travel ?? 0),
        going_out: Number(latest.going_Out ?? 0),
        entertainment: Number(latest.entertainment ?? 0),
        utilities: Number(latest.utilities ?? 0),
        healthcare: Number(latest.healthcare ?? 0),
        education: Number(latest.education ?? 0),
        miscellaneous: Number(latest.miscellaneous ?? 0),
      };
      return await mlPredict(body);
    },
  });

  const allocate = useMutation({
    mutationFn: async () => {
      if (!latest) throw new Error('No budget data yet. Add a month on the Dashboard first.');
      const income = Number(latest.monthly_Income ?? 0);
      const total = Number(latest.total_Expenses ?? 0);

      const body: AllocateBody = {
        spare_cash: Math.max(0, income - total),
        current_expenses: {
          rent: Number(latest.rent ?? 0),
          loan_repayment: Number(latest.loan_Repayment ?? 0),
          insurance: Number(latest.insurance ?? 0),
          subscriptions: Number(latest.subscriptions ?? 0),
          groceries: Number(latest.groceries ?? 0),
          travel: Number(latest.travel ?? 0),
          going_out: Number(latest.going_Out ?? 0),
          entertainment: Number(latest.entertainment ?? 0),
          utilities: Number(latest.utilities ?? 0),
          healthcare: Number(latest.healthcare ?? 0),
          education: Number(latest.education ?? 0),
          miscellaneous: Number(latest.miscellaneous ?? 0),
        },
        monthly_income: income,
        financial_goals: [],
      };

      return await mlAllocate(body);
    },
  });

  const saveRec = useMutation({
    mutationFn: async (text: string) => {
      await api.post('/api/AIRecommendations', { recommendationText: text });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-recs'] }),
  });

  /**
   * Auto-scrolls chat to bottom when new messages arrive
   * Includes safety check to prevent infinite scroll loops
   */
  useEffect(() => {
    if (messageCountRef.current < 100) {
      scrollToBottom();
      messageCountRef.current++;
    }
  }, [chatMessages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Handles chat message submission with AI service fallback
   * Attempts cloud AI first, falls back to local AI if unavailable
   * Implements 8-second timeout for responsive UX
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      isUser: true,
      message: userInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = userInput;
    setUserInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const apiPromise = api.post('/api/Chat/message', { message: currentInput });
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      // Check if response contains error
      if (response.data?.error || response.data?.message?.includes('ServiceUnavailable') || 
          response.data?.message?.includes('API key') || response.data?.message?.includes('overloaded')) {
        throw new Error('API_ERROR');
      }
      
      // Convert $ to £ in the API response
      const messageWithPounds = convertCurrencySymbols(response.data.message);
      
      const aiMsg: ChatMessage = {
        isUser: false,
        message: messageWithPounds,
        timestamp: new Date(response.data.timestamp || new Date())
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error: unknown) {
      console.log('Switching to local AI assistant');
      
      // Friendly message for user
      let errorMessage = '🤖 **Local AI Mode Activated**\n\nI\'m using my built-in knowledge to help you. No internet connection needed!\n\n';
      
      // Check specific error types
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
        
        if (axiosError.response?.status === 503 || 
            axiosError.response?.data?.error?.includes('UNAVAILABLE') ||
            axiosError.response?.data?.message?.includes('overloaded')) {
          errorMessage = '⏰ **AI Service Busy**\n\nThe cloud AI is currently overloaded. Don\'t worry - switching to my local knowledge base!\n\n';
        } else if (axiosError.response?.data?.message?.includes('API key')) {
          errorMessage = '🔑 **Using Offline Mode**\n\nCloud AI unavailable right now. Using my built-in intelligence instead!\n\n';
        }
      } else if (error instanceof Error && error.message === 'Timeout') {
        errorMessage = '⏰ **Response Timeout**\n\nTaking too long to respond. Let me help you with my local knowledge!\n\n';
      }
      
      const localResponse = generateLocalAIResponse(currentInput, latest || undefined);
      
      const aiMsg: ChatMessage = {
        isUser: false,
        message: errorMessage + localResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Clears chat history and resets message counter
   */
  const clearChat = () => {
    setChatMessages([{
      isUser: false,
      message: "👋 Chat cleared! How can I help you with your finances?",
      timestamp: new Date()
    }]);
    messageCountRef.current = 0;
  };

  const latestIncome = Number(latest?.monthly_Income ?? 0);
  const latestExpenses = Number(latest?.total_Expenses ?? 0);
  const latestSpare = Math.max(0, latestIncome - latestExpenses);

  const quickPrompts = [
    'How can I reduce my expenses?',
    "What's my biggest spending category?",
    'Tips for saving more money?',
    'Am I staying within my budget?'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bb-page-title mb-2">🤖 AI Financial Assistant</h1>
            <p className="text-slate-600">Get AI-powered insights, predictions, and personalized advice</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bb-stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="bb-stat-label text-green-100">Income ({month || '—'})</div>
            <div className="bb-stat-value">{fmtGBP(latestIncome)}</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-red-500 to-pink-600 text-white">
            <div className="bb-stat-label text-red-100">Total Expenses</div>
            <div className="bb-stat-value">{fmtGBP(latestExpenses)}</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="bb-stat-label text-indigo-100">Spare Cash</div>
            <div className="bb-stat-value">{fmtGBP(latestSpare)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bb-card p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat Assistant
            </button>
            <button
              onClick={() => setActiveTab('ml')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'ml'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ML Predictions
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'recommendations'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved ({recs.data?.length || 0})
            </button>
          </div>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-2 bb-card flex flex-col" style={{ height: 'calc(100vh - 400px)', maxHeight: '600px' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {chatMessages.slice(-50).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-lg ${
                        msg.isUser 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      }`}>
                        {msg.isUser ? '👤' : '🤖'}
                      </div>

                      {/* Message Bubble */}
                      <div className="flex flex-col">
                        <div className={`rounded-2xl px-4 py-3 shadow-md ${
                          msg.isUser
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-white border-2 border-slate-200 text-slate-900'
                        }`}>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                        </div>
                        <span className={`text-xs text-slate-500 mt-1 px-1 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg">
                        🤖
                      </div>
                      <div className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 shadow-md">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask me anything about your finances..."
                    className="flex-1 bb-input"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !userInput.trim()}
                    className="bb-btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>

                {/* Quick Prompts */}
                <div className="grid grid-cols-2 gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setUserInput(prompt)}
                      disabled={isTyping}
                      className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-sm border border-slate-200 text-slate-700 disabled:opacity-50"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Info Card */}
              <div className="bb-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    🧠
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Powered</h3>
                    <p className="text-sm text-indigo-100">Smart financial advice</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-100">Messages</span>
                    <span className="font-bold">{chatMessages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-100">Budget Data</span>
                    <span className="font-bold">{latest ? '✓ Available' : '✗ None'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bb-card p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={clearChat}
                    className="w-full bb-btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('ml')}
                    className="w-full bb-btn-primary text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    ML Predictions
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bb-card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Pro Tip
                </h3>
                <p className="text-sm text-green-800">
                  The AI works in offline mode! If the cloud AI is busy, you'll automatically get smart responses from the local assistant.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ML Predictions Tab - Keep existing code */}
        {activeTab === 'ml' && (
          <div className="space-y-6">
            {!latest ? (
              <div className="bb-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Budget Data Yet</h3>
                <p className="text-slate-600 mb-6">Add a budget month on the Dashboard to get AI predictions.</p>
              </div>
            ) : (
              <>
                <div className="bb-card p-6">
                  <h2 className="bb-section-title mb-4">ML Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      className="bb-btn-primary h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => predict.mutate()}
                      disabled={predict.isPending}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {predict.isPending ? 'Predicting...' : 'Predict Next Month'}
                    </button>
                    <button
                      className="bb-btn-secondary h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => allocate.mutate()}
                      disabled={allocate.isPending || latestSpare <= 0}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {allocate.isPending ? 'Allocating...' : 'Allocate Spare Cash'}
                    </button>
                  </div>
                  {latestSpare <= 0 && (
                    <p className="text-sm text-orange-600 mt-3 text-center">
                      ⚠️ No spare cash available for allocation.
                    </p>
                  )}
                </div>

                {predict.data && (
                  <div className="bb-card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-4">Prediction Results</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <span className="font-medium text-slate-700">Predicted Total Expenses</span>
                        <strong className="text-2xl text-blue-900">{fmtGBP(predict.data.predicted_total_expenses)}</strong>
                      </div>
                      {predict.data.confidence_level && (
                        <div className={`p-4 rounded-lg ${
                          predict.data.confidence_level === 'high' 
                            ? 'bg-green-100 border-2 border-green-300 text-green-800' 
                            : predict.data.confidence_level === 'medium'
                            ? 'bg-yellow-100 border-2 border-yellow-300 text-yellow-800'
                            : 'bg-red-100 border-2 border-red-300 text-red-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Confidence Level:</span>
                            <span className="uppercase font-bold">{predict.data.confidence_level}</span>
                          </div>
                          {predict.data.percentage_difference && (
                            <p className="text-sm mt-2">±{predict.data.percentage_difference.toFixed(1)}% variance</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {allocate.data && (
                  <div className="bb-card p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Smart Allocation Results</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                        <span className="font-medium text-indigo-900">Total Spare Cash</span>
                        <strong className="text-2xl text-indigo-900">{fmtGBP(allocate.data.total_spare_cash)}</strong>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                        <p className="text-sm font-semibold text-green-900 mb-2">{allocate.data.summary}</p>
                        <p className="text-xs text-green-700">💡 {allocate.data.tip}</p>
                      </div>

                      <div className="space-y-3">
                        {allocate.data.allocations.map((alloc, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${
                              alloc.priority === 'High'
                                ? 'bg-red-50 border-red-300'
                                : alloc.priority === 'Medium'
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-green-50 border-green-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800">{alloc.category}</span>
                              <span className="text-xl font-bold">{fmtGBP(alloc.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-600">{alloc.percentage}% of spare cash</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                alloc.priority === 'High'
                                  ? 'bg-red-200 text-red-800'
                                  : alloc.priority === 'Medium'
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-green-200 text-green-800'
                              }`}>
                                {alloc.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{alloc.reason}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        className="w-full bb-btn-success mt-4"
                        onClick={() => {
                          const text = `Spare Cash Allocation (${month}):\n${allocate.data.allocations
                            .map(a => `• ${a.category}: ${fmtGBP(a.amount)} (${a.percentage}%)`)
                            .join('\n')}\n\n${allocate.data.tip}`;
                          saveRec.mutate(text);
                        }}
                      >
                        Save This Recommendation
                      </button>
                    </div>
                  </div>
                )}

                {!predict.data && !allocate.data && (
                  <div className="bb-card p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-slate-600">Click an action above to get ML-powered insights</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Saved Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="bb-card p-6">
            <h2 className="bb-section-title mb-6">Saved Recommendations</h2>
            {recs.isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : !recs.data || recs.data.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Saved Recommendations</h3>
                <p className="text-slate-600 mb-6">Use ML predictions and save your insights here.</p>
                <button onClick={() => setActiveTab('ml')} className="bb-btn-primary">
                  Go to ML Predictions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recs.data.map((r) => (
                  <div key={r.id} className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200 hover:border-indigo-300 transition shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                        Saved Insight
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(r.generatedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">{r.recommendationText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}