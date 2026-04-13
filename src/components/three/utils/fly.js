import * as THREE from "three";
import textureCircle from "./texture-circle.png";
export default class Fly {
  constructor(points, length, circle = 2, color = [[255,239,102]], opacity = 1, size = 10, weight = 0, isLargeMap = false) {
    this.points = points; // 路径
    this.length = length; // 长度（粒子数）
    this.weight = weight; // 粗细（按照长度length的比例传值）
    this.circle = circle; // 周期
    this.color = color; // 颜色(传一个数组为单色，两个数组为渐变)
    this.opacity = opacity; // 透明度
    this.size = size; // 大小
    this.isLargeMap = isLargeMap
    this.progress = 0;
    this.frameId = null;
    this.geometry = null;
    this.material = null;
    this.texture = null;
    this.obj = null;
    this.createFly();
  }

  createFly() {
    // 几何体
    this.geometry = new THREE.BufferGeometry();
    this.updateFly();

    // 纹理和材质
    this.texture = new THREE.TextureLoader().load(textureCircle);
    this.material = new THREE.PointsMaterial({
      // color: this.color,
      map: this.texture,
      // alphaTest: 0.9,
      transparent: true,
      depthWrite: false,
      opacity: this.opacity,
      //blending: THREE.AdditiveBlending,
      size: this.size,
      sizeAttenuation: true,
      vertexColors: true
    });

    // 修正着色器
    this.material.onBeforeCompile = (shader) => {
      const vertex = `
              attribute float aScale;
              void main() {
            `;
      const vertex1 = `gl_PointSize = size * aScale;`;
      shader.vertexShader = shader.vertexShader.replace("void main() {", vertex);
      shader.vertexShader = shader.vertexShader.replace("gl_PointSize = size;", vertex1);
    };

    // 物体
    this.obj = new THREE.Points(this.geometry, this.material);
    this.obj.isLargeMap = this.isLargeMap
    // console.log(this.obj)
  }

  // 更新
  updateFly() {
    // 计算新数据
    const posArr = [];
    const scaleArr = [];
    const colors = []
    const posIndex = Math.floor(this.progress * this.points.length);
    const flyPointArr = this.points.filter((point, index) => {
      if (index >= posIndex - this.length && index <= posIndex) return true;
    });
    const RGB1 = this.color[0]
    const RGB2 = this.color[1] || this.color[0]
    // const 
    flyPointArr.forEach((point, index) => {
      posArr.push(...point);
      scaleArr.push((index + this.weight) / this.length);
      let RN = ''
      let GN = ''
      let BN = ''
      // if (index <= flyPointArr.length / 3) {
      //   RN = RGB1[0]
      //   GN = RGB1[1]
      //   BN = RGB1[2]
      // } else {
        
      // }
      RN = RGB1[0] + (RGB2[0] - RGB1[0])/flyPointArr.length * index
      GN = RGB1[1] + (RGB2[1] - RGB1[1])/flyPointArr.length * index
      BN = RGB1[2] + (RGB2[2] - RGB1[2])/flyPointArr.length * index

      const color = new THREE.Color()
      color.setRGB(RN/255, GN/255, BN/255)
      colors.push(color.r, color.g, color.b)
    });
    // 更新几何体
    this.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    this.geometry.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array(scaleArr), 1));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
  }

  // 移动
  move() {
    if (this.frameId) return;
    const clock = new THREE.Clock(); // 时钟
    const h = () => {
      // this.frameId = requestAnimationFrame(h);
      const dt = clock.getDelta();
      this.progress += dt / this.circle; // 更新进度
      if (this.progress > 1 + this.length/this.points.length) this.progress = 1 + this.length/this.points.length;
      this.updateFly();
      if (this.progress == 1 + this.length/this.points.length) this.progress = 0;
    };
    // this.frameId = requestAnimationFrame(h);
    this.frameId = setInterval(h, 100)
  }

  // 停止
  stop() {
    if (this.frameId) {
      // cancelAnimationFrame(this.frameId);
      clearInterval(this.frameId)
      this.frameId = null;
      this.material.dispose()
      this.geometry.dispose()
      this.obj.clear()
    }
  }
}
