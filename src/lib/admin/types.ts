export type Status = "pending" | "accepted" | "rejected";
export type Role = "artist" | "visitor";

export interface AdminRegistration {
  id: string;
  created_at: string;
  role: Role;
  full_name: string;
  stage_name: string | null;
  phone: string;
  email: string | null;
  instagram: string | null;
  why: string;
  art_type: string | null;
  art_type_other: string | null;
  portfolio_url: string | null;
  proof_count: number;
  /** an ID picture is on file (older registrations and expired ones have none) */
  has_id: boolean;
  banned: boolean;
  ban_reason: string | null;
  status: Status;
  reject_reason: string | null;
}

export type DoorPerson = Pick<
  AdminRegistration,
  | "id"
  | "full_name"
  | "stage_name"
  | "role"
  | "status"
  | "phone"
  | "email"
  | "instagram"
  | "has_id"
  | "banned"
  | "ban_reason"
>;
    