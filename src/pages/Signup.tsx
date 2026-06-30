import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import logo from '../assets/logo.svg';
import { Brain, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface SignupProps {
  onLogin: (name: string, email: string, role: 'citizen' | 'official') => void;
}

export default function Signup({ onLogin }: SignupProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      onLogin(userName || 'Anonymous Hero', email || 'guest@hero.net', 'citizen');
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

      <div className="sm:mx-auto w-full max-w-md z-10">
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="Urban Mind Logo" 
            className="h-16 w-auto object-contain select-none" 
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-sans font-extrabold text-neutral-900 tracking-tight">
          Join the Urban Mind Network
        </h2>
        <p className="mt-2 text-center text-xs text-neutral-500 font-medium">
          Start earning reputation points while protecting your neighborhood
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-xl border border-neutral-200/50 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Full Name field */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-neutral-800"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-neutral-800"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-neutral-800"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="flex items-center text-xs text-neutral-600 gap-2 p-1 font-medium bg-neutral-50 rounded-xl border border-neutral-200/30 p-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>By joining, you pledge to submit authentic, factual reports to prevent municipal backlog interference.</span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-neutral-200/80 pt-4 text-center">
            <span className="text-xs text-neutral-500 font-medium mr-1.5">Have an established account?</span>
            <Link
              to="/login"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Sign back in
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
