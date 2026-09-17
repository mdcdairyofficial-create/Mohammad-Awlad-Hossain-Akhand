import React from 'react';
import { MessageSquare, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkWhatsAppNumber } from './WhatsAppPhoneHelper';

interface WhatsAppPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: 'en' | 'bn' | 'hi' | 'ur';
  className?: string;
  showStatusBelow?: boolean;
}

export default function WhatsAppPhoneInput({
  value,
  onChange,
  placeholder,
  language = 'bn',
  className = '',
  showStatusBelow = true
}: WhatsAppPhoneInputProps) {
  const waStatus = checkWhatsAppNumber(value, language);

  const handleTestWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (waStatus.waLink) {
      window.open(waStatus.waLink, '_blank');
    }
  };

  const defaultPlaceholder = placeholder || (language === 'bn' ? 'মোবাইল নং (হোয়াটসঅ্যাপ)' : 'Mobile No (WhatsApp)');

  return (
    <div className="w-full space-y-1">
      <div className="relative flex items-center">
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultPlaceholder}
          className={`w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
            waStatus.isValid
              ? 'border-blue-400 focus:ring-2 focus:ring-blue-500 bg-blue-50/15'
              : waStatus.statusType === 'incomplete'
              ? 'border-amber-300 focus:ring-2 focus:ring-amber-500'
              : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white'
          } ${className}`}
        />

        {/* Right side icon */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {waStatus.isValid && (
            <button
              type="button"
              onClick={handleTestWhatsApp}
              title={language === 'bn' ? 'হোয়াটসঅ্যাপ সক্রিয় - ক্লিক করে চ্যাট টেস্ট করুন' : 'WhatsApp Active - Click to Test Chat'}
              className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            >
              <MessageSquare size={12} className="text-blue-600 fill-blue-600" />
              <span className="hidden sm:inline">নীল</span>
              <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Status banner below input */}
      {showStatusBelow && value.trim().length > 0 && (
        <div>
          {waStatus.isValid ? (
            <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-blue-50/80 border border-blue-200 rounded-md text-blue-700 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <MessageSquare size={12} className="text-blue-600 fill-blue-600" />
                <span>
                  {language === 'bn' 
                    ? 'হোয়াটসঅ্যাপ নম্বর সক্রিয় (নীল স্ট্যাটাস)' 
                    : 'WhatsApp Active (Blue Status)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="text-[10px] underline hover:text-blue-900 font-bold"
              >
                {language === 'bn' ? 'টেস্ট করুন' : 'Test'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700 font-medium">
              <AlertCircle size={12} className="text-amber-500 shrink-0" />
              <span>{waStatus.statusText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
