import React from 'react';

const Watermark = () => {
  return (
    <div className="fixed bottom-4 right-6 pointer-events-none z-[9999] opacity-30 select-none mix-blend-overlay">
      <h1 className="text-4xl md:text-6xl font-black text-[var(--text-muted)] tracking-tighter uppercase">
        Pramanit
      </h1>
    </div>
  );
};

export default Watermark;
