import React from "react";
import { Building2, Sprout, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, Mail, FileCheck } from "lucide-react";

interface PortalGatewayProps {
  onNavigate: (path: string) => void;
}

export default function PortalGateway({ onNavigate }: PortalGatewayProps) {
  return (
    <div className="min-h-screen bg-[#f4f7f2] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} className="text-emerald-700" /> Tata Steel Foundation &bull; FPC Management System
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1f372d] tracking-tight">
            Enterprise Authentication &amp; Onboarding Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Select your dedicated access gate below. TSF Central Operations and Farmer Producer Companies (FPCs) maintain separate, strictly isolated authentication domains.
          </p>
        </div>

        {/* 2 Primary Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* TSF Admin Gate */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-lg shadow-emerald-950/5 hover:border-emerald-600/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#176b49]" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#176b49] flex items-center justify-center mb-4 border border-emerald-100 group-hover:scale-105 transition-transform">
                <Building2 size={24} />
              </div>
              <div className="text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase mb-1">
                Flow 1 &bull; Central Desk
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">TSF Central Admin Portal</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                TSF Operations team login using username and password. Initiate FPC invitations, review applications, and monitor network compliance.
              </p>

              <div className="space-y-1.5 text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Username &amp; Password authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Flow 2: FPC Invitation Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>TSF National Monitoring Dashboard</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("/tsf/login")}
              className="w-full py-3 px-4 rounded-xl bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              Sign In as TSF Admin <ArrowRight size={14} />
            </button>
          </div>

          {/* FPC Admin Gate */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-lg shadow-emerald-950/5 hover:border-emerald-600/50 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#12583b]" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#12583b] flex items-center justify-center mb-4 border border-emerald-100 group-hover:scale-105 transition-transform">
                <Sprout size={24} />
              </div>
              <div className="text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase mb-1">
                Flow 3 &bull; Company Workspace
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">FPC Administrator Portal</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Nominated FPC Admin login using email and password. Access is strictly restricted to your company's records with zero cross-tenant visibility.
              </p>

              <div className="space-y-1.5 text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Email &amp; Password authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Strict multi-tenant data isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Flow 4: 8-Step Statutory Company Onboarding</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("/fpc/login")}
              className="w-full py-3 px-4 rounded-xl bg-[#12583b] hover:bg-[#0c3e29] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              Sign In as FPC Admin <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Invitation Activation Strip */}
        <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-emerald-200 shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white m-0">Received an email invitation from TSF?</h3>
              <p className="text-xs text-emerald-200 mt-0.5 m-0 leading-relaxed">
                Validate your single-use token, verify your locked email, and create your password to begin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/onboard/activate")}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-[#176b49] hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
          >
            Activate Invited Account <ArrowRight size={14} />
          </button>
        </div>

        {/* Flow Architecture Map */}
        <div className="mt-8 p-4 bg-white/70 border border-slate-200/80 rounded-xl text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
            Connected Four-Flow Architecture
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-700">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">1. TSF Admin Login</span>
            <span className="text-slate-400">&rarr;</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">2. FPC Invitation Management</span>
            <span className="text-slate-400">&rarr;</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">3. Activate &amp; FPC Login</span>
            <span className="text-slate-400">&rarr;</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">4. Existing FPC Onboarding</span>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        FPC Development Project, supported by Citibank. Implemented with Tata Steel Foundation.
      </footer>
    </div>
  );
}

