import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Trash2,
  Download,
  Filter,
  FileText,
  User,
  Calendar,
  ChevronRight,
  X
} from 'lucide-react';

interface Invoice {
  id: string;
  clientName: string;
  caseNumber: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  createdAt: string;
}

interface InvoicesViewProps {
  t: (key: string) => string;
  language: 'bn' | 'en' | 'hi' | 'ur';
}

export const InvoicesView = ({ t, language }: InvoicesViewProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    clientName: '',
    caseNumber: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load local invoices
    const saved = localStorage.getItem('mdc_invoices');
    if (saved) {
      setInvoices(JSON.parse(saved));
    } else {
      // Mock data for first time
      const mock: Invoice[] = [
        {
          id: '1',
          clientName: 'Rahim Uddin',
          caseNumber: 'CR 124/2024',
          amount: 5000,
          paidAmount: 2000,
          dueDate: '2024-06-15',
          status: 'partial',
          createdAt: new Date().toISOString()
        }
      ];
      setInvoices(mock);
      localStorage.setItem('mdc_invoices', JSON.stringify(mock));
    }
  }, []);

  const handleAddInvoice = () => {
    if (!newInvoice.clientName || !newInvoice.amount) return;
    
    const invoice: Invoice = {
      id: Date.now().toString(),
      clientName: newInvoice.clientName,
      caseNumber: newInvoice.caseNumber,
      amount: parseFloat(newInvoice.amount),
      paidAmount: 0,
      dueDate: newInvoice.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updated = [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem('mdc_invoices', JSON.stringify(updated));
    setIsAddingInvoice(false);
    setNewInvoice({ clientName: '', caseNumber: '', amount: '', dueDate: new Date().toISOString().split('T')[0] });
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    localStorage.setItem('mdc_invoices', JSON.stringify(updated));
  };

  const totalBill = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalDue = totalBill - totalPaid;

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = i.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         i.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'paid' && i.status === 'paid') ||
                         (filterStatus === 'pending' && (i.status === 'pending' || i.status === 'partial' || i.status === 'overdue'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t('invoices')}</h2>
          <p className="text-slate-500 font-medium">{t('billing_management')}</p>
        </div>
        <button 
          onClick={() => setIsAddingInvoice(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <Plus size={20} />
          {t('add_invoice')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{t('total_bill')}</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">৳ {totalBill.toLocaleString()}</h4>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{t('total_paid')}</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">৳ {totalPaid.toLocaleString()}</h4>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{t('total_due')}</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">৳ {totalDue.toLocaleString()}</h4>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={t('search_cases_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
            >
              {s === 'all' ? t('all') : s === 'paid' ? t('status_paid') : t('status_pending')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <motion.div
              layout
              key={invoice.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600">
                  <User size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => deleteInvoice(invoice.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                    <Download size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{invoice.clientName}</h4>
                  <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                    <FileText size={14} /> {invoice.caseNumber}
                  </p>
                </div>

                <div className="flex items-center justify-between py-4 border-y border-slate-50 dark:border-slate-700">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-1">{t('amount')}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">৳ {invoice.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-1">{t('total_due')}</p>
                    <p className="text-lg font-black text-rose-500">৳ {invoice.amount - invoice.paidAmount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                    invoice.status === 'partial' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {invoice.status === 'paid' ? t('status_paid') : t('status_pending')}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                    <Calendar size={14} />
                    {invoice.dueDate}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <DollarSign size={40} />
            </div>
            <p className="text-lg font-bold">{t('no_invoices')}</p>
          </div>
        )}
      </div>

      {/* Add Invoice Modal */}
      <AnimatePresence>
        {isAddingInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('add_invoice')}</h3>
                <button onClick={() => setIsAddingInvoice(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-2xl">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('client_name')}</label>
                  <input 
                    type="text"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('case_number')}</label>
                  <input 
                    type="text"
                    value={newInvoice.caseNumber}
                    onChange={(e) => setNewInvoice({...newInvoice, caseNumber: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. CR 124/2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('amount')}</label>
                    <input 
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('due_date')}</label>
                    <input 
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddInvoice}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all mt-4"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
