import { siteConfig } from "@/data/site";

/** Builds a WhatsApp link with a pre-filled message.
 *  siteConfig.whatsapp must look like https://wa.me/213XXXXXXXXX */
export function whatsappLink(message: string) {
  const base = siteConfig.whatsapp.replace(/\/$/, "");
  return `${base}?text=${encodeURIComponent(message)}`;
}
