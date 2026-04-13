<template>
  <div class="three-map">
    <div id="threeContainer"></div>
    <div class="tooltip">
      <div class="top-header" />
      <div class="tooltip-title">{{tooltip.portDeptCountry}}</div>
      <div class="bottom-border" />
      <div class="tooltip-content">
        <div class="content-item">
          <span>C1</span>
          <span class="num">{{tooltip.inOutCnt}}{{tooltip.inOutCntUnit}}</span>
        </div>
        <!-- <div>
          <span>入境数据</span>
          <span class="num">{{tooltip.outCnt}}{{tooltip.outCntUnit}}</span>
        </div> -->
      </div>
    </div>
  </div>
</template>
<script>
import * as THREE from "three";
import * as TWEEN from "tween";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import earthMap from "@/assets/earth/earthMap.jpg";
import aperture from "@/assets/earth/aperture.png";
import dot from "@/assets/earth/dot.png";
import mapCenter from "@/assets/earth/mapCenter.png";
import plain from "@/assets/earth/plain.png";
import wl from "@/assets/earth/wl.png";
import stationBig from "@/assets/dashboard/station-big.png";
import Fly from './utils/fly'
// let renderer, stats, controls, camera, scene;
const radius = 6;
// const group = new THREE.Group(); // 主画布
// const groupDots = new THREE.Group(); // 标注点
// const groupLines = new THREE.Group(); // 飞线
// const groupFlyLines = new THREE.Group(); // 蝌蚪飞线
// const aGroup = new THREE.Group(); // 飞机模型
// const map = new THREE.Object3D(); // 地图描边
// const camaPositions = [
//   { x: 3, y: - 20, z: 200 }, //远处
//   { x: 2, y: - 2, z: 20 }//近处
// ];
// const groupRotation = [0.5, 2.9, 0.1]
export default {
  props: {
    stationData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      mapDom: null,
      tooltipDom: null,
      renderer: null, // 渲染
      tween: null, // Tween
      controls: null, // 用户操作
      scene: null, // 场景
      camera: null, // 相机
      sprite: null, // 地球光晕
      group: new THREE.Group(), // 主画布
      groupDots: new THREE.Group(), // 标注点
      groupStations: new THREE.Group(), // 站组点（放大国家时保留）
      groupFlyLines: new THREE.Group(), // 蝌蚪飞线
      map: new THREE.Object3D(), // 地图描边
      groupLines: new THREE.Group(), // 飞线（不用）
      aGroup: new THREE.Group(), // 飞机模型（不用）
      globeTextureLoader: new THREE.TextureLoader(),
      planGeometry: new THREE.PlaneBufferGeometry(1, 1), //默认在XOY平面上
      pointMaterial: new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(wl),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      }), // 普通点
      countryPointMaterial: new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(mapCenter),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      }), // 国家点
      stationPointMaterial: new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(stationBig),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      }), // 站组点
      mapLineMaterial: new THREE.LineBasicMaterial({
        color: 0x009FEB,
        linewidth: 5,
      }), // 轮廓线
      mapShapeMaterial : new THREE.MeshBasicMaterial({
        color: 0x009FEB,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      }), // 轮廓背景
      initFlag: false,
      animationType: true, // 地球入场动画
      rotationY: false, // 地球自动旋转
      meshAnimateType: false, // 标记点动画
      lonlat: { x: 0, y: 0, z: 200 },
      camaPositions: [
        { x: 2, y: 5, z: 200 }, //远处
        { x: 2, y: 5, z: 20 }//近处
      ],
      groupRotation: [0, 2.9, 0],
      tooltip: {
        portDeptCountry: "",
        inCnt: 0,
        inCntUnit: '',
        outCnt: 0,
        outCntUnit: ''
      },
      isLargeMap: false,
      posArr: [],
      contryGeoJson: null,
      animationFrame: null,
      timer: null,
      isPageVisible: true
    };
  },
  async mounted() {
    await this.getWorldMap()
    this.mapDom = document.querySelector("#threeContainer");
    this.tooltipDom = document.querySelector(".tooltip");
    this.width = this.mapDom.clientWidth;
    this.height = this.mapDom.clientHeight;
    if (this.camera) {
      return
    }
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initLight();
    //初始化地球
    this.initEarth();
    //地球光晕
    this.initEarthSprite();
    this.initControls();
    this.initTween();
    this.animate();
    // this.initAuxiliaryTool();
    window.addEventListener('resize', this.onWindowResize)
    // 页面不可见时暂停动画，节省性能
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    // window.group = this.group
  },
  beforeDestroy() {
    let that = this
    that.tween.stop()
    that.stopAnimation()
    that.clearGroup(that.group)
    that.scene.remove(that.group)
    that.clearScrene()
    window.removeEventListener('resize', this.onWindowResize)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    // 处理页面可见性变化
    handleVisibilityChange() {
      if (document.hidden) {
        this.isPageVisible = false
      } else {
        this.isPageVisible = true
      }
    },
    clearGroup(group) {
      let clearCache = item => {
        item.geometry.dispose()
        item.material.dispose()
      }
      let removeObj = obj => {
        let arr = obj.children.filter(x => x)
        arr.forEach(item => {
          if (item.children.length) {
            removeObj(item)
          } else {
            clearCache(item)
            item.clear()
          }
        })
        obj.clear()
        arr = null
      }
      removeObj(group)
    },
    clearScrene() {
      this.scene.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
        child = null
      })
      this.renderer.forceContextLoss();
      this.renderer.dispose()
      this.scene.clear()
      this.scene = null
      this.controls.dispose()
      this.camera.clear()
      this.sprite.clear()
      this.camera = null
      this.controls = null
      this.sprite = null
      this.renderer.domElement = null
    },
    getWorldMap() {
      return this.$axiosGet(API.getWorldMap).then(res => {
        this.posArr = res.map(val => {
          let children = val.children.map(child => {
            return {
              ...child,
              portDeptCountry: child.portArrvCountry
            }
          })
          return {
            ...val,
            children
          }
        })
      });
    },
    /**
     * @description 初始化相机
     */
    initCamera() {
      this.camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        1000
      );
      // this.camera.position.set(5, -20, 200);
      this.camera.lookAt(0, 0, 0);
      // window.camera = this.camera
    },

    /**
     * @description 初始化场景
     */
    initScene() {
      this.scene = new THREE.Scene();
      // this.scene.rotation.set(0, -2, 2);
      // this.scene.background = new THREE.Color(0x020924);
      // this.scene.fog = new THREE.Fog(0x020924, 200, 1000);
    },

    //辅助工具
    initAuxiliaryTool() {
      const helper = new THREE.AxesHelper(500);
      this.scene.add(helper);
      // 网格
      const grid = new THREE.GridHelper(10, 1000, 0x000000, 0x000000);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      this.scene.add(grid);
    },
    //性能插件
    // initStats() {
    //   stats = new Stats();
    //   document.body.appendChild(stats.dom);
    // },
    /**
     * 初始化用户交互
     **/
    initControls() {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      // 如果使用animate方法时，将此函数删除
      // this.controls.addEventListener( 'change', render );
      // 使动画循环使用时阻尼或自转 意思是否有惯性
      this.controls.enableDamping = true;
      //动态阻尼系数 降低以提高响应速度
      this.controls.dampingFactor = 0.08;
      //是否可以缩放
      this.controls.enableZoom = true;
      //是否自动旋转
      this.controls.autoRotate = false;
      this.controls.autoRotateSpeed = 2;
      //设置相机距离原点的最远距离
      // this.controls.minDistance = 2;
      //设置相机距离原点的最远距离
      this.controls.maxDistance = 50;
      //是否开启右键拖拽
      this.controls.enablePan = true;
      // 禁用滚轮缩放时的过度缩放
      this.controls.zoomSpeed = 1.0;
      // 限制旋转速度
      this.controls.rotateSpeed = 0.8;
    },
    // 入场相机动画
    initTween() {
      let that = this
      this.tween = new TWEEN.Tween(this.camaPositions[0])
        .to(this.camaPositions[1], 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function() {
          that.camera.position.set(
            that.camaPositions[0].x,
            that.camaPositions[0].y,
            that.camaPositions[0].z
          );
        })
        .onComplete(() => {
          this.initFlag = true;
          //初始化点和曲线
          this.initDotAndFly();
          //光柱效果和底部矩形
          // initLightPillar();
        })
        .start()
    },
    //threejs自带的经纬度转换
    lglt2xyz(lng, lat) {
      const theta = (90 + lng) * (Math.PI / 180);
      const phi = (90 - lat) * (Math.PI / 180);
      return new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(radius, phi, theta)
      );
    },
    /**
     * 经纬度坐标转球面坐标
     * @param {地球半径} R
     * @param {经度(角度值)} longitude
     * @param {维度(角度值)} latitude
     */
    lon2xyz(R, longitude, latitude) {
      let lon = longitude * Math.PI / 180; //转弧度值
      const lat = latitude * Math.PI / 180; //转弧度值
      lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度
      // 经纬度坐标转球面坐标计算公式
      const x = R * Math.cos(lat) * Math.cos(lon);
      const y = R * Math.sin(lat);
      const z = R * Math.cos(lat) * Math.sin(lon);
      // 返回球面坐标
      return {
        x: x,
        y: y,
        z: z
      };
    },
    // 经纬度转地球坐标
    createPosition(lnglat) {
      const spherical = new THREE.Spherical();
      spherical.radius = radius;
      const lng = lnglat[0];
      const lat = lnglat[1];
      const theta = (lng + 90) * (Math.PI / 180);
      const phi = (90 - lat) * (Math.PI / 180);
      spherical.phi = phi; //方位角
      spherical.theta = theta; //倾斜角
      const position = new THREE.Vector3();
      position.setFromSpherical(spherical);
      return position;
    },
    /**
     * @description 初始化渲染场景
     */
    initRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      // 限制像素比，最大为2，避免高分屏性能问题
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(this.width, this.height);
      const containerDom = document.querySelector("#threeContainer");
      containerDom.appendChild(this.renderer.domElement);
      this.renderer.domElement.addEventListener("mousemove", this.infoMouse);
      this.renderer.domElement.addEventListener("click", this.infoClick);
    },
    // 获取当前点
    getPonit(event) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
      const getBoundingClientRect = this.mapDom.getBoundingClientRect();
      mouse.x =
        (event.clientX - getBoundingClientRect.left) /
          this.mapDom.offsetWidth *
          2 -
        1;
      mouse.y =
        -(
          (event.clientY - getBoundingClientRect.top) /
          this.mapDom.offsetHeight
        ) *
          2 +
        1;
      //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
      raycaster.setFromCamera(mouse, this.camera);
      // 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
      const intersects = raycaster.intersectObjects(this.scene.children);
      // 点击对象
      return intersects.find(val => val.object.isPoint);
    },
    // 悬浮目标点展示tooltip
    infoMouse(event) {
      event.preventDefault();
      const point = this.getPonit(event);
      // 站点鼠标变为可点击状态
      if (point && point.object.isStation) {
        this.mapDom.style.cursor = 'pointer';
        this.showTooltip(point);
      } else {
        this.mapDom.style.cursor = 'default';
        if (point && point?.object?.info?.portDeptCountry) {
          this.initFlag = false;
          if ( point?.object?.info?.portDeptCountry == '印度' || point?.object?.info?.portDeptCountry == '泰国' || point?.object?.info?.portDeptCountry == '埃及' || point?.object?.info?.portDeptCountry == '柬埔寨' || point?.object?.info?.portDeptCountry == '伊朗' || point?.object?.info?.portDeptCountry == '中国台湾' || point?.object?.info?.portDeptCountry == '中国澳门' || point?.object?.info?.portDeptCountry == '马来西亚') {
            this.showTooltip(point);
          }
        } else {
          if (!this.isLargeMap) {
            this.initFlag = true;
          }
          this.hideTooltip();
        }
      }
    },
    getNum(val, fixed = 1) {
      if (!val) {
        val = 0
      }
      if (val > 99999999) {
        return {
          value: (val / 100000000).toFixed(fixed),
          unit: "亿"
        };
      } else if (val > 9999) {
        return {
          value: (val / 10000).toFixed(fixed),
          unit: "万"
        };
      } 
      return {
        value: val,
        unit: ""
      }
    },
    // 显示tooltip
    showTooltip(point) {
      let title = '';
      if (point.object.isStation) {
        title = point.object.info.name || '站组';
      } else {
        title = point.object.info.portDeptCountry || '';
      }
      const inCntObj = this.getNum(point.object.info.inCnt)
      const outCntObj = this.getNum(point.object.info.outCnt)
      const inOutCntObj = this.getNum(point.object.info.inCnt + point.object.info.outCnt)
      this.tooltip = {
        portDeptCountry: title,
        inCnt: inCntObj.value,
        inCntUnit: inCntObj.unit,
        outCnt: outCntObj.value,
        outCntUnit: outCntObj.unit,
        inOutCnt: inOutCntObj.value,
        inOutCntUnit: inOutCntObj.unit
      };
      // console.log(point);
      const vector = point.point.project(this.camera);
      const halfWidth = this.mapDom.offsetWidth / 2;
      const halfHeight = this.mapDom.offsetHeight / 2;
      const x = Math.round(vector.x * halfWidth + halfWidth);
      const y = Math.round(-vector.y * halfHeight + halfHeight);
      this.tooltipDom.style.display = "block";
      this.tooltipDom.style.left = `${x - 210 }px`;
      this.tooltipDom.style.top = `${y - 90 }px`;
    },
    // 隐藏tooltip
    hideTooltip() {
      this.tooltipDom.style.display = "none";
    },
    // 点击目标点
    // 加载国家GeoJSON - 使用静态导入方式
    loadCountryGeoJson(countryCode) {
      // 国家代码到文件的映射 - 使用完整的静态导入
      const countryMap = {
        // 站组数据使用的国家代码
        'china': () => Promise.resolve(require('./geoJson/world-geojson/countries/chn.json')),
        'usa': () => Promise.resolve(require('./geoJson/world-geojson/countries/usa.json')),
        'united_kingdom': () => Promise.resolve(require('./geoJson/world-geojson/countries/united_kingdom.json')),
        'japan': () => Promise.resolve(require('./geoJson/world-geojson/countries/japan.json')),
        'france': () => Promise.resolve(require('./geoJson/world-geojson/countries/france.json')),
        'australia': () => Promise.resolve(require('./geoJson/world-geojson/countries/australia.json')),
        'united_arab_emirates': () => Promise.resolve(require('./geoJson/world-geojson/countries/united_arab_emirates.json')),
        'malaysia': () => Promise.resolve(require('./geoJson/world-geojson/countries/malaysia.json')),
        'russia': () => Promise.resolve(require('./geoJson/world-geojson/countries/russia.json')),
        'south_africa': () => Promise.resolve(require('./geoJson/world-geojson/countries/south_africa.json')),
        'brazil': () => Promise.resolve(require('./geoJson/world-geojson/countries/brazil.json')),
        'india': () => Promise.resolve(require('./geoJson/world-geojson/countries/india.json')),
        'south_korea': () => Promise.resolve(require('./geoJson/world-geojson/countries/south_korea.json')),
        // 埃及使用 aiji (阿拉伯语对埃及的称呼)
        'egypt': () => Promise.resolve(require('./geoJson/world-geojson/countries/aiji.json')),
        'can': () => Promise.resolve(require('./geoJson/world-geojson/countries/can.json')),
        'mexico': () => Promise.resolve(require('./geoJson/world-geojson/countries/mexico.json')),
        // API返回的国家点使用的代码
        'aiji': () => Promise.resolve(require('./geoJson/world-geojson/countries/aiji.json')),
        'iran': () => Promise.resolve(require('./geoJson/world-geojson/countries/iran.json')),
        'taiwan': () => Promise.resolve(require('./geoJson/world-geojson/countries/taiwan.json')),
        'aomen': () => Promise.resolve(require('./geoJson/world-geojson/countries/aomen.json')),
        'cambodia': () => Promise.resolve(require('./geoJson/world-geojson/countries/cambodia.json')),
      }

      const loader = countryMap[countryCode]
      if (loader) {
        return loader()
      }
      console.log('未找到对应的国家GeoJSON:', countryCode)
      return Promise.reject(new Error('未找到对应的国家GeoJSON'))
    },

    infoClick(event) {
      event.preventDefault();
      const point = this.getPonit(event);
      // TODO 后面会放开
      return;
      // 点击国家点
      if (point && point.object.isDeptCountry && !this.isLargeMap) {
        const countryCode = point.object.info.countryDatasource
        this.loadCountryGeoJson(countryCode).then(geoJson => {
          this.contryGeoJson = geoJson
          this.redrawnLarge(point)
        }).catch(e => {
          console.log('加载国家GeoJSON失败:', e)
        })
        return
      }
      // 点击站点 - 显示所在国家的地图和省份
      if (point && point.object.isStation) {
        const countryCode = point.object.info.countryDatasource
        if (!countryCode) return

        if (this.isLargeMap) {
          // 已在国家高亮模式，点击其他站点切换国家
          this.switchCountry(point)
        } else {
          // 首次进入国家高亮模式
          this.loadCountryGeoJson(countryCode).then(geoJson => {
            this.contryGeoJson = geoJson
            this.redrawnLarge(point)
          }).catch(e => {
            console.log('加载国家GeoJSON失败:', e)
          })
        }
      }
    },
    // 切换国家（国家高亮模式下）
    switchCountry(point) {
      const countryCode = point.object.info.countryDatasource
      if (!countryCode) return

      this.loadCountryGeoJson(countryCode).then(geoJson => {
        this.contryGeoJson = geoJson
        // 清除当前的国家地图和飞线
        this.flyStop()
        this.clearGroup(this.map)
        this.clearGroup(this.groupDots)
        this.clearGroup(this.groupFlyLines)
        this.group.remove(this.map)
        this.group.remove(this.groupDots)
        this.group.remove(this.groupFlyLines)
        // 重新添加站点
        this.group.remove(this.groupStations)
        this.groupStations.name = '站组点集合'
        this.group.add(this.groupStations)
        // 相机移动到新国家
        this.cameraLarge(point)
        // 初始化新国家的飞线
        this.initDotAndFly(countryCode)
        // 触发事件
        this.$emit('clickPoint', point.object.info.countryDatasource, point.object.info.countryDatasourceName)
      }).catch(e => {
        console.log('加载国家GeoJSON失败:', e)
      })
    },
    // 放大地球
    cameraLarge(pointObj) {
      // this.lonlat = this.camera.position;
      // new TWEEN.Tween({ x: this.lonlat.x, y: this.lonlat.y, z: this.lonlat.z, rotationx: 0, rotationy: 0,rotationz: 0, positionx: 0, positiony: 0})
      //   .to({ x: pointObj.object.position.x*2, y: pointObj.object.position.y*2, z: pointObj.object.position.z*2,rotationx: 0.3, rotationy: -0.12,rotationz: -0.2, positionx: -0.8, positiony: -2}, 1500)
      //   .onUpdate(function() {
          
      //   })
      //   .onComplete(() => {
          
      //   })
      //   .easing(TWEEN.Easing.Sinusoidal.InOut)
      //   .start();
      this.camera.position.x = pointObj.object.position.x*2;
      this.camera.position.y = pointObj.object.position.y*2;
      this.camera.position.z = pointObj.object.position.z*2;
      this.camera.lookAt(0, 0, 0);
      if (pointObj.object.info.countryDatasource == 'aiji') {
        this.group.rotation.set(0.18, -0.10, 0.20);
      } else if (pointObj.object.info.countryDatasource == 'iran') {
        this.group.rotation.set(0.20, -0.02, 0.14);
      } else if (pointObj.object.info.countryDatasource == 'india') {
        this.group.rotation.set(0.32, -0.16, 0.02);
      } else if (pointObj.object.info.countryDatasource == 'taiwan' || pointObj.object.info.countryDatasource == 'aomen') {
        this.group.rotation.set(0.2, -0.1, -0.15);
      } else {
        this.group.rotation.set(0.3, -0.14, -0.05);
      }
      this.group.position.x = -0.8
      this.group.position.y = -2
      this.initMap(this.contryGeoJson)
      this.$emit('clickPoint', pointObj.object.info.countryDatasource,pointObj.object.info.countryDatasourceName)
      // this.lonlat = this.camera.position;
    },
    // 重绘国家地图
    redrawnLarge(point) {
      this.flyStop()
      this.scene.rotation.y = 0
      this.clearGroup(this.map)
      this.clearGroup(this.groupDots)
      this.clearGroup(this.groupFlyLines)
      this.group.remove(this.map)
      this.group.remove(this.groupDots)
      this.group.remove(this.groupFlyLines)
      // 不清除 groupStations，保留站点显示
      this.group.remove(this.groupStations)
      this.initFlag = false
      this.isLargeMap = true;
      this.sprite.visible = false
      this.group.rotation.set(0, 0, 0);
      this.group.position.set(0, 0, 0);
      this.cameraLarge(point);
      // 重新添加站点到 group
      this.groupStations.name = '站组点集合'
      this.group.add(this.groupStations)
      this.initDotAndFly(point.object.info.countryDatasource)
    },
    // 重绘全球地图
    redrawnMap() {
      let that = this
      this.flyStop()
      this.clearGroup(this.map)
      this.clearGroup(this.groupDots)
      this.clearGroup(this.groupFlyLines)
      this.group.remove(this.map)
      this.group.remove(this.groupDots)
      this.group.remove(this.groupFlyLines)
      // 保留 groupStations 不清除
      this.initFlag = false
      this.sprite.visible = true
      this.isLargeMap = false
      this.group.rotation.set(...this.groupRotation);
      this.group.position.set(0, 0, 0);
      this.scene.rotation.y = 0
      // new TWEEN.Tween({x: this.camera.position.x, y:this.camera.position.y, z:this.camera.position.z})
      //   .to(that.camaPositions[1], 2000)
      //   .onUpdate(function() {
          
      //   })
      //   .onComplete(() => {
      //     this.initFlag = true;
      //     //初始化点和曲线
      //     this.initDotAndFly();
      //     //光柱效果和底部矩形
      //     // initLightPillar();
      //   })
      //   .start()
      this.camera.position.set(this.camaPositions[1].x,this.camaPositions[1].y,this.camaPositions[1].z)
      this.camera.lookAt(0, 0, 0);
      this.initFlag = true;
      //初始化点和曲线
      this.initDotAndFly();
      // console.log(that.group, that.scene, that.map)
    },
    getPonits(length) {
      return {
        points: (length * 100 / 2).toFixed(0),
        length: (length * 100 / 2 * 1 / 3).toFixed(0),
        weight: (length * 100 / 2 * 1 / 3 * 2 / 3)
      }
      // return {
      //   points: 500,
      //   length: 200,
      //   weight: 100
      // }
    },
    // 添加蝌蚪飞线
    addFlyLines(curve) {
      const flyPoints = []
      let curveLength = curve.getLength()
      let { points, length, weight } = this.getPonits(curveLength)
      // console.log('points', points, length, weight)
      curve.getSpacedPoints(points).forEach((point) => {
        const { x, y, z } = point; 
        flyPoints.push([x, y, z]);
      });
      // const length = 300;
      // const weight = 200;
      const circle = 8;
      // const color = [[102,228,255],[255,239,102]]
      const color = [[34,145,255],[21,208,255]]
      // const color = [[255,149,0],[255,211,16]]
      // const color = [[21,208,255]]
      const opacity = 1;
      const size = this.isLargeMap ? 0.04 : 0.07;
      const fly = new Fly(flyPoints, length, circle, color, opacity, size, weight, this.isLargeMap);
      return fly
    },
    flyMove(immediate = false) {
      this.groupFlyLines.children.forEach(fly => {
        if (immediate) {
          fly.flyParent.move()
        } else {
          setTimeout(() => {
            fly.flyParent.move()
          }, Math.random() * 6000)
        }
      })
    },
    flyStop() {
      this.groupFlyLines.children.forEach(fly => {
        fly.flyParent.stop()
      })
    },
    // 添加飞线
    addLines(v0, v3) {
      // 夹角
      const angle = v0.angleTo(v3) * 1.8 / Math.PI / 0.1; // 0 ~ Math.PI
      const aLen = angle * 0.46,
        hLen = angle * angle * 12;
      const p0 = new THREE.Vector3(0, 0, 0);
      // 法线向量
      const rayLine = new THREE.Ray(p0, this.getVCenter(v0.clone(), v3.clone()));
      // 顶点坐标
      const vtop = v0
        .clone()
        .add(v3)
        .normalize()
        .multiplyScalar(30);
      // 控制点坐标
      const v1 = this.getLenVcetor(v0.clone(), vtop, aLen);
      const v2 = this.getLenVcetor(v3.clone(), vtop, aLen);
      // 绘制三维三次贝赛尔曲线
      const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
      // console.log(curve.getLength())
      // const geometry = new LineGeometry();
      // const points = curve.getSpacedPoints(100);
      // const positions = [];
      // const colors = [];
      // const color = new THREE.Color();
      // /**
      //  * HSL中使用渐变
      //  * h — hue value between 0.0 and 1.0
      //  * s — 饱和度 between 0.0 and 1.0
      //  * l — 亮度 between 0.0 and 1.0
      //  */
      // // hsla(11,66%,30%,0.07)
      // // hsla(15,100%,74%,1)
      // for (let j = 0; j < points.length; j++) {
      //   // color.setHSL(
      //   //   196/360,
      //   //   (100 - j / points.length * 12) / 100,
      //   //   (95 - j / points.length * 43) / 100
      //   // );
      //   // colors.push(color.r, color.g, color.b);
      //   positions.push(points[j].x, points[j].y, points[j].z);
      // }
      // geometry.setPositions(positions);
      // // geometry.setColors(colors);
      // const material = new LineMaterial({
      //   linewidth: 0.0006,
      //   vertexColors: true,
      //   dashed: false
      // });

      return {
        curve: curve,
        // lineMesh: new Line2(geometry, material)
      };
    },
    // 计算v1,v2 的中点
    getVCenter(v1, v2) {
      const v = v1.add(v2);
      return v.divideScalar(2);
    },
    // 计算V1，V2向量固定长度的点
    getLenVcetor(v1, v2, len) {
      const v1v2Len = v1.distanceTo(v2);
      return v1.lerp(v2, len / v1v2Len);
    },
    /**
     * @desc 设置目标点
     * @param <Group> groupDots ...
     * @param <number> radius ...
     */
    setRandomDot(groupDots, countryDatasource) {
      const texture = new THREE.TextureLoader().load(wl);
      const countryTexture = new THREE.TextureLoader().load(mapCenter);
      if (countryDatasource) {
        const findPos = this.posArr.find(val => val.countryDatasource === countryDatasource)
        // 添加国家点
        const dotMesh = this.createPointMesh(findPos, 0.040, true, true)
        groupDots.add(dotMesh);
        // 添加国家标签
        const txtMesh = this.createTextCanvas(findPos, findPos.portDeptCountry, true)
        groupDots.add(txtMesh);
        // findPos.children.forEach(pos => {
        //   const dotMesh = this.createPointMesh(pos, texture, 0.06);
        //   groupDots.add(dotMesh);
        // })
      } else {
        this.posArr.forEach(pos => {
          if (pos.portDeptCountry == '印度' || pos.portDeptCountry == '泰国' || pos.portDeptCountry == '埃及' || pos.portDeptCountry == '柬埔寨' || pos.portDeptCountry == '伊朗' || pos.portDeptCountry == '中国台湾' || pos.portDeptCountry == '中国澳门' || pos.portDeptCountry == '马来西亚') {
            // 添加国家点
            const dotMesh = this.createPointMesh(pos, 0.065, true)
            dotMesh.isDeptCountry = true
            groupDots.add(dotMesh);
            // 添加国家标签
            const txtMesh = this.createTextCanvas(pos, pos.portDeptCountry)
            groupDots.add(txtMesh);
          } else {
            // 添加普通点
            const dotMesh = this.createPointMesh(pos, 0.08);
            groupDots.add(dotMesh);
          }
          // pos.children.forEach(val => {
          //   if (!groupDots.children.find(dot => dot.portDeptCountry === val.portDeptCountry)) {
          //     const dotMesh = this.createPointMesh(val, texture, 0.1);
          //     groupDots.add(dotMesh);
          //   }
          // })
        });
      }

      // 渲染站组数据 - 使用独立的 groupStations
      if (this.stationData && this.stationData.length > 0) {
        this.stationData.forEach(station => {
          // 创建站点点
          const stationMesh = this.createPointMesh(station, 0.05, false, false, true)
          stationMesh.isPoint = true
          stationMesh.isStation = true
          stationMesh.info = station
          this.groupStations.add(stationMesh)

          // 如果有站点名称，添加标签
          if (station.name) {
            const stationLabel = this.createTextCanvas(station, station.name, false)
            this.groupStations.add(stationLabel)
          }
        })
      }
    },
    // 创建目标点
    createPointMesh(pos, setSize, isCountry, isLargeMap, isStation) {
      let material = null
      if (isStation) {
        material = this.stationPointMaterial
      } else if (isCountry) {
        material = this.countryPointMaterial
      } else {
        material = this.pointMaterial
      }
      const mesh = new THREE.Mesh(this.planGeometry, material);
      const size = radius * setSize; //矩形平面Mesh的尺寸
      mesh.scale.set(size, size, size); //设置mesh大小
      //设置mesh位置
      const coord = this.lon2xyz(radius, pos.lon, pos.lat);
      if (isLargeMap) {
        mesh.position.set(coord.x * 1.011, coord.y * 1.011, coord.z * 1.011);
      } else {
        mesh.position.set(coord.x, coord.y, coord.z);
      }
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      // // console.log(pos.portDeptCountry, mesh.position)
      // // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
      // const coordVec3 = new THREE.Vector3(coord.x, coord.y, coord.z).normalize();
      // // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
      // const meshNormal = new THREE.Vector3(0, 0, 1);
      // // 四元数属性.quaternion表示mesh的角度状态
      // //.setFromUnitVectors();计算两个向量之间构成的四元数值
      // mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      mesh.posChildren = pos.children;
      mesh.isPoint = true;
      mesh.info = pos;
      mesh.portDeptCountry = pos.portDeptCountry;
      mesh.privateType = isCountry ? '' : 'mark'
      mesh.setSize = setSize
      mesh.size = 1
      mesh.meshAnimateLarge = false
      return mesh;
    },
    // 创建文本标注
    createTextCanvas(pos, name, isCountry) {
      //用canvas生成图片
      let w = 72;
      let h = 36;
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext('2d');
      canvas.width = w;
      canvas.height = h;
      ctx.globalAlpha = 1
      //左右翻转
      ctx.scale(-1, 1);
      ctx.translate(-w, 0);
      // //制作矩形
      // ctx.fillStyle = "rgba(23,78,106,0.75)";
      // ctx.fillRect(0, 0, w, h)
      // ctx.fillStyle = "rgba(39,183,255,1)";
      // ctx.fillRect(0, 0, w, h/7)
      // //设置文字 
      // ctx.fillStyle = "rgba(231,247,255,1)";
      // ctx.font = 16 + 'px "微软雅黑"';
      // ctx.textAlign = 'center';
      // ctx.fillText(name, w/2, h/2 + 8);
      
      //生成图片
      let url = canvas.toDataURL('image/png');
      let geometry = null
      //几何体--长方形
      if (isCountry) {
        geometry = new THREE.PlaneGeometry(0.42, 0.22);
      } else {
        geometry = new THREE.PlaneGeometry(0.72, 0.36);
      }
      //将图片构建到纹理中
      let material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(url),
        side: THREE.DoubleSide, //两面可见
        depthWrite: false, //禁止写入深度缓冲区数据
        transparent: true,
      });
      let coord = this.lon2xyz(radius, pos.lon, isCountry ? pos.lat - 2.6 : pos.lat - 3.6)
      let txtMesh = new THREE.Mesh(geometry, material); 
      if (isCountry) {
        txtMesh.position.set(coord.x * 1.011, coord.y * 1.011, coord.z * 1.011);
      } else {
        txtMesh.position.set(coord.x, coord.y, coord.z);
      }
      txtMesh.lookAt(new THREE.Vector3(0, 0, 0));
      return txtMesh
    },
    // 标记点动画
    meshAnimate() {
      this.groupDots.children.forEach(mesh => {
        const size = radius * mesh.setSize;
        if (mesh.privateType !== 'mark') return
        if (!mesh.meshAnimateLarge) {
          mesh.size -= 0.008
        } else  {
          mesh.size += Math.random() * 0.008
        }
        mesh.scale.set(
          mesh.size * size,
          mesh.size * size,
          mesh.size * size
        )
        if (mesh.size <= 0.6) {
          mesh.meshAnimateLarge = true
        } else if (mesh.size >= 1) {
          mesh.meshAnimateLarge = false
        }
      })
    },
    /**
     * @description 初始化点和曲线
     */
    initDotAndFly(countryDatasource) {
      // 创建标注点
      this.setRandomDot(this.groupDots, countryDatasource);
      //标注点加载group上面
      this.groupDots.name = '点集合'
      this.group.add(this.groupDots);
      // 曲线
      const animateDots = [];
      // console.log(this.groupDots);
      let dot2Flys = []
      if (countryDatasource) {
        dot2Flys = this.groupDots.children.filter(val => val?.info?.countryDatasource === countryDatasource)
      } else {
        dot2Flys = this.groupDots.children
      }
      dot2Flys.forEach(elem => {
        if (elem.posChildren && elem.posChildren.length) {
          elem.posChildren.forEach(pos => {
            const coord = this.lon2xyz(radius, pos.lon, pos.lat);
            const position = new THREE.Vector3(coord.x, coord.y, coord.z);
            const line = this.addLines(elem.position, position);
            let fly = this.addFlyLines(line.curve)
            fly.obj.flyParent = fly
            this.groupFlyLines.name = '飞线集合'
            this.groupFlyLines.add(fly.obj)
            // groupLines.add(line.lineMesh);
            // 飞机模型
            // this.globeTextureLoader.load(plain, (texture) => {
              // const p = new THREE.Vector3(0, 0, 0);
              // const points = [p];
              // const geometry = new THREE.BufferGeometry().setFromPoints(points);
              // const material = new THREE.PointsMaterial({
              //   map: texture,
              //   transparent: true,
              //   side: THREE.DoubleSide,
              //   size: 0.8,
              //   depthWrite: true
              // });
              // const aMesh = new THREE.Points(geometry, material);
              // aMesh.castShadow = true;
          //     const material = new THREE.SpriteMaterial( { map: texture, size: 0.5 } );
          //     const aMesh = new THREE.Sprite( material );
          //     if (this.isLargeMap) {
          //       aMesh.scale.set(0.20, 0.20, 0.20);
          //     } else {
          //       aMesh.scale.set(0.35, 0.35, 0.35);
          //     }
          //     aGroup.add(aMesh);
          //     // 生成动画点
          //     const num = Math.floor(Math.random() * (360 - 280 + 1) + 280);
          //     const start = elem.position;
          //     const end = line.curve.getPoints(num)[(num/2).toFixed(0)];
          //     const rotation = this.get2DPos(
          //       new THREE.Vector3(start.x, start.y, start.z),
          //       new THREE.Vector3(end.x, end.y, end.z)
          //     )
          //     material.rotation = rotation;
          //     animateDots.push({
          //       index: 0,
          //       aMesh,
          //       targetPosition: position,
          //       startPosition: elem.position,
          //       points: line.curve.getPoints(num),
          //       length: num,
          //       material
          //     });
          //   });
          });
        }
      });
      // this.group.add(groupLines);
      this.group.add(this.groupFlyLines);
      // 添加站组点（全球显示，不清除）
      this.groupStations.name = '站组点集合'
      this.group.add(this.groupStations);
      this.flyMove()
      // const that = this
      // function animateLine() {
      //   // console.log(aGroup.children)
      //   animateDots.forEach((val) => {
      //     that.setDirection(val)
      //     val.index++;
      //     if (val.index > val.length) {
      //       val.index = 0
      //     }
      //   });
      //   setTimeout(animateLine, 100);
      // }
      // group.add(aGroup);
      // // animateLine();
      // setTimeout(animateLine, 1000);

    },
    setDirection(line) {
      const model = line.aMesh;
      const startPosition = line.startPosition;
      const material = line.material;
      const pos = line.points[line.index];
      model.position.set(pos.x, pos.y, pos.z);
      // if (!this.isLargeMap) {
      //   const rotation = this.get2DPos(
      //     new THREE.Vector3(startPosition.x, startPosition.y, startPosition.z),
      //     new THREE.Vector3(pos.x, pos.y, pos.z)
      //   )
      //   material.rotation = rotation;
      // }
    },
    get2DPos(worldVector1, worldVector2) {
      //通过世界坐标获取转标准设备坐标
      const vector1 = worldVector1.project(this.camera);
      const vector2 = worldVector2.project(this.camera);
      const w = window.innerWidth / 2;
      const h = window.innerHeight / 2;
      const x1 = Math.round(vector1.x * w + w);//标准设备坐标转屏幕坐标
      const y1 = Math.round(-vector1.y * h + h);
      const x2 = Math.round(vector2.x * w + w);//标准设备坐标转屏幕坐标
      const y2 = Math.round(-vector2.y * h + h);
      return this.getRotation({x: x1, y: y1}, {x: x2, y: y2});
    },
    // 计算飞机偏移角度
    getRotation(start, end) {
      const x1 = start.x;
      const y1 = start.y
      const x3 = end.x;
      const y3 = end.y;
      const dx = x3 - x1;
      const dy = y3 - y1;
      if (dy ===0 && dx === 0) {
        return 0;
      }
      let rotation = Math.atan(dy / dx);
      if (dx > 0 && dy > 0) {
        rotation
      } else if ( dx < 0 && dy > 0) {
        rotation = Math.PI + rotation;
      } else if (dx > 0 && dy < 0) {
        rotation = 2 * Math.PI + rotation;
      } else if (dx < 0 && dy < 0) {
        rotation = Math.PI + rotation;
      } else if (dx === 0 && dy > 0) {
        rotation = Math.PI / 2;
      } else if (dx === 0 && dy < 0) {
        rotation = Math.PI * 3 / 2;
      } else if (dx > 0 && dy === 0) {
        rotation = Math.PI * 2;
      } else if (dx < 0 && dy === 0) {
        rotation = Math.PI;
      }
      return rotation + Math.PI * 1
    },
    /**
     * @description 初始化光
     */
    initLight() {
      // 平行光
      const directionalLight = new THREE.DirectionalLight(0xcccccc, 0.4);
      directionalLight.position.set(-250, 250, 100);
      this.scene.add(directionalLight);

      // 点光
      const pointLight = new THREE.PointLight(0xcccccc, 0.04);
      pointLight.position.set(-250, 250, 100);
      this.scene.add(pointLight);

      // 半球光
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.4);
      hemisphereLight.position.set(-230, 230, 100);
      this.scene.add(hemisphereLight);

      //环境光
      const ambient = new THREE.AmbientLight(0xcccccc, 0.7);
      this.scene.add(ambient);
    },
    /**
     * 包含2个，一个地球，一个辉光球体
     */
    initEarth() {
      // 地球 - 减少分段数以提高性能 (64, 64 仍然足够平滑)
      this.globeTextureLoader.load(earthMap, (texture) => {
        const globeGgeometry = new THREE.SphereGeometry(radius, 64, 64);
        const globeMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        const globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial);
        this.group.rotation.set(...this.groupRotation);
        globeMesh.name = '地球'
        this.group.add(globeMesh);
        this.scene.add(this.group);
      });
    },
    /**
     * 创建地球光晕特效
     */
    initEarthSprite() {
      const texture = this.globeTextureLoader.load(aperture);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false
      });
      this.sprite = new THREE.Sprite(spriteMaterial);
      this.sprite.scale.set(radius * 3.64, radius * 3.1, radius * 3.1);
      this.sprite.name = '光晕'
      this.group.add(this.sprite);
    },
    // 地图描边
    // 处理坐标跨越 180 度的问题
    fixCoordinateJump(coordinates) {
      if (!coordinates || coordinates.length === 0) return coordinates
      // 获取所有经度值
      let allLons = []
      coordinates.forEach(polygon => {
        polygon.forEach(point => allLons.push(point[0]))
      })
      // 检查是否跨越 180 度
      const minLon = Math.min(...allLons)
      const maxLon = Math.max(...allLons)
      if (minLon < -90 && maxLon > 90) {
        // 跨越 180 度，将负经度转为正的
        const newCoords = []
        coordinates.forEach(polygon => {
          const newPolygon = []
          polygon.forEach(point => {
            let lon = point[0]
            if (lon < 0) lon = lon + 360
            newPolygon.push([lon, point[1]])
          })
          newCoords.push(newPolygon)
        })
        return newCoords
      }
      return coordinates
    },
    initMap(contryGeoJson) {
      // 遍历省份构建模型
      contryGeoJson.features.forEach(elem => {
        // 新建一个省份容器：用来存放省份对应的模型和轮廓线
        const province = new THREE.Object3D();
        // 处理坐标跨越 180 度的问题
        const coordinates = this.fixCoordinateJump(elem.geometry.coordinates);
        coordinates.forEach((polygon, index) => {
          const positions = [];
          const shapePositions = []
          const vector2Arr = []
          const shapeArr = []
          const linGeometry = new THREE.BufferGeometry();

          const shape = new THREE.Shape()
          for (let i = 0; i < polygon.length; i++) {
            const pos = this.lglt2xyz(polygon[i][0], polygon[i][1]);
            positions.push(pos.x * 1.01, pos.y * 1.01, pos.z * 1.01);

            if (i === 0 ) {
              shape.moveTo(polygon[i][0], -polygon[i][1])
            } else {
              shape.lineTo(polygon[i][0], -polygon[i][1])
            }
            if (i === polygon.length - 1) {
              shape.lineTo(polygon[0][0], -polygon[0][1])
            }
            const shapePos = this.lon2xyz(radius, polygon[i][0], polygon[i][1])
            shapePositions.push(shapePos.x * 1.01, shapePos.y * 1.01, shapePos.z * 1.01)
            vector2Arr.push(shapePos)
          }

          // console.log('shapePositions', positions, shapePositions)
          // 轮廓线
          linGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
          );
          // const matLine = new THREE.LineBasicMaterial({
          //   color: 0x009FEB,
          //   linewidth: 5,
          // });
          const line = new THREE.Line(linGeometry, this.mapLineMaterial);
          province.add(line);

          // 轮廓背景
          const geometry = new THREE.ShapeBufferGeometry(shape)
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(shapePositions, 3)
          );
          // const material = new THREE.MeshBasicMaterial({
          //   color: 0x009FEB,
          //   transparent: true,
          //   opacity: 0.35,
          //   side: THREE.DoubleSide
          // })
          const mesh = new THREE.Mesh(geometry, this.mapShapeMaterial)
          province.add(mesh)
        });
        this.map.add(province);
      });
      this.map.name = '地图轮廓'
      this.group.add(this.map);
    },
    /**
     * 窗口变动
     **/
    onWindowResize() {
      clearTimeout(this.timer)
      this.timer = null
      this.timer = setTimeout(() => {
        if (this.camera && this.renderer) {
          this.camera.aspect = this.mapDom.clientWidth / this.mapDom.clientHeight;
          this.camera.updateProjectionMatrix();
          this.renders();
          this.renderer.setSize(this.mapDom.clientWidth, this.mapDom.clientHeight);
        }
      }, 500)
    },
    /**
     * @description 渲染
     */
    renders() {
      this.renderer?.clear();
      this.renderer?.render(this.scene, this.camera);
    },
    /**
     * 更新
     **/
    animate() {
      this.animationFrame = window.requestAnimationFrame(() => {
        // 页面不可见时跳过渲染
        if (!this.isPageVisible) {
          this.animate();
          return;
        }

        // 检查是否有用户交互
        const isInteracting = this.controls && (
          this.controls.startX !== undefined ||
          this.controls.startY !== undefined ||
          this.controls._changed
        );

        if (this.controls) {
          this.controls.update();
        }
        // if (stats) {
        //   stats.update();
        // }
        if (TWEEN) {
          TWEEN.update();
        }
        // 仅在非交互状态且initFlag为true时才旋转
        if (this.initFlag && !isInteracting) {
          this.scene.rotation.y = this.scene.rotation.y + 0.0005;
        }
        // this.meshAnimate()
        this.renders();
        this.animate();
      });
      // setInterval(() => {
      //   if (this.controls) {
      //     this.controls.update();
      //   }
      //   // if (stats) {
      //   //   stats.update();
      //   // }
      //   if (TWEEN) {
      //     TWEEN.update();
      //   }
      //   if (this.initFlag) {
      //     this.scene.rotation.y = this.scene.rotation.y + 0.0005;
      //   }
      //   // this.meshAnimate()
      //   this.renders();
      //   this.animate();
      // }, 10)
    },
    startAnimation() {
      this.flyMove(true)
      this.animate()
    },
    stopAnimation() {
      this.flyStop()
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  },
};
</script>

