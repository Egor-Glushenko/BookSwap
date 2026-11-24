export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {hint && <span className="field-hint">{hint}</span>}
        </label>
      )}
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
