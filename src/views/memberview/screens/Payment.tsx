import React, { useState } from 'react';
import { 
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { createPayment } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PaymentSchema } from '@/lib/validations/payment';

export default function Payment() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paymentHistory = [
    { id: '#TRX-9876', date: 'Oct 24, 2023', time: '11:45 AM', amount: '15,000 VND', method: 'Momo Wallet', status: 'Success' },
    { id: '#TRX-9875', date: 'Oct 22, 2023', time: '05:30 PM', amount: '35,000 VND', method: 'Visa ****4242', status: 'Success' },
    { id: '#TRX-9874', date: 'Oct 20, 2023', time: '09:15 AM', amount: '50,000 VND', method: 'ZaloPay', status: 'Failed' },
    { id: '#TRX-9873', date: 'Oct 18, 2023', time: '02:00 PM', amount: '20,000 VND', method: 'Agribank', status: 'Success' },
    { id: '#TRX-9872', date: 'Oct 15, 2023', time: '10:30 AM', amount: '10,000 VND', method: 'Momo Wallet', status: 'Success' },
  ];

  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);
  const currentPayments = paymentHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPayments.map((trx, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{trx.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, paymentHistory.length)} of {paymentHistory.length} transactions
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`size-9 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${page === currentPage ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`size-9 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}