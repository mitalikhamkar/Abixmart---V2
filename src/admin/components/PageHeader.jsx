import React from 'react';

// Shared page heading for every admin section: gold eyebrow, display
// title, optional description, optional right-aligned actions (filters).
export default function PageHeader({ title, eyebrow = 'ABIXMART Admin', description, children }) {
  return (
    <div className="adm-pagehead">
      <div className="min-w-0">
        <p className="adm-eyebrow">{eyebrow}</p>
        <h1 className="adm-title font-display">{title}</h1>
        {description && <p className="adm-subtitle">{description}</p>}
      </div>
      {children && <div className="adm-pagehead-actions">{children}</div>}
    </div>
  );
}