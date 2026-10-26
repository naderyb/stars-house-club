import { siteConfig } from "@/data/site";

/** Builds a WhatsApp link with a pre-filled message.
 *  siteConfig.whatsapp must look like https://wa.me/213XXXXXXXXX */
export function whatsappLink(message: string) {
  const base = siteConfig.whatsapp.replace(/\/$/, "");
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** The message people send us first, so our replies are never "cold" */
export function sayHiMessage(role: "artist" | "visitor", fullName: string) {
  const as = role === "artist" ? "an artist" : "a visitor";
  return `Hi Stars House! I just registered as ${as}: ${fullName.trim()}. What's the result?`;
}
