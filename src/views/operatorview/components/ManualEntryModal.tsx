import React, { useState } from 'react';
import { X, LogOut, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../shared/supabase';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: { plate: string; vehicleType: 'motorbike' | 'car'; fee: number; paymentMethod: string }) => void;
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  onSuccess
}: ManualEntryModalProps) {
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'motorbike' | 'car'>('motorbike');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getFee = () => vehicleType === 'motorbike' ? 5000 : 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      alert('Vui lòng nhập biển số xe');
      return;
    }

    setIsSubmitting(true);
    const fee = getFee();
    
    try {
      // Log transaction to Supabase
      const { error } = await supabase
        .from('transactions')
        .insert([{
          plate: plate.toUpperCase(),
          vehicle_type: vehicleType,
          fee: fee,
          payment_method: paymentMethod,
          entry_type: 'manual_exit',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error logging transaction:', error);
        alert('Lỗi khi xử lý giao dịch');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ plate, vehicleType, fee, paymentMethod });
      }
      
      setTimeout(() => {
        setPlate('');
        setVehicleType('motorbike');
        setPaymentMethod('cash');
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error processing manual exit:', error);
      alert('Lỗi hệ thống');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogOut size={24} />
            <h2 className="text-xl font-bold">Xe Xuất Bãi Thủ Công</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle size={48} className="text-green-500" />
            <p className="text-lg font-bold text-slate-800">Xử lý thành công!</p>
            <p className="text-sm text-slate-600">Biển số {plate}</p>
            <p className="text-sm font-semibold text-green-600">Phí: {getFee().toLocaleString()} đ</p>
          </div>
        ) : (
          /* Content */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Warning */}
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-amber-900">Chỉ khi cảm biến lỗi</p>
                <p className="text-xs text-amber-700 mt-1">Sử dụng khi máy quét không hoạt động</p>
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Biển Số Xe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="VD: ABC-1234"
                maxLength={10}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono font-bold"
                required
                autoFocus
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Loại Xe <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleType('motorbike')}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    vehicleType === 'motorbike'
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Xe Máy
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    vehicleType === 'car'
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Ô Tô
                </button>
              </div>
            </div>

            {/* Fee Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Phí Cần Thu</p>
              <p className="text-3xl font-bold text-slate-800">{getFee().toLocaleString()} <span className="text-lg">đ</span></p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Thanh Toán <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'mobile')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="cash">Tiền Mặt</option>
                <option value="card">Thẻ Ngân Hàng</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !plate.trim()}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Xuất'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
