import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import AIChatAssistant from '../components/AIChatAssistant';
import GeminiVisionScanner from '../components/GeminiVisionScanner';
import { Bot, HelpCircle, ShieldCheck, Sparkles, AlertCircle, MessageSquare, Camera } from 'lucide-react';
import { Issue } from '../types';

interface AIAssistantProps {
  issues: Issue[];
  user: { name: string; email: string; role: 'citizen' | 'official' } | null;
}

export default function AIAssistant({ issues, user }: AIAssistantProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'vision'>('chat');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSuggest = (presetText: string) => {
    // If they ask to draft or suggest a preset, let's redirect them to report-issue with that preset context
    navigate(`/report-issue?draft=${encodeURIComponent(presetText)}`);
  };

  const triggerChatQuery = (text: string) => {
    setActivePreset(text);
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left"
    >
      
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span>Gemini Hub & Vision Center</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Consult the AI chatbot copilot or upload images to trigger cognitive structural threat analysis instantly.
          </p>
        </div>

        {/* Sliding Tab Controller */}
        <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-bold self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'vision' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Vision Scanner</span>
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
          <AIChatAssistant 
            onSuggestPreset={handleSuggest} 
            issues={issues}
            user={user}
            triggerPreset={activePreset}
            onClearPreset={() => setActivePreset(null)}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <GeminiVisionScanner />
        </div>
      )}

    </motion.div>
  );
}
