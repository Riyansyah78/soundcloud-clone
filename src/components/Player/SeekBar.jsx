import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/formatTime';

const SeekBar = ({ value, max, onChange }) => {
  const [localValue, setLocalValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sinkronisasi: Kalau tidak sedang digeser user, ikuti waktu lagu
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  // 1. Saat slider digeser (Visual only)
  const handleChange = (e) => {
    setIsDragging(true); // Tandai sedang dragging
    setLocalValue(parseFloat(e.target.value));
  };

  // 2. Saat mouse dilepas (Kirim perintah ke Player)
  const handleMouseUp = () => {
    setIsDragging(false); // Selesai dragging
    if (onChange) {
      onChange(localValue); // <-- BARU kirim data ke Player di sini
    }
  };

  return (
    <div className="flex items-center gap-x-2 w-full group select-none">
      <span className="text-xs text-neutral-400 w-[40px] text-right font-mono">
        {formatTime(localValue)}
      </span>

      <div className="relative flex items-center w-full h-10">
        <input 
          type="range" 
          min={0} 
          max={max || 0} 
          step={0.1}
          value={localValue}
          
          onChange={handleChange}      // Update angka visual
          onMouseUp={handleMouseUp}    // Update lagu (Desktop)
          onTouchEnd={handleMouseUp}   // Update lagu (HP)
          
          className="
            w-full 
            h-1 
            bg-neutral-600 
            rounded-lg 
            appearance-none 
            cursor-pointer
            accent-white
            hover:accent-sc-orange
            z-10
          "
        />
        
        {/* Progress Bar Oranye Visual */}
        <div 
          className="absolute h-1 bg-sc-orange rounded-l-lg pointer-events-none"
          style={{ width: `${(localValue / (max || 1)) * 100}%` }}
        ></div>
      </div>

      <span className="text-xs text-neutral-400 w-[40px] font-mono">
        {formatTime(max)}
      </span>
    </div>
  );
};

export default SeekBar;