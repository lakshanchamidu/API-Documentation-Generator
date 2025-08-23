import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({
  size = "md",
  text = "",
  className = "",
  centered = true,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const containerClasses = centered
    ? "flex flex-col items-center justify-center min-h-[200px]"
    : "flex items-center space-x-2";

  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

// Page loading spinner
export const PageLoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
      <p className="mt-4 text-lg text-gray-600">{text}</p>
    </div>
  </div>
);

// Inline loading spinner
export const InlineLoadingSpinner = ({
  text = "Loading...",
  className = "",
}) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

// Button loading spinner
export const ButtonLoadingSpinner = ({ className = "" }) => (
  <Loader2 className={`w-4 h-4 animate-spin ${className}`} />
);

// Overlay loading spinner
export const OverlayLoadingSpinner = ({ text = "Loading..." }) => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  </div>
);

export default LoadingSpinner;
