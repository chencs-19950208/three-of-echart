<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <div slot="header">
            <span>欢迎使用 Vue2 + Element UI 模板</span>
          </div>
          <p>这是一个基于 Vue 2 和 Element UI 的项目模板，已集成以下功能：</p>
          <el-tag style="margin: 5px">Vue 2</el-tag>
          <el-tag type="success" style="margin: 5px">Element UI</el-tag>
          <el-tag type="warning" style="margin: 5px">Vue Router</el-tag>
          <el-tag type="info" style="margin: 5px">Webpack 5</el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>开发</h3>
          <p>运行 <code>npm run dev</code> 启动开发服务器</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>构建</h3>
          <p>运行 <code>npm run build</code> 构建生产版本</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>组件</h3>
          <el-button type="primary" @click="handleClick">点击测试</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    handleClick() {
      this.$message.success('Element UI 组件工作正常！')
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}
</style>