<style lang="less" scoped>
.three-map {
  position: relative;
  width: 100%;
  height: 100%;
}
#threeContainer {
  width: 100%;
  height: 100%;
  // background-image: url("../../../assets/earth/bg.png");
  background-size: 100% 100%;
}
.tooltip {
  display: none;
  background-image: linear-gradient(270deg, #6A4317 1%, #8D711F 99%);
  position: absolute;
  top: 0;
  width: 148px;
  height: 75px;
  border-radius: 4px;
  // border: 1px solid rgba(255, 201, 92, 0.5);

  .top-header {
    height: 4px;
    width: 100%;
    background-color: #F7C971;
  }

  .tooltip-title {
    color: #FFEEDA;
    font-size: 16px;
    font-weight: 500;
    line-height: 30px;
    margin: 0 12px;
  }

  .bottom-border {
    margin: 0 12px;
    height: 1px;
    background-color: #F7C971;
    opacity: 0.25;
  }

  .tooltip-content {
    font-family: PingFangSC-Medium;
    font-size: 14px;
    color: rgba(230, 247, 255, 0.85);
    letter-spacing: 0;
    font-weight: 500;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .content-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .num {
      font-family: Alibaba-PuHuiTi-B;
      font-size: 18px;
      color: #d8f0ff;
      letter-spacing: 0;
      text-align: center;
      text-shadow: 0 0 10px #0091ff;
      font-weight: 700;
      margin-left: 14px;
    }
  }
}
</style>
