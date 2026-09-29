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
 * Gets the direct Magic Tracking URL for a case
 */
export function getMagicCaseTrackUrl(params: {
  caseId?: string | number;
  caseNumber?: string;
  referralCode?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mdccasebook.vercel.app';
  const query = new URLSearchParams();
  if (params.caseId) {
    query.set('track', String(params.caseId));
  } else if (params.caseNumber) {
    query.set('track', params.caseNumber);
  }
  query.set('role', 'client');
  if (params.referralCode) {
    query.set('ref', params.referralCode);
  }
  return `${origin}/?${query.toString()}`;
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
    lawyerName = 'আপনার বিজ্ঞ আইনজীবী',
    referralCode = '',
    language = 'bn'
  } = params;

  const trackUrl = getMagicCaseTrackUrl({
    caseId,
    caseNumber,
    referralCode
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

🔔 পরবর্তী তারিখের অটো পুশ নোটিফিকেশন ও সরাসরি মামলার অগ্রগতি দেখতে নিচের লিংকে প্রবেশ করুন:
👉 ${trackUrl}

(কোনো অ্যাপ ডাউনলোড ছাড়াই লিংকে ক্লিক করে আপনার মোবাইলে অটো এলার্ট চালু করতে পারবেন এবং ১-ক্লিকে হোমস্ক্রিনে সেভ করতে পারবেন)

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

🔔 To view live case status and receive instant automatic push notifications on your phone, click here:
👉 ${trackUrl}

Regards,
${lawyerName}
(MDC Casebook Legal Assistant)`;
}
