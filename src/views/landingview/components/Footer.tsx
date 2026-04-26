import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ParkingCircle } from 'lucide-react';
import { REVEAL_VIEWPORT, fadeUp } from '../animations';
import LegalDocModal, { type LegalDocSection } from './LegalDocModal';
import LiveMapModal from './LiveMapModal';
import ContactSupportModal from './ContactSupportModal';

// Single source of truth for legal doc content. Co-located with the Footer
// since this is the only place they're referenced; if Privacy / Terms ever
// gain dedicated routes, this data is trivial to lift into a separate module.
const PRIVACY_POLICY: { title: string; lastUpdated: string; sections: LegalDocSection[] } = {
  title: 'Privacy Policy',
  lastUpdated: 'January 15, 2026',
  sections: [
    {
      heading: 'Information We Collect',
      body: 'We collect license plate numbers, NFC card identifiers, vehicle entry/exit timestamps, parking zone usage data, and any payment information you provide. For HCMUT members, we link this data to your student or staff ID to enable monthly billing and access policies. No biometric data is collected at any time.',
    },
    {
      heading: 'How We Use Your Data',
      body: 'Vehicle and access data is used solely to operate the parking system: granting entry, calculating charges, generating receipts, and providing real-time slot availability. Aggregate, anonymized usage statistics may be used by HCMUT facility planners to optimize traffic flow and capacity allocation.',
    },
    {
      heading: 'Data Sharing',
      body: 'We never sell your data. We share information only with: (1) HCMUT IT Services for authentication, (2) authorized payment processors for transaction settlement, and (3) law enforcement when legally required under Vietnamese law. Third parties access only the minimum data needed for their specific function.',
    },
    {
      heading: 'Data Retention',
      body: 'Active session data is retained for 24 months for billing dispute resolution. Anonymized statistical data may be retained indefinitely. You may request deletion of your account at any time; deletion is processed within 30 days, subject to legal retention requirements that apply to financial records.',
    },
    {
      heading: 'Security',
      body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). NFC tokens use rotating cryptographic challenges, making card cloning computationally infeasible. The platform undergoes annual security audits by HCMUT\'s Faculty of Computer Science and Engineering.',
    },
    {
      heading: 'Your Rights',
      body: 'You may access, correct, or delete your personal data at any time through the member portal or by contacting parking@hcmut.edu.vn. You also have the right to data portability and to lodge complaints with the relevant Vietnamese data protection authorities.',
    },
  ],
};

const TERMS_OF_SERVICE: { title: string; lastUpdated: string; sections: LegalDocSection[] } = {
  title: 'Terms of Service',
  lastUpdated: 'January 15, 2026',
  sections: [
    {
      heading: 'Acceptance of Terms',
      body: 'By using the HCMUT Smart Parking System ("Service"), you agree to these terms. If you do not agree, please do not use the service. These terms apply to visitors, students, faculty, staff, and any third parties using HCMUT parking facilities.',
    },
    {
      heading: 'Eligibility & Accounts',
      body: 'Member accounts are limited to current HCMUT students, faculty, and staff. Visitors may use the service without an account via QR-based payments at the gate. You are responsible for maintaining the confidentiality of your account credentials and the physical security of your NFC card.',
    },
    {
      heading: 'Fees & Payment',
      body: 'Visitor parking is charged at the published hourly rate displayed at gate entrances. Member subscriptions are billed monthly in advance. All fees are quoted in Vietnamese Dong (VND) and are inclusive of applicable VAT. Disputes must be raised within 30 days of the transaction date through the member portal.',
    },
    {
      heading: 'Acceptable Use',
      body: 'You may use the system only for lawful, personal, non-commercial purposes. You may not: (1) attempt to circumvent gate hardware, sensors, or sensor calibration; (2) share your NFC card with non-members; (3) park in zones outside your authorization tier; or (4) use the system to harass, surveil, or stalk other users.',
    },
    {
      heading: 'Liability',
      body: 'HCMUT provides this service "as is" and is not liable for vehicle damage, theft, or loss occurring within parking zones beyond what is required by Vietnamese law. Users are responsible for securing their vehicles. The system\'s availability is best-effort; we target 99.9% uptime but make no absolute guarantee.',
    },
    {
      heading: 'Termination',
      body: 'HCMUT may suspend or terminate access for violations of these terms, fraudulent activity, or non-payment. You may close your account at any time through the member portal. Termination does not waive any outstanding fees or other obligations accrued prior to termination.',
    },
    {
      heading: 'Governing Law',
      body: 'These terms are governed by the laws of the Socialist Republic of Vietnam. Any disputes will be resolved through HCMUT\'s internal mediation process first, and through the competent Vietnamese courts thereafter.',
    },
  ],
};

type ActiveModal = 'privacy' | 'terms' | 'map' | 'support' | null;

export default function Footer() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const close = () => setActiveModal(null);

  // Defining the link items as data so the markup stays compact and keeping
  // them in scroll-order matches a user's natural reading top-to-bottom.
  const linkItems: { label: string; modal: ActiveModal }[] = [
    { label: 'Privacy Policy', modal: 'privacy' },
    { label: 'Terms of Service', modal: 'terms' },
    { label: 'Campus Map', modal: 'map' },
    { label: 'Support', modal: 'support' },
  ];

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={fadeUp}
      className="w-full pt-16 pb-8 bg-slate-50 flex flex-col md:flex-row justify-between items-center px-8 border-t border-slate-200/50"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <ParkingCircle className="text-primary" size={24} />
            <p className="text-xl font-bold text-primary font-headline">HCMUT Parking</p>
          </div>
          <p className="font-body text-sm text-slate-500 max-w-xs">
            © 2026 HCMUT Smart Parking System. Engineering the Future of Campus Mobility.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 font-body text-sm font-semibold">
          {linkItems.map(({ label, modal }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveModal(modal)}
              className="text-slate-600 hover:text-primary transition-colors active:scale-95"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:-translate-y-1 transition-all shadow-sm group active:scale-95"
            title="Back to top"
            aria-label="Back to top"
          >
            <ArrowUp size={18} className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <LegalDocModal
        open={activeModal === 'privacy'}
        onClose={close}
        title={PRIVACY_POLICY.title}
        lastUpdated={PRIVACY_POLICY.lastUpdated}
        sections={PRIVACY_POLICY.sections}
      />
      <LegalDocModal
        open={activeModal === 'terms'}
        onClose={close}
        title={TERMS_OF_SERVICE.title}
        lastUpdated={TERMS_OF_SERVICE.lastUpdated}
        sections={TERMS_OF_SERVICE.sections}
      />
      <LiveMapModal open={activeModal === 'map'} onClose={close} />
      <ContactSupportModal open={activeModal === 'support'} onClose={close} />
    </motion.footer>
  );
}
