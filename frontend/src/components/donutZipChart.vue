<template>
  <div class="w-1/2">
    <canvas class="p-10" ref="canvas"></canvas>
  </div>
</template>

<script setup>
// Composition API migration (F1):
// - props: { label, chartData } -> defineProps()
// - mounted() -> onMounted(), which creates the chart
// - this.$refs.zipChart -> template ref `canvas` via ref(null)
// - NEW: watch() updates the chart when the props change (the old chart stayed stale)
// - NEW: onBeforeUnmount() destroys the chart (the old one leaked a Chart.js instance)
// - was: `await new Chart(...)`, a constructor isn't a promise, so the await was removed
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
})

const canvas = ref(null)
let chart = null // Chart.js instance; not reactive on purpose (Chart.js manages itself)

onMounted(() => {
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: props.label,
      datasets: [{ borderWidth: 1, data: props.chartData }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Clients by Zip Code' }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  })
})

// Redraw when the dashboard passes new data
watch(
  () => [props.label, props.chartData],
  ([labels, data]) => {
    if (!chart) return
    chart.data.labels = labels
    chart.data.datasets[0].data = data
    chart.update()
  },
  { deep: true }
)

// Free the canvas and its event listeners when leaving the page
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>