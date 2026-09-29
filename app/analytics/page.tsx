"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, Mail, MessageCircle, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type EventCounts=Record<string,number>;
type Campaign={id:string;name:string;status:string;audienceSize:number;steps:number;sent:number;replies:number;meetings:number};

export default function Analytics(){
 const [counts,setCounts]=useState<EventCounts>({});
 const [campaigns,setCampaigns]=useState<Campaign[]>([]);
 useEffect(()=>{
  Promise.all([fetch("/api/analytics").then(r=>r.json()),fetch("/api/campaigns").then(r=>r.json())])
   .then(([a,c])=>{setCounts(a.counts??{});setCampaigns(c.campaigns??[])})
   .catch(()=>{});
 },[]);
 const metrics=[
  ["Companies discovered",String(counts.company_search??0),"Search events",Users],
  ["Emails queued",String(counts.campaign_run??0),"Campaign runs",Mail],
  ["Replies sent",String(counts.reply_sent??0),"Inbox activity",MessageCircle],
  ["Meetings",String(counts.meeting_created??0),"Recorded events",BarChart3],
 ] as const;
 return <AppShell><div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
  <header className="flex items-center justify-between border-b border-white/10 pb-6"><div><p className="text-xs uppercase tracking-widest text-cyan-300">Performance</p><h1 className="mt-1 text-2xl font-semibold">Analytics</h1><p className="mt-2 text-sm text-slate-500">Live metrics from the current local workspace.</p></div><a href="/dashboard" className="text-sm text-slate-400">Dashboard</a></header>
  <section className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label,value,detail,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><Icon size={18} className="text-cyan-300"/><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500">{detail}<ArrowUpRight size={12}/></p></div>)}</section>
  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><h2 className="font-medium">Campaign performance</h2><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="pb-3">Campaign</th><th className="pb-3">Status</th><th className="pb-3">Audience</th><th className="pb-3">Steps</th><th className="pb-3">Sent</th><th className="pb-3">Replies</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id} className="border-t border-white/5"><td className="py-4">{c.name}</td><td className="py-4 text-slate-400">{c.status}</td><td className="py-4 text-slate-400">{c.audienceSize}</td><td className="py-4 text-slate-400">{c.steps}</td><td className="py-4 text-slate-400">{c.sent}</td><td className="py-4 text-cyan-300">{c.replies}</td></tr>)}</tbody></table>{campaigns.length===0&&<p className="py-8 text-center text-sm text-slate-600">No campaign data yet.</p>}</div></section>
 </div></AppShell>;
}