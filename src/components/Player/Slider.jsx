import React from 'react';

const Slider = ({ value = 1, onChange }) => {
  const handleChange = (newValue) => {
    onChange?.(newValue);
  };

  return (
    <div className="relative flex items-center select-none touch-none w-full h-10">
      <input 
        type="range" 
        min={0} 
        max={1} 
        step={0.1} 
        value={value}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        className="
          w-full 
          h-1 
          bg-neutral-600 
          rounded-lg 
          appearance-none 
          cursor-pointer
          accent-white
          hover:accent-sc-orange
        "
      />
    </div>
  );
}

export default Slider;