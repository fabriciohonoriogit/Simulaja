import React from 'react';

const JarvisAvatar = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`relative ${className} rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-[1px] shadow-lg shadow-cyan-500/10`}>
      {/* Outer subtle glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-purple-500/30 opacity-75" />

      {/* Inner orb background */}
      <div className="relative w-full h-full rounded-full bg-slate-950/90 backdrop-blur-md flex items-center justify-center overflow-hidden">
        {/* Core AI Gradient Glow */}
        <div className="absolute w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-cyan-400/30 via-blue-500/20 to-purple-400/30 blur-sm" />

        {/* Minimalist AI Spark Core SVG (Gemini / Apple Intelligence Style) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3/5 h-3/5 text-cyan-300 relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
        >
          <path
            d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
            fill="currentColor"
          />
          <path
            d="M18.5 2C18.5 3.933 16.933 5.5 15 5.5C16.933 5.5 18.5 7.067 18.5 9C18.5 7.067 20.067 5.5 22 5.5C20.067 5.5 18.5 3.933 18.5 2Z"
            fill="currentColor"
            className="opacity-75"
          />
        </svg>
      </div>
    </div>
  );
};

export default JarvisAvatar;
