import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  MonitorPlay, 
  Users, 
  Clock, 
  MapPin, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Info,
  Award,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2 as CheckIcon,
  Smartphone,
  Building2,
  ArrowRight,
  Eye,
  Facebook,
  Youtube,
  Link,
  Video,
  Layers
} from 'lucide-react';

interface AdFlexiplanProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  onPurchase: (config: AdConfig) => void;
}

interface AdConfig {
  type: string;
  reach: number;
  validity: number;
  placement: string[];
  totalPrice: number;
  location?: string;
  subLocation?: string;
  targetRoles?: string[];
  adTitle?: string;
  adDescription?: string;
  fbLink?: string;
  fbCoverPhoto?: File;
  adMedia?: File;
  ytLink?: string;
  otherLink?: string;
  adMediaType?: 'image' | 'video';
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'active';
}

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  totalPrice, 
  language, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  totalPrice: number; 
  language: string;
  onConfirm: (method: string, data?: any) => void;
}) => {
  const [method, setMethod] = useState<'mobile' | 'bank'>('mobile');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const bn = language === 'bn';
  const t = (b: string, e: string) => bn ? b : e;

  if (!isOpen) return null;

  const handleMobilePayment = () => {
    if (!selectedProvider) return;
    setIsProcessing(true);
    // Simulate instant activation
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm('mobile', { provider: selectedProvider });
    }, 2000);
  };

  const handleBankPayment = () => {
    if (!receipt) return;
    setIsProcessing(true);
    // Simulate manual clearance submission
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm('bank', { receiptAttached: true });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-[3.5rem] shadow-2xl border-4 border-indigo-600 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-400 hover:text-indigo-600 transition-colors z-10">
          <X size={32} className="md:w-12 md:h-12" />
        </button>

        <div className="p-6 md:p-12 space-y-6 md:space-y-8 text-center overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-indigo-950 dark:text-white tracking-tight mb-2 md:mb-3">
              {t('পেমেন্ট পদ্ধতি', 'PAYMENT OPTION')}
            </h2>
            <p className="text-sm md:text-lg text-slate-900 dark:text-slate-200 font-bold uppercase tracking-widest opacity-60">
              {t('আপনার পছন্দের মাধ্যমটি বেছে নিন', 'SELECT YOUR PREFERRED METHOD')}
            </p>
          </div>

          <div className="flex gap-2 md:gap-4 p-1 md:p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[2rem]">
            <button 
              onClick={() => setMethod('mobile')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-4 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all ${method === 'mobile' ? 'bg-white text-indigo-700 shadow-xl' : 'text-slate-500'}`}
            >
              <Smartphone size={20} className="md:w-6 md:h-6" />
              {t('মোবাইল ব্যাংকিং', 'Mobile')}
            </button>
            <button 
              onClick={() => setMethod('bank')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-4 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all ${method === 'bank' ? 'bg-white text-indigo-700 shadow-xl' : 'text-slate-500'}`}
            >
              <Building2 size={20} className="md:w-6 md:h-6" />
              {t('ব্যাংক ট্রান্সফার', 'Bank Pay')}
            </button>
          </div>

          <div className="min-h-[300px] md:min-h-[350px]">
            {method === 'mobile' ? (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  {[
                    { id: 'bKash', color: '#D12053', label: 'bKash' },
                    { id: 'Nagad', color: '#F7941D', label: 'Nagad' },
                    { id: 'Rocket', color: '#8C3494', label: 'Rocket' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      className={`relative aspect-square rounded-2xl md:rounded-[2rem] border-2 md:border-4 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all ${selectedProvider === p.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}
                    >
                      <div 
                        className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="text-white font-black text-[8px] md:text-sm uppercase tracking-tighter">{p.id}</span>
                      </div>
                      <span className="font-black text-xs md:text-xl tracking-tight">{p.label}</span>
                      {selectedProvider === p.id && (
                        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-10 md:h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
                          <CheckIcon size={14} className="md:w-6 md:h-6" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-5 md:p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl md:rounded-[2rem] border-2 border-blue-100 dark:border-blue-800 text-left">
                  <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                    <Zap size={20} className="text-blue-600 md:w-6 md:h-6" />
                    <h4 className="font-black text-lg md:text-2xl text-blue-900 dark:text-blue-200">{t('পেমেন্ট ইনস্ট্রাকশন', 'INSTANT ACTIVATION')}</h4>
                  </div>
                  <p className="text-sm md:text-lg text-blue-700 dark:text-blue-300 font-medium">
                    {t('মোবাইল ব্যাংকিং পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই আপনার প্যাকটি একটিভ হয়ে যাবে।', 'Your ad pack will be activated instantly upon successful mobile payment.')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-4 text-left">
                <div className="p-5 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 space-y-3 md:space-y-4">
                  <h4 className="font-black text-lg md:text-2xl text-indigo-900 dark:text-white uppercase tracking-tight">{t('ব্যাংক ডিটেইলস', 'BANK ACCOUNT DETAILS')}</h4>
                  <div className="space-y-1.5 md:space-y-2 text-sm md:text-xl font-bold">
                    <p className="flex justify-between"><span>{t('ব্যাংক নাম:', 'Bank Name:')}</span> <span className="text-indigo-600">Dutch-Bangla Bank</span></p>
                    <p className="flex justify-between"><span>{t('হিসাব নাম:', 'Account Name:')}</span> <span className="text-indigo-600">MDC DIARY LTD</span></p>
                    <p className="flex justify-between"><span>{t('হিসাব নম্বর:', 'Account No:')}</span> <span className="text-indigo-600 font-mono">123.456.7890</span></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-black text-sm md:text-xl text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('জমা রশিদের ছবি দিন', 'UPLOAD DEPOSIT RECEIPT')}</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 md:border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl md:rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 cursor-pointer transition-all group">
                    <div className="flex flex-col items-center justify-center p-4">
                      <Upload size={32} className="text-slate-400 group-hover:text-indigo-600 mb-2 md:mb-4 transition-colors md:w-12 md:h-12" />
                      <p className="text-sm md:text-xl font-bold text-slate-500 group-hover:text-indigo-600 tracking-tight text-center">
                        {receipt ? receipt.name : t('ফাইল সিলেক্ট করুন', 'CLICK TO UPLOAD RECEIPT')}
                      </p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                  </label>
                </div>
                
                <div className="p-4 md:p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl md:rounded-[2rem] border-2 border-amber-100 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <Info size={20} className="text-amber-600 md:w-6 md:h-6" />
                    <p className="text-xs md:text-lg text-amber-900 dark:text-amber-200 font-bold leading-tight">
                      {t('ব্যাংক পেমেন্টের ক্ষেত্রে আমাদের প্রতিনিধি ম্যানুয়ালি চেক করে আধা-ঘন্টার মধ্যে একটিভ করবেন।', 'Bank payments require manual verification and take approx. 30 mins to activate.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between border-t-2 md:border-t-4 border-slate-50 dark:border-slate-800 pt-6 md:pt-10 gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs md:text-lg font-black text-slate-400 uppercase tracking-widest mb-1">{t('মোট প্রদেয়', 'AMOUNT TO PAY')}</p>
              <h3 className="text-4xl md:text-6xl font-black text-emerald-600 tracking-tighter leading-none">৳{totalPrice}</h3>
            </div>
            <button
              onClick={method === 'mobile' ? handleMobilePayment : handleBankPayment}
              disabled={isProcessing || (method === 'mobile' && !selectedProvider) || (method === 'bank' && !receipt)}
              className="w-full md:w-auto px-8 md:px-16 py-4 md:py-8 bg-indigo-600 text-white rounded-2xl md:rounded-[3rem] font-black text-xl md:text-3xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 md:gap-6 uppercase shadow-2xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isProcessing ? t('প্রসেসিং হচ্ছে...', 'PROCESSING...') : (
                <>
                  {t('পেমেন্ট সম্পন্ন করুন', 'COMPLETE PAY')}
                  <ChevronRight size={24} className="md:w-10 md:h-10" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const AdFlexiplan = ({ language, onPurchase }: AdFlexiplanProps) => {
  const [adType, setAdType] = useState('Banner');
  const [reach, setReach] = useState(1000);
  const [validity, setValidity] = useState(7);
  const [placements, setPlacements] = useState<string[]>(['Dashboard']);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // New State for Targeting and Frequency
  const [location, setLocation] = useState('All Bangladesh'); // 'All Bangladesh' or specific district
  const [subLocation, setSubLocation] = useState('All Thanas'); // Specific Thana
  const [targetRoles, setTargetRoles] = useState<string[]>(['Lawyer', 'Clerk', 'Client']);
  const [dailyFrequency, setDailyFrequency] = useState(3); // times per day
  const [duration, setDuration] = useState(15); // seconds
  
  // Ad Content State
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [fbLink, setFbLink] = useState('');
  const [fbCoverPhoto, setFbCoverPhoto] = useState<File | null>(null);
  const [ytLink, setYtLink] = useState('');
  const [otherLink, setOtherLink] = useState('');
  const [adMedia, setAdMedia] = useState<File | null>(null);
  const [adMediaType, setAdMediaType] = useState<'image' | 'video'>('image');

  const t = (bn: string, en: string) => language === 'bn' ? bn : en;

  const adTypes = [
    { id: 'Banner', label: t('ব্যানার', 'Banner'), icon: MonitorPlay, priceMult: 1, special: false },
    { id: 'Interstitial', label: t('ফুল স্ক্রিন', 'Full Screen'), icon: Zap, priceMult: 2.5, special: false },
    { id: 'Election', label: t('বার নির্বাচন', 'Bar Election'), icon: Award, priceMult: 3.0, special: true },
    { id: 'BotMsg', label: t('এআই বট মেসেজ', 'AI Bot Msg'), icon: Target, priceMult: 1.8, special: false },
  ];

  const districtThanaMap: { [key: string]: string[] } = {
    'Dhaka': ['Adabor', 'Badda', 'Bangsal', 'Cantonment', 'Chak Bazar', 'Dakshinkhan', 'Darus Salam', 'Dhamrai', 'Dhanmondi', 'Demra', 'Dohar', 'Gendaria', 'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Keraniganj', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Nawabganj', 'New Market', 'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Sabujbagh', 'Savar', 'Shah Ali', 'Shahbagh', 'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Turag', 'Uttara', 'Uttar Khan', 'Vatara', 'Wari'],
    'Chattogram': ['Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda', 'Bakalia', 'Bayazid', 'Chandgaon', 'Double Mooring', 'Halishahar', 'Khulshi', 'Kotwali', 'Pahartali', 'Patenga', 'Panchlaish', 'Port'],
    'Gazipur': ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi'],
    'Narayanganj': ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon'],
    'Narsingdi': ['Belabo', 'Monohardi', 'Narsingdi Sadar', 'Palash', 'Raipura', 'Shivpur'],
    'Manikganj': ['Daulatpur', 'Gheor', 'Leirang', 'Manikganj Sadar', 'Saturia', 'Shibalaya', 'Singair'],
    'Munshiganj': ['Gazaria', 'Lohajang', 'Munshiganj Sadar', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
    'Faridpur': ['Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Faridpur Sadar', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
    'Gopalganj': ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
    'Madaripur': ['Kalkini', 'Madaripur Sadar', 'Rajoir', 'Shibchar'],
    'Rajbari': ['Baliakandi', 'Goalandaghat', 'Kalukhali', 'Pangsha', 'Rajbari Sadar'],
    'Shariatpur': ['Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Shariatpur Sadar', 'Zajira'],
    'Kishoreganj': ['Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kishoreganj Sadar', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
    'Tangail': ['Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Tangail Sadar'],
    'Mymensingh': ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Mymensingh Sadar', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal'],
    'Jamalpur': ['Bakshiganj', 'Dewanganj', 'Islampur', 'Jamalpur Sadar', 'Madarganj', 'Melandaha', 'Sarishabari'],
    'Netrokona': ['Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Netrokona Sadar', 'Purbadhala'],
    'Sherpur': ['Jhenaigati', 'Nakla', 'Nalitabari', 'Sherpur Sadar', 'Sreebardi'],
    'Cumilla': ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Monohargonj', 'Meghna', 'Muradnagar', 'Nangalkot', 'Cumilla Sadar', 'Sadar South', 'Titas'],
    'Brahmanbaria': ['Akhaura', 'Bancharampur', 'Brahmanbaria Sadar', 'Bijoynagar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail', 'Ashuganj'],
    'Chandpur': ['Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab North', 'Matlab South', 'Shahrasti', 'Chandpur Sadar'],
    'Noakhali': ['Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Noakhali Sadar', 'Kabirhat'],
    'Feni': ['Chhagalnaiya', 'Daganbhuiyan', 'Feni Sadar', 'Parshuram', 'Sonagazi', 'Fulgazi'],
    'Lakshmipur': ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
    'Cox\'s Bazar': ['Chakaria', 'Cox\'s Bazar Sadar', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua'],
    'Khagrachhari': ['Dighinala', 'Khagrachhari Sadar', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
    'Rangamati': ['Baghaichhari', 'Barkal', 'Kawkhali', 'Belaichhari', 'Kaptai', 'Jurachhari', 'Langadu', 'Naniarchar', 'Rajasthali', 'Rangamati Sadar'],
    'Bandarban': ['Ali Kadam', 'Bandarban Sadar', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
    'Rajshahi': ['Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore', 'Boalia', 'Motihar', 'Rajpari', 'Shah Makdum'],
    'Bogura': ['Adamdighi', 'Bogura Sadar', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola'],
    'Joypurhat': ['Akkelpur', 'Joypurhat Sadar', 'Kalai', 'Khetlal', 'Panchbibi'],
    'Naogaon': ['Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mahadevpur', 'Naogaon Sadar', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
    'Natore': ['Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Natore Sadar', 'Singra', 'Naldanga'],
    'Chapainawabganj': ['Bholahat', 'Gomastapur', 'Nachole', 'Chapainawabganj Sadar', 'Shibganj'],
    'Pabna': ['Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Pabna Sadar', 'Santhia', 'Sujanagar'],
    'Sirajganj': ['Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Sirajganj Sadar', 'Tarash', 'Ullahpara'],
    'Rangpur': ['Badarganj', 'Mithapukur', 'Gangachara', 'Kaunia', 'Rangpur Sadar', 'Pirgachha', 'Pirganj', 'Taraganj'],
    'Dinajpur': ['Birampur', 'Birganj', 'Birol', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Dinajpur Sadar', 'Nawabganj', 'Parbatipur'],
    'Gaibandha': ['Phulchhari', 'Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
    'Kurigram': ['Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Kurigram Sadar', 'Nageshwari', 'Rajarhat', 'Rau मारी', 'Ulipur'],
    'Lalmonirhat': ['Aditmari', 'Hatibandha', 'Kaliganj', 'Lalmonirhat Sadar', 'Patgram'],
    'Nilphamari': ['Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Nilphamari Sadar', 'Saidpur'],
    'Panchagarh': ['Atwari', 'Boda', 'Debiganj', 'Panchagarh Sadar', 'Tetulia'],
    'Thakurgaon': ['Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail', 'Thakurgaon Sadar'],
    'Khulna': ['Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terakhada', 'Khulna Sadar', 'Khalishpur', 'Daulatpur', 'Sonadanga', 'Khan Jahan Ali'],
    'Bagerhat': ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
    'Chuadanga': ['Alamdanga', 'Chuadanga Sadar', 'Damurhuda', 'Jiban Nagar'],
    'Jashore': ['Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Jashore Sadar', 'Manirampur', 'Sharsha'],
    'Jhenaidah': ['Harinakunda', 'Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
    'Kushtia': ['Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Kushtia Sadar', 'Mirpur'],
    'Magura': ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
    'Meherpur': ['Gangni', 'Meherpur Sadar', 'Mujibnagar'],
    'Narail': ['Kalia', 'Lohagara', 'Narail Sadar'],
    'Satkhira': ['Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Satkhira Sadar', 'Shyamnagar', 'Tala'],
    'Barishal': ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gournadi', 'Hizla', 'Barishal Sadar', 'Mehendiganj', 'Muladi', 'Wazirpur'],
    'Barguna': ['Amtali', 'Bamna', 'Barguna Sadar', 'Betagi', 'Patharghata', 'Taltali'],
    'Bhola': ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
    'Jhalokati': ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
    'Patuakhali': ['Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Patuakhali Sadar', 'Rangabali', 'Dumki'],
    'Pirojpur': ['Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Pirojpur Sadar', 'Nesarabad', 'Indurkani'],
    'Sylhet': ['Balaganj', 'Beanibazar', 'Bishwanath', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Sylhet Sadar', 'Zakiganj', 'Dakshin Surma', 'Osmani Nagar'],
    'Habiganj': ['Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Habiganj Sadar', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'],
    'Moulvibazar': ['Barlekha', 'Kamalganj', 'Kulaura', 'Moulvibazar Sadar', 'Rajnagar', 'Sreemangal', 'Juri'],
    'Sunamganj': ['Bishwamarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Sunamganj Sadar', 'Tahirpur', 'South Sunamganj']
  };

  const districts = Object.keys(districtThanaMap).sort();

  const handleDistrictChange = (d: string) => {
    setLocation(d);
    setSubLocation('All Thanas');
  };

  const roleOptions = [
    { id: 'Lawyer', label: t('উকিল', 'Lawyer') },
    { id: 'Clerk', label: t('মুহুরি', 'Clerk') },
    { id: 'Client', label: t('ক্লায়েন্ট', 'Client') },
  ];

  const durationOptions = [5, 10, 15, 30, 60];
  const reachOptions = [250, 1000, 5000, 10000, 50000, 100000, 500000];
  const validityOptions = [1, 7, 15, 30];
  const placementOptions = [
    { id: 'Dashboard', label: t('ড্যাশবোর্ড', 'Dashboard') },
    { id: 'Cases', label: t('মামলাসমূহ', 'Cases') },
    { id: 'Performance', label: t('কর্মক্ষমতা', 'Performance') },
    { id: 'Cause List', label: t('কার্যতালিক', 'Cause List') },
    { id: 'Monthly Report', label: t('মাসিক রিপোর্ট', 'Monthly Report') },
    { id: 'Calendar', label: t('ক্যালেন্ডার', 'Calendar') },
    { id: 'Invoices', label: t('ইনভয়েস', 'Invoices') },
    { id: 'Tasks', label: t('টাস্ক ম্যানেজমেন্ট', 'Task Management') },
    { id: 'Timeline', label: t('মামলা টাইমলাইন', 'Case Timeline') },
    { id: 'Documents', label: t('ডকুমেন্টস', 'Documents') },
    { id: 'Library', label: t('লাইব্রেরি', 'Library') },
    { id: 'Resources', label: t('রিসোর্স', 'Resources') },
    { id: 'Legal Drafts', label: t('লিগ্যাল ড্রাফটস', 'Legal Drafts') },
    { id: 'Case History 20y', label: t('২০ বছরের মামলা ইতিহাস', 'Case History 20y') },
    { id: 'Professional Services', label: t('প্রফেশনাল সার্ভিস', 'Professional Services') },
    { id: 'Support Chat', label: t('সাপোর্ট চ্যাট', 'Support Chat') },
    { id: 'Subscription', label: t('সাবস্ক্রিপশন', 'Subscription') },
    { id: 'Notifications', label: t('নোটিফিকেশন', 'Notifications') },
    { id: 'Lawyer Directory', label: t('উকিল ডিরেক্টরি', 'Lawyer Directory') },
    { id: 'Clerk Directory', label: t('মুহুরি ডিরেক্টরি', 'Clerk Directory') },
    { id: 'Medigen', label: t('মেডিজেন', 'Medigen') },
    { id: 'Divine Books', label: t('ঐশী গ্রন্থ', 'Divine Books') },
    { id: 'Affiliate Zone', label: t('অ্যাফিলিয়েট জোন', 'Affiliate Zone') },
    { id: 'News', label: t('নিউজ পোর্টাল', 'News') },
    { id: 'Media', label: t('মিডিয়া', 'Media') },
    { id: 'Emergency', label: t('জরুরী', 'Emergency') },
    { id: 'Recharge', label: t('রিচার্জ', 'Recharge') },
    { id: 'Profile', label: t('প্রোফাইল', 'Profile') },
    { id: 'Settings', label: t('সেটিংস', 'Settings') },
    { id: 'Admin Panel', label: t('অ্যাডমিন প্যানেল', 'Admin Panel') },
    { id: 'AI Bot', label: t('এআই বট', 'AI Bot') },
  ];

  const [totalPrice, setTotalPrice] = useState(0);
  const [estimatedAudience, setEstimatedAudience] = useState(0);

  useEffect(() => {
    // Basic audience estimation mock
    let baseAudience = location === 'All Bangladesh' ? 500000 : 50000;
    if (subLocation !== 'All Thanas') baseAudience = 3000;
    
    // Bar Election ads reach everyone (free + paid), normal ads only reach non-paid
    const visibilityMultiplier = adType === 'Election' ? 1.0 : 0.65; // ~65% non-paid user assumption
    
    const roleMultiplier = targetRoles.length / 3;
    setEstimatedAudience(Math.round(baseAudience * roleMultiplier * visibilityMultiplier));

    // Pricing calculation
    const basePrice = 50; 
    const typeMult = adTypes.find(t => t.id === adType)?.priceMult || 1;
    const validityMult = validity === 1 ? 1 : validity === 7 ? 6 : validity === 15 ? 12 : 20;
    const reachMult = reach / 1000;
    const placementMult = 1 + (placements.length - 1) * 0.1;
    const freqMult = 1 + (dailyFrequency - 1) * 0.3;
    const durMult = duration / 15;

    let calculated = Math.round(basePrice * typeMult * validityMult * reachMult * placementMult * freqMult * durMult);
    
    // Premium for election ads
    if (adType === 'Election') {
      calculated += 2000; // Extra base cost for reaching paid members
    }
    
    setTotalPrice(calculated);
  }, [adType, reach, validity, placements, location, targetRoles, dailyFrequency, duration]);

  const togglePlacement = (id: string) => {
    if (placements.includes(id)) {
      if (placements.length > 1) {
        setPlacements(placements.filter(p => p !== id));
      }
    } else {
      setPlacements([...placements, id]);
    }
  };

  const toggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      if (targetRoles.length > 1) {
        setTargetRoles(targetRoles.filter(r => r !== role));
      }
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-12 pb-48">
      {/* Header with very large text */}
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl lg:text-5xl font-black text-indigo-950 dark:text-white tracking-tighter">
          {t('বিজ্ঞাপন ফ্লেক্সি-প্ল্যান', 'AD FLEXIPLAN')}
        </h2>
        <p className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-[0.3em] text-base lg:text-lg opacity-60">
          {t('আপনার প্রয়োজন অনুযায়ী প্যাক তৈরি করুন', 'BUILD YOUR CUSTOM AD BUNDLE')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
        {/* Ad Type Circular Selector */}
        <div className="flex flex-col items-center space-y-8">
          <h3 className="font-black text-indigo-950 dark:text-white uppercase tracking-widest text-xl">{t('বিজ্ঞাপনের ধরণ', 'AD TYPE')}</h3>
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[6px] border-dashed border-indigo-100 dark:border-indigo-900/30 animate-[spin_30s_linear_infinite]"></div>
            <div className="grid grid-cols-1 gap-4 relative z-10 w-full px-6 text-center">
              {adTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAdType(type.id)}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase transition-all flex items-center gap-3 justify-center relative overflow-hidden ${
                    adType === type.id 
                      ? 'bg-indigo-600 text-white shadow-2xl scale-110' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-2 border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {type.special && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-[8px] px-2 py-0.5 rounded-bl-lg font-black text-white transform rotate-0 origin-top-right">
                      PREMIUM
                    </div>
                  )}
                  <type.icon size={22} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price Bubble Central */}
        <div className="flex flex-col items-center justify-center relative scale-110">
          <motion.div 
            key={totalPrice}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-56 h-56 rounded-full bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-950 p-2 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.4)] flex items-center justify-center relative z-20"
          >
            <div className="w-full h-full rounded-full border-2 border-white/30 flex flex-col items-center justify-center text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{t('মোট খরচ', 'TOTAL COST')}</span>
              <div className="flex items-start">
                <span className="text-xl font-black mt-1">৳</span>
                <span className="text-5xl font-black tracking-tighter leading-none">{totalPrice}</span>
              </div>
              <div className="mt-3 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="text-[10px] font-black uppercase">{validity} {t('দিনের মেয়াদ', 'DAYS PACK')}</span>
              </div>
            </div>
          </motion.div>
          {/* Decorative animations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-100 dark:border-indigo-900/20 rounded-full animate-ping opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-indigo-50 dark:border-indigo-900/10 rounded-full animate-[ping_4s_linear_infinite] opacity-10"></div>
        </div>

        {/* Validity Selector */}
        <div className="flex flex-col items-center space-y-10">
          <h3 className="font-black text-indigo-950 dark:text-white uppercase tracking-widest text-xl">{t('মেয়াদের সময়', 'VALIDITY')}</h3>
          <div className="flex flex-col gap-4 w-48">
            {validityOptions.map((v) => (
              <button
                key={v}
                onClick={() => setValidity(v)}
                className={`relative py-5 rounded-[1.5rem] font-black text-xl lg:text-2xl transition-all flex items-center justify-center gap-4 ${
                  validity === v 
                    ? 'bg-indigo-600 text-white shadow-2xl' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-2 border-transparent'
                }`}
              >
                {validity === v && (
                  <motion.div layoutId="validity-check" className="absolute left-6">
                    <CheckCircle2 size={28} />
                  </motion.div>
                )}
                <span>{v} {t('দিন', 'DAYS')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        
        {/* Reach & Target Section */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wider text-lg text-black dark:text-white">{t('অডিয়েন্স রিচ', 'AUDIENCE REACH')}</h3>
                  <p className="text-black dark:text-slate-300 text-[10px] font-black opacity-60">{t('কতজনের কাছে দেখাবেন', 'TOTAL IMPRESSIONS')}</p>
                </div>
              </div>
              <div className="bg-indigo-800 text-white px-5 py-1.5 rounded-xl text-lg font-black shadow-xl shadow-indigo-100">
                {reach.toLocaleString()}
              </div>
            </div>
            
            <div className="relative pt-2">
              <input 
                type="range"
                min="0"
                max={reachOptions.length - 1}
                step="1"
                value={reachOptions.indexOf(reach)}
                onChange={(e) => setReach(reachOptions[parseInt(e.target.value)])}
                className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-800"
              />
              <div className="flex justify-between mt-4">
                {reachOptions.map((opt) => (
                  <button 
                    key={opt} 
                    onClick={() => setReach(opt)}
                    className={`flex flex-col items-center gap-1.5 transition-all ${reach === opt ? 'scale-110' : 'opacity-40'}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${reach === opt ? 'bg-indigo-800 shadow-[0_0_10px_rgba(79,70,229,0.8)]' : 'bg-slate-400'}`}></div>
                    <span className={`text-[10px] font-black ${reach === opt ? 'text-black' : 'text-slate-600'}`}>
                      {opt >= 1000 ? `${opt / 1000}K` : opt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Targeting */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 text-amber-800 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPin size={24} />
              </div>
              <h3 className="font-black uppercase tracking-wider text-lg text-black dark:text-white">{t('টার্গেট লোকেশন', 'LOCATION')}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setLocation('All Bangladesh')}
                className={`py-4 px-6 rounded-2xl font-black text-sm uppercase transition-all ${
                  location === 'All Bangladesh' 
                    ? 'bg-amber-600 text-white shadow-xl' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <span>{t('সারা বাংলাদেশ', 'ALL BANGLADESH')}</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={location !== 'All Bangladesh' ? location : ''}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={`py-4 px-6 rounded-2xl font-black text-sm uppercase transition-all outline-none border-none ${
                    location !== 'All Bangladesh' 
                      ? 'bg-amber-600 text-white shadow-xl' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <option value="" disabled>{t('জেলা সিলেক্ট করুন', 'SELECT DISTRICT')}</option>
                  {districts.map(d => (
                    <option key={d} value={d} className="text-black">{d}</option>
                  ))}
                </select>

                <select
                  disabled={location === 'All Bangladesh'}
                  value={subLocation}
                  onChange={(e) => setSubLocation(e.target.value)}
                  className={`py-4 px-6 rounded-2xl font-black text-sm uppercase transition-all outline-none border-none ${
                    subLocation !== 'All Thanas' 
                      ? 'bg-amber-600 text-white shadow-xl' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-30'
                  }`}
                >
                  <option value="All Thanas">{t('সকল থানা', 'ALL THANAS')}</option>
                  {location !== 'All Bangladesh' && districtThanaMap[location]?.map(than => (
                    <option key={than} value={than} className="text-black">{than}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black dark:text-indigo-200 uppercase tracking-widest opacity-60">{t('উপলব্ধ অডিয়েন্স', 'AVAILABLE AUDIENCE')}</span>
                <span className="text-xl font-black text-indigo-800 dark:text-indigo-400">{estimatedAudience.toLocaleString()} IDs</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Type & Frequency Section */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Target size={24} />
              </div>
              <h3 className="font-black uppercase tracking-wider text-lg text-black dark:text-white">{t('ব্যবহারকারীর ধরণ', 'USER TYPE')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {roleOptions.map(role => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`py-4 rounded-2xl font-black text-xs uppercase transition-all ${
                    targetRoles.includes(role.id)
                      ? 'bg-emerald-500 text-white shadow-xl'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900'
                  }`}
                >
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex gap-8">
              {/* Frequency */}
              <div className="flex-1 space-y-4">
                <h3 className="font-black text-black dark:text-white uppercase tracking-widest text-[10px] opacity-60">{t('প্রচার সংখ্যা (প্রতিদিন)', 'PER DAY')}</h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setDailyFrequency(Math.max(1, dailyFrequency - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-2xl font-black text-black hover:bg-slate-300 transition-colors"
                  >-</button>
                  <span className="text-3xl font-black text-black dark:text-white px-2">{dailyFrequency}</span>
                  <button 
                    onClick={() => setDailyFrequency(Math.min(10, dailyFrequency + 1))}
                    className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg hover:bg-indigo-500 transition-all"
                  >+</button>
                </div>
              </div>
              
              {/* Duration */}
              <div className="flex-1 space-y-4">
                <h3 className="font-black text-black dark:text-white uppercase tracking-widest text-[10px] opacity-60">{t('বিজ্ঞাপনের সময় (সেক)', 'DURATION (SEC)')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {durationOptions.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        duration === d 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-5 border-t-2 border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest mb-1 opacity-60">{t('মোট প্রচারণা', 'TOTAL SHOWS')}</p>
                <h4 className="text-xl font-black text-black dark:text-white">{(reach * validity * dailyFrequency).toLocaleString()}</h4>
              </div>
              <div>
                <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest mb-1 opacity-60">{t('বিজ্ঞাপন লেংথ', 'AD LENGTH')}</p>
                <h4 className="text-xl font-black text-black dark:text-white">{duration} {t('সেকেন্ড', 'Sec')}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placement List - Scrollable */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MonitorPlay size={32} />
            </div>
            <h3 className="font-black uppercase tracking-wider text-xl">{t('প্লেসমেন্ট সিলেক্ট করুন', 'PLACEMENT')}</h3>
          </div>
          <span className="text-xs font-black text-slate-400">{placements.length} Selected</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
          {placementOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => togglePlacement(opt.id)}
              className={`py-4 px-5 rounded-2xl text-xs font-black uppercase transition-all flex items-center justify-between group text-left ${
                placements.includes(opt.id)
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <span className="whitespace-normal leading-tight">{opt.label}</span>
              <div className="flex-shrink-0 ml-2">
                {placements.includes(opt.id) ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-indigo-400"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ad Content Section */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-10 group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Layers size={32} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-wider text-xl text-black dark:text-white">{t('বিজ্ঞাপনের বিবরণ ও কন্টেন্ট', 'AD CONTENT & CREATIVE')}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('আপনার বিজ্ঞাপনের ছবি, ভিডিও এবং লিংক যুক্ত করুন', 'UPLOAD MEDIA & SOCIAL LINKS')}</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setAdMediaType('image')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${adMediaType === 'image' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <ImageIcon size={16} />
              {t('ছবি', 'IMAGE')}
            </button>
            <button 
              onClick={() => setAdMediaType('video')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${adMediaType === 'video' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <Video size={16} />
              {t('ভিডিও', 'VIDEO')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Media Upload and Text Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('বিজ্ঞাপনের শিরোনাম', 'AD TITLE (OPTIONAL)')}</label>
              <input 
                type="text" 
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder={t('যেমন: উকিল নির্বাচনের বিশেষ প্রচারণা', 'e.g. Bar Election Special Promo')}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('বিজ্ঞাপনের সংক্ষিপ্ত বিবরণ', 'AD DESCRIPTION')}</label>
              <textarea 
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
                rows={3}
                placeholder={t('আপনার বিজ্ঞাপন সম্পর্কে কিছু লিখুন...', 'Write something about your ad...')}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {adMediaType === 'image' ? t('বিজ্ঞাপনের ছবি আপলোড করুন', 'UPLOAD AD IMAGE') : t('বিজ্ঞাপনের ভিডিও আপলোড করুন', 'UPLOAD AD VIDEO')}
              </label>
              <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all overflow-hidden group/upload">
                {adMedia ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30">
                    <div className="text-center space-y-2">
                      <CheckIcon className="mx-auto text-indigo-600" size={32} />
                      <p className="text-sm font-black text-indigo-950 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{adMedia.name}</p>
                      <button onClick={(e) => { e.preventDefault(); setAdMedia(null); }} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Change File</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover/upload:scale-110 transition-transform">
                      {adMediaType === 'image' ? <ImageIcon size={28} className="text-slate-300" /> : <Video size={28} className="text-slate-300" />}
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('ফাইল সিলেক্ট করুন', 'CLICK TO UPLOAD')}</p>
                  </div>
                )}
                <input type="file" className="hidden" accept={adMediaType === 'image' ? 'image/*' : 'video/*'} onChange={(e) => setAdMedia(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800/50">
            <h4 className="font-black text-indigo-950 dark:text-white uppercase tracking-tight text-sm mb-4">{t('সোশ্যাল ও ওয়েবে রিডাইরেক্ট লিংক', 'REDIRECT & SOCIAL LINKS')}</h4>
            
            <div className="space-y-5">
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center transition-transform group-focus-within/input:scale-110">
                  <Facebook size={18} />
                </div>
                <input 
                  type="url" 
                  value={fbLink}
                  onChange={(e) => setFbLink(e.target.value)}
                  placeholder="https://facebook.com/your-page"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-16 pr-6 py-4 font-bold text-sm text-slate-700 dark:text-white focus:border-indigo-500 outline-none shadow-sm transition-all"
                />
                {fbLink && (
                  <div className="mt-4">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-4 mb-2 block">{t('MDC LEGAL ফেসবুক কাভার ফটো', 'MDC LEGAL FB COVER PHOTO')}</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setFbCoverPhoto(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 ring-2 ring-rose-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center transition-transform group-focus-within/input:scale-110">
                  <Youtube size={18} />
                </div>
                <input 
                  type="url" 
                  value={ytLink}
                  onChange={(e) => setYtLink(e.target.value)}
                  placeholder="https://youtube.com/c/your-channel"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-16 pr-6 py-4 font-bold text-sm text-slate-700 dark:text-white focus:border-rose-500 outline-none shadow-sm transition-all"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center transition-transform group-focus-within/input:scale-110">
                  <Link size={18} />
                </div>
                <input 
                  type="url" 
                  value={otherLink}
                  onChange={(e) => setOtherLink(e.target.value)}
                  placeholder="https://your-website.com"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-16 pr-6 py-4 font-bold text-sm text-slate-700 dark:text-white focus:border-emerald-500 outline-none shadow-sm transition-all"
                />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white dark:bg-slate-900 rounded-2xl text-[10px] md:text-xs font-bold text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
              {t('প্রোমোশন বাড়াতে আপনার ভিডিও বা ওয়েবসাইটের ডিরেক্ট লিংক যুক্ত করুন। এতে ইউজার ড্রাইভ করা সহজ হবে।', 'Adding direct links to your video or website helps drive more users and increases conversions.')}
            </div>
          </div>
        </div>
      </div>

      {/* Live Ad Preview Section */}
      <div className="max-w-5xl mx-auto mb-40 px-4">
        <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl group">
          <div className="p-6 md:p-8 border-b-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Eye size={20} />
              </div>
              <h3 className="text-xl font-black text-indigo-950 dark:text-white uppercase tracking-tight">{t('বিজ্ঞাপনের লাইভ প্রিভিউ', 'LIVE AD PREVIEW')}</h3>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Draft Mode</span>
            </div>
          </div>
          <div className="p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-inner relative overflow-hidden group/ad">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${adType === 'Election' ? 'bg-amber-600' : 'bg-indigo-600'} text-white flex items-center justify-center shadow-xl`}>
                    {(() => {
                      const Icon = adTypes.find(t => t.id === adType)?.icon || MonitorPlay;
                      return <Icon size={32} />;
                    })()}
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-indigo-950 dark:text-white uppercase tracking-tighter">
                      {adTitle || (adType === 'Election' ? 'Election Candidate Profile' : 'Professional Legal Service')}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{adType} • {location}</p>
                  </div>
                </div>
                
                <div className="h-2 w-24 bg-indigo-600 rounded-full"></div>
                
                <p className="text-base md:text-lg font-bold text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  {adDescription || (adType === 'Election' 
                    ? `Vote for a better association. Join the movement for a strong and unified bar in ${location}.` 
                    : `Get expert legal consultation in ${location}. Specialized in Civil and Criminal litigation.`
                  )}
                </p>

                <div className="pt-4 flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700">#AD_CAMPAIGN</span>
                  <span className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700">{reach.toLocaleString()} REACH</span>
                  {fbLink && <span className="px-4 py-2 bg-blue-600 rounded-xl text-[8px] font-black text-white shadow-sm flex items-center gap-1"><Facebook size={12} /> FB</span>}
                  {ytLink && <span className="px-4 py-2 bg-rose-600 rounded-xl text-[8px] font-black text-white shadow-sm flex items-center gap-1"><Youtube size={12} /> YT</span>}
                </div>
              </div>
              
              {/* Fake UI Decorations */}
              <div className="absolute top-0 right-0 p-8">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <Zap size={20} />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Sticky Footer */}
      <div className="fixed bottom-24 left-4 right-4 lg:left-80 lg:right-8 z-40">
        <motion.div 
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          className="max-w-5xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-indigo-700 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6"
        >
          <div className="flex items-center gap-4 md:gap-6 px-2 md:px-4 text-left w-full md:w-auto">
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-1 opacity-60">{t('প্ল্যান ওভারভিউ', 'PLAN OVERVIEW')}</p>
              <div className="flex items-center gap-3 text-indigo-950 dark:text-white">
                <span className="text-lg font-black">{adType}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-base font-bold">{reach.toLocaleString()} Reach</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-base font-bold truncate max-w-[100px]">{location}</span>
                {adType === 'Election' ? (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-amber-600 uppercase leading-none">All Members</span>
                      <span className="text-[9px] font-bold text-slate-400 leading-tight">(Paid + Free)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-600 uppercase leading-none">Free Members</span>
                      <span className="text-[9px] font-bold text-slate-400 leading-tight">(Non-Subscribed)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="border-l-2 border-slate-100 dark:border-slate-800 pl-4 md:pl-6 flex-1 md:flex-none">
              <p className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-widest mb-1 opacity-40">{t('মোট বাজেট', 'TOTAL BUDGET')}</p>
              <h4 className="text-2xl md:text-3xl font-black text-indigo-700">৳{totalPrice}</h4>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-indigo-700 text-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-3 md:gap-4 uppercase shadow-2xl shadow-indigo-100 active:scale-95"
          >
            {t('এক্টিভেট করুন', 'ACTIVATE NOW')}
            <ChevronRight size={24} className="md:w-7 md:h-7" />
          </button>
        </motion.div>
      </div>

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        language={language}
        totalPrice={totalPrice}
        onConfirm={(method, data) => {
          onPurchase({
            type: adType,
            reach,
            validity,
            placement: placements,
            totalPrice,
            location,
            subLocation,
            targetRoles,
            adTitle,
            adDescription,
            fbLink,
            fbCoverPhoto: fbCoverPhoto || undefined,
            adMedia: adMedia || undefined,
            ytLink,
            otherLink,
            adMediaType,
            paymentMethod: method,
            paymentStatus: method === 'mobile' ? 'active' : 'pending'
          });
          setShowPaymentModal(false);
          alert(method === 'mobile' 
            ? (language === 'bn' ? 'বিজ্ঞাপন সরাসরি একটিভ হয়েছে!' : 'Ad Pack Activated Instantly!')
            : (language === 'bn' ? 'সফলভাবে জমা হয়েছে। এনালগ ক্লিয়ারেন্সের জন্য অপেক্ষা করুন।' : 'Submitted successfully. Waiting for manual clearance.')
          );
        }}
      />
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
