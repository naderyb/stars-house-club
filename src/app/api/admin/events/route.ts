import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fromLocalInput } from "@/lib/admin/eventTypes";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";

export const runtime = "nodejs";

const id = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const local = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a valid date and time");

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    id: id.optional(),
    title: text(80).min(1, "The event needs a title"),
    category: text(30).min(1, "Give the event a category"),
    description: text(600).min(1, "Add a short description"),
    price: text(30),
    link: text(300).refine((v) => v === "" || /^https?:\/\//i.test(v), {
      message: "The link must start with https://",
    }),
    image: text(500).refine((v) => v === "" || /^(https:\/\/|\/)/.test(v), {
      message: "Invalid poster",
    }),
    announce: z.boolean(),
    start: local,
    end: z.union([local, z.literal("")]),
  }),
  z.object({ action: z.literal("delete"), id }),
]);

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest({ roles: ACCESS.events })))
      return fail("Please sign in again.", 401);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 422);

    const body = parsed.data;
    const supabase = getServiceClient();

    if (body.action === "save") {
      if (body.end && body.end <= body.start)
        return fail("The end must be after the start.", 422);

      const values = {
        title: body.title,
        category: body.category,
        description: body.description,
        price: body.price || null,
        link: body.link || null,
        image: body.image || null,
        announce: body.announce,
        start_at: fromLocalInput(body.start),
        end_at: body.end ? fromLocalInput(body.end) : null,
      };
      const { error } = body.id
        ? await supabase.from("events").update(values).eq("id", body.id)
        : await supabase.from("events").insert(values);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", body.id);
      if (error) throw error;
    }

    revalidatePath("/events");
    revalidatePath("/api/events"); // feeds the banner on Home and Menu
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side.", 500);
  }
}
