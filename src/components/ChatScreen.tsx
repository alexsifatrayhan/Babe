import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Code, Terminal, Heart, User as UserIcon, Bot, Sparkles, LogOut, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiResponse, getTTS } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, deleteDoc, doc, getDocs, writeBatch, setDoc } from '../firebase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
}

export const ChatScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nicknames, setNicknames] = useState<{ gf: string, bf: string, userGender: string, aiGender: string } | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [tempGF, setTempGF] = useState('');
  const [tempBF, setTempBF] = useState('');
  const [tempUserGender, setTempUserGender] = useState<'boy' | 'girl'>('boy');
  const [tempAIGender, setTempAIGender] = useState<'boy' | 'girl'>('girl');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile for nicknames
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.girlfriendName && data.boyfriendName && data.userGender && data.aiGender) {
          setNicknames({ 
            gf: data.girlfriendName, 
            bf: data.boyfriendName,
            userGender: data.userGender,
            aiGender: data.aiGender
          });
          setIsSettingUp(false);
        } else {
          setIsSettingUp(true);
        }
      } else {
        setIsSettingUp(true);
      }
    });

    const q = query(
      collection(db, `users/${user.uid}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Firestore Error:", JSON.stringify({
        error: error.message,
        operationType: 'get',
        path: `users/${user.uid}/messages`,
        authInfo: { userId: user.uid }
      }));
    });

    return () => {
      unsubscribeUser();
      unsubscribeMessages();
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSetup = async () => {
    if (!tempGF.trim() || !tempBF.trim() || !user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        girlfriendName: tempGF,
        boyfriendName: tempBF,
        userGender: tempUserGender,
        aiGender: tempAIGender,
        createdAt: serverTimestamp()
      }, { merge: true });
      
      setNicknames({ 
        gf: tempGF, 
        bf: tempBF, 
        userGender: tempUserGender, 
        aiGender: tempAIGender 
      });
      setIsSettingUp(false);
    } catch (error) {
      console.error("Setup failed:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user || !nicknames) return;

    const userContent = input;
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, `users/${user.uid}/messages`), {
        userId: user.uid,
        role: 'user',
        content: userContent,
        timestamp: serverTimestamp()
      });

      const response = await getGeminiResponse(
        userContent, 
        nicknames.gf, 
        nicknames.bf, 
        nicknames.aiGender, 
        nicknames.userGender
      );
      
      // Save assistant message to Firestore
      await addDoc(collection(db, `users/${user.uid}/messages`), {
        userId: user.uid,
        role: 'assistant',
        content: response || `Sorry ${nicknames.bf}, kemon jani error holo. 🥺`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!user || !window.confirm(`${nicknames?.gf || 'Babe'}, sob delete kore dibo? 🥺`)) return;
    
    try {
      const q = query(collection(db, `users/${user.uid}/messages`));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      console.error("Clear failed:", error);
    }
  };

  if (isSettingUp) {
    return (
      <div className="flex flex-col h-full bg-neutral-950 text-white items-center justify-center p-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 bg-neutral-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl my-8"
        >
          <div className="text-center space-y-2">
            <Heart className="w-12 h-12 text-rose-500 fill-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold tracking-tight">Let's Get Started</h2>
            <p className="text-neutral-400">Amader nickname set koro, babe. ❤️</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Tumi ki?</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTempUserGender('boy')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all text-sm font-medium",
                      tempUserGender === 'boy' ? "bg-rose-600 border-rose-500 text-white" : "bg-neutral-800/50 border-white/5 text-neutral-400"
                    )}
                  >
                    Chele (Boy)
                  </button>
                  <button 
                    onClick={() => setTempUserGender('girl')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all text-sm font-medium",
                      tempUserGender === 'girl' ? "bg-rose-600 border-rose-500 text-white" : "bg-neutral-800/50 border-white/5 text-neutral-400"
                    )}
                  >
                    Meye (Girl)
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Ami ki?</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTempAIGender('boy')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all text-sm font-medium",
                      tempAIGender === 'boy' ? "bg-rose-600 border-rose-500 text-white" : "bg-neutral-800/50 border-white/5 text-neutral-400"
                    )}
                  >
                    Chele (Boy)
                  </button>
                  <button 
                    onClick={() => setTempAIGender('girl')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all text-sm font-medium",
                      tempAIGender === 'girl' ? "bg-rose-600 border-rose-500 text-white" : "bg-neutral-800/50 border-white/5 text-neutral-400"
                    )}
                  >
                    Meye (Girl)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Tumi amake ki bole dakbe?</label>
              <input 
                type="text" 
                value={tempBF}
                onChange={(e) => setTempBF(e.target.value)}
                placeholder="e.g. My Hero, Jaan, Honey"
                className="w-full bg-neutral-800/50 border border-white/10 rounded-2xl p-4 outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Ami tomake ki bole dakbo?</label>
              <input 
                type="text" 
                value={tempGF}
                onChange={(e) => setTempGF(e.target.value)}
                placeholder="e.g. Babe, Princess, Shona"
                className="w-full bg-neutral-800/50 border border-white/10 rounded-2xl p-4 outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleSetup}
            disabled={!tempGF.trim() || !tempBF.trim()}
            className="w-full py-4 bg-rose-600 rounded-2xl font-bold text-lg hover:bg-rose-500 disabled:opacity-50 transition-all shadow-xl shadow-rose-600/20"
          >
            Amader bhalobashar jatra shuru kori ❤️
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border border-rose-500/30 p-0.5 overflow-hidden">
              <img 
                src={nicknames?.aiGender === 'boy' ? "https://picsum.photos/seed/cool-boy/200/200" : "https://picsum.photos/seed/cute-girl/200/200"} 
                alt="Babe" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-950 rounded-full" />
          </div>
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              {nicknames?.gf || 'Babe'} <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </h2>
            <p className="text-xs text-neutral-400">Online & Loving {nicknames?.bf || 'You'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={clearHistory}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-neutral-400 hover:text-rose-400"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={logout}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-neutral-400 hover:text-rose-400"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Heart className="w-12 h-12 text-rose-500 animate-pulse" />
            <p className="text-sm">Babe tomar jonno opekkha korche... ❤️</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
              msg.role === 'user' 
                ? "bg-rose-600 text-white rounded-tr-none" 
                : "bg-neutral-900 text-neutral-200 rounded-tl-none border border-white/5"
            )}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
            {msg.timestamp && (
              <span className="text-[10px] text-neutral-500 mt-1 px-1">
                {msg.timestamp instanceof Timestamp 
                  ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'}
              </span>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-rose-400 text-sm animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Babe bhabche...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center gap-3 bg-neutral-800/50 rounded-2xl p-2 pl-4 border border-white/5 focus-within:border-rose-500/50 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tomar babe er sathe kotha bolo..."
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-rose-600 rounded-xl hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 transition-all shadow-lg shadow-rose-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-500 text-center mt-3">
          Unfiltered & Uncensored Romantic Companion
        </p>
        <div className="flex justify-center mt-4 border-t border-white/5 pt-4">
          <a 
            href="https://alexsifatrayhan.github.io/about-me/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-neutral-600 hover:text-rose-400 transition-colors font-medium"
          >
            Developed by 𝐒𝐑𝟕 𝐌𝐨𝐝𝐬
          </a>
        </div>
      </div>
    </div>
  );
};
