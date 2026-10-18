import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS, CAN, type Role } from "@/lib/admin/roles";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const id = z.string().uuid();
const tabName = z
  .string()
  .trim()
  .min(1, "Type a name for the tab")
  .max(40, "40 characters maximum");
const itemName = z.string().trim().min(1, "Type what was ordered").max(80);
const price = z
  .number()
  .int("The price must be a whole number")
  .min(0)
  .max(1_000_000);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("openTab"), name: tabName }),
  z.object({ action: z.literal("renameTab"), tabId: id, name: tabName }),
  z.object({ action: z.literal("deleteTab"), tabId: id }),
  z.object({
    action: z.literal("addItem"),
    tabId: id,
    name: itemName,
    price,
    qty: z.number().int().min(1).max(99),
  }),
  z.object({
    action: z.literal("setQty"),
    itemId: id,
    qty: z.number().int().min(0).max(99), // 0 removes the line
  }),
  z.object({
    action: z.literal("payTabs"),
    tabIds: z.array(id).min(1).max(12),
  }),
  z.object({
    action: z.literal("payItems"),
    itemIds: z.array(id).min(1).max(100),
  }),
  z.object({ action: z.literal("closeTab"), tabId: id }),
  z.object({ action: z.literal("undoPay"), tabId: id }),
]);

type Action = z.infer<typeof bodySchema>["action"];

