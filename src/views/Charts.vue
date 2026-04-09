<template>
  <div class="charts-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header"><span>柱状图</span></div>
          <div ref="barChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header"><span>饼图</span></div>
          <div ref="pieChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <div slot="header"><span>折线图</span></div>
          <div ref="lineChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'Charts',
  data() {
    return {
      charts: []
    }
  },
  mounted() {
    this.initBarChart()
    this.initPieChart()
    this.initLineChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.charts.forEach(chart => chart.dispose())
  },
  methods: {
    handleResize() {
      this.charts.forEach(chart => chart.resize())
    },
    initBarChart() {
      const chart = echarts.init(this.$refs.barChart)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: { type: 'value' },
        series: [{
          name: '销量',
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110, 130],
          itemStyle: { color: '#409EFF' }
        }]
      })
      this.charts.push(chart)
    },
    initPieChart() {
      const chart = echarts.init(this.$refs.pieChart)
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%' },
        series: [{
          name: '访问来源',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          data: [
            { value: 1048, name: '搜索引擎' },
            { value: 735, name: '直接访问' },
            { value: 580, name: '邮件营销' },
            { value: 484, name: '联盟广告' },
            { value: 300, name: '视频广告' }
          ]
        }]
      })
      this.charts.push(chart)
    },
    initLineChart() {
      const chart = echarts.init(this.$refs.lineChart)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['邮件', '联盟广告', '视频广告'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: { type: 'value' },
        series: [
          { name: '邮件', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210] },
          { name: '联盟广告', type: 'line', smooth: true, data: [220, 182, 191, 234, 290, 330, 310] },
          { name: '视频广告', type: 'line', smooth: true, data: [150, 232, 201, 154, 190, 330, 410] }
        ]
      })
      this.charts.push(chart)
    }
  }
}
</script>

<style scoped>
.charts-page {
  padding: 20px;
}
.chart-container {
  width: 100%;
  height: 350px;
}
</style>
