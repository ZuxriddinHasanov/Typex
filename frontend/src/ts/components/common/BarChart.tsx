import Chart, { ChartConfiguration } from "chart.js/auto";
import { createEffect, onCleanup, JSXElement } from "solid-js";

export function BarChart(props: {
  data: Array<Record<string, unknown>> | undefined;
  labelKey: string;
  valueKey: string;
  color?: string;
  label?: string;
}): JSXElement {
  let canvasRef!: HTMLCanvasElement;
  let chartInstance: Chart | null = null;

  createEffect(() => {
    const rawData = props.data ?? [];
    const labels = rawData.map((d) => (d[props.labelKey] as string) ?? "");
    const values = rawData.map((d) => (d[props.valueKey] as number) ?? 0);

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: props.label ?? "Qiymat",
            data: values,
            backgroundColor: props.color ?? "#FF5A1F",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false, drawBorder: false },
            ticks: { maxTicksLimit: 10, color: "#888", font: { size: 10 } },
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: { color: "#33333333", drawBorder: false },
            ticks: { maxTicksLimit: 5, color: "#888", font: { size: 10 } },
          },
        },
      },
    };

    if (chartInstance) {
      chartInstance.data = config.data;
      chartInstance.options = config.options as any;
      chartInstance.update();
    } else if (canvasRef) {
      chartInstance = new Chart(canvasRef, config);
    }
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });

  return (
    <div class="relative h-[200px] w-full">
      <canvas ref={canvasRef} class="h-full w-full"></canvas>
    </div>
  );
}

