import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Issue } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Compass, 
  MapPin, 
  Activity, 
  ArrowUpRight, 
  RotateCcw, 
  ShieldCheck, 
  ChevronRight,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

interface AIChatAssistantProps {
  onSuggestPreset?: (presetText: string) => void;
  issues: Issue[];
  user: { name: string; email: string; role: 'citizen' | 'official' } | null;
  triggerPreset?: string | null;
  onClearPreset?: () => void;
}

const PRESET_CARDS = [
  {
    title: "Nearby unresolved issues",
    desc: "Discover active potholes, leaks, and street hazards close to Dolores Park.",
    query: "Show nearby unresolved issues",
    icon: <Compass className="w-4 h-4 text-blue-500" />
  },
  {
    title: "Why is my issue pending",
    desc: "Verify repair status and learn how Community Trust Scores speed up dispatch.",
    query: "Why is my issue pending",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
  },
  {
    title: "Highest risk zones",
    desc: "Analyze live hazard concentrations and predictive infrastructure risks.",
    query: "Which area has the highest risk",
    icon: <Activity className="w-4 h-4 text-orange-500" />
  },
  {
    title: "Community health summary",
    desc: "Check the current efficiency metrics, average trust index, and progress.",
    query: "Show community health summary",
    icon: <Sparkles className="w-4 h-4 text-purple-500" />
  }
];

