<template>
  <div class="threejs-page">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <div slot="header">
            <span>Three.js 3D 场景</span>
            <el-button-group style="float: right">
              <el-button size="mini" :type="currentShape === 'cube' ? 'primary' : ''" @click="switchShape('cube')">立方体</el-button>
              <el-button size="mini" :type="currentShape === 'sphere' ? 'primary' : ''" @click="switchShape('sphere')">球体</el-button>
              <el-button size="mini" :type="currentShape === 'torus' ? 'primary' : ''" @click="switchShape('torus')">圆环</el-button>
            </el-button-group>
          </div>
          <div ref="threeContainer" class="three-container"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>旋转速度</h3>
          <el-slider v-model="rotationSpeed" :min="0" :max="100" :step="1" @input="updateSpeed"></el-slider>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>颜色</h3>
          <el-color-picker v-model="meshColor" @change="updateColor"></el-color-picker>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <h3>线框模式</h3>
          <el-switch v-model="wireframe" @change="updateWireframe"></el-switch>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'ThreeScene',
  data() {
    return {
      currentShape: 'cube',
      rotationSpeed: 30,
      meshColor: '#409EFF',
      wireframe: false,
      scene: null,
      camera: null,
      renderer: null,
      mesh: null,
      animationId: null,
      speed: 0.03
    }
  },
  mounted() {
    this.initScene()
    this.animate()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
  },
  methods: {
    initScene() {
      const container = this.$refs.threeContainer
      const width = container.clientWidth
      const height = container.clientHeight

      // 场景
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x1a1a2e)

      // 相机
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      this.camera.position.z = 3

      // 渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(window.devicePixelRatio)
      container.appendChild(this.renderer.domElement)

      // 光源
      const ambientLight = new THREE.AmbientLight(0x404040, 2)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 5, 5)
      this.scene.add(directionalLight)

      const pointLight = new THREE.PointLight(0xff6b6b, 1, 100)
      pointLight.position.set(-5, 3, 2)
      this.scene.add(pointLight)

      // 网格辅助
      const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
      gridHelper.position.y = -1.5
      this.scene.add(gridHelper)

      // 创建初始几何体
      this.createMesh('cube')
    },
    createMesh(shape) {
      if (this.mesh) {
        this.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()
      }

      let geometry
      switch (shape) {
        case 'cube':
          geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
          break
        case 'sphere':
          geometry = new THREE.SphereGeometry(1, 32, 32)
          break
        case 'torus':
          geometry = new THREE.TorusGeometry(0.8, 0.3, 16, 100)
          break
        default:
          geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
      }

      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(this.meshColor),
        wireframe: this.wireframe,
        shininess: 100,
        specular: 0x444444
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.scene.add(this.mesh)
    },
    animate() {
      this.animationId = requestAnimationFrame(this.animate)
      if (this.mesh) {
        this.mesh.rotation.x += this.speed
        this.mesh.rotation.y += this.speed * 0.7
      }
      this.renderer.render(this.scene, this.camera)
    },
    handleResize() {
      const container = this.$refs.threeContainer
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
    },
    switchShape(shape) {
      this.currentShape = shape
      this.createMesh(shape)
    },
    updateSpeed() {
      this.speed = this.rotationSpeed / 1000
    },
    updateColor() {
      if (this.mesh) {
        this.mesh.material.color.set(new THREE.Color(this.meshColor))
      }
    },
    updateWireframe() {
      if (this.mesh) {
        this.mesh.material.wireframe = this.wireframe
      }
    }
  }
}
</script>

<style scoped>
.threejs-page {
  padding: 20px;
}
.three-container {
  width: 100%;
  height: 500px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
