export type UserRole = 'super_admin' | 'country_manager' | 'district_admin' | 'lawyer' | 'clerk' | 'admin' | 'client';

export interface CaseHistoryEntry {
  date: string;
  actionBy: UserRole | 'petitioner' | 'respondent' | 'court' | 'accused';
  description: string;
}

export interface Case {
  id: number;
  caseNumber: string;
  rawCaseNumber?: string;
  court?: string;
  courtName: string;
  nextDate: string;
  status: string;
  caseType: string;
  petitioner: string;
  respondent: string;
  isUpdated: boolean;
  order?: string;
  petitionerMobile?: string;
  respondentMobile?: string;
  petitionerLawyer?: string;
  respondentLawyer?: string;
  petitionerLawyerMobile?: string[] | string;
  respondentLawyerMobile?: string[] | string;
  petitionerAsstLawyerMobile?: string[] | string;
  respondentAsstLawyerMobile?: string[] | string;
  petitionerClerk?: string;
  respondentClerk?: string;
  petitionerClerkMobile?: string[] | string;
  respondentClerkMobile?: string[] | string;
  petitionerAsstClerkMobile?: string[] | string;
  respondentAsstClerkMobile?: string[] | string;
  petitionerAsstClerk?: string;
  respondentAsstClerk?: string;
  filingDate?: string;
  lastEditedBySide?: string;
  reportedErrorBySide?: string;
  visibility?: 'public' | 'private';
  user_id?: number;
  selectedParty?: 'petitioner' | 'respondent' | 'accused';
  caseYear?: string;
  policeStation?: string;
  district?: string;
  caseSection?: string;
  history?: CaseHistoryEntry[];
  totalRespondents?: string;
  respondentDetails?: { name: string; phone: string; serial: string | number }[];
  additionalOrder?: string;
  documents?: { name: string; type: string; url: string }[];
  clerkCanCall?: boolean;
  lawyerCanCall?: boolean;
  created_at?: string;
}

export interface Notification {
  id: string | number;
  user_id?: string | number;
  title?: string;
  message: string;
  time?: string;
  type?: 'case_update' | 'task_assigned' | 'affiliate_approved' | 'system' | 'hearing' | 'update' | 'task';
  isRead: boolean;
  isGlobal?: boolean;
  created_at?: string;
}

export interface Task {
  id: string | number;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assignedBy?: string;
  caseId?: string | number;
  caseNumber?: string;
  category?: 'attendance' | 'filing' | 'copy' | 'fee' | 'other';
  courtName?: string;
  created_at: string;
}

export interface SupportMessage {
  id: string | number;
  chat_id: string | number;
  sender_id: string | number;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface ArchiveCase {
  id: string | number;
  caseNumber: string;
  courtName: string;
  year: number;
  parties: string;
  result?: string;
  summary?: string;
}

export interface UserMemory {
  id: string | number;
  user_id: string | number;
  content: string;
  category: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
