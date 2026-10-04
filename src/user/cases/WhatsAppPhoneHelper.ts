export interface WhatsAppCheckResult {
  isValid: boolean;
  cleanNumber: string;
  statusText: string;
  statusType: 'valid' | 'incomplete' | 'invalid' | 'empty';
  waLink: string;
}

/**
 * Checks if a mobile number is a valid format for WhatsApp
 * (Bangladesh 11-digit number 013-019 or valid international format)
 */
export function checkWhatsAppNumber(phone: string, language: 'en' | 'bn' | 'hi' | 'ur' = 'bn'): WhatsAppCheckResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      cleanNumber: '',
      statusText: language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর লিখুন' : 'Enter mobile number',
      statusType: 'empty',
      waLink: ''
    };
  }

  const raw = phone.trim();
  // Remove non-digit chars except leading '+'
  let digits = raw.replace(/[^0-9+]/g, '');

  let normalized = digits;
  if (normalized.startsWith('+880')) {
    normalized = normalized.substring(3);
    if (!normalized.startsWith('0')) normalized = '0' + normalized;
  } else if (normalized.startsWith('880')) {
    normalized = normalized.substring(2);
    if (!normalized.startsWith('0')) normalized = '0' + normalized;
  }

  // BD phone: 11 digits starting with 013, 014, 015, 016, 017, 018, 019
  const isBd = /^01[3-9]\d{8}$/.test(normalized);
  const isIntl = /^\+?[1-9]\d{9,14}$/.test(digits);

  if (isBd) {
    const intlDigits = '88' + normalized;
    return {
      isValid: true,
      cleanNumber: intlDigits,
      statusText: language === 'bn' ? 'হোয়াটসঅ্যাপ সক্রিয় (নীল)' : 'WhatsApp Active (Blue)',
      statusType: 'valid',
      waLink: `https://wa.me/${intlDigits}`
    };
  } else if (isIntl && digits.replace('+', '').length >= 10) {
    const cleanDigits = digits.replace('+', '');
    return {
      isValid: true,
      cleanNumber: cleanDigits,
      statusText: language === 'bn' ? 'আন্তর্জাতিক হোয়াটসঅ্যাপ সক্রিয়' : 'Intl WhatsApp Active',
      statusType: 'valid',
      waLink: `https://wa.me/${cleanDigits}`
    };
  } else {
    const len = digits.replace('+', '').length;
    let msg = '';
    if (len > 0 && len < 11) {
      msg = language === 'bn'
        ? `হোয়াটসঅ্যাপ নম্বর নয় / অসম্পূর্ণ (${len}/১১ ডিজিট)`
        : `Not WhatsApp / Incomplete (${len}/11 digits)`;
    } else if (len > 11 && !digits.startsWith('+')) {
      msg = language === 'bn' ? 'অতিরিক্ত ডিজিট রয়েছে (সঠিক ১১ ডিজিট দিন)' : 'Excess digits (Must be 11 digits)';
    } else {
      msg = language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর সঠিক নয়' : 'Invalid WhatsApp number';
    }

    return {
      isValid: false,
      cleanNumber: digits.replace(/[^0-9]/g, ''),
      statusText: msg,
      statusType: len > 0 ? 'incomplete' : 'invalid',
      waLink: ''
    };
  }
}

/**
 * Gets the direct Magic Tracking and Auto-Login URL for a case
 */
