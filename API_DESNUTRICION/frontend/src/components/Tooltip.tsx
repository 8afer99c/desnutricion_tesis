import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div
        className={`absolute ${positionClasses[position]} hidden group-hover:block w-48 z-50`}
      >
        <div className="bg-slate-800 text-white text-xs text-center leading-relaxed rounded-lg py-2 px-3 shadow-xl pointer-events-none transform transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45 
            ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
          `}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
