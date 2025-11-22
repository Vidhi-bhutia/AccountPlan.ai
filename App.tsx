import React, { useState, useCallback, useMemo } from 'react';
import { GeminiService } from './services/geminiService';
import { ChatInterface } from './components/ChatInterface';
import { AccountPlanView } from './components/AccountPlanView';
import { Message, AccountPlan, ChatStatus, PlanSection } from './types';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';

function App() {
  // --- State ---
  // Initialize service once per component lifecycle
  const geminiService = useMemo(() => new GeminiService(), []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your Company Research Assistant. I can help you gather intelligence on companies and generate detailed account plans. \n\nTry saying: **\"Research Eightfold.ai and create an account plan.\"**",
      timestamp: Date.now()
    }
  ]);
  const [status, setStatus] = useState<ChatStatus>(ChatStatus.IDLE);
  const [accountPlan, setAccountPlan] = useState<AccountPlan | null>(null);
  const [isMobilePlanOpen, setIsMobilePlanOpen] = useState(false);

  // --- Callbacks ---
  
  const handlePlanUpdate = useCallback((planUpdate: Partial<AccountPlan>) => {
    setAccountPlan((prev) => {
      const currentSections = prev?.sections || [];
      let newSections = [...currentSections];

      if (planUpdate.sections) {
        planUpdate.sections.forEach((updateSection) => {
          const index = newSections.findIndex(s => s.id === updateSection.id);
          if (index >= 0) {
            // Update existing
            newSections[index] = { ...newSections[index], ...updateSection } as PlanSection;
          } else {
            // Add new
            newSections.push(updateSection as PlanSection);
          }
        });
      }

      return {
        companyName: planUpdate.companyName || prev?.companyName || 'New Company',
        sections: newSections,
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Automatically open plan view on mobile if created for first time
    if (!accountPlan) {
        setIsMobilePlanOpen(true);
    }
  }, [accountPlan]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setStatus(ChatStatus.SEARCHING); // Start with searching status assumption

    try {
      const response = await geminiService.sendMessage(text, (update) => {
        // This callback runs when the model calls the tool
        setStatus(ChatStatus.UPDATING_PLAN);
        handlePlanUpdate(update);
      });

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        groundingSources: response.sources
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an unexpected error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setStatus(ChatStatus.IDLE);
    }
  };

  const handleManualSectionUpdate = (sectionId: string, newContent: string) => {
    setAccountPlan(prev => {
        if (!prev) return null;
        return {
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
        };
    });
  };

  // --- Render ---

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
        {/* Mobile Overlay Toggle for Plan */}
        <div className="md:hidden fixed top-4 right-4 z-50">
            <button 
                onClick={() => setIsMobilePlanOpen(!isMobilePlanOpen)}
                className="bg-white p-2 rounded-full shadow-lg border border-slate-200 text-slate-600"
            >
                {isMobilePlanOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </button>
        </div>

      {/* Left Panel: Chat Interface */}
      <div className={`w-full md:w-[45%] lg:w-[40%] h-full flex flex-col transition-all duration-300 ${isMobilePlanOpen ? 'hidden md:flex' : 'flex'}`}>
        <ChatInterface 
            messages={messages} 
            status={status} 
            onSendMessage={handleSendMessage} 
        />
      </div>

      {/* Right Panel: Account Plan View */}
      <div className={`
        fixed inset-0 z-40 bg-white md:static md:z-0 md:w-[55%] lg:w-[60%] h-full border-l border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isMobilePlanOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <AccountPlanView 
            plan={accountPlan} 
            onUpdateSection={handleManualSectionUpdate} 
        />
      </div>
    </div>
  );
}

export default App;
