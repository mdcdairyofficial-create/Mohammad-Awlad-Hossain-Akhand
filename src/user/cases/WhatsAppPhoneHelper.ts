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
 * Generates formatted WhatsApp message containing case details and active referral link
 */
export function generateCaseWhatsAppMessage(params: {
  caseNumber?: string;
  courtName?: string;
  nextDate?: string;
  order?: string;
  partyType: 'petitioner' | 'respondent';
  partyName?: string;
  lawyerName?: string;
  referralCode?: string;
  language?: 'en' | 'bn';
}): string {
  const {
    caseNumber = 'N/A',
    courtName = 'বিজ্ঞ আদালত',
    nextDate,
    order,
    partyType,
    partyName = '',
    lawyerName = 'আপনার বিজ্ঞ আইনজীবী',
    referralCode = '',
    language = 'bn'
  } = params;

  const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('ais-')
    ? window.location.origin
    : 'https://mdccasebook.vercel.app';

  const refUrl = referralCode
    ? `${origin}/register?ref=${referralCode}`
    : `${origin}/register`;

  if (language === 'bn') {
    if (partyType === 'petitioner') {
      return `সম্মানিত ${partyName ? partyName : 'ক্লায়েন্ট'},
আপনার মামলাটি MDC Casebook লিগ্যাল সিস্টেমে অন্তর্ভুক্ত করা হয়েছে।

📋 মামলার বিবরণ:
• মামলা নং: ${caseNumber}
• আদালত: ${courtName}
${nextDate ? `• পরবর্তী ধার্য তারিখ: ${nextDate}` : ''}
${order ? `• ধার্য বিষয় / আদেশ: ${order}` : ''}

মামলার প্রতিটি তারিখের আপডেট, তথ্য ও সরাসরি নোটিফিকেশন পেতে নিচের লিংকে ক্লিক করে অ্যাপে যুক্ত হোন:
🔗 ${refUrl}

ধন্যবাদান্তে,
${lawyerName}
(MDC Casebook ডিজিটাল লিগ্যাল অ্যাসিস্ট্যান্ট)`;
    } else {
      return `সম্মানিত ${partyName ? partyName : 'ক্লায়েন্ট'},
আপনার মামলাটির তথ্য MDC Casebook লিগ্যাল সিস্টেমে অন্তর্ভুক্ত করা হয়েছে।

📋 মামলার বিবরণ:
• মামলা নং: ${caseNumber}
• আদালত: ${courtName}
${nextDate ? `• পরবর্তী ধার্য তারিখ: ${nextDate}` : ''}
${order ? `• ধার্য বিষয় / আদেশ: ${order}` : ''}

মামলার প্রতিটি তারিখের আপডেট, আদালতের তথ্য ও সরাসরি নোটিফিকেশন পেতে নিচের লিংকে ক্লিক করে অ্যাপে যুক্ত হোন:
🔗 ${refUrl}

ধন্যবাদান্তে,
${lawyerName}
(MDC Casebook ডিজিটাল লিগ্যাল অ্যাসিস্ট্যান্ট)`;
    }
  }

  // English fallback
  return `Dear ${partyName || 'Client'},
Your case has been successfully recorded in MDC Casebook.

Case Details:
• Case No: ${caseNumber}
• Court: ${courtName}
${nextDate ? `• Next Date: ${nextDate}` : ''}
${order ? `• Order/Step: ${order}` : ''}

To track your case dates and get real-time legal updates, register using this link:
${refUrl}

Regards,
${lawyerName}
(MDC Casebook)`;
}
