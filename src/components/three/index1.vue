<template>
  <div class="three-map">
    <div id="threeContainer"></div>
    <div class="tooltip">
      <div class="tooltip-title">{{tooltip.portDeptCountry}}</div>
      <div class="tooltip-content">
        <div>
          <span>出境数据</span>
          <span class="num">{{tooltip.inCnt}}{{tooltip.inCntUnit}}</span>
        </div>
        <div>
          <span>入境数据</span>
          <span class="num">{{tooltip.outCnt}}{{tooltip.outCntUnit}}</span>
        </div>
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
// import mapCenter from "@/assets/earth/dot2.png";
import plain from "@/assets/earth/plain.png";
const china = require("./geoJson/china.json");

var renderer, stats, controls;

window.camera = null;
window.scene = null;
const radius = 6;
window.group = new THREE.Group(); // 主画布
const groupDots = new THREE.Group(); // 标注点
const groupLines = new THREE.Group(); // 飞线
const aGroup = new THREE.Group(); // 飞机模型
var initFlag = false;
var planGeometry = new THREE.PlaneBufferGeometry(1, 1); //默认在XOY平面上
var globeTextureLoader = new THREE.TextureLoader(); // 地球
var map = new THREE.Object3D(); // 地图描边
var camaPositions = [
  { x: 3, y: - 20, z: 200 }, //远处
	{ x: 2, y: - 2, z: 20 }//近处
];
var groupRotation = [0.5, 2.9, 0.1]
export default {
  data() {
    return {
      mapDom: null,
      tooltipDom: null,
      renderer: null,
      sprite: null, // 地球光晕
      animationType: true, // 地球入场动画
      rotationY: false, // 地球自动旋转
      meshAnimateType: false, // 标记点动画
      lonlat: { x: 0, y: 0, z: 200 },
      tooltip: {
        portDeptCountry: "",
        inCnt: 0,
        inCntUnit: '',
        outCnt: 0,
        outCntUnit: ''
      },
      isLargeMap: false,
      posArr: [],
      contryGeoJson: null
    };
  },
  async mounted() {
    await this.getWorldMap()
    this.mapDom = document.querySelector("#threeContainer");
    this.tooltipDom = document.querySelector(".tooltip");
    this.width = this.mapDom.clientWidth;
    this.height = this.mapDom.clientHeight;
    if (camera) return
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initLight();
    //初始化地球
    this.initEarth();
    //地球光晕
    this.initEarthSprite();
    //外圈描边高亮
    // this.initGeoJson();
    this.initControls();
    this.initTween();
    this.animate();
    // this.initAuxiliaryTool();
  },
  methods: {
    getWorldMap() {
      return this.$axiosGet(API.getWorldMap).then(res => {
        this.posArr = res
      });
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
      var lon = (longitude * Math.PI) / 180; //转弧度值
      var lat = (latitude * Math.PI) / 180; //转弧度值
      lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度
      // 经纬度坐标转球面坐标计算公式
      var x = R * Math.cos(lat) * Math.cos(lon);
      var y = R * Math.sin(lat);
      var z = R * Math.cos(lat) * Math.sin(lon);
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
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(this.width, this.height);
      const containerDom = document.querySelector("#threeContainer");
      containerDom.appendChild(renderer.domElement);
      renderer.domElement.addEventListener("mousemove", this.infoMouse);
      renderer.domElement.addEventListener("click", this.infoClick);
    },
    // 获取当前点
    getPonit(event) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
      let getBoundingClientRect = this.mapDom.getBoundingClientRect();
      mouse.x =
        ((event.clientX - getBoundingClientRect.left) /
          this.mapDom.offsetWidth) *
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
      raycaster.setFromCamera(mouse, camera);
      // 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
      let intersects = raycaster.intersectObjects(scene.children);
      // 点击对象
      return intersects.find(val => val.object.isPoint);
    },
    // 悬浮目标点展示tooltip
    infoMouse(event) {
      event.preventDefault();
      let point = this.getPonit(event);
      if (point && point?.object?.info?.portDeptCountry) {
        initFlag = false;
        this.showTooltip(point);
      } else {
        if (!this.isLargeMap) {
          initFlag = true;
        }
        this.hideTooltip();
      }
    },
    getNum(val, fixed = 1) {
      if (!val) val = 0
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
      } else {
        return {
          value: val,
          unit: ""
        }
      }
    },
    // 显示tooltip
    showTooltip(point) {
      let inCntObj = this.getNum(point.object.info.inCnt) 
      let outCntObj = this.getNum(point.object.info.outCnt) 
      this.tooltip = {
        portDeptCountry: point.object.info.portDeptCountry,
        inCnt: inCntObj.value,
        inCntUnit: inCntObj.unit,
        outCnt: outCntObj.value,
        outCntUnit: outCntObj.unit
      };
      // console.log(point);
      let vector = point.point.project(camera);
      let halfWidth = this.mapDom.offsetWidth / 2;
      let halfHeight = this.mapDom.offsetHeight / 2;
      let x = Math.round(vector.x * halfWidth + halfWidth);
      let y = Math.round(-vector.y * halfHeight + halfHeight);
      this.tooltipDom.style.display = "block";
      this.tooltipDom.style.left = x - 210 + "px";
      this.tooltipDom.style.top = y - 114 + "px";
    },
    // 隐藏tooltip
    hideTooltip() {
      this.tooltipDom.style.display = "none";
    },
    // 点击目标点
    infoClick(event) {
      event.preventDefault();
      let point = this.getPonit(event);
      // console.log(point);
      try {
        if (point && !this.isLargeMap) {
          // let china = require("./geoJson/nanjing.json");
          // let china = require("./geoJson/world-geojson/countries/russia.json");
          this.contryGeoJson = require(`./geoJson/world-geojson/countries/${point.object.info.countryDatasource}.json`);
          // this.contryGeoJson = require(`./geoJson/${point.object.info.countryDatasource}.json`);
          this.redrawnLarge()
          this.initDotAndFly(point.object.info.countryDatasource)
          this.cameraLarge(point);
        }
      } catch(e) {
        console.log(e)
      }
      
    },
    // 放大地球
    cameraLarge(pointObj) {
      this.isLargeMap = true;
      initFlag = false;
      scene.rotation.y = 0
      map.clear()
      group.remove(map)
      group.rotation.set(0, 0, 0);
      this.lonlat = camera.position;
      new TWEEN.Tween({ x: this.lonlat.x, y: this.lonlat.y, z: this.lonlat.z, rotationx: 0, rotationy: 0,rotationz: 0, positionx: 0, positiony: 0})
        .to({ x: pointObj.object.position.x*2, y: pointObj.object.position.y*2, z: pointObj.object.position.z*2,rotationx: 0.3, rotationy: -0.12,rotationz: -0.2, positionx: -0.8, positiony: -2}, 1500)
        .onUpdate(function() {
          camera.position.x = this.x;
          camera.position.y = this.y;
          camera.position.z = this.z;
          camera.lookAt(0, 0, 0);
          group.rotation.set(this.rotationx, this.rotationy, this.rotationz);
          group.position.x = this.positionx
          group.position.y = this.positiony
        })
        .onComplete(() => {
          this.initMap(this.contryGeoJson)
          this.$emit('clickPoint', pointObj.object.info.countryDatasource)
        })
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();
      this.lonlat = camera.position;
    },
    // 重绘国家地图
    redrawnLarge() {
      groupDots.clear()
      groupLines.clear()
      aGroup.clear()
      group.remove(groupDots)
      group.remove(groupLines)
      group.remove(aGroup)
      this.sprite.visible = false
    },
    // 重绘全球地图
    redrawnMap() {
      groupDots.clear()
      groupLines.clear()
      aGroup.clear()
      map.clear()
      group.remove(map)
      group.remove(groupDots)
      group.remove(groupLines)
      group.remove(aGroup)
      initFlag = false
      this.sprite.visible = true
      this.isLargeMap = false
      group.rotation.set(...groupRotation);
      group.position.set(0, 0, 0);
      scene.rotation.y = 0
      new TWEEN.Tween({x: camera.position.x, y:camera.position.y, z:camera.position.z})
        .to(camaPositions[1], 2000)
        .onUpdate(function() {
          camera.position.set(this.x,this.y,this.z)
          camera.lookAt(0, 0, 0);
        })
        .onComplete(() => {
          initFlag = true;
          //初始化点和曲线
          this.initDotAndFly();
          //光柱效果和底部矩形
          // initLightPillar();
        })
        .start()
    },
    /**
     * @description 初始化相机
     */
    initCamera() {
      camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        1000
      );
      camera.position.set(5, -20, 200);
      camera.lookAt(0, 0, 0);
      window.camera = camera;
    },

    /**
     * @description 初始化场景
     */
    initScene() {
      scene = new THREE.Scene();
      // scene.background = new THREE.Color(0x020924);
      // scene.fog = new THREE.Fog(0x020924, 200, 1000);
      window.scene = scene;
    },

    //辅助工具
    initAuxiliaryTool() {
      const helper = new THREE.AxesHelper(500);
      scene.add(helper);
      // 网格
      var grid = new THREE.GridHelper(10, 1000, 0x000000, 0x000000);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      scene.add(grid);
    },
    //性能插件
    initStats() {
      stats = new Stats();
      document.body.appendChild(stats.dom);
    },
    /**
     * 初始化用户交互
     **/
    initControls() {
      controls = new OrbitControls(camera, renderer.domElement);
      // 如果使用animate方法时，将此函数删除
      // controls.addEventListener( 'change', render );
      // 使动画循环使用时阻尼或自转 意思是否有惯性
      controls.enableDamping = true;
      //动态阻尼系数 就是鼠标拖拽旋转灵敏度
      controls.dampingFactor = 0.35;
      //是否可以缩放
      controls.enableZoom = true;
      //是否自动旋转
      controls.autoRotate = false;
      controls.autoRotateSpeed = 2;
      //设置相机距离原点的最远距离
      // controls.minDistance = 2;
      //设置相机距离原点的最远距离
      controls.maxDistance = 50;
      //是否开启右键拖拽
      controls.enablePan = true;
    },
    // 入场相机动画
    initTween() {
      new TWEEN.Tween(camaPositions[0])
        .to(camaPositions[1], 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          camera.position.set(
            camaPositions[0].x,
            camaPositions[0].y,
            camaPositions[0].z
          );
        })
        .onComplete(() => {
          initFlag = true;
          //初始化点和曲线
          this.initDotAndFly();
          //光柱效果和底部矩形
          // initLightPillar();
        })
        .start()
    },
    // 添加飞线
    addLines(v0, v3) {
      // 夹角
      var angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1; // 0 ~ Math.PI
      var aLen = angle * 0.36,
        hLen = angle * angle * 12;
      var p0 = new THREE.Vector3(0, 0, 0);
      // 法线向量
      var rayLine = new THREE.Ray(p0, this.getVCenter(v0.clone(), v3.clone()));
      // 顶点坐标
      var vtop = v0
        .clone()
        .add(v3)
        .normalize()
        .multiplyScalar(30);
      // 控制点坐标
      var v1 = this.getLenVcetor(v0.clone(), vtop, aLen);
      var v2 = this.getLenVcetor(v3.clone(), vtop, aLen);
      // 绘制三维三次贝赛尔曲线
      var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
      var geometry = new LineGeometry();
      var points = curve.getSpacedPoints(100);
      var positions = [];
      var colors = [];
      var color = new THREE.Color();
      /**
       * HSL中使用渐变
       * h — hue value between 0.0 and 1.0
       * s — 饱和度 between 0.0 and 1.0
       * l — 亮度 between 0.0 and 1.0
       */
      // hsla(11,66%,30%,0.07)
      // hsla(15,100%,74%,1)
      for (var j = 0; j < points.length; j++) {
        color.setHSL(
          196/360,
          (100 - (j / points.length) * 12) / 100,
          (95 - (j / points.length) * 43) / 100
        );
        colors.push(color.r, color.g, color.b);
        positions.push(points[j].x, points[j].y, points[j].z);
      }
      geometry.setPositions(positions);
      geometry.setColors(colors);
      var matLine = new LineMaterial({
        linewidth: 0.0014,
        vertexColors: true,
        dashed: false
      });

      return {
        curve: curve,
        lineMesh: new Line2(geometry, matLine)
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
     * @param <Group> group ...
     * @param <number> radius ...
     */
    setRandomDot(group, countryDatasource) {
      var texture = new THREE.TextureLoader().load(dot);
      // var mapCenter = new THREE.TextureLoader().load(mapCenter);
      // var texture2 = new THREE.TextureLoader().load( './imgs/diqiu2/标注光圈.png' );
      if (countryDatasource) {
        let findPos = this.posArr.find(val => val.countryDatasource === countryDatasource)
        let dotMesh = this.createPointMesh(findPos, texture, 0.045)
        group.add(dotMesh);
        findPos.children.forEach(pos => {
          let dotMesh = this.createPointMesh(pos, texture, 0.045);
          group.add(dotMesh);
        })
      } else {
         this.posArr.forEach(pos => {
          var dotMesh = this.createPointMesh(pos, texture);
          // var waveMesh = createWaveMesh( pos, texture2 );
          group.add(dotMesh);
          // group.add( waveMesh );
          // WaveMeshArr.push( waveMesh );
        });
      }
    },
    // 创建目标点
    createPointMesh(pos, texture, setSize = 0.065) {
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, //使用背景透明的png贴图，注意开启透明计算
        side: THREE.DoubleSide, //双面可见
        depthWrite: false //禁止写入深度缓冲区数据
      });
      var mesh = new THREE.Mesh(planGeometry, material);
      var size = radius * setSize; //矩形平面Mesh的尺寸
      mesh.scale.set(size, size, size); //设置mesh大小
      //设置mesh位置
      const coord = this.lon2xyz(radius, pos.lon, pos.lat);
      mesh.position.set(coord.x, coord.y, coord.z);
      // console.log(pos.portDeptCountry, mesh.position)
      // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
      var coordVec3 = new THREE.Vector3(coord.x, coord.y, coord.z).normalize();
      // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
      var meshNormal = new THREE.Vector3(0, 0, 1);
      // 四元数属性.quaternion表示mesh的角度状态
      //.setFromUnitVectors();计算两个向量之间构成的四元数值
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      mesh.posChildren = pos.children;
      mesh.isPoint = true;
      mesh.info = pos;
      mesh.portDeptCountry = pos.portDeptCountry;
      return mesh;
    },
    /**
     * @description 初始化点和曲线
     */
    initDotAndFly(countryDatasource) {
      // 创建标注点
      this.setRandomDot(groupDots, countryDatasource);
      //随机点加载group上面
      group.add(groupDots);
      // 曲线
      var animateDots = [];
      // console.log(groupDots);
      let dot2Flys = []
      if (countryDatasource) {
        dot2Flys = groupDots.children.filter(val => val.info.countryDatasource === countryDatasource)
      } else {
        dot2Flys = groupDots.children
      }
      dot2Flys.forEach(elem => {
        if (elem.posChildren && elem.posChildren.length) {
          elem.posChildren.forEach(pos => {
            const coord = this.lon2xyz(radius, pos.lon, pos.lat);
            let position = new THREE.Vector3(coord.x, coord.y, coord.z);
            var line = this.addLines(elem.position, position);
            groupLines.add(line.lineMesh);
            // 飞机模型
            let globeTextureLoader = new THREE.TextureLoader();
            globeTextureLoader.load(plain, function(texture) {
              var p = new THREE.Vector3(0, 0, 0);
              const points = [p];
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              var material = new THREE.PointsMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                size: 0.8,
                depthWrite: true
              });
              var aMesh = new THREE.Points(geometry, material);
              aMesh.castShadow = true;
              aGroup.add(aMesh);
              // 生成动画点
              let num = Math.floor(Math.random() * (260 - 180 + 1) + 140)
              animateDots.push({
                index: 0,
                aMesh,
                targetPosition: position,
                length: num,
                points: line.curve.getPoints(num)
              });
            });
          });
        }
      });
      group.add(groupLines);
      let that = this
      function animateLine() {
        // console.log(aGroup.children)
        animateDots.forEach((val, index) => {
          const v = val.points[val.index];
          that.setDirection(val.aMesh, v, val.targetPosition)
          val.index++;
          if (val.index > val.length) {
            val.index = 0
          }
        });
        setTimeout(animateLine, 100);
      }
      group.add(aGroup);
      animateLine();
    },
    setDirection(model, v, targetPos) {
      model.position.set(v.x, v.y, v.z);
    },
    /**
     * @description 初始化光
     */
    initLight() {
      // 平行光
      var directionalLight = new THREE.DirectionalLight(0xcccccc, 0.5);
      directionalLight.position.set(-250, 250, 100);
      scene.add(directionalLight);

      // 点光
      var pointLight = new THREE.PointLight(0xcccccc, 0.4);
      pointLight.position.set(-250, 250, 100);
      scene.add(pointLight);

      // 半球光
      var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.4);
      hemisphereLight.position.set(-230, 230, 100);
      scene.add(hemisphereLight);

      //环境光
      var ambient = new THREE.AmbientLight(0xcccccc, 0.7);
      scene.add(ambient);
    },
    /**
     * 包含2个，一个地球，一个辉光球体
     */
    initEarth() {
      // 地球
      globeTextureLoader.load(earthMap, function(texture) {
        var globeGgeometry = new THREE.SphereGeometry(radius, 100, 100);
        var globeMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        var globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial);
        group.rotation.set(...groupRotation);
        group.add(globeMesh);
        scene.add(group);
      });
    },
    /**
     * 创建地球光晕特效
     */
    initEarthSprite() {
      var texture = globeTextureLoader.load(aperture);
      var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false
      });
      this.sprite = new THREE.Sprite(spriteMaterial);
      this.sprite.scale.set(radius * 3.64, radius * 3.1, radius * 3.1);
      group.add(this.sprite);
    },
    /**
     * 中国描边高亮
     */
    // initGeoJson() {
    //   // const loader = new THREE.FileLoader();
    //   // let china = require("./geoJson/countries/CHN.geo.json");
    //   // let china = require("./geoJson/world-geojson/countries/russia.json");
    //   this.initMap(this.contryGeoJson);
    // },
    // 地图描边
    initMap(chinaJson) {
      // 遍历省份构建模型
      chinaJson.features.forEach(elem => {
        // 新建一个省份容器：用来存放省份对应的模型和轮廓线
        const province = new THREE.Object3D();
        const coordinates = elem.geometry.coordinates;
        coordinates.forEach((polygon, index) => {
            const positions = [];
            const shapePositions = []
            const vector2Arr = []
            const shapeArr = []
            const linGeometry = new THREE.BufferGeometry();

            const shape = new THREE.Shape()
            for (let i = 0; i < polygon.length; i++) {
              var pos = this.lglt2xyz(polygon[i][0], polygon[i][1]);
              positions.push(pos.x * 1.005, pos.y * 1.005, pos.z * 1.005);

              if (i === 0 ) {
                shape.moveTo(polygon[i][0], -polygon[i][1])
              } else {
                shape.lineTo(polygon[i][0], -polygon[i][1])
              }
              if (i === polygon.length - 1) {
                shape.lineTo(polygon[0][0], -polygon[0][1])
              }
              var shapePos = this.lon2xyz(radius, polygon[i][0], polygon[i][1])
              shapePositions.push(shapePos.x * 1.04, shapePos.y * 1.04, shapePos.z * 1.04)
              vector2Arr.push(shapePos)
            }

            // console.log('shapePositions', positions, shapePositions)
            // 轮廓线
            linGeometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(positions, 3)
            );
            const matLine = new THREE.LineBasicMaterial({
              color: 0x009FEB,
              linewidth: 5,
            });
            const line = new THREE.Line(linGeometry, matLine);
            province.add(line);

            // 轮廓背景
            // const geometry = new THREE.ExtrudeGeometry(shape, {depth: 4, bevelEnabled: false})
            // const material = new THREE.MeshBasicMaterial({
            //   color: 0xf27610,
            //   transparent: true,
            //   opacity: 0.5
            // })
            // const mesh =  new THREE.Mesh(geometry, material) 
            // let shape = new THREE.Shape(vector2Arr)
            // shapeArr.push(shape)
            let geometry = new THREE.ShapeBufferGeometry(shape)
            geometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(shapePositions, 3)
            );
            let material = new THREE.MeshBasicMaterial({
              color: 0x009FEB,
              transparent: true,
              opacity: 0.35,
              side: THREE.DoubleSide
            })
            const mesh = new THREE.Mesh(geometry, material)
            province.add(mesh)
        });
        map.add(province);
      });
      group.add(map);
    },
    /**
     * 窗口变动
     **/
    onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      this.easingrenders();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    /**
     * @description 渲染
     */
    renders() {
      renderer.clear();
      renderer.render(scene, camera);
    },
    /**
     * 更新
     **/
    animate() {
      window.requestAnimationFrame(() => {
        if (controls) controls.update();
        if (stats) stats.update();
        if (TWEEN) TWEEN.update();
        if (initFlag) {
          scene.rotation.y = scene.rotation.y + 0.002;
        }
        this.renders();
        this.animate();
      });
    }
  }
};
</script>

<style lang="less">
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
  background: rgba(43, 50, 60, 0.85);
  position: absolute;
  top: 0;
  width: 200px;
  height: 104px;
  border-radius: 4px;
  border: 1px solid rgba(255, 201, 92, 0.5);
  .tooltip-title {
    background-image: linear-gradient(
      270deg,
      rgba(255, 193, 100, 0.1) 0%,
      rgba(255, 201, 92, 0.5) 99%
    );
    color: #f7c971;
    line-height: 30px;
    padding: 0 12px;
  }
  .tooltip-content {
    height: 74px;
    font-family: PingFangSC-Medium;
    font-size: 14px;
    color: rgba(230, 247, 255, 0.85);
    letter-spacing: 0;
    font-weight: 500;
    padding: 9px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    div {
      display: flex;
      align-items: center;
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
