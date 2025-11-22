import React, { useRef, useEffect } from 'react';
import { Message, ChatStatus, GroundingSource } from '../types';
import { Send, Bot, User, Loader2, ExternalLink, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  status: ChatStatus;
  onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, status, onSendMessage }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== ChatStatus.IDLE) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Research Agent</h1>
            <p className="text-xs text-slate-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                 {msg.role === 'model' ? (
                   <div className="prose prose-sm max-w-none prose-blue dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                   </div>
                 ) : (
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                 )}
              </div>

              {/* Grounding Sources */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.groundingSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {status !== ChatStatus.IDLE && (
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-500 font-medium">
                        {status === ChatStatus.SEARCHING ? 'Researching sources...' : 
                         status === ChatStatus.UPDATING_PLAN ? 'Updating account plan...' : 
                         'Thinking...'}
                    </span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to research a company (e.g., 'Research Eightfold.ai')..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm transition-all"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            disabled={status !== ChatStatus.IDLE}
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== ChatStatus.IDLE}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-2">
            AI can make mistakes. Please review generated plans.
        </p>
      </div>
    </div>
  );
};
