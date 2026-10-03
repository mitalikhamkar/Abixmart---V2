import React from 'react';

// Lightweight, dependency-free charts. They render only the data they are
// given and show an explicit empty message when there is nothing to plot.

export function ChartCard({ title, hint, aside, children }) {
  return (
    <div className="adm-panel adm-panel-pad">
      <div className="adm-chart-head">
        <div className="min-w-0">
          <h3 className="adm-chart-title font-display">{title}</h3>
          {hint && <p className="adm-chart-hint">{hint}</p>}
        </div>
        {aside && <span className="adm-chart-total">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

// Horizontal bars. items: [{ key, label, value, sub? }]
export function BarList({
  items,
  valueFormat = (v) => String(v),
  showShare = true,
  limit,
  gold = false,
  empty = 'No data yet.',
}) {
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0);
  const rows = limit ? items.slice(0, limit) : items;
  const max = rows.reduce((m, i) => Math.max(m, Number(i.value) || 0), 0);

  if (rows.length === 0 || total === 0) return <p className="adm-chart-empty">{empty}</p>;

  return (
    <div className="adm-barlist">
      {rows.map((item) => {
        const value = Number(item.value) || 0;
        const width = max ? (value / max) * 100 : 0;
        return (
          <div key={item.key}>
            <div className="adm-bar-top">
              <span className="adm-bar-label">{item.label}</span>
              <span className="adm-bar-value">
                {valueFormat(value)}
                {showShare ? ` · ${Math.round((value / total) * 100)}%` : ''}
              </span>
            </div>
            <div className="adm-bar-track">
              <div className={`adm-bar-fill${gold ? ' adm-bar-fill--gold' : ''}`} style={{ width: `${width}%` }} />
            </div>
            {item.sub && <p className="adm-bar-sub">{item.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

// Vertical bars over time. series: [{ key, label, value }]
export function TimeBars({ series, valueFormat = (v) => String(v), name = 'Chart', empty = 'No data in this period.' }) {
  const total = series.reduce((s, p) => s + (Number(p.value) || 0), 0);
  if (series.length === 0 || total === 0) return <p className="adm-chart-empty">{empty}</p>;

  const max = series.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0);
  const peak = series.find((p) => Number(p.value) === max);
  const step = Math.ceil(series.length / 6);

  return (
    <div>
      <div
        className="adm-timebars"
        role="img"
        aria-label={`${name}. Total ${valueFormat(total)}, peak ${valueFormat(max)} on ${peak?.label}.`}
      >
        {series.map((p) => {
          const value = Number(p.value) || 0;
          return (
            <div key={p.key} className={`adm-timebar${value === 0 ? ' is-zero' : ''}`} title={`${p.label}: ${valueFormat(value)}`}>
              <span style={{ height: `${max ? (value / max) * 100 : 0}%` }} />
            </div>
          );
        })}
      </div>
      <div className="adm-timelabels" aria-hidden="true">
        {series.map((p, i) => (
          <span key={p.key}>{i % step === 0 && <em>{p.label}</em>}</span>
        ))}
      </div>
      <p className="adm-chart-caption">
        Total {valueFormat(total)} · Peak {valueFormat(max)} ({peak?.label})
      </p>
    </div>
  );
}