/** Who may do each action. The roles come from lib/admin/roles.ts. */
const WHO: Record<Action, readonly Role[]> = {
  openTab: CAN.takeOrders,
  renameTab: CAN.takeOrders,
  deleteTab: CAN.takeOrders,
  addItem: CAN.takeOrders,
  setQty: CAN.takeOrders,
  payTabs: CAN.pay,
  payItems: CAN.pay,
  closeTab: CAN.pay,
  undoPay: ["admin"],
};

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    const session = await adminFromRequest({ roles: ACCESS.orders });
    if (!session) return fail("Please sign in again.", 401);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 422);
    }

    const body = parsed.data;
    if (!WHO[body.action].includes(session.role)) {
      return fail("Your account isn't allowed to do that.", 403);
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();
    let result: Record<string, unknown> = {};

    switch (body.action) {
      case "openTab": {
        // double tap protection: same name opened by this person in the last 10 seconds
        const { data: recent, error: recentError } = await supabase
          .from("tabs")
          .select("id, name")
          .eq("status", "open")
          .eq("created_by", session.username)
          .gte("created_at", new Date(Date.now() - 10_000).toISOString());
        if (recentError) throw recentError;
        const same = (recent ?? []).find(
          (t) => (t.name as string).toLowerCase() === body.name.toLowerCase(),
        );
        if (same) {
          result = { id: same.id };
          break;
        }

        const { data, error } = await supabase
          .from("tabs")
          .insert({ name: body.name, created_by: session.username })
          .select("id")
          .single();
        if (error) throw error;
        result = { id: data.id };
        break;
      }

      case "renameTab": {
        const { data, error } = await supabase
          .from("tabs")
          .update({ name: body.name })
          .eq("id", body.tabId)
          .eq("status", "open")
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) return fail("Tab not found.", 404);
        break;
      }

      case "deleteTab": {
        const { data: paid, error: paidError } = await supabase
          .from("tab_items")
          .select("id")
          .eq("tab_id", body.tabId)
          .not("paid_at", "is", null)
          .limit(1);
        if (paidError) throw paidError;
        if (paid && paid.length > 0) {
          return fail(
            "This tab already has payments, so it can't be deleted.",
            409,
          );
        }

        const { data, error } = await supabase
          .from("tabs")
          .delete()
          .eq("id", body.tabId)
          .eq("status", "open")
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) return fail("Tab not found.", 404);
        break;
      }

      case "addItem": {
        const { data: tab, error: tabError } = await supabase
          .from("tabs")
          .select("id")
          .eq("id", body.tabId)
          .eq("status", "open")
          .maybeSingle();
        if (tabError) throw tabError;
        if (!tab) return fail("That tab is closed or doesn't exist.", 404);

        // same item, same price, still unpaid, not a shared one: raise the quantity
        const { data: found, error: foundError } = await supabase
          .from("tab_items")
          .select("id, qty")
          .eq("tab_id", body.tabId)
          .eq("name", body.name)
          .eq("price", body.price)
          .is("paid_at", null)
          .limit(1);
        if (foundError) throw foundError;
        const existing = found?.[0];

        const { error } = existing
          ? await supabase
              .from("tab_items")
              .update({
                qty: Math.min(99, (existing.qty as number) + body.qty),
              })
              .eq("id", existing.id)
          : await supabase.from("tab_items").insert({
              tab_id: body.tabId,
              name: body.name,
              price: body.price,
              qty: body.qty,
            });
        if (error) throw error;
        break;
      }

      case "setQty": {
        // paid lines are frozen: they are already in the earnings
        const query =
          body.qty === 0
            ? supabase.from("tab_items").delete()
            : supabase.from("tab_items").update({ qty: body.qty });
        const { data, error } = await query
          .eq("id", body.itemId)
          .is("paid_at", null)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          return fail("That item is already paid or no longer exists.", 409);
        }
        break;
      }

      case "payTabs": {
        const tabIds = Array.from(new Set(body.tabIds));

        const { data: tabs, error: tabsError } = await supabase
          .from("tabs")
          .select("id")
          .in("id", tabIds)
          .eq("status", "open");
        if (tabsError) throw tabsError;
        const openIds = (tabs ?? []).map((t) => t.id as string);
        if (openIds.length === 0)
          return fail("Those tabs are already closed.", 409);

        const { data: paid, error: payError } = await supabase
          .from("tab_items")
          .update({ paid_at: now, paid_by: session.username })
          .in("tab_id", openIds)
          .is("paid_at", null)
          .select("id");
        if (payError) throw payError;
        if (!paid || paid.length === 0) return fail("Nothing to pay yet.", 422);

        const { error: closeError } = await supabase
          .from("tabs")
          .update({ status: "closed", closed_at: now })
          .in("id", openIds);
        if (closeError) throw closeError;

        // an item added in the same second must not vanish on a closed tab: reopen those
        const { data: late, error: lateError } = await supabase
          .from("tab_items")
          .select("tab_id")
          .in("tab_id", openIds)
          .is("paid_at", null);
        if (lateError) throw lateError;
        const lateIds = Array.from(
          new Set((late ?? []).map((i) => i.tab_id as string)),
        );
        if (lateIds.length > 0) {
          const { error } = await supabase
            .from("tabs")
            .update({ status: "open", closed_at: null })
            .in("id", lateIds);
          if (error) throw error;
        }
        break;
      }

      case "payItems": {
        // partial payment: the tab stays open
        const { data, error } = await supabase
          .from("tab_items")
          .update({ paid_at: now, paid_by: session.username })
          .in("id", body.itemIds)
          .is("paid_at", null)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          return fail("Those items were already paid.", 409);
        }
        break;
      }

      case "closeTab": {
        const { data: owed, error: owedError } = await supabase
          .from("tab_items")
          .select("id")
          .eq("tab_id", body.tabId)
          .is("paid_at", null)
          .limit(1);
        if (owedError) throw owedError;
        if (owed && owed.length > 0) {
          return fail("This tab still has unpaid items.", 409);
        }

        const { data, error } = await supabase
          .from("tabs")
          .update({ status: "closed", closed_at: now })
          .eq("id", body.tabId)
          .eq("status", "open")
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) return fail("Tab not found.", 404);
        break;
      }

      case "undoPay": {
        const { data: tab, error: tabError } = await supabase
          .from("tabs")
          .select("closed_at")
          .eq("id", body.tabId)
          .eq("status", "closed")
          .maybeSingle();
        if (tabError) throw tabError;
        if (!tab?.closed_at) return fail("That tab isn't closed.", 404);

        // everything paid in the same action as the closing goes back to "owed"
        const { error: itemsError } = await supabase
          .from("tab_items")
          .update({ paid_at: null, paid_by: null })
          .eq("tab_id", body.tabId)
          .eq("paid_at", tab.closed_at);
        if (itemsError) throw itemsError;

        const { error } = await supabase
          .from("tabs")
          .update({ status: "open", closed_at: null })
          .eq("id", body.tabId);
        if (error) throw error;
        break;
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("tabs route:", err);
    // staff-only route: show the real database message so problems are easy to find
    const e = err as { message?: string; code?: string } | null;
    return fail(
      e?.message
        ? `Database error${e.code ? ` (${e.code})` : ""}: ${e.message}`
        : "Something went wrong on our side.",
      500,
    );
  }
}
