import React from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Search,
  ChevronRight,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Support() {
  const faqs = [
    { q: "How do I top up my balance?", a: "Go to the Dashboard or Payments screen and select 'Top-up Balance'. You can use BKPay, MoMo, or ZaloPay." },
    { q: "What happens if I lose my student ID?", a: "You can still park by using the visitor mode or by entering your license plate manually at the gate. Contact the security office for a replacement ID." },
    { q: "Can I register multiple vehicles?", a: "Yes, you can manage multiple vehicles in the 'Payments & Vehicles' section. You can set one as your primary vehicle." },
    { q: "How is the parking fee calculated?", a: "Fees are based on the zone and duration. Students get a discounted rate of 2,000 VND/hour for motorbikes and 10,000 VND/hour for cars." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto w-full"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <LifeBuoy size={32} className="text-primary" /> Help & Support
        </h2>
        <p className="text-slate-500">Find answers, contact us, or view our documentation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Live Chat</h4>
            <p className="text-xs text-slate-500 mt-1">Available 24/7 for urgent issues</p>
          </div>
          <button className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">Start Chat</button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <Phone size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Call Support</h4>
            <p className="text-xs text-slate-500 mt-1">Mon-Fri, 8:00 AM - 5:00 PM</p>
          </div>
          <button className="w-full py-2 bg-slate-100 text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">Call Now</button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Email Us</h4>
            <p className="text-xs text-slate-500 mt-1">Response within 24 hours</p>
          </div>
          <button className="w-full py-2 bg-slate-100 text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">Send Email</button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{faq.q}</h4>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <FileText size={40} className="text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-2">User Manual</h3>
            <p className="text-slate-400 text-sm mb-6">Download the full guide on how to use the HCMUT Smart Parking system effectively.</p>
            <button className="flex items-center gap-2 text-primary font-bold hover:underline">
              Download PDF <ExternalLink size={16} />
            </button>
          </div>
        </div>
        <div className="bg-primary p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          <div className="relative z-10">
            <LifeBuoy size={40} className="text-white mb-4" />
            <h3 className="text-2xl font-bold mb-2">Campus Map</h3>
            <p className="text-blue-100 text-sm mb-6">View all parking zones and charging stations across the HCMUT campus.</p>
            <button className="flex items-center gap-2 text-white font-bold hover:underline">
              View Map <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
