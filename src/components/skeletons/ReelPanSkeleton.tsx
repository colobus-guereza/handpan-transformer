
import { motion } from "framer-motion";

export function ReelPanSkeleton() {
    return (
        <motion.div
            key="page-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-[999] bg-slate-950"
        >
            {/* 1. Center: Digipan Skeleton (Background Layer) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[85vw] max-w-[360px] aspect-square">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[30%] h-[30%] rounded-full bg-white/10 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                    </div>
                </div>
            </div>

            {/* 2. UI Overlay: Header & Footer (Foreground Layer) */}
            <div className="absolute inset-0 flex flex-col justify-between">
                {/* Header Skeleton - matches real header (px-4 py-8, centered scale name) */}
                <header className="relative flex items-center justify-center px-4 py-8 bg-gradient-to-b from-black/80 to-transparent">
                    {/* Back button placeholder */}
                    <div className="absolute left-4 w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                    {/* Scale name placeholder */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-28 h-6 bg-white/10 rounded-md animate-pulse" />
                            <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                </header>

                {/* Spacer to match client structure exactly */}
                <div className="flex-1 min-h-[100px]" />

                {/* Footer Skeleton - matches real footer (px-6 py-8 pb-6, min-h-[180px], justify-end) */}
                <footer className="w-full px-6 py-8 pb-6 bg-gradient-to-t from-black/95 to-transparent min-h-[180px] flex flex-col justify-end items-center gap-6">
                    {/* Button group placeholder */}
                    <div className="w-full flex items-center justify-between max-w-[380px] relative">
                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                        {/* Center record button - larger */}
                        <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                            <div className="w-[85%] h-[85%] rounded-full bg-white/10 animate-pulse" />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                    </div>
                </footer>
            </div>
        </motion.div>
    );
}
