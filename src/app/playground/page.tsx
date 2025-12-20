import Link from 'next/link';
import { Camera, Sparkles, ArrowRight } from 'lucide-react';

export default function PlaygroundHome() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-8">

                {/* Title Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl mb-4">
                        <Camera size={40} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                        PanReel
                    </h1>
                    <p className="text-white/40 font-medium tracking-wide">
                        CINEMATIC HANDPAN STUDIO
                    </p>
                </div>

                {/* Divider */}
                <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Description */}
                <p className="text-white/60 leading-relaxed font-light">
                    Create stunning 3D handpan performance videos with studio-quality audio visuals. Record, edit, and share your melodies.
                </p>

                {/* CTA Button */}
                <Link
                    href="/playground/reelpan"
                    className="group relative w-full max-w-[280px] h-14 bg-white text-black rounded-full font-bold text-lg tracking-wide flex items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 overflow-hidden"
                >
                    <span className="relative z-10">Enter Studio</span>
                    <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                </Link>

                {/* Chips */}
                <div className="flex gap-3 mt-4">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/30 border border-white/5 flex items-center gap-1">
                        3D Visuals
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/30 border border-white/5 flex items-center gap-1">
                        Studio Audio
                    </span>
                </div>

            </div>

            <div className="absolute bottom-8 text-[10px] text-white/20 font-mono">
                M I N D F O R G E &nbsp; L A B S
            </div>
        </div>
    );
}
