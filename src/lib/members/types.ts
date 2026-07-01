export type MemberStatus = "active" | "inactive";

export type Nominee = {
  id: string;
  member_id: string;
  nominee_name: string;
  nominee_phone: string | null;
  relation: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Member = {
  id: string;
  profile_id: string | null;
  member_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  nid: string | null;
  permanent_address: string | null;
  present_address: string | null;
  joining_date: string | null;
  status: MemberStatus;
  goal: string | null;
  created_at: string;
  updated_at: string;
};

export type MemberWithNominee = Member & {
  nominee: Nominee | null;
};
