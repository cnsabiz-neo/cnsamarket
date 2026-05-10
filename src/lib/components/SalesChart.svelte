<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  export let classCounts; // [{ class_num, total, reserved }]

  Chart.register(...registerables);

  let canvas;
  let chart;

  const labels = classCounts.map((d) => `${d.class_num}반`);
  const reservedData = classCounts.map((d) => d.reserved);
  const totalData = classCounts.map((d) => d.total);

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '예약됨',
            data: reservedData,
            backgroundColor: '#007AFF',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6
          },
          {
            label: '전체',
            data: totalData,
            backgroundColor: '#E8F2FF',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              font: { size: 12 },
              color: '#666'
            }
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}개`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#999', font: { size: 11 } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#999',
              font: { size: 11 }
            },
            grid: { color: '#f3f4f6' },
            border: { display: false }
          }
        }
      }
    });
  });

  onDestroy(() => chart?.destroy());
</script>

<div class="relative h-52 sm:h-64">
  <canvas bind:this={canvas}></canvas>
</div>
