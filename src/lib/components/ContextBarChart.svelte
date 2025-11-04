<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { ContextAnalytics } from '$lib/api';

  Chart.register(...registerables);

  export let data: ContextAnalytics[] = [];

  let chartCanvas: HTMLCanvasElement | undefined;
  let chartInstance: Chart | null = null;
  let previousDataLength = 0;

  const EMERALD_50 = '#f0fdf4';
  const EMERALD_100 = '#dcfce7';
  const EMERALD_200 = '#bbf7d0';
  const EMERALD_300 = '#86efac';
  const EMERALD_400 = '#4ade80';
  const EMERALD_500 = '#22c55e';
  const EMERALD_600 = '#16a34a';

  const NEUTRAL_900 = '#0f172a';
  const NEUTRAL_800 = '#1e293b';
  const NEUTRAL_700 = '#334155';
  const WHITE = '#ffffff';
  const GRAY_300 = '#d1d5db';
  const GRAY_400 = '#9ca3af';

  const colors = [
    EMERALD_500,
    EMERALD_400,
    EMERALD_300,
    EMERALD_200,
    EMERALD_100,
    EMERALD_600
  ];

  function initChart() {
    if (!chartCanvas) return;

    const sorted = [...data].sort((a, b) => b.cigaretteCount - a.cigaretteCount);
    const labels = sorted.map((ctx) => ctx.context);
    const counts = sorted.map((ctx) => ctx.cigaretteCount);
    const cravings = sorted.map((ctx) => ctx.avgCraving);
    
    // Use emerald green colors
    const barColors = sorted.map((ctx, idx) => colors[idx % colors.length]);

    if (chartInstance) {
      // Update existing chart with animation
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = counts;
      (chartInstance.data.datasets[0] as any).backgroundColor = barColors;
      chartInstance.update('active');
    } else {
      // Create new chart
      chartInstance = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Cigarettes',
              data: counts,
              backgroundColor: barColors,
              borderColor: EMERALD_600,
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: EMERALD_400,
              hoverBorderColor: EMERALD_300,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: NEUTRAL_800,
              titleColor: WHITE,
              bodyColor: GRAY_300,
              borderColor: NEUTRAL_700,
              borderWidth: 1,
              padding: 12,
              titleFont: {
                size: 14,
                weight: 'bold' as const
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                afterLabel: (context) => {
                  const idx = context.dataIndex;
                  const avgCraving = cravings[idx] ?? 0;
                  return `Avg craving: ${avgCraving.toFixed(1)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: GRAY_400,
                font: {
                  size: 12
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: NEUTRAL_700,
                lineWidth: 0.5
              },
              ticks: {
                color: GRAY_400,
                font: {
                  size: 12
                },
                stepSize: 1
              },
              title: {
                display: true,
                text: 'Cigarettes',
                color: GRAY_400,
                font: {
                  size: 12,
                  weight: 'normal' as const
                }
              }
            }
          }
        }
      });
    }
    previousDataLength = data.length;
  }

  onMount(initChart);

  $: if (data.length > 0 && chartCanvas) {
    initChart();
  }
</script>

<div class="flex justify-center">
  <canvas bind:this={chartCanvas} style="max-height: 280px;"></canvas>
</div>
