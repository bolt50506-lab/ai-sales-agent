"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Building2, GitBranch, Inbox, LayoutDashboard, Settings, Target, Users, Workflow } from "lucide-react";

const items=[
  ["/dashboard","Overview",LayoutDashboard],
  ["/icp","ICP",Target],
  ["/company-finder","Companies",Building2],
  ["/leads","Leads",Users],
  ["/campaigns","Campaigns",Workflow],
  ["/inbox","Inbox",Inbox],
  ["/crm","CRM",GitBranch],
  ["/workflows","Workflows",Bot],
  ["/analytics","Analytics",BarChart3],
  ["/settings","Settings",Settings],
] as const;

export function AppShell({children}:{children:ReactNode}){
 const pathname=usePathname();
 return <div className="min-h-screen bg-[#07111f] text-slate-100">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#081321] lg:block">
   <div className="flex h-full flex-col p-4">
    <Link href="/dashboard" className="mb-6 flex items-center gap-3 px-2 py-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Bot size={20}/></span>
      <span><span className="block text-sm font-semibold">AI Sales Agent</span><span className="text-[11px] text-slate-500">Sales intelligence workspace</span></span>
    </Link>
    <nav className="space-y-1">
      {items.map(([href,label,Icon])=><Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${pathname===href||pathname.startsWith(href+"/")?"bg-cyan-400/10 text-cyan-200":"text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Icon size={17}/>{label}</Link>)}
    </nav>
    <div className="mt-auto rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4"><p className="text-xs font-medium text-cyan-300">Local-first mode</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Mock providers are active. Connect real services when ready.</p></div>
   </div>
  </aside>
  <div className="lg:pl-64">
   <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111f]/90 px-4 py-3 backdrop-blur lg:hidden"><Link href="/dashboard" className="text-sm font-semibold">AI Sales Agent</Link></header>
   <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
  </div>
 </div>
}