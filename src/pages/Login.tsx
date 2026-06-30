import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import logo from '../assets/logo.svg';
import { Brain, Mail, Lock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (name: string, email: string, role: 'citizen' | 'official') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('anshdeeep.singh.2006@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<'citizen' | 'official'>('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const name = role === 'citizen' ? 'Anshdeep Singh' : 'City Dispatcher';
      onLogin(name, email, role);
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
      
      {/* Top Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

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
          Welcome to Urban Mind
        </h2>
        <p className="mt-2 text-center text-xs text-neutral-500 font-medium">
          The Civic Intelligence Network • Powered by Gemini AI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-xl border border-neutral-200/50 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Sign in as
              </label>
              <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setRole('citizen');
                    setEmail('anshdeeep.singh.2006@gmail.com');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    role === 'citizen'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Active Citizen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('official');
                    setEmail('dispatch@sfpublicworks.org');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    role === 'official'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  City Official
                </button>
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-neutral-800"
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-neutral-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-neutral-600 font-medium">
                  Remember me
                </label>
              </div>

              <div className="font-medium text-blue-600 hover:text-blue-500">
                <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-55 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-white text-neutral-400 font-semibold tracking-wider">New to the network?</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/signup"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                Create a new citizen account
              </Link>
            </div>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2 text-left">
          <ShieldAlert className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-yellow-800">
            <strong>Demonstration credentials:</strong> Simply press <em>Sign In</em>. Choose the <strong>Active Citizen</strong> role for reporting and gamification, or <strong>City Official</strong> to test the authority triage and resolution features.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
