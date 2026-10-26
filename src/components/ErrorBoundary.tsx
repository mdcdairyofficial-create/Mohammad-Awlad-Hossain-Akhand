import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "দুঃখিত, একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।";
      const rawMsg = (this.state.error?.message || "").toLowerCase();
      
      if (
        rawMsg.includes("rate exceeded") ||
        rawMsg.includes("quota exceeded") ||
        rawMsg.includes("resource_exhausted") ||
        rawMsg.includes("resource-exhausted") ||
        rawMsg.includes("too many requests")
      ) {
        errorMessage = "সার্ভারে অতিরিক্ত ট্রাফিকের কারণে সাময়িক বিলম্ব হচ্ছে। কয়েক সেকেন্ড পর স্বয়ংক্রিয়ভাবে স্বাভাবিক হয়ে যাবে।";
      } else {
        try {
          // Try to parse FirestoreErrorInfo if it's a JSON string
          const errorData = JSON.parse(this.state.error?.message || "");
          if (errorData.error && errorData.error.includes("insufficient permissions")) {
            errorMessage = "আপনার এই তথ্য দেখার অনুমতি নেই। দয়া করে এডমিনের সাথে যোগাযোগ করুন।";
          }
        } catch (e) {
          // Not a JSON error, use default message
        }
      }

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">সমস্যা হয়েছে</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                পুনরায় চেষ্টা করুন (Reload)
              </button>
              <button 
                onClick={() => {
                  try {
                    localStorage.removeItem('appCases');
                    localStorage.removeItem('appTasks');
                    localStorage.removeItem('appNotifications');
                  } catch {}
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors"
              >
                ক্যাশ সাফ করে পুনরায় লোড করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
