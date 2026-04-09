<template>
  <div class="homepage">
    <div class="top-bar">
      <h2 class="page-title left-title">系统数据规模</h2>
      <div class="search-box">
        <input type="text" placeholder="输入站组名称" class="search-input" />
        <button class="search-btn">搜索</button>
      </div>
      <h2 class="page-title right-title">情治机构分布</h2>
    </div>
    <div class="main-content">
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="total-card">
          <div class="total-icon">📊</div>
          <span class="total-label">数据总量(条)</span>
          <span class="total-value">320<small>亿</small></span>
        </div>
        <div class="stat-list">
          <div class="stat-item" v-for="s in stats" :key="s.name">
            <span class="stat-icon">{{ s.icon }}</span>
            <span class="stat-name">{{ s.name }}</span>
            <span class="stat-val">{{ s.value }}</span>
          </div>
        </div>
        <h3 class="section-title">数据资源分布</h3>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>数据类型</th><th>业务方向</th><th>数据总量</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in tableData" :key="i" :class="{ highlight: i === 1 }">
                <td>{{ row.type }}</td><td>{{ row.direction }}</td><td>{{ row.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Center Globe -->
      <div class="center-panel">
        <Globe3D ref="globe" />
      </div>
      <!-- Right Panel -->
      <div class="right-panel">
        <div class="chart-wrap">
          <AgencyChart />
        </div>
        <h3 class="section-title tools-title">实战工具</h3>
        <div class="tools-grid">
          <div class="tool-card" v-for="t in tools" :key="t.name">
            <div class="tool-info">
              <span class="tool-name">{{ t.name }}</span>
            </div>
            <div class="tool-icon">{{ t.icon }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Globe3D from '@/components/homepage/Globe3D.vue'
import AgencyChart from '@/components/homepage/AgencyChart.vue'

export default {
  name: 'Homepage',
  components: { Globe3D, AgencyChart },
  data() {
    return {
      stats: [
        { icon: '👤', name: '人员库数据', value: '30万' },
        { icon: '🗄️', name: '基础库数据', value: '70亿' },
        { icon: '🔄', name: '中间库数据', value: '20万' },
        { icon: '📁', name: '案例库数据', value: '100' }
      ],
      tableData: [
        { type: '人员库', direction: '美国', amount: '50万' },
        { type: '基站库', direction: '法国', amount: '7万' },
        { type: '案例库', direction: '英国', amount: '10万' },
        { type: '人员库', direction: '加拿大', amount: '20万' },
        { type: '出入境库', direction: '澳大利亚', amount: '31万' },
        { type: '分类一', direction: '国家一', amount: '61万' },
        { type: '分类二', direction: '国家二', amount: '61万' },
        { type: '分类三', direction: '国家三', amount: '61万' },
        { type: '分类四', direction: '国家四', amount: '61万' },
        { type: '分类五', direction: '国家五', amount: '61万' },
        { type: '分类六', direction: '国家六', amount: '61万' }
      ],
      tools: [
        { name: '离线翻译', icon: '🌐' },
        { name: 'OCR识别', icon: '📝' },
        { name: '录音转写', icon: '🎙️' },
        { name: '人脸比对', icon: '👤' }
      ]
    }
  }
}
</script>

<style scoped>
.homepage {
  width: 100vw; height: 100vh; overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #0d1b3e 50%, #0a1628 100%);
  color: #fff; font-family: 'Microsoft YaHei', sans-serif;
  display: flex; flex-direction: column;
}
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; position: relative; z-index: 10;
}
.page-title {
  font-size: 18px; color: #00d4ff;
  text-shadow: 0 0 10px rgba(0,212,255,0.5);
  margin: 0; white-space: nowrap;
}
.search-box { display: flex; gap: 0; }
.search-input {
  background: rgba(0,100,200,0.15); border: 1px solid rgba(0,150,255,0.3);
  color: #8ec8f0; padding: 6px 16px; font-size: 13px; outline: none;
  border-radius: 2px 0 0 2px; width: 200px;
}
.search-btn {
  background: linear-gradient(180deg, #1a6dd4, #0d4a9e); border: 1px solid #2080e0;
  color: #fff; padding: 6px 20px; cursor: pointer; font-size: 13px;
  border-radius: 0 2px 2px 0;
}
.main-content {
  flex: 1; display: flex; overflow: hidden; padding: 0 16px 16px;
}
.left-panel { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; z-index: 5; }
.center-panel { flex: 1; position: relative; }
.right-panel { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; z-index: 5; }
.total-card {
  background: linear-gradient(135deg, rgba(0,80,180,0.3), rgba(0,40,100,0.2));
  border: 1px solid rgba(0,150,255,0.25); border-radius: 4px;
  padding: 12px 16px; display: flex; align-items: center; gap: 10px;
}
.total-icon { font-size: 20px; }
.total-label { font-size: 12px; color: #8ec8f0; }
.total-value { font-size: 28px; font-weight: bold; color: #00ff88; margin-left: auto; font-family: 'Digital', monospace; }
.total-value small { font-size: 14px; }
.stat-list { display: flex; flex-direction: column; gap: 6px; }
.stat-item {
  background: rgba(0,50,120,0.2); border: 1px solid rgba(0,100,200,0.15);
  border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;
}
.stat-icon { font-size: 16px; }
.stat-name { font-size: 12px; color: #8ec8f0; flex: 1; }
.stat-val { font-size: 16px; font-weight: bold; color: #fff; }
.section-title {
  font-size: 14px; color: #00d4ff; margin: 8px 0 4px;
  text-shadow: 0 0 8px rgba(0,212,255,0.4);
}
.data-table-wrap { flex: 1; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.data-table th {
  background: rgba(0,80,180,0.3); color: #8ec8f0; padding: 6px 8px;
  text-align: left; border-bottom: 1px solid rgba(0,150,255,0.2);
}
.data-table td {
  padding: 5px 8px; border-bottom: 1px solid rgba(0,80,150,0.1); color: #b0d0f0;
}
.data-table tr.highlight td { background: rgba(0,150,255,0.15); color: #00d4ff; }
.data-table-wrap::-webkit-scrollbar { width: 3px; }
.data-table-wrap::-webkit-scrollbar-thumb { background: rgba(0,150,255,0.3); border-radius: 2px; }
.chart-wrap { height: 240px; }
.tools-title { margin-top: 4px; }
.tools-grid { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.tool-card {
  background: linear-gradient(135deg, rgba(0,60,150,0.25), rgba(0,30,80,0.2));
  border: 1px solid rgba(0,120,220,0.2); border-radius: 4px;
  padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: all 0.3s;
}
.tool-card:hover { border-color: rgba(0,180,255,0.5); background: rgba(0,80,180,0.3); }
.tool-name { font-size: 14px; color: #c0e0ff; }
.tool-icon { font-size: 24px; opacity: 0.8; }
</style>
