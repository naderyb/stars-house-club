import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

const DAY = 24 * 60 * 60 * 1000;

/** Deletes ID pictures that were uploaded but never attached to a registration
 *  (someone abandoned the form), once they are a day old.
 *  IDs that belong to a registration are never touched here. */
export async function purgeOrphanIds() {
  try {
    const supabase = getServiceClient();
    const dayAgo = Date.now() - DAY;

    const folders = await supabase.storage
      .from("ids")
      .list("pending", { limit: 500 });
    if (folders.error) throw folders.error;

    const candidates: string[] = [];
    for (const folder of folders.data ?? []) {
      const files = await supabase.storage
        .from("ids")
        .list(`pending/${folder.name}`);
      if (files.error) throw files.error;
      for (const f of files.data ?? []) {
        const created = f.created_at ? new Date(f.created_at).getTime() : 0;
        if (created && created < dayAgo) {
          candidates.push(`pending/${folder.name}/${f.name}`);
        }
      }
    }

    let removed = 0;
    for (let i = 0; i < candidates.length; i += 100) {
      const batch = candidates.slice(i, i + 100);
      const { data, error } = await supabase
        .from("registrations")
        .select("id_path")
        .in("id_path", batch);
      if (error) throw error;

      const used = new Set((data ?? []).map((r) => r.id_path as string));
      const orphans = batch.filter((p) => !used.has(p));
      if (orphans.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("ids")
          .remove(orphans);
        if (removeError) throw removeError;
        removed += orphans.length;
      }
    }
    return removed;
  } catch (err) {
    console.error("purgeOrphanIds failed:", err);
    return 0;
  }
}
