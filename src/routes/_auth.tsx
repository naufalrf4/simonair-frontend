import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ReactNode } from 'react';
import { Fish, Waves, Thermometer, BellRing } from 'lucide-react';

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
});

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full relative overflow-hidden bg-gradient-to-tr from-[#0c2139] via-[#105372] to-[#2db5cd]">
      {/* ANIMATED BACKGROUND BUBBLES */}
      <AnimatedBubbles />

      {/* Left: Branding & Info */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#2291c7] via-[#1c5072]/90 to-[#17385b]/95 flex-col items-center justify-between p-0 relative overflow-hidden z-10">

        <div className="w-full flex flex-col items-center justify-center h-full px-10">
          <div className="text-center max-w-lg space-y-5 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl mt-10">
            <Fish className="w-14 h-14 mx-auto text-accent animate-bounce drop-shadow-lg" strokeWidth={1.5} />
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-primary-foreground tracking-tight drop-shadow-md">
              ELSA IoT
              <span className="text-lg font-semibold block text-primary-foreground/90 mt-2">
                Environment Liquid Smart Analyzer
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-base sm:text-lg mb-4">
              Real-time monitoring & management of <b>water quality</b> for your ornamental freshwater fish tanks.<br />
              Stay ahead with sensor logs, smart calibrations, and automated alerts all in one dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <FeatureCard
                icon={<Waves className="w-6 h-6 text-accent" />}
                label="Live Sensor Logs"
              />
              <FeatureCard
                icon={<Thermometer className="w-6 h-6 text-accent" />}
                label="Temperature & pH"
              />
              <FeatureCard
                icon={<BellRing className="w-6 h-6 text-accent" />}
                label="Threshold Alerts"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 w-full text-center text-primary-foreground/70 text-xs sm:text-sm tracking-wide z-10">
          © {new Date().getFullYear()} ELSA IoT &middot; <span className="font-semibold text-accent">TEK 59</span> Sekolah Vokasi IPB. All rights reserved.
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="w-full md:w-1/2 bg-gradient-to-b from-[#eaf8fc] via-[#e7f0f8] to-[#f5fbfd] flex items-center justify-center p-6 md:p-10 z-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/20 shadow hover:scale-105 transition-transform border border-white/15 min-w-[90px]">
      {icon}
      <span className="text-xs text-primary-foreground mt-1 font-semibold">{label}</span>
    </div>
  );
}

// ANIMATED SVG BUBBLES COMPONENT
function AnimatedBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Keyframes for bubbles */}
      <style>
        {`
          @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 0.48; }
            80% { opacity: 0.28; }
            100% { transform: translateY(-110vh) scale(1.18); opacity: 0; }
          }
          .bubble {
            animation: float-up 15s linear infinite;
          }
          .bubble2 { animation-duration: 19s; animation-delay: 2s; }
          .bubble3 { animation-duration: 13s; animation-delay: 4s; }
          .bubble4 { animation-duration: 22s; animation-delay: 1.5s; }
          .bubble5 { animation-duration: 16s; animation-delay: 5s; }
        `}
      </style>
      <svg className="absolute left-[5%] bottom-[-60px] w-24 h-24 bubble" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="40" ry="28" fill="#38bdf8" fillOpacity="0.19" />
      </svg>
      <svg className="absolute left-[25%] bottom-[-100px] w-32 h-28 bubble bubble2" viewBox="0 0 110 110">
        <ellipse cx="55" cy="55" rx="44" ry="32" fill="#06b6d4" fillOpacity="0.16" />
      </svg>
      <svg className="absolute left-[60%] bottom-[-80px] w-28 h-20 bubble bubble3" viewBox="0 0 110 80">
        <ellipse cx="55" cy="40" rx="34" ry="24" fill="#2563eb" fillOpacity="0.14" />
      </svg>
      <svg className="absolute left-[45%] bottom-[-120px] w-40 h-36 bubble bubble4" viewBox="0 0 180 130">
        <ellipse cx="90" cy="65" rx="60" ry="44" fill="#2dd4bf" fillOpacity="0.14" />
      </svg>
      <svg className="absolute left-[80%] bottom-[-60px] w-20 h-14 bubble bubble5" viewBox="0 0 70 40">
        <ellipse cx="35" cy="20" rx="30" ry="18" fill="#1e293b" fillOpacity="0.08" />
      </svg>
    </div>
  );
}

function RouteComponent() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
