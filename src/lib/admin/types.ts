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
  status: Status;
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
>;
    