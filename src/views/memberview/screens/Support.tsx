import React, { useState, useEffect } from 'react';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Send,
  LifeBuoy,
  X,
  SearchX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "How can I extend my monthly parking plan?",
    answer: "You can go to the 'Payments' section, select your current parking plan, and click the 'Extend Plan' button. The system will automatically deduct the balance from your wallet and extend the validity for another 30 days.",
    tags: ['Membership', 'Plan', 'Extend']
  },
  {
    question: "What should I do if I lose my physical parking card?",
    answer: "Don't worry! Please visit the Operator office at the main gate (Campus 1 or Campus 2). Bring your ID card and the registered license plate info on the App to receive a new physical card.",
    tags: ['Loss Card', 'QR Code']
  },
  {
    question: "How do I update my vehicle's license plate?",
    answer: "In the 'Payments' section, you can edit your vehicle information and update the new license plate number. Note: The Primary vehicle is the one used for gate recognition.",
    tags: ['Vehicle', 'Membership']
  },
  {
    question: "My account balance is incorrect. What should I do?",
    answer: "Please check your transaction history in the 'Parking History' section. If there's a mistake, submit a 'Support Request' below with the transaction ID, and our technical team will resolve it within 24 hours.",
    tags: ['Refund', 'Balance']
  }
];

const searchTags = ['Refund', 'Membership', 'Loss Card', 'QR Code'];

export default function Support() {
  const { profile } = useProfile();
  const [userVehicles, setUserVehicles] = useState<any[]>([]);

  const [openFaqs, setOpenFaqs] = useState<number[]>([0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [subject, setSubject] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');

  const allFaqsOpen = openFaqs.length === faqs.length;

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAllFaqs = () => {
    setOpenFaqs(allFaqsOpen ? [] : faqs.map((_, i) => i));
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const filteredFaqs = faqs
    .map((faq, index) => ({ ...faq, index }))
    .filter((faq) => {
      if (!isSearching) return true;
      return (
        faq.question.toLowerCase().includes(normalizedSearch) ||
        faq.answer.toLowerCase().includes(normalizedSearch) ||
        faq.tags.some((t) => t.toLowerCase().includes(normalizedSearch))
      );
    });

  const handleTagClick = (tag: string) => {
    setSearchTerm((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag));
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('vehicles')
        .select('id, plate_number, model_name')
        .eq('user_id', profile.id);
      if (data) {
        setUserVehicles(data);
      }
    };
    fetchVehicles();
  }, [profile?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setSubject('');
    setSelectedVehicle('');
    setDescription('');
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto flex flex-col gap-8 pb-10"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">How can we help?</h1>
        <p className="text-slate-500">Quickly find help or contact our 24/7 dedicated support team.</p>
      </header>

      {/* Hero Search Section */}
      <div className="relative bg-primary rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Search for answers</h2>
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 size-6" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white border-none shadow-xl focus:ring-4 focus:ring-white/20 text-lg outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {searchTags.map((tag) => {
              const isActive = searchTerm.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-primary shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Methods */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-slate-800">Direct Support</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Emergency Hotline</p>
                <p className="text-xs text-slate-400">CS1: 028-1234-5678</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Live Chat Support</p>
                <p className="text-xs text-slate-400">Always active 24/7</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Official Email</p>
                <p className="text-xs text-slate-400">parking@hcmut.edu.vn</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-100 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-orange-600" size={20} />
              <p className="font-bold text-orange-800 text-sm">Security Guard</p>
            </div>
            <p className="text-xs text-orange-700 leading-relaxed">
              If you notice suspicious activity or fire, please call security immediately: <b>113</b> (Internal) or the numbers above.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">
              {isSearching
                ? `${filteredFaqs.length} result${filteredFaqs.length !== 1 ? 's' : ''} for "${searchTerm}"`
                : 'Frequent Questions'}
            </h3>
            {!isSearching && (
              <button
                type="button"
                onClick={toggleAllFaqs}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                {allFaqsOpen ? 'Collapse all' : 'View all'} <HelpCircle size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <SearchX size={26} />
                </div>
                <p className="font-bold text-slate-700">No results found</p>
                <p className="text-sm text-slate-400 mt-1">
                  We couldn't find any article matching "{searchTerm}". Try a different keyword or{' '}
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-primary font-bold hover:underline"
                  >
                    clear your search
                  </button>
                  .
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = isSearching ? true : openFaqs.includes(faq.index);
                return (
                  <div
                    key={faq.index}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(faq.index)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex-1 pr-4">{faq.question}</span>
                      {isOpen ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 pt-0 text-slate-500 text-sm leading-relaxed border-t border-slate-50 bg-slate-50/30">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Contact Form */}
          <div className="mt-4 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <LifeBuoy size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">Submit a Request</h4>
                <p className="text-xs text-slate-400">We'll get back to you in less than 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Payment Issue"
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Related Vehicle</label>
                <select
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">Select vehicle...</option>
                  {userVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate_number} ({v.model_name})</option>
                  ))}
                  <option value="other">Other issue</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Describe your problem</label>
                <textarea
                  rows={4}
                  placeholder="Please describe your problem in detail..."
                  className="bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${formSubmitted ? 'bg-green-500 text-white' : 'bg-primary text-white hover:brightness-110 shadow-primary/20'}`}
                >
                  {formSubmitted ? (
                    <>Sent Successfully!</>
                  ) : (
                    <>
                      <Send size={18} /> Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
