import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";

export const runtime = "nodejs";

const id = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("saveCategory"),
    id: id.optional(),
    title: text(60).min(1, "The category needs a name"),
    badge: text(30),
    wide: z.boolean(),
  }),
  z.object({ action: z.literal("deleteCategory"), id }),
  z.object({
    action: z.literal("saveItem"),
    id: id.optional(),
    categoryId: id,
    name: text(80).min(1, "The item needs a name"),
    note: text(60),
    groupLabel: text(40),
    price: z
      .number()
      .int("The price must be a whole number")
      .min(0)
      .max(1_000_000),
    available: z.boolean(),
  }),
  z.object({ action: z.literal("deleteItem"), id }),
  z.object({ action: z.literal("setAvailable"), id, available: z.boolean() }),
  z.object({
    action: z.literal("move"),
    kind: z.enum(["category", "item"]),
    id,
    dir: z.enum(["up", "down"]),
  }),
]);

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest({ roles: ACCESS.menu })))
      return fail("Please sign in again.", 401);

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
      case "saveCategory": {
        const values = {
          title: body.title,
          badge: body.badge || null,
          wide: body.wide,
        };
        const { error } = body.id
          ? await supabase
              .from("menu_categories")
              .update(values)
              .eq("id", body.id)
          : await supabase
              .from("menu_categories")
              .insert({ ...values, sort: await nextSort("menu_categories") });
        if (error) throw error;
        break;
      }

      case "deleteCategory": {
        // items go with it; past orders keep their own copy of names and prices
        const { error } = await supabase
          .from("menu_categories")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "saveItem": {
        const values = {
          category_id: body.categoryId,
          name: body.name,
          note: body.note || null,
          group_label: body.groupLabel || null,
          price: body.price,
          available: body.available,
        };
        const { error } = body.id
          ? await supabase.from("menu_items").update(values).eq("id", body.id)
          : await supabase.from("menu_items").insert({
              ...values,
              sort: await nextSort(
                "menu_items",
                "category_id",
                body.categoryId,
              ),
            });
        if (error) throw error;
        break;
      }

      case "deleteItem": {
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "setAvailable": {
        const { error } = await supabase
          .from("menu_items")
          .update({ available: body.available })
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "move": {
        const table =
          body.kind === "category" ? "menu_categories" : "menu_items";

        let q = supabase
          .from(table)
          .select("id")
          .order("sort")
          .order("created_at");
        if (body.kind === "item") {
          const { data: row } = await supabase
            .from("menu_items")
            .select("category_id")
            .eq("id", body.id)
            .maybeSingle();
          if (!row) return fail("Not found.", 404);
          q = q.eq("category_id", row.category_id);
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

    revalidatePath("/menu"); // the public menu updates right away
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side.", 500);
  }
}
