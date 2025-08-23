import React from "react";
import { ButtonLoadingSpinner } from "./LoadingSpinner";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = "left",
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 focus:ring-primary-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
    ghost: "hover:bg-gray-100 text-gray-700 focus:ring-primary-500",
    outline:
      "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const isDisabled = disabled || loading;

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <>
          <ButtonLoadingSpinner />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4 mr-2" />}
          {children}
          {Icon && iconPosition === "right" && (
            <Icon className="w-4 h-4 ml-2" />
          )}
        </>
      )}
    </button>
  );
};

// Specialized button components
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;

export const SecondaryButton = (props) => (
  <Button variant="secondary" {...props} />
);

export const DangerButton = (props) => <Button variant="danger" {...props} />;

export const SuccessButton = (props) => <Button variant="success" {...props} />;

export const GhostButton = (props) => <Button variant="ghost" {...props} />;

export const OutlineButton = (props) => <Button variant="outline" {...props} />;

// Icon button component
export const IconButton = ({
  icon: Icon,
  tooltip,
  size = "md",
  variant = "ghost",
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <Button
      variant={variant}
      className={`${sizeClasses[size]} ${className}`}
      title={tooltip}
      {...props}
    >
      <Icon className={iconSizeClasses[size]} />
    </Button>
  );
};

export default Button;
