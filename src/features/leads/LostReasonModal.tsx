import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface LostReasonModalProps {
  isOpen: boolean;
  leadName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const LostReasonModal: React.FC<LostReasonModalProps> = ({
  isOpen,
  leadName,
  onClose,
  onConfirm,
}) => {
  const [reasonCategory, setReasonCategory] = useState('Joined Competitor');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const fullReason = details.trim() 
        ? `${reasonCategory}: ${details.trim()}` 
        : reasonCategory;
      await onConfirm(fullReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-base">
            <AlertTriangle className="h-5 w-5" />
            <span>Mark Enquiry as Lost</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Please record why <strong className="text-slate-900">{leadName}</strong> is being marked as Lost. This will be preserved in admission analytics.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Primary Reason *
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="Joined Competitor">Enrolled with another coaching institute</option>
              <option value="Fee / Budget Constraint">Fee / budget constraints</option>
              <option value="Timing / Batch Conflict">Course timing or batch conflict</option>
              <option value="Location / Commute Issue">Location / distance issue</option>
              <option value="No Response / Invalid Contact">Unreachable / invalid contact number</option>
              <option value="Changed Educational Plans">Changed plans / career direction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Student opted for a college minor instead..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Lost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
