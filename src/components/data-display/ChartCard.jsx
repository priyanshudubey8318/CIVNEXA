import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

/**
 * ChartCard Component
 * Wraps Chart.js visualizations in an enterprise card layout with custom tooltips and responsive styling
 */
export const ChartCard = ({
  title,
  subtitle,
  type = 'doughnut', // 'doughnut' or 'bar'
  data,
  options = {},
  height = 260,
  action,
  className = '',
}) => {
  const defaultDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 14,
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
          color: '#475569',
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 10,
        cornerRadius: 8,
      },
    },
    cutout: '70%',
  };

  const defaultBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#64748B',
        },
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          stepSize: 1,
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#64748B',
        },
      },
    },
  };

  const mergedOptions = {
    ...(type === 'doughnut' ? defaultDoughnutOptions : defaultBarOptions),
    ...options,
  };

  return (
    <div className={`cx-card ${className}`}>
      <div className="cx-card-header">
        <div>
          <h2 className="h6 mb-0" style={{ color: 'var(--cx-navy-900)', fontWeight: 700 }}>
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--cx-slate-500)', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="cx-card-body">
        <div style={{ height: `${height}px`, position: 'relative' }}>
          {type === 'doughnut' ? (
            <Doughnut data={data} options={mergedOptions} />
          ) : (
            <Bar data={data} options={mergedOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
