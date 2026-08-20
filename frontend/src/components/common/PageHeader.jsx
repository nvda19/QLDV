export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
  noPrint = false
}) {
  return (
    <div className={`page-header ${noPrint ? 'no-print' : ''} ${className}`}>
      <div className="page-header-title-container">
        <h2 className="page-header-title">{title}</h2>
        {subtitle && <p className="page-header-subtitle text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
