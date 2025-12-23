import React from 'react';

const Box = ({ children, className }) => {
  return (
    <div
      className={`
        bg-neutral-900 
        rounded-lg 
        h-fit 
        w-full 
        ${className || ""}
      `}
    >
      {children}
    </div>
  );
};

export default Box;