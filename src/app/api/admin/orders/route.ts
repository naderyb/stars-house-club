import { NextResponse } from "next/server";
import { z } from "zod";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const id = z.string().uuid();

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("addTable"),
    number: z
      .number()
      .int("The table number must be a whole number")
      .min(1, "The table number must be 1 or more")
      .max(999),
  }),
  z.object({ action: z.literal("deleteTable"), id }),
  z.object({
    action: z.literal("addItem"),
    tableId: id,
    name: z.string().trim().min(1, "Type what was ordered").max(80),
    price: z
      .number()
      .int("The price must be a whole number")
      .min(0)
      .max(1_000_000),
    qty: z.number().int().min(1).max(99),
  }),
  z.object({
    action: z.literal("setQty"),
    itemId: id,
    qty: z.number().int().min(0).max(99), // 0 removes the line
  }),
  z.object({ action: z.literal("pay"), orderId: id }),
  z.object({ action: z.literal("cancel"), orderId: id }),
  z.object({ action: z.literal("reopen"), orderId: id }),
]);

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

const isDuplicate = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: string }).code === "23505";

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest())) return fail("Please sign in again.", 401);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 422);

    const body = parsed.data;
    const supabase = getServiceClient();

    switch (body.action) {
      case "addTable": {
        const { data: existing, error: lookupError } = await supabase
          .from("restaurant_tables")
          .select("id")
          .eq("number", body.number)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) break;

        const { error } = await supabase
          .from("restaurant_tables")
          .insert({ number: body.number });
        if (error) {
          // A second waiter/browser may have created the same table between
          // the lookup and insert. Treat that request as an idempotent success.
          if (isDuplicate(error)) break;
          throw error;
        }
        break;
      }

      case "deleteTable": {
        const { data: open } = await supabase
          .from("orders")
          .select("id")
          .eq("table_id", body.id)
          .eq("status", "open")
          .limit(1);
        if (open && open.length > 0)
          return fail("This table still has an open order.", 409);

        // paid orders stay in the stats (they keep their own table number)
        const { error } = await supabase
          .from("restaurant_tables")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        break;
      }

      case "addItem": {
        const { data: table } = await supabase
          .from("restaurant_tables")
          .select("id, number")
          .eq("id", body.tableId)
          .maybeSingle();
        if (!table) return fail("Table not found.", 404);

        const findOpen = async () => {
          const { data } = await supabase
            .from("orders")
            .select("id")
            .eq("table_id", table.id)
            .eq("status", "open")
            .limit(1);
          return data?.[0] ?? null;
        };

        let order = await findOpen();
        if (!order) {
          const created = await supabase
            .from("orders")
            .insert({ table_id: table.id, table_label: String(table.number) })
            .select("id")
            .single();
          if (created.error) {
            if (!isDuplicate(created.error)) throw created.error;
            order = await findOpen(); // someone just opened it
          } else {
            order = created.data;
          }
        }
        if (!order) return fail("Could not open the order.", 500);

        // same item and same price on the same order: just raise the quantity
        const { data: found } = await supabase
          .from("order_items")
          .select("id, qty")
          .eq("order_id", order.id)
          .eq("name", body.name)
          .eq("price", body.price)
          .limit(1);
        const existing = found?.[0];

        const { error } = existing
          ? await supabase
              .from("order_items")
              .update({ qty: Math.min(99, existing.qty + body.qty) })
              .eq("id", existing.id)
          : await supabase.from("order_items").insert({
              order_id: order.id,
              name: body.name,
              price: body.price,
              qty: body.qty,
            });
        if (error) throw error;
        break;
      }

      case "setQty": {
        const { error } =
          body.qty === 0
            ? await supabase.from("order_items").delete().eq("id", body.itemId)
            : await supabase
                .from("order_items")
                .update({ qty: body.qty })
                .eq("id", body.itemId);
        if (error) throw error;
        break;
      }

      case "pay": {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("price, qty")
          .eq("order_id", body.orderId);
        if (itemsError) throw itemsError;
        if (!items || items.length === 0)
          return fail("Nothing to pay yet.", 422);

        const total = items.reduce(
          (sum, i) => sum + (i.price as number) * (i.qty as number),
          0,
        );
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "paid", total, paid_at: new Date().toISOString() })
          .eq("id", body.orderId)
          .eq("status", "open")
          .select("id");
        if (error) throw error;
        // Retrying a payment is safe: the original paid order is already
        // included in stats, so do not create another payment record.
        if (!data || data.length === 0) {
          const { data: paidOrder, error: paidError } = await supabase
            .from("orders")
            .select("id")
            .eq("id", body.orderId)
            .eq("status", "paid")
            .maybeSingle();
          if (paidError) throw paidError;
          if (paidOrder) break;
          return fail("Order not found.", 404);
        }
        break;
      }

      case "cancel": {
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", body.orderId)
          .eq("status", "open");
        if (error) throw error;
        break;
      }

      case "reopen": {
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "open", total: 0, paid_at: null })
          .eq("id", body.orderId)
          .eq("status", "paid")
          .select("id");
        if (error) {
          if (isDuplicate(error))
            return fail("That table already has a new open order.", 409);
          throw error;
        }
        if (!data || data.length === 0) return fail("Order not found.", 404);
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("orders route:", err);
    // admin-only route: show the real database message so problems are easy to find
    const e = err as { message?: string; code?: string } | null;
    return fail(
      e?.message
        ? `Database error${e.code ? ` (${e.code})` : ""}: ${e.message}`
        : "Something went wrong on our side.",
      500,
    );
  }
}
