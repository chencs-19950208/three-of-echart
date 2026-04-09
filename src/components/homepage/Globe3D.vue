<template>
  <div class="globe-wrapper" ref="container">
    <div v-if="tooltip.show" class="globe-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div class="tooltip-sub">{{ tooltip.sub }}</div>
      <div class="tooltip-val">{{ tooltip.value }}</div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'

const MARKERS = [
  { lat: 39.9, lng: 116.4, title: '北京站组', sub: 'C1', value: '600万' },
  { lat: 35.6, lng: 139.7, title: '东京站组', sub: 'C2', value: '320万' },
  { lat: 37.5, lng: 127.0, title: '首尔站组', sub: 'C3', value: '210万' },
  { lat: 48.8, lng: 2.3, title: '巴黎站组', sub: 'C4', value: '180万' },
  { lat: 51.5, lng: -0.1, title: '伦敦站组', sub: 'C5', value: '150万' },
  { lat: 40.7, lng: -74.0, title: '纽约站组', sub: 'C6', value: '420万' },
  { lat: 38.9, lng: -77.0, title: '华盛顿站组', sub: 'C7', value: '280万' },
  { lat: 34.0, lng: -118.2, title: '洛杉矶站组', sub: 'C8', value: '190万' },
  { lat: 55.7, lng: 37.6, title: '莫斯科站组', sub: 'C9', value: '260万' }
]

export default {
  name: 'Globe3D',
  data() {
    return {
      tooltip: { show: false, x: 0, y: 0, title: '', sub: '', value: '' }
    }
  },
  mounted() {
    this.initScene()
    this.animate()
    window.addEventListener('resize', this.onResize)
    this.$refs.container.addEventListener('mousemove', this.onMouseMove)
    this.$refs.container.addEventListener('click', this.onClick)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    cancelAnimationFrame(this._raf)
    if (this.renderer) this.renderer.dispose()
  },
  methods: {
    latLngToVec3(lat, lng, r) {
      const phi = (90 - lat) * Math.PI / 180
      const theta = (lng + 180) * Math.PI / 180
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      )
    },
    initScene() {
      const el = this.$refs.container
      const w = el.clientWidth, h = el.clientHeight
      this.scene = new THREE.Scene()
      this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
      this.camera.position.set(0, 0, 3.2)
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(w, h)
      this.renderer.setPixelRatio(window.devicePixelRatio)
      el.appendChild(this.renderer.domElement)

      // Lights
      this.scene.add(new THREE.AmbientLight(0x334466, 1.5))
      const dl = new THREE.DirectionalLight(0xffffff, 1.2)
      dl.position.set(5, 3, 5)
      this.scene.add(dl)

      // Earth sphere
      const loader = new THREE.TextureLoader()
      const earthGeo = new THREE.SphereGeometry(1, 64, 64)
      const earthMat = new THREE.MeshPhongMaterial({
        map: loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
        bumpMap: loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
        bumpScale: 0.02,
        specularMap: loader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
        specular: new THREE.Color(0x222222),
        shininess: 15
      })
      this.earth = new THREE.Mesh(earthGeo, earthMat)
      this.scene.add(this.earth)

      // Atmosphere glow
      const atmosGeo = new THREE.SphereGeometry(1.05, 64, 64)
      const atmosMat = new THREE.MeshBasicMaterial({
        color: 0x0088ff, transparent: true, opacity: 0.08, side: THREE.BackSide
      })
      this.scene.add(new THREE.Mesh(atmosGeo, atmosMat))

      // Outer ring glow
      const ringGeo = new THREE.RingGeometry(1.15, 1.2, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00aaff, transparent: true, opacity: 0.15, side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      this.scene.add(ring)

      // Markers
      this.markerMeshes = []
      MARKERS.forEach(m => {
        const pos = this.latLngToVec3(m.lat, m.lng, 1.01)
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff6633 })
        )
        dot.position.copy(pos)
        dot.userData = m
        this.earth.add(dot)
        this.markerMeshes.push(dot)

        // Pulse ring
        const pulse = new THREE.Mesh(
          new THREE.RingGeometry(0.015, 0.025, 16),
          new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        )
        pulse.position.copy(pos)
        pulse.lookAt(pos.clone().multiplyScalar(2))
        this.earth.add(pulse)
      })

      // Country highlight group
      this.highlightGroup = new THREE.Group()
      this.earth.add(this.highlightGroup)

      this.raycaster = new THREE.Raycaster()
      this.mouse = new THREE.Vector2()
      this.isDragging = false
      this.prevMouse = { x: 0, y: 0 }
      this.rotSpeed = { x: 0, y: 0.002 }

      el.addEventListener('mousedown', e => {
        this.isDragging = true
        this.prevMouse = { x: e.clientX, y: e.clientY }
      })
      el.addEventListener('mouseup', () => { this.isDragging = false })
      el.addEventListener('mousemove', e => {
        if (this.isDragging) {
          const dx = e.clientX - this.prevMouse.x
          const dy = e.clientY - this.prevMouse.y
          this.earth.rotation.y += dx * 0.005
          this.earth.rotation.x += dy * 0.005
          this.earth.rotation.x = Math.max(-1, Math.min(1, this.earth.rotation.x))
          this.prevMouse = { x: e.clientX, y: e.clientY }
        }
      })
    },
    onMouseMove(e) {
      const rect = this.$refs.container.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const hits = this.raycaster.intersectObjects(this.markerMeshes)
      if (hits.length > 0) {
        const d = hits[0].object.userData
        this.tooltip = { show: true, x: e.clientX - this.$refs.container.getBoundingClientRect().left + 15, y: e.clientY - this.$refs.container.getBoundingClientRect().top - 10, title: d.title, sub: d.sub, value: d.value }
      } else {
        this.tooltip.show = false
      }
    },
    onClick(e) {
      const rect = this.$refs.container.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const hits = this.raycaster.intersectObjects(this.markerMeshes)
      if (hits.length > 0) {
        this.highlightCountry(hits[0].object.userData)
      }
    },
    highlightCountry(marker) {
      // Clear previous highlights
      while (this.highlightGroup.children.length) {
        this.highlightGroup.remove(this.highlightGroup.children[0])
      }
      // Draw a highlight circle around the marker location
      const pos = this.latLngToVec3(marker.lat, marker.lng, 1.005)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.06, 0.08, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      )
      ring.position.copy(pos)
      ring.lookAt(pos.clone().multiplyScalar(2))
      this.highlightGroup.add(ring)
    },
    animate() {
      this._raf = requestAnimationFrame(this.animate)
      if (!this.isDragging) {
        this.earth.rotation.y += 0.002
      }
      this.renderer.render(this.scene, this.camera)
    },
    onResize() {
      const el = this.$refs.container
      if (!el) return
      const w = el.clientWidth, h = el.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }
  }
}
</script>

<style scoped>
.globe-wrapper { width: 100%; height: 100%; position: relative; }
.globe-tooltip {
  position: absolute; pointer-events: none; z-index: 100;
  background: rgba(10, 30, 60, 0.9); border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 4px; padding: 8px 14px; min-width: 100px;
}
.tooltip-title { font-size: 13px; color: #00d4ff; font-weight: bold; }
.tooltip-sub { font-size: 11px; color: #8ec8f0; margin-top: 2px; }
.tooltip-val { font-size: 16px; color: #fff; font-weight: bold; margin-top: 4px; }
</style>
