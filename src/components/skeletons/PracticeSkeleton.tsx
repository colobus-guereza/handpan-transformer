import { motion } from "framer-motion";

export function PracticeSkeleton() {
    return (
        <motion.div
            key="page-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-[999] bg-slate-950 pointer-events-none"
        >
            {/* 1. Header Skeleton - matches real header */}
            <header className="relative flex items-center justify-center px-4 py-8 pointer-events-none">
                {/* Back button placeholder (Circle, absolute left-4) */}
                <div className="absolute left-4 w-10 h-10 rounded-full bg-white/5 animate-pulse border border-white/5" />
                {/* Song title placeholder (Centered) */}
                <div className="w-28 h-5 bg-white/10 rounded-md animate-pulse" />
            </header>

            {/* 2. Score Area Skeleton - top-[120px] h-[15%] */}
            {/* border-b removed per user request */}
            <div className="absolute top-[120px] left-0 w-full h-[15%] flex items-center justify-center">
                <div className="w-[80%] h-8 bg-white/5 rounded-full animate-pulse" />
            </div>

            {/* 3. Instrument Area Skeleton - Shifted to bottom position: top-[calc(120px+15%)] */}
            <div className="absolute top-[calc(120px+15%)] left-0 w-full h-[50%] flex items-center justify-center">
                <div className="relative w-[85vw] max-w-[310px] aspect-square">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[30%] h-[30%] rounded-full bg-white/10 animate-pulse" />
                    </div>
                    {/* Orbiting dots */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                    </div>
                </div>
            </div>

            {/* 4. Footer Skeleton - Precisely matched to actual footer (absolute mr/ml positioning) */}
            {/* Removed redundant 'relative' which interfered with 'absolute bottom-0' */}
            <footer className="absolute bottom-0 w-full px-6 py-4 pb-6 min-h-[126px] flex items-center justify-center">
                {/* Stop button (absolute right-1/2 mr-[40px]) */}
                <div className="absolute right-1/2 mr-[40px] w-11 h-11 rounded-full bg-white/5 border border-white/5 animate-pulse" />

                {/* Play button (Centered) */}
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 animate-pulse shadow-lg" />

                {/* Loop button (absolute left-1/2 ml-[40px]) */}
                <div className="absolute left-1/2 ml-[40px] w-11 h-11 rounded-full bg-white/5 border border-white/5 animate-pulse" />
            </footer>
        </motion.div>
    );
}
