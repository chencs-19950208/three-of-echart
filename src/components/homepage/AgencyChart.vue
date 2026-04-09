<template>
  <div class="agency-chart">
    <div ref="chart" class="chart-el"></div>
    <div class="legend-grid">
      <div class="legend-item" v-for="item in legendData" :key="item.name">
        <span class="dot" :style="{ background: item.color }"></span>
        <span class="lname">{{ item.name }}</span>
        <span class="lval">{{ item.value }}</span>
        <span class="lpct">{{ item.pct }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

const COLORS = ['#1a6dd4', '#00c9a7', '#f5a623', '#e74c5e', '#7b61ff', '#00d4ff', '#f06292', '#66bb6a']
const DATA = [
  { name: '机构1', value: 59 },
  { name: '机构2', value: 55 },
  { name: '机构3', value: 19 },
  { name: '机构4', value: 29 },
  { name: '机构5', value: 24 },
  { name: '机构6', value: 27 },
  { name: '机构7', value: 19 },
  { name: '机构8', value: 13 }
]

export default {
  name: 'AgencyChart',
  data() {
    const total = DATA.reduce((s, d) => s + d.value, 0)
    return {
      legendData: DATA.map((d, i) => ({
        name: d.name, value: d.value, color: COLORS[i],
        pct: Math.round(d.value / total * 100) + '%'
      }))
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chart)
      this.chart.setOption({
        color: COLORS,
        series: [{
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '50%'],
          data: DATA,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }
          },
          itemStyle: { borderColor: 'rgba(10,20,40,0.8)', borderWidth: 2 }
        }]
      })
    },
    onResize() { if (this.chart) this.chart.resize() }
  }
}
</script>

<style scoped>
.agency-chart { display: flex; flex-direction: column; height: 100%; }
.chart-el { width: 100%; height: 140px; }
.legend-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px;
  font-size: 11px; padding: 0 4px;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.lname { color: #8ec8f0; flex: 1; }
.lval { color: #b0d0f0; min-width: 20px; text-align: right; }
.lpct { color: #607090; min-width: 30px; text-align: right; }
</style>
