import { NextResponse } from "next/server";
import { store } from "@/lib/services/store-service";

export async function GET() {
  const events = store.getEvents();
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});
  return NextResponse.json({ events, counts, provider: "local" });
}

export async function POST(request: Request) {
  const body = await request.json();
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof body.type === "string" ? body.type : "activity",
    entityId: typeof body.entityId === "string" ? body.entityId : "unknown",
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    createdAt: new Date().toISOString(),
  };
  store.addEvent(event);
  return NextResponse.json({ event }, { status: 201 });
}