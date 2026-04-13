<template>
  <div style="width: 100%; height: 100%;">
    <div id="container" ref="mapId" style="width: 100%; height: 100%;"></div>
  </div>
</template>
<script>
import * as THREE from "three"
import * as TWEEN from "tween"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import map_img from '@/assets/images/map.jpg'
import map_wl from '@/assets/images/wl.png'
import starPng from '@/assets/images/star.jpeg'
import plane from '@/assets/images/plane1.png'
import lightbg1 from '@/assets/images/lightbg1.png'


let camera, scene, controls;
let group = new THREE.Group();
let radius = 60;// 地球大小
let fov = 100;
export default {
  name: 'index',
  data () {
    return {
      mapDom: null,
      renderer: null,
      animationType: true, // 地球入场动画
      rotationY: false, // 地球自动旋转
      meshAnimateType: false, // 标记点动画
      lonlat: { x: 0, y: 0, z: 200 },
      // 移动物体网格对象组
      moveSpots: []
    }
  },
  mounted () {
    this.info ()
  },
  methods: {
    // 初始化
    info () {
      this.map = new THREE.Object3D()// 创建一个空对象
      this.infoThree ()
      this.infoBg()
      this.infoLight()
      this.infoBall ()
      this.infoRender ()
      this.renderer.domElement.addEventListener("click", this.infoMouse)

      // 添加地图点
      this.infoMark(
        { lon: 116.358976, lat: 39.803282, name: "中国", color: 'red' }
      )
      
    },

    // 创建背景
    infoBg() {
      const positions = [];
      const colors = [];
      const geometry = new THREE.BufferGeometry();
      for (var i = 0; i < 10000; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        positions.push(vertex.x, vertex.y, vertex.z);
        var color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55);
        colors.push(color.r, color.g, color.b);
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      var textureLoader = new THREE.TextureLoader();
      var texture = textureLoader.load(starPng); //加载纹理贴图

      var starsMaterial = new THREE.PointsMaterial({
        map: texture,
        size: 1,
        transparent: true,
        opacity: 1,
        vertexColors: true, //true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
        // blending: AdditiveBlending,
        sizeAttenuation: true,
      });
      let stars = new THREE.Points(geometry, starsMaterial);
      stars.scale.set(300, 300, 300);
      
      scene.add(stars)// 添加星空
    },

    // 添加光源
    infoLight() {
      // 平行光
      var directionalLight = new THREE.DirectionalLight(0x80b5ff, 1);
      directionalLight.position.set(-250, 250, 100);
      scene.add(directionalLight);
      
      // 点光
      var pointLight = new THREE.PointLight(0x80d4ff, 1);
      pointLight.position.set(-250, 250, 100);
      scene.add(pointLight);
  
      // 半球光
      var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x3d6399, 1);
      hemisphereLight.position.set(-250, 250, 100);
      scene.add(hemisphereLight);
  
      //环境光
      var ambient = new THREE.AmbientLight(0x002bff, 0.8);
      scene.add(ambient);
    },


    // 基本配置
    infoThree () {
      // 场景
      scene = new THREE.Scene()
      
      // 渲染
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
      })
      this.mapDom = this.$refs.mapId
      this.renderer.setSize(this.mapDom.clientWidth, this.mapDom.clientHeight)
      this.renderer.setClearColor(0x000, 0)
      this.mapDom.appendChild(this.renderer.domElement)
      // 相机
      camera = new THREE.PerspectiveCamera(
        fov,
        this.mapDom.clientWidth / this.mapDom.clientHeight,
        1,
        1000
      )
      camera.position.set(0, 0, 200)
      camera.lookAt(0, 0, 0)
      // 鼠标
      this.infoOrbitControls()
    },

    // 重新渲染
    infoRender() {
      this.renderer.clear()
      // 地球入场动画
      if (this.animationType) this.ballAnimation()
      // 地球旋转
      if (this.rotationY) this.ballRotationY()
      // 标记点动画
      if (this.meshAnimateType) this.meshAnimate()
      this.renderer.render(scene, camera)
      requestAnimationFrame(this.infoRender)
      TWEEN.update()
      controls.update()
      // 飞线模型移动动画
      this.moveSpots.forEach(function (mesh) {
        mesh._s += 0.006
        let tankPosition = new THREE.Vector3()
        tankPosition = mesh.curve.getPointAt(mesh._s % 1)
        mesh.position.set(tankPosition.x, tankPosition.y, tankPosition.z)
      })
    },

    // 鼠标
    infoOrbitControls() {
      controls = new TrackballControls(camera, this.renderer.domElement)
    },

    // 地球
    infoBall() {
      const _this = this
      // 纹理贴图
      let textureLoader = new THREE.TextureLoader();
      textureLoader.load(map_img, function (texture) {
        // 创建球
        let geometry = new THREE.SphereGeometry(radius, 100, 100);
        let material = new THREE.MeshLambertMaterial({//可接收光源材质
          map: texture, //设置颜色贴图属性值
        });
        //网格模型对象Mesh
        let mesh = new THREE.Mesh(geometry, material);
        // 唯一标识
        mesh.name = "ballMain";
        // 添加到场景中
        scene.add(mesh);
        scene.add(_this.createSprite(radius))
      });
    },

    //地球光圈
    createSprite(R) {
      var textureLoader = new THREE.TextureLoader();
      var texture = textureLoader.load(lightbg1);//加载纹理贴图
      // 创建精灵材质对象SpriteMaterial
      var spriteMaterial = new THREE.SpriteMaterial({
        map: texture, //设置贴图
        transparent: true,//开启透明
        // opacity: 0.5,//通过透明度整体调节光圈
      });
      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(R * 3.0, R * 3.0, 1);//缩放精灵
      return sprite
    },

    // 地球入场动画
    ballAnimation() {
      fov -= 0.6
      if (fov <= 45) {
        this.animationType = false
        camera.position.set(0, 0, 200)
        camera.lookAt(0, 0, 0)
        this.infoOrbitControls()
      } else {
        camera = new THREE.PerspectiveCamera(
          fov,
          this.mapDom.clientWidth / this.mapDom.clientHeight,
          1,
          1000
        );
        camera.position.set(0, 0, 200)
        camera.lookAt(0, 0, 0)
      }
    },

    // 地球自动旋转
    ballRotationY() {
      scene.rotation.y -= 0.001
    },

    // 移动相机
    cameraPos (objList) {
      let layerObj = scene.getObjectByName(objList.name)
      scene.rotation.y = 0
      this.rotationY = false
      new TWEEN.Tween( { x: this.lonlat.x, y: this.lonlat.y, z: this.lonlat.z } )
        .to( { x: layerObj.position.x * 2.8, y: layerObj.position.y * 2.8, z: layerObj.position.z * 2.8}, 1500 )
        .onUpdate( function () {
          camera.position.x = this.x
          camera.position.y = this.y
          camera.position.z = this.z
          camera.lookAt(0, 0, 0)
        })
        .onComplete ( ()=> {
          
        })
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start()
      this.lonlat = camera.position
    },


    // 鼠标事件（点击标记的点的事件）
    infoMouse(event) {
      event.preventDefault();
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

      console.log(intersects)

      // 点击对象的处理
      let countryIndex = intersects.findIndex(item => {
        return item.object.name === '中国'
      })
      if(countryIndex > -1) {
        let objList = {
          name: intersects[countryIndex].object.name
        }
        this.cameraPos (objList)
        // 描绘地图边界
        let ss = require('@/assets/geoJson/china.json')
        this.intMapJson(ss)
        
        this.drawLine(116.358976, 39.803282, -77.02238, 38.900042)
      }else {
        // 开启自动旋转
        this.rotationY = false
        setTimeout(() => {
          this.rotationY = false
        }, 500);
      }
      // 记录当前摄像头的位置
      this.lonlat = camera.position
    },


    // 根据地图json数据描边
    intMapJson( chinaJson ) {
      // 遍历省份构建模型
      chinaJson.features.forEach( elem => {
        // 新建一个省份容器：用来存放省份对应的模型和轮廓线
        const province = new THREE.Object3D();
        const coordinates = elem.geometry.coordinates;
        coordinates.forEach( multiPolygon => {
          multiPolygon.forEach( polygon => {
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'orange' } ); //0x3BFA9E
            const positions = [];
            const linGeometry = new THREE.BufferGeometry();
            for (let i = 0; i < polygon.length; i ++) {
              var pos = this.lglt2xyz( polygon[i][0], polygon[i][1] );
              positions.push( pos.x, pos.y, pos.z );
            }
            linGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
            const line = new THREE.Line( linGeometry, lineMaterial );
            province.add( line );
          } );
        } );
        this.map.add( province );
      } );
      scene.add( this.map );
    },
    /**
      *经纬度转换坐标
      *lng:经度
      *lat:维度
      *radius:地球半径
      */
    lglt2xyz(lng, lat) {
      const phi = (180 + lng) * (Math.PI / 180)
      const theta = (90 - lat) * (Math.PI / 180)
      return {
        x: -radius * Math.sin(theta) * Math.cos(phi) || 0,
        y: radius * Math.cos(theta) || 0,
        z: radius * Math.sin(theta) * Math.sin(phi) || 0,
      }
    },
     // 添加纹理标记点
    infoMark(item) {
      let cityGeometry = new THREE.PlaneBufferGeometry(0.5, 0.5) //默认在XOY平面上,两个参数为尺寸
      let textureLoader = new THREE.TextureLoader()
      let texture = textureLoader.load(map_wl)
      let cityWaveMaterial = new THREE.MeshBasicMaterial({
        color: item.color,
        map: texture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      })
      let mesh = new THREE.Mesh(cityGeometry, cityWaveMaterial)
      const coord = this.lglt2xyz(item.lon, item.lat)
      mesh.scale.set(2, 2, 2)
      // 唯一标识
      mesh.name = item.name
      mesh.privateType = 'mark'
      mesh.position.set(coord.x, coord.y, coord.z)
      const coordVec3 = new THREE.Vector3(
        coord.x,
        coord.y,
        coord.z
      ).normalize()
      const meshNormal = new THREE.Vector3(0, 0, 1)
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3)
      // 动画
      group.add(mesh)
      //网格模型添加到场景中
      scene.add(group)
      this.meshAnimateType = true
    },

    // 标记点动画
    meshAnimate() {
      for (let i = 0; i < group.children.length; i++) {
        if (group.children[i].privateType === "mark") {
          // 添加初始随机数，防止动画同步
          group.children[i].material.opacity += Math.random() * 0.2
          group.children[i].scale.set(
            group.children[i].material.opacity + 7,
            group.children[i].material.opacity + 7,
            group.children[i].material.opacity + 7
          )
          if (group.children[i].scale.x >= 9) {
            group.children[i].material.opacity = 0
          }
        }
      }
    },

    
    // 绘制飞线
    drawLine(longitude, latitude, longitude2, latitude2) {      
      let geometry = new THREE.BufferGeometry(); //声明一个几何体对象Geometry
      let v0 = this.getPosition(longitude, latitude, this.radius);      
      let v3 = this.getPosition(longitude2, latitude2, this.radius);
      let { v1, v2 } = this.getBezierPoint(v0, v3);   // 三维二次贝赛尔曲线      
      let curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
      let curvePoints = curve.getPoints(100);
      geometry.setFromPoints(curvePoints);
      console.log(geometry)
      let material = new THREE.LineBasicMaterial({        
        color: 'rgba(230, 76, 162 ,85)'     
      });
      let line = new THREE.Line(geometry, material);
      scene.add(line)    
      this.moveSpot(curve)
    },
    // 获取位置
    getPosition(lng, lat) {      // 经度，纬度转换为坐标      
      const phi = (180 + lng) * (Math.PI / 180)
      const theta = (90 - lat) * (Math.PI / 180)
      const x = -radius * Math.sin(theta) * Math.cos(phi) || 0
      const y = radius * Math.cos(theta) || 0
      const z = radius * Math.sin(theta) * Math.sin(phi) || 0
      return new THREE.Vector3(x, y, z);  
    },
    // 获取贝兹尔曲线控制点
    getBezierPoint(v0, v3) {     
      var angle = v0.angleTo(v3);
      var vtop = v0.clone().add(v3);
      vtop = vtop.normalize().multiplyScalar(radius);
      var n;
      if (angle <= 1) {
        n = radius / 5 * angle;
      } else if (angle > 1 && angle < 2) {
        n = radius / 5 * Math.pow(angle, 2);
      } else {
        n = radius / 5 * Math.pow(angle, 1.5);
      }

      var v1 = v0.clone().add(vtop).normalize().multiplyScalar(radius + n);
      var v2 = v3.clone().add(vtop).normalize().multiplyScalar(radius + n);  
      return {        
        v1: v1,        
        v2: v2      
      };    
    },
    getLenVcetor(v1, v2, len) {   
      let v1v2Len = v1.distanceTo(v2);   
      return v1.lerp(v2, len / v1v2Len);
    },
    getVCenter(v1, v2) {  
      let v = v1.add(v2);  
      return v.divideScalar(2); 
    },
    // 创建飞线上移动模型
    moveSpot(curve) {
      const _this = this
      let globeTextureLoader = new THREE.TextureLoader()
      globeTextureLoader.load( plane, function ( texture ) {
        var p = new THREE.Vector3( 3, 0, 0 );
        const points = [ p ];
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        var material = new THREE.PointsMaterial( {
          map: texture,
          transparent: true,
          side: THREE.DoubleSide, 
          size: 20, 
          depthWrite: true
        } );
        var aMesh = new THREE.Points( geometry, material );
        aMesh.curve = curve
        aMesh._s = 0
        aMesh.castShadow = true
        aMesh.traverse( function ( child ) {
          if ( child.isMesh ) {
            console.log(child)
              child.frustumCulled = false;
              //模型阴影
              child.castShadow = true;
              //模型自发光
              child.material.emissive =  child.material.color;
              child.material.emissiveMap = child.material.map ;
          }}
        )
        scene.add(aMesh)
        _this.moveSpots.push(aMesh)
      } );
    }
  }
}
</script>

<style lang="less">
#layerMain {
  position: absolute;
  width: 300px;
  height: 160px;
  line-height: 160px;
  text-align: center;
  color: white;
  display: none;
  background-color: rgba(34,34,35,.6);
  .shape {
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    width: 0;
    height: 0;
    bottom: -40px;
    border: 20px solid transparent;
    border-top-color: rgba(34,34,35,.6);
  }
}
</style>
