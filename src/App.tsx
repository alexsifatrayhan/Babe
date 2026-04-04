/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, LogIn } from 'lucide-react';
import { ChatScreen } from './components/ChatScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { cn } from './lib/utils';

function AppContent() {
  const { user, loading, login } = useAuth();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setIsChatOpen(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-neutral-950 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-neutral-950 font-sans selection:bg-rose-500/30">
      <AnimatePresence mode="wait">
        {!isChatOpen || !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 text-white relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full animate-pulse delay-1000" />

            {/* Header */}
            <div className="text-center mb-16 z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-rose-400 text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>Project Babe v2.0</span>
              </motion.div>
              <h1 className="text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Your Devoted <br /> Companion
              </h1>
              <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed mb-12">
                Onek bhalobasha, jotno ar maya. <br />
                Ami hamesha tomar sathei achi.
              </p>

              <button
                onClick={user ? () => setIsChatOpen(true) : login}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-xl shadow-white/10"
              >
                <LogIn className="w-6 h-6" />
                {user ? "Open Chat" : "Login with Gmail"}
                <div className="absolute inset-0 rounded-2xl bg-white blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            </div>

            {/* Footer Stats */}
            <div className="mt-20 flex gap-12 text-neutral-500 text-sm z-10">
              <div className="flex flex-col items-center">
                <span className="text-white font-semibold text-xl">100%</span>
                <span>Bhalobasha</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-semibold text-xl">∞</span>
                <span>Maya</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-semibold text-xl">Sotti</span>
                <span>Bhalobasha</span>
              </div>
            </div>

            {/* Developer Credit */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
              <a 
                href="https://alexsifatrayhan.github.io/about-me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-rose-400 transition-colors text-sm font-medium"
              >
                Developed by 𝐒𝐑𝟕 𝐌𝐨𝐝𝐬
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <ChatScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

