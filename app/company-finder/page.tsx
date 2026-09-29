"use client";
import { useState } from "react";
import { Building2, Check, ChevronRight, Filter, MapPin, Search, Users } from "lucide-react";

const data = [
 {id:"c1",name:"Northstar Software",domain:"northstar.example",industry:"SaaS",location:"Austin, TX",employees:54,description:"B2B workflow software company."},
 {id:"c2",name:"Vertex Digital",domain:"vertex.example",industry:"Technology",location:"Dubai, UAE",employees:31,description:"Digital transformation consultancy."},
 {id:"c3",name:"Summit Growth",domain:"summit.example",industry:"Marketing",location:"London, UK",employees:22,description:"Growth marketing agency for B2B brands."}
];

export default function CompanyFinder(){
 const [query,setQuery]=useState("");
 const [industry,setIndustry]=useState("All industries");
 const [selected,setSelected]=useState<string[]>([]);
 const filtered=data.filter(c=>(!query||[c.name,c.domain,c.industry,c.location].join(" ").toLowerCase().includes(query.toLowerCase()))&&(industry==="All industries"||c.industry===industry));
 const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 return <main className="min-h-screen bg-[#07111f] text-slate-100"><div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
 <header className="flex items-center justify-between border-b border-white/10 pb-6"><div><p className="text-xs uppercase tracking-widest text-cyan-300">Prospecting</p><h1 className="mt-1 text-2xl font-semibold">Company Finder</h1></div><a href="/dashboard" className="text-sm text-slate-400 hover:text-white">Dashboard</a></header>
 <div className="grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
 <aside className="rounded-2xl border border-white/10 bg-white/[.035] p-5 h-fit"><div className="flex items-center gap-2 text-sm font-medium"><Filter size={16}/> Filters</div><label className="mt-6 block text-xs text-slate-500">Industry</label><select value={industry} onChange={e=>setIndustry(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b1828] px-3 py-2 text-sm outline-none"><option>All industries</option><option>SaaS</option><option>Technology</option><option>Marketing</option></select><div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4"><p className="text-xs font-medium text-cyan-300">API-ready</p><p className="mt-1 text-xs leading-5 text-slate-500">Local mock data is active. A real provider can be connected later.</p></div></aside>
 <section><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search companies, industries, locations..." className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400/40"/></div><button onClick={()=>setSelected(filtered.map(x=>x.id))} className="rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm">Select all</button></div>
 <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} companies found</span>{selected.length>0&&<span>{selected.length} selected</span>}</div>
 <div className="mt-3 space-y-3">{filtered.map(c=><article key={c.id} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:border-cyan-400/20"><div className="flex gap-4"><button onClick={()=>toggle(c.id)} className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected.includes(c.id)?"border-cyan-400 bg-cyan-400 text-slate-950":"border-white/20"}`}>{selected.includes(c.id)&&<Check size={13}/>}</button><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Building2 size={21}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-medium">{c.name}</h2><p className="mt-1 text-xs text-slate-500">{c.domain}</p></div><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400">{c.industry}</span></div><p className="mt-3 text-sm text-slate-400">{c.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={13}/>{c.location}</span><span className="flex items-center gap-1"><Users size={13}/>{c.employees} employees</span></div></div><ChevronRight className="mt-2 text-slate-700 group-hover:text-cyan-300" size={18}/></div></article>)}</div></section></div>
 </div></main>;
}