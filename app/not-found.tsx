'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[family-name:var(--font-sans)] transition-colors duration-300">
            <div className="max-w-md w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="mb-8 relative inline-block"
                >
                    {/* Decorative Elements */}
                    <div className="absolute -inset-4 bg-blue-500/5 rounded-md blur-3xl" />

                    <div className="relative bg-[var(--card-bg)] p-8 rounded-md border border-[var(--card-border)]">
                        <div className="bg-blue-600 w-20 h-20 rounded-md flex items-center justify-center text-white mx-auto mb-6 transform -rotate-12 transition-transform hover:rotate-0 duration-500">
                            <Search size={40} strokeWidth={2.5} />
                        </div>

                        <h1 className="text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-2">404</h1>
                        <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mb-6" />

                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">Endpoint Not Found</h2>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
                            The page you're looking for doesn't exist or has been moved to a different status.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all group"
                            >
                                <Home size={18} />
                                Return to Dashboard
                            </Link>

                            <button
                                onClick={() => window.history.back()}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-6 py-2 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Go Back
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Minimal Footer Tag */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400"
                >
                    KanbanLite System
                </motion.p>
            </div>
        </div>
    );
}
