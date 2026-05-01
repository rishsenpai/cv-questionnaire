'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, Loader2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { readJson } from '@/lib/storage';

const buildLocalScoutReply = (message: string, user: any) => {
  const text = message.toLowerCase();
  const name = user?.name || 'je profiel';
  const sector = user?.sector || 'de sector waarin je wilt groeien';

  if (text.includes('cv')) {
    return `## CV check\n\n- Zet bovenaan direct je functietitel en locatie.\n- Maak je resultaten concreet met cijfers of impact.\n- Voeg 5 tot 8 relevante skills toe voor ${sector}.\n\n## Snelle winst\n\nWerk daarna je profiel bij, zodat werkgevers sneller zien waarom ${name} een match is.`;
  }

  if (text.includes('telesur') || text.includes('jobs') || text.includes('vacature')) {
    return `## Vacature advies\n\nKijk vooral naar functies die aansluiten op **${sector}** en filter op locatie, ervaringsniveau en type dienstverband.\n\n## Slimme aanpak\n\n- Sla interessante vacatures op\n- Vergelijk de vereisten met je profiel\n- Vul ontbrekende skills of certificaten meteen aan`;
  }

  if (text.includes('skill')) {
    return `## Skill advies\n\nVoor **${sector}** zijn deze drie richtingen slim:\n\n- vakinhoudelijke skills die direct in vacatures terugkomen\n- communicatie en samenwerking\n- digitale tools waarmee je sneller levert\n\nKies 1 skill voor deze maand en voeg bewijs toe in je profiel.`;
  }

  if (text.includes('salaris')) {
    return `## Salaris trends\n\nVergelijk niet alleen op bedrag, maar ook op:\n\n- groeipad\n- secundaire voorwaarden\n- flexibiliteit\n- opleidingsbudget\n\nSterke profielen met duidelijke ervaring en actuele skills onderhandelen meestal beter.`;
  }

  return `## Career Scout\n\nIk help je graag met profieladvies, vacatures, skills en sollicitatiestrategie.\n\nVertel me waar je nu op vastloopt, dan geef ik een concreet volgende stap voor **${name}**.`;
};

export function AICareerScout() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(() => {
    return readJson('suri_user', null);
  });

  useEffect(() => {
    const checkUser = () => {
      setUser(readJson('suri_user', null));
    };

    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = typeof overrideMessage === 'string' ? overrideMessage : input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const reply = buildLocalScoutReply(userMessage, user);
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: "Mijn excuses, er is een fout opgetreden. Probeer het opnieuw." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-blue-600 text-white p-4 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-black uppercase tracking-widest text-xs"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline">Ask AI Scout</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-[101] w-full sm:w-[450px] sm:max-h-[700px] flex flex-col bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(59,130,246,1)] overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 border-2 border-white flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-sm italic">Career Scout <span className="text-[8px] bg-blue-600 px-1 ml-1">BETA</span></h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Career Tips Ready
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Sluit career scout"
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px] max-h-[500px]"
            >
              {messages.length === 0 && (
                <div className="text-center py-10 px-6">
                  <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                  <h4 className="font-black uppercase tracking-tight italic mb-2">Hoe kan ik je carrière helpen?</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Vraag me over vacatures bij Staatsolie, hoe je je CV kunt verbeteren, of welke skills op dit moment populair zijn in Suriname.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "Check mijn CV",
                      "Jobs bij Telesur?",
                      "Skill advies",
                      "Salaris trends"
                    ].map(hint => (
                      <button 
                        key={hint}
                        onClick={() => handleSend(hint)}
                        className="bg-white border-2 border-black px-3 py-1.5 text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  key={i} 
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 shrink-0 flex items-center justify-center border-2 border-black font-black text-[10px]",
                    msg.role === 'user' ? "bg-yellow-400" : "bg-blue-600 text-white"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative",
                    msg.role === 'user' ? "bg-white" : "bg-white italic"
                  )}>
                    <div className="prose prose-xs prose-p:my-1 text-[12px] font-medium leading-relaxed text-slate-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 border-2 border-black flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-4 border-black bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="STEL JE VRAAG..."
                  className="flex-1 bg-slate-50 border-2 border-black p-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="bg-black text-white p-3 hover:bg-blue-600 transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <Zap className="w-3 h-3 text-yellow-400" />
                AI can make mistakes. Verify important info.
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
