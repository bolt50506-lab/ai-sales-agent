"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(){
  const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [mode,setMode]=useState<"signin"|"signup">("signin"); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");const supabase=createClient();if(!supabase){setMessage("Supabase is not configured.");setBusy(false);return;}
    const result=mode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/auth/callback"}});
    if(result.error)setMessage(result.error.message);else{setMessage(mode==="signup"?"Check your email to confirm your account.":"Signed in.");if(mode==="signin")router.push("/");}
    setBusy(false);
  }
  return <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[.04] p-8 shadow-2xl"><div className="mb-8"><p className="text-xs uppercase tracking-[.25em] text-cyan-400">AI Sales Agent</p><h1 className="mt-2 text-3xl font-semibold">{mode==="signin"?"Welcome back":"Create your workspace"}</h1><p className="mt-2 text-sm text-white/50">{mode==="signin"?"Sign in to access your sales workspace.":"Create an account to start using Supabase-backed persistence."}</p></div><form onSubmit={submit} className="space-y-4"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-400/50"/><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-400/50"/><button disabled={busy} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy?"Please wait…":mode==="signin"?"Sign in":"Create account"}</button></form>{message&&<p className="mt-4 text-sm text-white/60">{message}</p>}<button onClick={()=>setMode(mode==="signin"?"signup":"signin")} className="mt-6 text-sm text-cyan-300 hover:text-cyan-200">{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button></div></main>;
}