export function getMagicCaseTrackUrl(params: {
  caseId?: string | number;
  caseNumber?: string;
  referralCode?: string;
  clientMobile?: string;
  clientName?: string;
  directDashboard?: boolean;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mdccasebook.vercel.app';
  const query = new URLSearchParams();
  if (params.caseId) {
    query.set('track', String(params.caseId));
  } else if (params.caseNumber) {
    query.set('track', params.caseNumber);
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
    query.set('ref', params.referralCode);
  }
  if (params.directDashboard) {
    query.set('view', 'dashboard');
  }
  return `${origin}/?${query.toString()}`;
}

/**
 * Generates an SMS message with auto-login link for clients without WhatsApp
 */
export function generateClientSmsMessage(params: {
  caseNumber?: string;
  courtName?: string;
  nextDate?: string;
  order?: string;
  partyName?: string;
  clientMobile?: string;
  caseId?: string | number;
  referralCode?: string;
  lawyerName?: string;
}): string {
  const trackUrl = getMagicCaseTrackUrl({
    caseId: params.caseId,
    caseNumber: params.caseNumber,
    clientMobile: params.clientMobile,
    clientName: params.partyName,
    referralCode: params.referralCode
  });
  return `MDC Casebook: শ্রদ্ধাভাজন ${params.partyName || 'মক্কেল'}, মামলা নং ${params.caseNumber || 'N/A'}-এর পরবর্তী শুনানি: ${params.nextDate || 'শীঘ্রই'}। কোনো পাসওয়ার্ড ছাড়াই সরাসরি এপে যুক্ত হতে ক্লিক করুন: ${trackUrl}`;
}

/**
 * Generates formatted WhatsApp message containing case details, magic case tracking link,
 * and automatic push notification opt-in.
 */
export function generateCaseWhatsAppMessage(params: {
  caseId?: string | number;
  caseNumber?: string;
  courtName?: string;
  nextDate?: string;
  order?: string;
  partyType?: 'petitioner' | 'respondent' | 'all';
  partyName?: string;
  clientMobile?: string;
  lawyerName?: string;
  referralCode?: string;
  language?: 'en' | 'bn';
}): string {
  const {
    caseId,
    caseNumber = 'N/A',
    courtName = 'বিজ্ঞ আদালত',
    nextDate,
    order,
    partyType = 'petitioner',
    partyName = '',
    clientMobile = '',
    lawyerName = 'আপনার বিজ্ঞ আইনজীবী',
    referralCode = '',
    language = 'bn'
  } = params;

  const trackUrl = getMagicCaseTrackUrl({
    caseId,
    caseNumber,
    referralCode,
    clientMobile,
    clientName: partyName
  });

  if (language === 'bn') {
    const salutation = partyName ? `শ্রদ্ধেয় ${partyName}` : 'শ্রদ্ধেয় মক্কেল';
    return `${salutation},
আপনার মামলার সর্বশেষ তথ্য ও পরবর্তী ধার্য তারিখ MDC Casebook লিগ্যাল সিস্টেমে হালনাগাদ করা হয়েছে।

📋 মামলার বিবরণ:
• মামলা নং: ${caseNumber}
• আদালত: ${courtName}
${nextDate ? `• পরবর্তী ধার্য তারিখ: ${nextDate}` : ''}
${order ? `• আদালতের পদক্ষেপ / আদেশ: ${order}` : ''}

🔔 ১-ক্লিকে কোনো পাসওয়ার্ড ছাড়া সরাসরি লগইন ও অটো পুশ নোটিফিকেশন পেতে নিচের লিংকে ক্লিক করুন:
👉 ${trackUrl}

(কোনো রেজিস্ট্রেশনের ঝামেলা ছাড়াই শুধুমাত্র লিংকে ক্লিক করেই আপনার ক্লায়েন্ট পোর্টালে যুক্ত হতে পারবেন এবং মামলার লাইভ আপডেট দেখতে পাবেন)

ধন্যবাদান্তে,
${lawyerName}
(MDC Casebook ডিজিটাল লিগ্যাল অ্যাসিস্ট্যান্ট)`;
  }

  // English fallback
  return `Dear ${partyName || 'Client'},
Your case details and next hearing date have been updated in MDC Casebook.

📋 Case Details:
• Case No: ${caseNumber}
• Court: ${courtName}
${nextDate ? `• Next Date: ${nextDate}` : ''}
${order ? `• Order/Step: ${order}` : ''}

🔔 Click below for 1-tap direct login and automatic push notifications (No password needed):
👉 ${trackUrl}

Regards,
${lawyerName}
(MDC Casebook Legal Assistant)`;
}
