import Link from 'next/link';
import "@/app/globals.css";

export default function NotFound() {
    return (
        <div className="absolute inset-0 bg-surface text-on-surface font-body flex flex-col justify-between selection:bg-secondary/30 dark overflow-hidden z-[9999]">
            {/* Error Canvas */}
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
                {/* Subtle Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-container blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-tertiary-container blur-[100px]"></div>
                </div>
                <div className="max-w-3xl w-full text-center relative z-10">
                    {/* Icon/Illustration */}
                    <div className="mb-12 flex justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-secondary/10 blur-2xl rounded-full scale-150 group-hover:bg-secondary/20 transition-all duration-700"></div>
                            <span className="material-symbols-outlined text-9xl text-secondary select-none" data-icon="search_off">search_off</span>
                        </div>
                    </div>
                    {/* 404 Typography */}
                    <h1 className="font-headline font-extrabold text-[12rem] leading-none text-secondary mb-4 tracking-tighter opacity-90" style={{ textShadow: "0 0 20px rgba(255, 223, 158, 0.2)" }}>
                        404
                    </h1>
                    {/* Message Cluster */}
                    <div className="space-y-6">
                        <h2 className="font-headline font-bold text-3xl md:text-4xl text-on-surface tracking-tight">
                            La página que buscas ha sido trasladada o no existe.
                        </h2>
                        <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed">
                            Parece que el expediente o la sección no está disponible en este momento. Verifique la dirección o regrese al panel administrativo.
                        </p>
                    </div>
                    {/* Actions */}
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link className="inline-flex items-center justify-center px-8 py-4 bg-secondary-container text-on-secondary font-semibold rounded-md hover:brightness-110 active:scale-95 transition-all duration-200 shadow-xl shadow-black/20" href="/dashboard">
                            <span className="material-symbols-outlined mr-2" data-icon="dashboard">dashboard</span>
                            Volver al Panel Principal
                        </Link>
                    </div>
                </div>
            </main>
            {/* Footer Component (Shared) */}
            <footer className="w-full py-8 border-t border-[#44474d]/20 bg-[#041329] z-10 relative">
                <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-lg font-bold text-[#ffdf9e]">
                        The Sovereign Authority
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        <a className="font-manrope text-sm tracking-wide text-[#c5c6cd] hover:text-[#d6e3ff] transition-all duration-300" href="#">Privacy Policy</a>
                        <a className="font-manrope text-sm tracking-wide text-[#c5c6cd] hover:text-[#d6e3ff] transition-all duration-300" href="#">Terms of Service</a>
                        <a className="font-manrope text-sm tracking-wide text-[#c5c6cd] hover:text-[#d6e3ff] transition-all duration-300" href="#">Contact Support</a>
                    </div>
                    <p className="font-manrope text-sm tracking-wide text-[#d6e3ff] opacity-60">
                        © 2026 The Sovereign Authority. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
