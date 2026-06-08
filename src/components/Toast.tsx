import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function Toast({ message, show, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      const t = setTimeout(() => {
        setExiting(true);
        setTimeout(() => { setVisible(false); setExiting(false); onClose(); }, 300);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-toast-in">
      <div className={`${exiting ? 'animate-toast-out' : ''} flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/20`}>
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}
