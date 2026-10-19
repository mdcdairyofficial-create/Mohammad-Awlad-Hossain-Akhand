import React from 'react';
import { MessageSquare, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkWhatsAppNumber } from './WhatsAppPhoneHelper';

interface WhatsAppPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: 'en' | 'bn' | 'hi' | 'ur';
  className?: string;
  containerClassName?: string;
  showStatusBelow?: boolean;
  compactExpandable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function WhatsAppPhoneInput({
  value,
  onChange,
  placeholder,
  language = 'bn',
  className = '',
  containerClassName = '',
  showStatusBelow = true,
  compactExpandable = false,
  onFocus,
  onBlur
}: WhatsAppPhoneInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const waStatus = checkWhatsAppNumber(value, language);

  const handleTestWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (waStatus.waLink) {
      window.open(waStatus.waLink, '_blank');
    }
  };

  const defaultPlaceholder = placeholder || (language === 'bn' ? 'মোবাইল নং (হোয়াটসঅ্যাপ)' : 'Mobile No (WhatsApp)');

  const hasValue = Boolean(value && value.trim().length > 0);
  const isExpanded = !compactExpandable || isFocused || hasValue;

  const baseContainerClass = compactExpandable
    ? isExpanded
      ? 'w-[130px] sm:w-[150px] flex-shrink-0 transition-all duration-200 ease-in-out'
      : 'w-[52px] sm:w-[60px] flex-shrink-0 transition-all duration-200 ease-in-out'
    : 'w-full space-y-1';

  return (
    <div className={`${baseContainerClass} ${containerClassName}`}>
      <div className="relative flex items-center w-full">
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={defaultPlaceholder}
          title={compactExpandable && !isExpanded ? (language === 'bn' ? 'ক্লিক করে নম্বর লিখুন' : 'Click to enter number') : undefined}
          className={`w-full rounded-lg border outline-none transition-all ${
            compactExpandable && !isExpanded
              ? 'px-1 py-1 text-[10px] sm:text-[11px] text-center font-bold bg-white/90 hover:bg-white border-[#d8d0b8] text-slate-600 placeholder:text-slate-400 cursor-pointer shadow-3xs'
              : 'px-2.5 py-1.5 text-xs font-medium bg-white text-slate-800 border-slate-300 focus:ring-2 focus:ring-indigo-500'
          } ${
            isExpanded && waStatus.isValid
              ? 'border-blue-400 focus:ring-2 focus:ring-blue-500 bg-blue-50/15'
              : isExpanded && waStatus.statusType === 'incomplete'
              ? 'border-amber-300 focus:ring-2 focus:ring-amber-500'
              : ''
          } ${className}`}
        />

        {/* Right side icon */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {isExpanded && waStatus.isValid && (
            <button
              type="button"
              onClick={handleTestWhatsApp}
              title={language === 'bn' ? 'হোয়াটসঅ্যাপ সক্রিয় - ক্লিক করে চ্যাট টেস্ট করুন' : 'WhatsApp Active - Click to Test Chat'}
              className="flex items-center gap-1 text-[10px] font-bold px-1 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            >
              <MessageSquare size={11} className="text-blue-600 fill-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* Status banner below input */}
      {!compactExpandable && showStatusBelow && value.trim().length > 0 && (
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
