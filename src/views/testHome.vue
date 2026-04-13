<template>
  <v-map
    class="g-map"
    ref="map"
    :class="{ detail: detailActive }"
    :stationData="stationData"
    @clickPoint="handleClickPonit"
  ></v-map>
</template>

<script>
import HomeTree from "@/components/three/index.vue";

export default {
  components: { "v-map": HomeTree },
  data() {
    return {
      detailActive: false,
      // 站组数据 - 全球经纬度信息 (countryDatasource 使用 world-geojson 中的文件名)
      stationData: [
        { name: '北京站组', lon: 116.46, lat: 39.92, countryDatasource: 'china' },
        { name: '纽约站组', lon: -74.00, lat: 40.71, countryDatasource: 'usa' },
        { name: '伦敦站组', lon: -0.13, lat: 51.51, countryDatasource: 'united_kingdom' },
        { name: '东京站组', lon: 139.69, lat: 35.69, countryDatasource: 'japan' },
        { name: '巴黎站组', lon: 2.35, lat: 48.85, countryDatasource: 'france' },
        { name: '悉尼站组', lon: 151.21, lat: -33.87, countryDatasource: 'australia' },
        { name: '迪拜站组', lon: 55.27, lat: 25.20, countryDatasource: 'united_arab_emirates' },
        { name: '吉隆坡站组', lon: 101.69, lat: 3.14, countryDatasource: 'malaysia' },
        { name: '莫斯科站组', lon: 37.62, lat: 55.76, countryDatasource: 'russia' },
        { name: '开普敦站组', lon: 18.42, lat: -33.93, countryDatasource: 'south_africa' },
        { name: '里约站组', lon: -43.17, lat: -22.91, countryDatasource: 'brazil' },
        { name: '孟买站组', lon: 72.88, lat: 19.08, countryDatasource: 'india' },
        { name: '首尔站组', lon: 126.98, lat: 37.57, countryDatasource: 'south_korea' },
        { name: '开罗站组', lon: 31.24, lat: 30.04, countryDatasource: 'egypt' },
        { name: '多伦多站组', lon: -79.38, lat: 43.65, countryDatasource: 'can' },
        { name: '墨西哥城站组', lon: -99.13, lat: 19.43, countryDatasource: 'mexico' }
      ]
    }
  },
  methods: {
    handleClickPonit(countryDatasource, countryDatasourceName) {
      this.countryDatasource = countryDatasource
      this.countryDatasourceName = countryDatasourceName
      this.largeActive = false
      this.detailActive = true
    }
  },
};
</script>

<style>
</style>