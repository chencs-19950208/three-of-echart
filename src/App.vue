<template>
  <div id="app">
    <el-container v-if="!isFullscreen">
      <el-header>
        <div class="header-content">
          <h1 class="logo">Vue2 Template</h1>
          <el-menu
            :default-active="$route.path"
            mode="horizontal"
            router
            background-color="#409EFF"
            text-color="#fff"
            active-text-color="#ffd04b"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/homepage">数据大屏</el-menu-item>
            <el-menu-item index="/charts">ECharts</el-menu-item>
            <el-menu-item index="/three">Three.js</el-menu-item>
            <el-menu-item index="/about">关于</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
    <router-view v-else />
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isFullscreen() {
      return this.$route.path === '/homepage'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

.el-header {
  background-color: #409EFF;
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 60px;
}

.logo {
  color: #fff;
  font-size: 20px;
  margin-right: 40px;
  white-space: nowrap;
}

.el-menu--horizontal {
  border-bottom: none !important;
}
</style>
