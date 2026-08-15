import React from "react";

/**
 * zer0-mistakes Input — labelled Bootstrap form control with the token focus
 * ring, optional leading icon, help text, and invalid state.
 */
export function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  help,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const borderColor = invalid
    ? "var(--zer0-color-danger)"
    : focus
    ? "var(--zer0-color-primary)"
    : "var(--zer0-color-border)";

  const wrap = {
    fontFamily: "var(--zer0-font-sans)",
    color: "var(--zer0-color-ink)",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    ...style,
  };
  const field = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: disabled ? "var(--zer0-color-bg-muted)" : "var(--zer0-color-bg)",
    border: `1px solid ${borderColor}`,
    borderRadius: "var(--zer0-radius)",
    padding: "0.45rem 0.7rem",
    boxShadow: focus
      ? invalid
        ? "0 0 0 0.2rem rgba(220, 53, 69, 0.25)"
        : "var(--zer0-shadow-focus)"
      : "none",
    transition: "border-color var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard), box-shadow var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard)",
  };
  const input = {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--zer0-color-ink)",
    fontFamily: "inherit",
    fontSize: "var(--zer0-text-base)",
    minWidth: 0,
  };

  return (
    <label style={wrap} htmlFor={inputId}>
      {label ? (
        <span style={{ fontSize: "var(--zer0-text-sm)", fontWeight: "var(--zer0-font-weight-medium)" }}>
          {label}
        </span>
      ) : null}
      <span style={field}>
        {icon ? <i className={`bi bi-${icon}`} style={{ color: "var(--zer0-color-ink-muted)" }} aria-hidden="true" /> : null}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={input}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...rest}
        />
      </span>
      {help ? (
        <span style={{ fontSize: "var(--zer0-text-sm)", color: invalid ? "var(--zer0-color-danger)" : "var(--zer0-color-ink-muted)" }}>
          {help}
        </span>
      ) : null}
    </label>
  );
}
