import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const id = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("saveWorkshop"),
    id: id.optional(),
    title: text(60).min(1, "The workshop needs a name"),
    ar: text(40),
    blurb: text(300),
    materials: text(80),
    visible: z.boolean(),
  }),
  z.object({ action: z.literal("deleteWorkshop"), id }),
  z.object({ action: z.literal("setVisible"), id, visible: z.boolean() }),
  z.object({
    action: z.literal("saveOption"),
    id: id.optional(),
    workshopId: id,
    name: text(80).min(1, "The option needs a name"),
    note: text(40),
    price: z
      .number()
      .int("The price must be a whole number")
      .min(0)
      .max(1_000_000),
    addOn: z.boolean(),
  }),
  z.object({ action: z.literal("deleteOption"), id }),
  z.object({
    action: z.literal("move"),
    kind: z.enum(["workshop", "option"]),
    id,
    dir: z.enum(["up", "down"]),
  }),
]);

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest())) return fail("Please sign in again.", 401);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 422);

    const body = parsed.data;
    const supabase = getServiceClient();

    /** next free position at the end of a list */
    const nextSort = async (table: string, column?: string, value?: string) => {
      let q = supabase
        .from(table)
        .select("sort")
        .order("sort", { ascending: false })
        .limit(1);
      if (column && value) q = q.eq(column, value);
      const { data } = await q;
      return (data?.[0]?.sort ?? 0) + 1;
    };

    switch (body.action) {
      case "saveWorkshop": {
        const values = {
          title: body.title,
          title_ar: body.ar || null,
          blurb: body.blurb,
          materials: body.materials || null,
          active: body.visible,
        };
        const { error } = body.id
          ? await supabase.from("workshops").update(values).eq("id", body.id)
          : await supabase
              .from("workshops")
              .insert({ ...values, sort: await nextSort("workshops") });
        if (error) throw error;
        break;
      }

      case "deleteWorkshop": {
        // its options go with it
        const { error } = await supabase
          .from("workshops")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "setVisible": {
        const { error } = await supabase
          .from("workshops")
          .update({ active: body.visible })
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "saveOption": {
        const values = {
          workshop_id: body.workshopId,
          name: body.name,
          note: body.note || null,
          price: body.price,
          add_on: body.addOn,
        };
        const { error } = body.id
          ? await supabase
              .from("workshop_options")
              .update(values)
              .eq("id", body.id)
          : await supabase.from("workshop_options").insert({
              ...values,
              sort: await nextSort(
                "workshop_options",
                "workshop_id",
                body.workshopId,
              ),
            });
        if (error) throw error;
        break;
      }

      case "deleteOption": {
        const { error } = await supabase
          .from("workshop_options")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "move": {
        const table =
          body.kind === "workshop" ? "workshops" : "workshop_options";

        // workshop_options has no created_at column
        let q = supabase.from(table).select("id").order("sort");
        if (body.kind === "workshop") q = q.order("created_at");
        if (body.kind === "option") {
          const { data: row } = await supabase
            .from("workshop_options")
            .select("workshop_id")
            .eq("id", body.id)
            .maybeSingle();
          if (!row) return fail("Not found.", 404);
          q = q.eq("workshop_id", row.workshop_id);
        }

        const { data: siblings, error } = await q;
        if (error) throw error;

        const ids = (siblings ?? []).map((s) => s.id as string);
        const i = ids.indexOf(body.id);
        const j = body.dir === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= ids.length) break;

        [ids[i], ids[j]] = [ids[j], ids[i]];
        // renumber the whole list, so duplicated positions can never get stuck
        const results = await Promise.all(
          ids.map((sid, idx) =>
            supabase
              .from(table)
              .update({ sort: idx + 1 })
              .eq("id", sid),
          ),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
        break;
      }
    }

    revalidatePath("/workshops"); // the public page updates right away
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side.", 500);
  }
}
