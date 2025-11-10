import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a78bfa',
  '#ec4899', '#84cc16', '#f97316', '#3b82f6', '#14b8a6', '#eab308'
];

export default function GroupedPie({
  labels, values, title
}: { labels: string[]; values: number[]; title?: string }) {
  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: PIE_COLORS.slice(0, values.length),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverBorderWidth: 4,
      hoverOffset: 8
    }]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'bottom' as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          }
        }
      },
      title: title ? { 
        display: true, 
        text: title,
        font: {
          size: 15
        },
        padding: {
          bottom: 20
        }
      } : undefined,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: {label: string; parsed: number; dataset: {data: number[]}}) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: £${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };
  return <Pie data={data} options={options} />;
}
