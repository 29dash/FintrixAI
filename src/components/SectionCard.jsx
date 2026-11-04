function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`section-card ${className}`}>
      {(title || subtitle || action) && (
        <div className="section-card__header">
          <div>
            {title && <h2 className="section-card__title">{title}</h2>}
            {subtitle && <p className="section-card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="section-card__action">{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}

export default SectionCard;
