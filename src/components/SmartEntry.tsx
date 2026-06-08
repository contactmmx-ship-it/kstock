import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles, Check, Edit2, RotateCcw, MapPin } from 'lucide-react';
import { useVoiceInput } from '../lib/hooks';
import { parseEntry } from '../lib/parser';
import { ParsedEntry, GPSLocation } from '../lib/types';

interface SmartEntryProps {
  onSubmit: (entry: ParsedEntry) => void;
  disabled?: boolean;
  gpsLocation?: GPSLocation | null;
  gpsStatus?: 'unknown' | 'granted' | 'denied' | 'loading';
  onRequestGPS?: () => void;
}

type VoiceState = 'idle' | 'listening' | 'confirming' | 'editing';

export default function SmartEntry({ onSubmit, disabled, gpsLocation, gpsStatus, onRequestGPS }: SmartEntryProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [pendingTranscript, setPendingTranscript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, supported, startListening, clearTranscript, error: voiceError } = useVoiceInput();

  // Voice result arrives → show confirm/edit/repeat UI
  useEffect(() => {
    if (transcript && voiceState === 'listening') {
      setPendingTranscript(transcript);
      setInput(transcript);
      handleParse(transcript);
      setVoiceState('confirming');
      clearTranscript();
    }
  }, [transcript, voiceState, clearTranscript]);

  // Track listening state
  useEffect(() => {
    if (isListening) setVoiceState('listening');
  }, [isListening]);

  const handleParse = (text: string) => {
    if (!text.trim()) { setParsed(null); setShowPreview(false); return; }
    const result = parseEntry(text);
    setParsed(result);
    setShowPreview(true);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim().length > 5) {
      handleParse(value);
    } else {
      setShowPreview(false);
    }
  };

  const handleSubmit = useCallback(() => {
    if (!parsed || !input.trim()) return;
    const finalParsed = { ...parsed };
    if (gpsLocation) {
      finalParsed.location = finalParsed.location || gpsLocation.locality || gpsLocation.city || '';
    }
    onSubmit(finalParsed);
    setInput('');
    setParsed(null);
    setShowPreview(false);
    setVoiceState('idle');
    setPendingTranscript('');
    inputRef.current?.focus();
  }, [parsed, input, onSubmit, gpsLocation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && parsed) handleSubmit();
  };

  // Voice confirm/edit/repeat handlers
  const handleVoiceConfirm = () => {
    handleSubmit();
  };

  const handleVoiceEdit = () => {
    setVoiceState('editing');
    inputRef.current?.focus();
    inputRef.current?.select();
    // Speak instruction (if speechSynthesis available)
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Please alter the message as you want.');
      u.lang = 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const handleVoiceRepeat = () => {
    setVoiceState('idle');
    setInput('');
    setParsed(null);
    setShowPreview(false);
    setPendingTranscript('');
    setTimeout(() => {
      startListening();
      setVoiceState('listening');
    }, 300);
  };

  const handleMicClick = () => {
    setVoiceState('listening');
    startListening();
  };

  const labelMap: Record<string, string> = {
    amount: 'Amount',
    type: 'Type',
    category: 'Category',
    payment_mode: 'Payment',
    person: 'Person',
    date: 'Date',
    time: 'Time',
    location: 'Location',
  };

  const isConfirming = voiceState === 'confirming';
  const isEditing = voiceState === 'editing';

  return (
    <div className="w-full">
      {/* Input Row */}
      <div className="relative">
        <div className={`flex items-center gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm transition-all ${
          isConfirming
            ? 'border-amber-400 ring-2 ring-amber-400/20'
            : isEditing
            ? 'border-violet-500 ring-2 ring-violet-500/20'
            : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}>
          <Sparkles className={`w-5 h-5 flex-shrink-0 ${isConfirming ? 'text-amber-500' : isEditing ? 'text-violet-500' : 'text-blue-500'}`} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              voiceState === 'listening'
                ? 'Listening... speak now'
                : 'Try: "500 amit ko diye" or "received 2000 from Rajesh"'
            }
            className="flex-1 outline-none text-slate-800 placeholder-slate-400 text-sm bg-transparent"
            disabled={disabled || voiceState === 'listening'}
            readOnly={isConfirming}
          />

          {/* GPS Indicator */}
          {gpsLocation && (
            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0">
              <MapPin className="w-3 h-3" />
              {gpsLocation.city || 'Located'}
            </span>
          )}
          {gpsStatus === 'unknown' && onRequestGPS && (
            <button
              onClick={onRequestGPS}
              className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 flex-shrink-0 transition-colors"
              title="Enable GPS"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}

          {/* Mic button */}
          {supported && voiceState !== 'confirming' && voiceState !== 'editing' && (
            <button
              onClick={handleMicClick}
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

          {/* Send button */}
          {voiceState !== 'confirming' && (
            <button
              onClick={handleSubmit}
              disabled={!parsed || disabled}
              className={`p-2 rounded-xl transition-all ${parsed ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Confirm / Edit / Repeat Buttons */}
      {isConfirming && (
        <div className="mt-2 flex gap-2 animate-fade-in">
          <button
            onClick={handleVoiceConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Check className="w-4 h-4" /> Confirm
          </button>
          <button
            onClick={handleVoiceEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-sm"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleVoiceRepeat}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Repeat
          </button>
        </div>
      )}

      {/* Edit mode — show submit button */}
      {isEditing && (
        <div className="mt-2 flex gap-2 animate-fade-in">
          <button
            onClick={() => { setVoiceState('idle'); }}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!parsed}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" /> Submit
          </button>
        </div>
      )}

      {/* Voice error */}
      {voiceError && (
        <p className="text-xs text-red-500 mt-1.5 pl-1">{voiceError}. Try typing instead.</p>
      )}

      {/* AI Preview */}
      {showPreview && parsed && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Parsed</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${parsed.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {parsed.type === 'income' ? '↑ INCOME' : '↓ EXPENSE'}
            </span>
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
                time: 'bg-indigo-100 text-indigo-700',
                location: 'bg-teal-100 text-teal-700',
              };
              return (
                <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colorMap[key] || 'bg-slate-100 text-slate-600'}`}>
                  <span className="opacity-60">{label}:</span> {key === 'amount' ? `₹${val}` : val}
                </span>
              );
            })}
            {gpsLocation && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-teal-100 text-teal-700">
                <MapPin className="w-3 h-3" />
                {gpsLocation.locality || gpsLocation.city}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
