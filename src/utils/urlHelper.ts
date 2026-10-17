/**
 * Application URL and Route Helper
 * Dynamically resolves the origin, generates reliable links,
 * and handles Bengali/English digit normalization.
 */

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    // Don't override localhost or preview URLs with an external production domain
    if (origin && !origin.startsWith('file://')) {
      return origin;
    }
  }
  return 'https://www.mdccasebook.com';
}

export function getReferralUrl(refCode?: string): string {
  const origin = getAppOrigin();
  const code = refCode ? refCode.trim() : '';
  return code ? `${origin}/register?ref=${encodeURIComponent(code)}` : `${origin}/register`;
}

export function getTrackUrl(params: {
  caseId?: string | number;
  caseNumber?: string;
  clientMobile?: string;
  clientName?: string;
  referralCode?: string;
  directDashboard?: boolean;
}): string {
  const origin = getAppOrigin();
  const query = new URLSearchParams();

  if (params.caseId) {
    query.set('track', String(params.caseId));
  } else if (params.caseNumber) {
    query.set('track', params.caseNumber.trim());
  }

  query.set('role', 'client');

  if (params.clientMobile) {
    query.set('phone', params.clientMobile.trim());
  }
  if (params.clientName) {
    query.set('name', params.clientName.trim());
  }
  query.set('magicAuth', '1');

  if (params.referralCode) {
    query.set('ref', params.referralCode.trim());
  }
  if (params.directDashboard) {
    query.set('view', 'dashboard');
  }

  return `${origin}/track?${query.toString()}`;
}

const BN_TO_EN_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const EN_TO_BN_MAP: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (char) => BN_TO_EN_MAP[char] || char);
}

export function toBanglaDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[0-9]/g, (char) => EN_TO_BN_MAP[char] || char);
}

export function normalizeSearchTerm(term: string): { original: string; en: string; bn: string } {
  if (!term) return { original: '', en: '', bn: '' };
  const clean = term.trim();
  return {
    original: clean,
    en: toEnglishDigits(clean),
    bn: toBanglaDigits(clean)
  };
}
