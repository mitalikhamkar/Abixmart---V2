import React from 'react';

export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-top">
        <span className="adm-label">{label}</span>
        {Icon && <Icon size={16} className="adm-stat-icon" />}
      </div>
      <p className="adm-stat-value font-display">{value}</p>
      {hint && <p className="adm-stat-hint">{hint}</p>}
    </div>
  );
}