import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Sparkles, Volume2, MessageCircle, X } from 'lucide-react';
import { parseEntry, isExpenseRelated } from '../lib/parser';
import { ParsedEntry } from '../lib/types';

type AssistantState = 'idle' | 'listening' | 'processing' | 'asking_mode' | 'rejected';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface VoiceAssistantProps {
  onSubmit: (entry: ParsedEntry) => void;
  disabled?: boolean;
}

const REJECTION_RESPONSE = "I am an AI expense updation assistant. I can only help with recording payments and receivals. Please tell me about an expense or income entry.";
const ASK_MODE_RESPONSE = "Was this by cash or online?";
const CONFIRM_PREFIX = "Got it. Recording ";
const NON_EXPENSE_RESPONSE = "That doesn't seem like an expense or income entry. I only handle payment and receival records. Please tell me about a transaction.";

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
    // Fallback resolve in case onend doesn't fire
    setTimeout(resolve, 5000);
  });
}

function formatEntrySummary(entry: ParsedEntry): string {
  const parts: string[] = [];
  parts.push(`${entry.type} of Rs ${entry.amount}`);
  parts.push(`for ${entry.category}`);
  if (entry.person) parts.push(`to/from ${entry.person}`);
  parts.push(`on ${entry.day} ${entry.date}`);
  parts.push(`at ${entry.time}`);
  if (entry.location) parts.push(`at ${entry.location}`);
  parts.push(`via ${entry.payment_mode}`);
  return parts.join(', ');
}

export default function VoiceAssistant({ onSubmit, disabled }: VoiceAssistantProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingEntry, setPendingEntry] = useState<ParsedEntry | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pendingEntryRef = useRef<ParsedEntry | null>(null);

  useEffect(() => {
    setRecognitionSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep ref in sync
  useEffect(() => {
    pendingEntryRef.current = pendingEntry;
  }, [pendingEntry]);

  const addMessage = useCallback((role: 'ai' | 'user', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setState('idle');
  }, []);

  const confirmAndSubmit = useCallback((entry: ParsedEntry) => {
    const summary = formatEntrySummary(entry);
    const confirmMsg = CONFIRM_PREFIX + summary;
    addMessage('ai', confirmMsg);
    if (speechSupported) speak(confirmMsg);
    onSubmit(entry);
    setPendingEntry(null);
    setState('idle');
  }, [onSubmit, speechSupported, addMessage]);

  const handleModeResponse = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    const isCash = ['cash', 'hard cash', 'physical', 'in hand', 'by cash', 'in cash'].some(k => lower.includes(k));
    const isOnline = ['online', 'upi', 'gpay', 'google pay', 'phonepe', 'phone pe', 'paytm', 'card', 'net banking', 'bank transfer'].some(k => lower.includes(k));

    if (isCash) {
      const entry = pendingEntryRef.current;
      if (entry) {
        confirmAndSubmit({ ...entry, payment_mode: 'cash', payment_mode_explicit: true });
      }
    } else if (isOnline) {
      const entry = pendingEntryRef.current;
      if (entry) {
        confirmAndSubmit({ ...entry, payment_mode: 'online', payment_mode_explicit: true });
      }
    } else {
      addMessage('ai', REJECTION_RESPONSE);
      if (speechSupported) speak(REJECTION_RESPONSE);
      setPendingEntry(null);
      setState('idle');
    }
  }, [confirmAndSubmit, speechSupported, addMessage]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setState('listening');

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      recognitionRef.current = null;
      setState('processing');
      processTranscript(transcript);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setState('idle');
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setState(prev => prev === 'listening' ? 'idle' : prev);
      }
    };

    try { recognition.start(); } catch { setState('idle'); }
  }, []);

  const processTranscript = useCallback((transcript: string) => {
    addMessage('user', transcript);

    const currentPending = pendingEntryRef.current;

    // If we're waiting for payment mode answer
    if (currentPending && !currentPending.payment_mode_explicit) {
      handleModeResponse(transcript);
      return;
    }

    // Check if it's expense related at all
    if (!isExpenseRelated(transcript)) {
      setState('rejected');
      addMessage('ai', NON_EXPENSE_RESPONSE);
      if (speechSupported) speak(NON_EXPENSE_RESPONSE);
      return;
    }

    const entry = parseEntry(transcript);

    if (entry.amount === 0) {
      setState('rejected');
      addMessage('ai', REJECTION_RESPONSE);
      if (speechSupported) speak(REJECTION_RESPONSE);
      return;
    }

    // If payment mode not specified, ask
    if (!entry.payment_mode_explicit) {
      setPendingEntry(entry);
      setState('asking_mode');
      addMessage('ai', ASK_MODE_RESPONSE);
      if (speechSupported) {
        speak(ASK_MODE_RESPONSE).then(() => startListening());
      } else {
        startListening();
      }
      return;
    }

    confirmAndSubmit(entry);
  }, [addMessage, handleModeResponse, confirmAndSubmit, speechSupported, startListening]);

  const handleStart = useCallback(() => {
    if (disabled) return;
    setShowChat(true);
    const greeting = 'Hello! Tell me about your expense or income. For example, Paid 500 to Mr Raj in cash for office rent.';
    addMessage('ai', greeting);
    if (speechSupported) {
      speak(greeting).then(() => startListening());
    } else {
      startListening();
    }
  }, [disabled, speechSupported, startListening, addMessage]);

  const handleClose = useCallback(() => {
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setShowChat(false);
    setMessages([]);
    setPendingEntry(null);
    setState('idle');
  }, [stopRecognition]);

  if (!recognitionSupported) {
    return (
      <div className="w-full">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700 font-medium">Voice assistant requires Chrome or Edge browser with HTTPS access.</p>
          <p className="text-xs text-amber-600 mt-1">Use the text entry below instead, or open this site in Chrome/Edge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Big start button when chat is closed */}
      {!showChat && (
        <button
          onClick={handleStart}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Talk to ExpenseFlow AI</p>
            <p className="text-xs text-blue-200">Tap and speak your expense</p>
          </div>
        </button>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ExpenseFlow AI</p>
                <p className="text-xs text-blue-200">
                  {state === 'listening' && 'Listening...'}
                  {state === 'processing' && 'Processing...'}
                  {state === 'asking_mode' && 'Waiting for payment mode...'}
                  {state === 'rejected' && 'Try again'}
                  {state === 'idle' && 'Ready'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (state === 'idle') startListening(); }}
                disabled={state !== 'idle'}
                className={`p-2 rounded-lg transition-all ${
                  state === 'listening'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={state === 'listening' ? 'Listening...' : 'Start talking'}
              >
                {state === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={handleClose} className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'ai'
                    ? 'bg-blue-600 text-white rounded-tl-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tr-sm shadow-sm'
                }`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Volume2 className="w-3 h-3 text-blue-200" />
                      <span className="text-xs text-blue-200 font-medium">AI</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Listening indicator */}
          {state === 'listening' && (
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <p className="text-sm text-slate-500">Listening... speak now</p>
              </div>
            </div>
          )}

          {/* Tap to talk when idle */}
          {state === 'idle' && messages.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <button
                onClick={() => startListening()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Mic className="w-4 h-4" />
                Tap to speak
              </button>
            </div>
          )}

          {/* Asking mode hint */}
          {state === 'asking_mode' && (
            <div className="px-4 py-3 border-t border-slate-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700 font-medium">Say "cash" or "online"</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
