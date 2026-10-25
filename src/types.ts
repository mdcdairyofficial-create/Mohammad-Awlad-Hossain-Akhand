export type UserRole = 'super_admin' | 'country_manager' | 'district_admin' | 'bar_admin' | 'lawyer' | 'clerk' | 'admin' | 'client' | 'bar_association' | 'advertiser';

export interface CaseHistoryEntry {
  id?: string;
  date: string;
  actionBy: UserRole | 'petitioner' | 'respondent' | 'court' | 'accused';
  description: string;
  order?: string;
  step?: string;
  status?: string;
  nextDate?: string;
  accusedPhoto?: string;
  petitionerPhoto?: string;
  documents?: { name: string; type: string; url: string }[];
}

export interface Case {
  id: string | number;
  caseNumber: string;
  rawCaseNumber?: string;
  court?: string;
  courtName: string;
  courtNumber?: string;
  nextDate: string;
  status: string;
  caseType: string;
  petitioner: string;
  respondent: string;
  isUpdated: boolean;
  order?: string;
  petitionerMobile?: string;
  petitionerSecondaryMobile?: string;
  respondentMobile?: string;
  respondentSecondaryMobile?: string;
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
  lastDate?: string;
  lastEditedBySide?: string;
  reportedErrorBySide?: string;
  visibility?: 'public' | 'private';
  user_id?: string | number;
  selectedParty?: 'petitioner' | 'respondent' | 'accused';
  selectedPartyAccess?: 'our_side' | 'all_sides';
  isUpdatedToday?: boolean;
  lastEditedDate?: string;
  caseYear?: string;
  policeStation?: string;
  district?: string;
  caseSection?: string;
  history?: CaseHistoryEntry[];
  pastDates?: string[];
  totalRespondents?: string;
  petitionerDetails?: { name: string; phone: string; optionalPhone?: string; serial: string | number; addedByMobile?: string; addedByName?: string; addedByRole?: string }[];
  respondentDetails?: { name: string; phone: string; optionalPhone?: string; serial: string | number; addedByMobile?: string; addedByName?: string; addedByRole?: string }[];
  additionalOrder?: string;
  documents?: { name: string; type: string; url: string }[];
  clerkCanCall?: boolean;
  lawyerCanCall?: boolean;
  synced_by_users?: string[];
  hasConflictWarning?: boolean;
  created_at?: any;
  priority?: 'low' | 'medium' | 'high';
  date?: string;
  details?: string;
  authorityHolder?: 'lawyer' | 'clerk';
  assignedAssociateId?: string;
  assignedAssociateName?: string;
  assignedAssociateMobile?: string;
  assignedAssociateRole?: string;
  assignedClerkAssistantId?: string;
  assignedClerkAssistantName?: string;
  assignedClerkAssistantMobile?: string;
  assignedClerkAssistantRole?: string;
  caseNotes?: CaseNote[];
}

export interface CaseNote {
  id: string;
  text: string;
  authorName: string;
  authorMobile?: string;
  authorRole?: string;
  date: string;
  createdAt?: any;
}

export interface ChamberAssociate {
  id: string;
  name: string;
  mobile: string;
  role?: string;
  barRegNo?: string;
  email?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  addedAt?: string;
  createdAt?: string;
  photoURL?: string;
}

export interface CaseComplaint {
  id?: string;
  caseId: string | number;
  caseNumber: string;
  complainantId: string;
  complainantName?: string;
  complainantRole?: string;
  accusedUserId?: string;
  accusedSide?: string;
  accusedName?: string;
  conflictingDate?: string;
  conflictingStep?: string;
  note?: string;
  status: 'pending' | 'resolved' | 'rejected';
  fineDeducted?: number;
  pendingFineAmount?: number;
  created_at?: any;
}

export interface Notification {
  id: string | number;
  user_id?: string | number;
  title?: string;
  message: string;
  time?: string;
  type?: 'case_update' | 'task_assigned' | 'affiliate_approved' | 'system' | 'hearing' | 'update' | 'task' | 'payment';
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
  user_id?: string | number;
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

export const normalizeDateString = (d?: string | null): string => {
  if (!d) return '';
  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let str = String(d).trim().replace(/[০-৯]/g, (char) => String(bnNums.indexOf(char)));

  if (str.includes('T')) {
    str = str.split('T')[0];
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${day}`;
  }

  return str;
};

export const getBangladeshTodayStr = (): string => {
  const now = new Date();
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch (e) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

export const isCaseOnDate = (c: Case, dateStr: string | null | undefined): boolean => {
  if (!dateStr || !c) return false;
  const target = normalizeDateString(dateStr);
  if (!target) return false;

  if (c.nextDate && normalizeDateString(c.nextDate) === target) return true;
  if (c.lastDate && normalizeDateString(c.lastDate) === target) return true;
  if (c.pastDates && Array.isArray(c.pastDates)) {
    if (c.pastDates.some(pd => pd && normalizeDateString(pd) === target)) return true;
  }
  if (c.history && Array.isArray(c.history)) {
    if (c.history.some(h => h && h.date && normalizeDateString(h.date) === target)) return true;
  }
  return false;
};

