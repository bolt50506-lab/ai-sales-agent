import { NextResponse } from "next/server";
import { store } from "@/lib/services/store-service";

export async function GET() {
  return NextResponse.json({ icp: store.getICP(), provider: "local" });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const current = store.getICP();
  const icp = store.saveICP({
    ...current,
    industry: typeof body.industry==="string"?body.industry:current.industry,
    location: typeof body.location==="string"?body.location:current.location,
    employees: typeof body.employees==="string"?body.employees:current.employees,
    roles: typeof body.roles==="string"?body.roles:current.roles,
    keywords: typeof body.keywords==="string"?body.keywords:current.keywords,
    updatedAt: new Date().toISOString(),
  });
  store.addEvent({id:`evt-${Date.now()}`,type:"icp_updated",entityId:icp.id,metadata:{industry:icp.industry},createdAt:new Date().toISOString()});
  return NextResponse.json({ icp });
}