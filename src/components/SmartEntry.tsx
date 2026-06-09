import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, Edit3 } from 'lucide-react';
import { useVoiceInput } from '../lib/hooks';
import { parseEntry } from '../lib/parser';
import { ParsedEntry } from '../lib/types';

interface SmartEntryProps {
  onSubmit: (entry: ParsedEntry) => void;
  disabled?: boolean;
}

export default function SmartEntry({ onSubmit, disabled }: SmartEntryProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    transcript,
    supported,
    startListening,
    clearTranscript,
  } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      handleParse(transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  const handleParse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setShowPreview(false);
      return;
    }
    const result = parseEntry(text);
    setParsed(result);
    setShowPreview(true);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim().length > 2) {
      handleParse(value);
    } else {
      setShowPreview(false);
    }
  };

  const handleSubmit = () => {
    if (!parsed || !input.trim()) return;
    const entry = { ...parsed, payment_mode: parsed.payment_mode || 'cash' };
    onSubmit(entry);
    setInput('');
    setParsed(null);
    setShowPreview(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && parsed) handleSubmit();
  };

  const labelMap: Record<string, string> = {
    amount: 'Amount',
    type: 'Type',
    category: 'Category',
    payment_mode: 'Payment',
    person: 'Person',
    date: 'Date',
    day: 'Day',
    time: 'Time',
    location: 'Location',
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Try: "Paid 500 to Amit for office rent"'
            className="flex-1 outline-none text-slate-800 placeholder-slate-400 text-sm bg-transparent"
            disabled={disabled}
          />
          {input && (
            <button
              onClick={() => inputRef.current?.focus()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {supported && (
            <button
              onClick={startListening}
              disabled={isListening || disabled}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}
              title="Voice input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!parsed || disabled}
            className={`p-2 rounded-xl transition-all ${
              parsed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showPreview && parsed && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Parsed</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(labelMap).map(([key, label]) => {
              const val = (parsed as any)[key];
              if (!val) return null;
              const colorMap: Record<string, string> = {
                amount: 'bg-blue-100 text-blue-700',
                type: val === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                category: 'bg-violet-100 text-violet-700',
                payment_mode: val === 'online' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700',
                person: 'bg-slate-200 text-slate-700',
                date: 'bg-indigo-100 text-indigo-700',
                day: 'bg-indigo-100 text-indigo-700',
                time: 'bg-indigo-100 text-indigo-700',
                location: 'bg-teal-100 text-teal-700',
              };
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colorMap[key] || 'bg-slate-100 text-slate-600'}`}
                >
                  <span className="opacity-60">{label}:</span>
                  {String(val)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
