import React from 'react';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import logo from '../assets/logo.svg';
import { ShieldCheck, Heart, Users, MapPin, Award, Info, ExternalLink } from 'lucide-react';

export default function About() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left space-y-12"
    >
      {/* Brand Identity Header Hero */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white border border-neutral-200/80 p-8 rounded-3xl shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full pointer-events-none blur-3xl" />
        
        {/* Brand Logo perfectly framed with clear spacing */}
        <div className="w-[120px] h-[120px] shrink-0 flex items-center justify-center p-2 rounded-2xl bg-[#F8F9FA] border border-neutral-200/40 shadow-xs">
          <img 
            src={logo} 
            alt="Urban Mind Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0FE] border border-[#D2E3FC] text-xs font-bold text-[#1A73E8]">
            <Info className="w-3.5 h-3.5" />
            <span>Official Identity & Core Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-neutral-900">
            Urban Mind Civic Network
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
            A Google Material Design-inspired platform designed to bridge the communications gap between citizens and municipal operations using next-generation telemetry and AI insights.
          </p>
        </div>
      </div>

      {/* Core Values / Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200/80 p-6 rounded-2xl space-y-3 hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">Community Led</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Harnessing the power of crowdsourced civic audits, allowing neighborhoods to self-verify street hazards and drive public works agendas.
          </p>
        </div>

        <div className="bg-white border border-neutral-200/80 p-6 rounded-2xl space-y-3 hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">Algorithmic Trust</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Using mathematically weighted indices and peer consensus protocols to filter and validate municipal reports automatically.
          </p>
        </div>

        <div className="bg-white border border-neutral-200/80 p-6 rounded-2xl space-y-3 hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">Gamified Cooperation</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Earn reputation badges and contribution tier status for high-fidelity spot hazard filings and municipal audit responses.
          </p>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="bg-white border border-neutral-200/80 p-8 rounded-3xl space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-black text-neutral-900 tracking-tight">Our Mission</h3>
          <div className="h-0.5 w-12 bg-blue-600 rounded-full" />
        </div>
        
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-4">
          Urban Mind was founded in 2026 under the vision of public trust, municipal accountability, and environmental resilience. Every reported spot—from potholes and broken signal posts to water leaks and garbage spills—creates a data point on our GIS digital twin, giving public dispatchers exact coordinates and priority ratings to schedule repairs.
        </p>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Through the use of generative technologies and predictive risk algorithms, we identify cascading infrastructure dependencies before they result in major disruptions, protecting our communities and making city operations more proactive, visual, and fair.
        </p>
      </div>

      {/* Technical Specifications */}
      <div className="bg-[#F8F9FA] border border-neutral-200/60 p-6 rounded-2xl space-y-3 font-mono">
        <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">System Specifications</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-neutral-600">
          <div className="flex justify-between border-b border-neutral-200 pb-1.5">
            <span className="text-neutral-400">Rendering Engine:</span>
            <span className="font-semibold text-neutral-800">React + Vite SPA</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200 pb-1.5 sm:border-b-0">
            <span className="text-neutral-400">Design Foundations:</span>
            <span className="font-semibold text-neutral-800">Material Design 3</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200 pb-1.5 sm:pt-1.5">
            <span className="text-neutral-400">AI Intelligence Core:</span>
            <span className="font-semibold text-neutral-800">Gemini 3.5 Flash</span>
          </div>
          <div className="flex justify-between pb-1.5 sm:pt-1.5">
            <span className="text-neutral-400">Mapping Topology:</span>
            <span className="font-semibold text-neutral-800">MapLibre GL GIS</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