export default function AIChatAssistant({ 
  onSuggestPreset, 
  issues, 
  user, 
  triggerPreset, 
  onClearPreset 
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hello! I am your Urban Mind Assistant, powered by Gemini. Ask me anything about reporting issues, reputation badges, or how city councils triage public works orders!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFollowUps, setActiveFollowUps] = useState<string[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clears conversation back to initial state
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: "Hello! I am your Urban Mind Assistant, powered by Gemini. Ask me anything about reporting issues, reputation badges, or how city councils triage public works orders!",
        timestamp: new Date().toISOString()
      }
    ]);
    setActiveFollowUps([]);
    setStreamingMessageId(null);
    setIsLoading(false);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setActiveFollowUps([]);
    setStreamingMessageId(null);

    try {
      const chatPayload = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: chatPayload,
          issues,
          user
        })
      });

      const data = await res.json();
      const fullText = data.text || "I was unable to compile a text formulation. Please retry.";

      // Dynamically establish follow-up recommendations based on content triggers
      let followUps = ["What is my next level badge?", "Tell me about Dolores Park risk index", "How can I earn double XP?"];
      const lowerText = fullText.toLowerCase();
      if (lowerText.includes("pothole") || lowerText.includes("road") || lowerText.includes("asphalt")) {
        followUps = ["How are potholes prioritized?", "Report a pothole nearby", "What is the dispatch SLA?"];
      } else if (lowerText.includes("water") || lowerText.includes("leak") || lowerText.includes("pipe")) {
        followUps = ["Who handles water main repairs?", "View active leaks on map", "What is a critical urgency score?"];
      } else if (lowerText.includes("reputation") || lowerText.includes("xp") || lowerText.includes("badge") || lowerText.includes("level")) {
        followUps = ["Show level progression table", "What actions award the most XP?", "How are verifications calculated?"];
      }

      // Create an empty message that we will stream words into
      const messageId = `ai-${Date.now()}`;
      const aiMsgPlaceholder: ChatMessage = {
        id: messageId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsgPlaceholder]);
      setIsLoading(false); // turn off loading animation so typed characters can flow
      setStreamingMessageId(messageId);

      const words = fullText.split(' ');
      let currentIdx = 0;
      let currentText = '';

      const interval = setInterval(() => {
        if (currentIdx < words.length) {
          currentText += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
          setMessages(prev => 
            prev.map(msg => msg.id === messageId ? { ...msg, text: currentText } : msg)
          );
          currentIdx++;
        } else {
          clearInterval(interval);
          setStreamingMessageId(null);
          setActiveFollowUps(followUps);
        }
      }, 30); // Fast, fluent word stream

    } catch (e) {
      console.error(e);
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: "I met connection delays communicating with my Gemini intelligence base. Please ensure your API keys or fallback server loops are intact.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (triggerPreset) {
      handleSendMessage(triggerPreset);
      onClearPreset?.();
    }
  }, [triggerPreset]);

  const formSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Helper to dynamically extract related issue source cards
  const findRelatedIssues = (text: string): Issue[] => {
    if (!text) return [];
    const lower = text.toLowerCase();
    
    return issues.filter(issue => {
      const titleMatch = lower.includes(issue.title.toLowerCase());
      const locationMatch = lower.includes(issue.locationName.toLowerCase());
      const categoryMatch = (
        (lower.includes("pothole") && issue.category === "pothole") ||
        (lower.includes("garbage") && issue.category === "garbage") ||
        (lower.includes("waste") && issue.category === "garbage") ||
        (lower.includes("leak") && issue.category === "water_leak") ||
        (lower.includes("water") && issue.category === "water_leak") ||
        (lower.includes("streetlight") && issue.category === "broken_streetlight") ||
        (lower.includes("light") && issue.category === "broken_streetlight") ||
        (lower.includes("graffiti") && issue.category === "graffiti") ||
        (lower.includes("paint") && issue.category === "graffiti") ||
        (lower.includes("tree") && issue.category === "tree_hazard") ||
        (lower.includes("hazard") && issue.category === "tree_hazard")
      );
      
      return (titleMatch || locationMatch || categoryMatch) && issue.status !== "resolved";
    }).slice(0, 3);
  };

  const isInitialWelcome = messages.length === 1 && messages[0].id === 'welcome-msg';

  return (
    <div className="bg-white/90 dark:bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl overflow-hidden flex flex-col h-[580px] sm:h-[680px] md:h-[720px] transition-all relative">
      
      {/* Seamless Minimalist Header Bar */}
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between shrink-0 bg-white/40 dark:bg-neutral-950/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shadow-inner">
            <Sparkles className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <span>Civic Agent AI</span>
              <span className="text-[9px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full uppercase leading-3">
                gemini-3.5
              </span>
            </h3>
          </div>
        </div>

        {/* Clear / Reset Conversation */}
        <button 
          onClick={handleClearChat}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all cursor-pointer"
          title="Reset chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Yard */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-8 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
      >
        <AnimatePresence mode="wait">
          {isInitialWelcome ? (
            /* Gemini-style Gorgeous Centered Greeting & Suggestion Chips */
            <motion.div
              key="welcome-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center py-8 text-center max-w-2xl mx-auto space-y-10 h-full"
            >
              <div className="space-y-3.5">
                <h1 className="text-4xl md:text-5xl font-sans font-medium tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent leading-none">
                  Hello, {user?.name || "Neighbor"}.
                </h1>
                <h2 className="text-2xl md:text-3xl font-sans font-light text-neutral-400 dark:text-neutral-500 tracking-tight leading-tight">
                  How can I help you shape the community today?
                </h2>
              </div>

              {/* Suggestion Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {PRESET_CARDS.map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSendMessage(card.query)}
                    className="p-4 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-neutral-900 shadow-xs hover:shadow-md rounded-2xl transition-all duration-300 cursor-pointer text-left flex flex-col justify-between group h-28"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors shadow-xs">
                        {card.icon}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Active Conversational Flow */
            <motion.div 
              key="chat-thread"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'assistant';
                const relatedIssues = isBot ? findRelatedIssues(msg.text) : [];
                const isLastMsg = index === messages.length - 1;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                    className={`flex gap-4 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* Glowing Sparkle Avatar for AI, Minimal Circle for User */}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      isBot 
                        ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 text-white shadow-md' 
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
                    }`}>
                      {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="space-y-3 flex-1 overflow-hidden">
                      {/* Name Header */}
                      <div className={`flex items-center gap-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ${!isBot && 'justify-end'}`}>
                        <span>{isBot ? "Civic Agent" : (user?.name || "You")}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Chat Bubbles */}
                      <div className={`text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 ${
                        isBot 
                          ? 'bg-transparent text-[14px]' // Seamless white canvas background for AI (Gemini theme)
                          : 'bg-neutral-100 dark:bg-neutral-800/80 px-4 py-2.5 rounded-2xl max-w-max ml-auto text-right text-[13px] border border-neutral-200/40 dark:border-neutral-700/40'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Word-streaming Cursor blinker */}
                        {msg.id === streamingMessageId && (
                          <span className="inline-block w-2 h-4.5 ml-1 bg-indigo-500 animate-pulse rounded-xs align-middle" />
                        )}
                      </div>

                      {/* Dynamic Related Source Cards */}
                      {isBot && relatedIssues.length > 0 && (
                        <div className="space-y-2 mt-2 pt-1 border-t border-dashed border-neutral-100 dark:border-neutral-800">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>Referenced Community Sources ({relatedIssues.length})</span>
                          </span>
                          
                          <div className="flex gap-3 overflow-x-auto pb-1.5 no-scrollbar max-w-full">
                            {relatedIssues.map(issue => (
                              <motion.div
                                key={issue.id}
                                whileHover={{ scale: 1.02, y: -1 }}
                                className="p-3 bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl flex flex-col justify-between shrink-0 w-64 shadow-xs text-left"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500">
                                      {issue.category}
                                    </span>
                                    <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                                      issue.severity === 'critical' ? 'bg-red-55 border border-red-100 text-red-600' :
                                      issue.severity === 'high' ? 'bg-orange-55 border border-orange-100 text-orange-600' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate mt-1.5">
                                    {issue.title}
                                  </h5>
                                  <p className="text-[10px] text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span>{issue.locationName}</span>
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-Up In-line suggestions under the last AI response */}
                      {isBot && isLastMsg && activeFollowUps.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pt-4 pb-1.5 scrollbar-none text-left">
                          {activeFollowUps.map((prompt, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleSendMessage(prompt)}
                              className="px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <span>💬 {prompt}</span>
                              <ChevronRight className="w-3 h-3 text-indigo-400" />
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator bubble */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-3xl mr-auto pt-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 text-white shadow-md flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1 pt-1.5">
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                <span>Gemini is thinking</span>
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
              <div className="relative w-64 sm:w-72 h-16 rounded-2xl overflow-hidden bg-neutral-100/60 dark:bg-neutral-850/40 border border-neutral-200/40 dark:border-neutral-800/45 flex flex-col justify-center px-4 space-y-2.5">
                {/* Glowing fluid animated gradient bars */}
                <div className="relative h-2 w-11/12 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-800/50">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-pink-500 rounded-full"
                  />
                </div>
                <div className="relative h-2 w-3/4 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-800/50">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear", delay: 0.3 }}
                    className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-purple-500 via-pink-500 via-orange-400 to-blue-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input prompt container bar footer */}
      <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/60 shrink-0 bg-white/60 dark:bg-neutral-950/30">
        <form onSubmit={formSubmission} className="max-w-3xl mx-auto relative flex items-center">
          
          <div className="absolute left-4.5 text-neutral-400">
            <Sparkles className="w-4.5 h-4.5 text-neutral-400 dark:text-neutral-500" />
          </div>

          <input
            type="text"
            disabled={isLoading}
            placeholder="Ask anything about reports, badging, dispatch SLA, rules..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full text-xs bg-neutral-50/80 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 focus:border-indigo-500/80 dark:focus:border-indigo-500/80 rounded-full pl-12 pr-14 py-4.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 placeholder-neutral-400 dark:placeholder-neutral-500 disabled:opacity-60 transition-all font-medium text-neutral-800 dark:text-neutral-100"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-2 px-4.5 py-2.5 rounded-full text-white transition-all cursor-pointer flex items-center justify-center ${
              (!inputValue.trim() || isLoading)
                ? 'bg-neutral-150 text-neutral-400 dark:bg-neutral-800/40 dark:text-neutral-600'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
