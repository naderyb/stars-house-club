export type Decision = "accepted" | "rejected";
export type ReviewRole = "artist" | "visitor";

const ROLE = {
  artist: { en: "Artist", fr: "Artiste" },
  visitor: { en: "Visitor", fr: "Visiteur" },
} as const;

const REJECTION = {
  artist: {
    en: "Unfortunately, we are afraid to inform you that at this moment we have no more place available, but don't worry, you can apply again, and hopefully we won't be full. Until then, keep shining!",
    fr: "Malheureusement, nous avons le regret de vous informer que nous n'avons plus de place disponible pour le moment, mais ne vous inquiétez pas, vous pouvez postuler à nouveau, et nous espérons ne pas être complets. D'ici là, continuez à briller !",
  },
  visitor: {
    en: "Unfortunately, we cannot have you among us due to the lack of space in the house. We received a lot of applications and it was not easy for us to send this message. But don't worry, apply again and hopefully we will have enough space for you to visit us and live the moment. Until then, keep shining!",
    fr: "Malheureusement, nous ne pouvons pas vous accueillir parmi nous en raison du manque de place dans la maison. Nous avons reçu beaucoup de candidatures et il n'a pas été facile pour nous d'envoyer ce message. Mais ne vous inquiétez pas, postulez à nouveau et nous espérons avoir assez de place pour que vous nous rendiez visite et viviez l'instant. D'ici là, continuez à briller !",
  },
} as const;

/** English first, then French, in one message */
export function buildMessage(
  decision: Decision,
  role: ReviewRole,
  fullName: string,
) {
  const name = fullName.trim().split(/\s+/)[0];
  const r = ROLE[role];

  if (decision === "accepted") {
    return [
      `Hello ${name}, Stars House Club is delighted to inform you that you have been accepted as ${r.en} at Stars House Club. Bring your energy and come let us know you (don't forget your ID).`,
      `Bonjour ${name}, Stars House Club a le plaisir de vous informer que vous avez été accepté(e) en tant que ${r.fr} à Stars House Club. Apportez votre énergie et venez nous rencontrer (n'oubliez pas votre pièce d'identité).`,
    ].join("\n\n");
  }

  return [
    `Hello ${name}, we have reviewed your application for: ${r.en}. ${REJECTION[role].en}`,
    `Bonjour ${name}, nous avons examiné votre candidature pour : ${r.fr}. ${REJECTION[role].fr}`,
  ].join("\n\n");
}

/** phone is stored as +213XXXXXXXXX, wa.me wants digits only */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
