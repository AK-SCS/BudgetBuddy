import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend
} from 'chart.js';
import type { BudgetEntry } from '../types/budget';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BudgetChart({ data }: { data: BudgetEntry[] }) {
  const sorted = [...data].sort((a, b) => a.month - b.month);
  const labels = sorted.map(s => MONTHS[(s.month - 1 + 12) % 12]);
  const incomes = sorted.map(s => Number(s.monthly_Income || 0));
  const expenses = sorted.map(s => Number(s.total_Expenses || 0));

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomes,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
          },
          {
            label: 'Expenses',
            data: expenses,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
          }
        ]
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                return context.dataset.label + ': £' + (value !== null ? value.toLocaleString() : '0');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v: number | string) => `£${v}`
            },
            grid: { 
              color: 'rgba(148,163,184,0.1)'
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }}
    />
  );
}
