// BackgroundGradient.jsx
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"

export default function BackgroundGradient({
  scale = 50,
  z = -2,

  speed = 0.2,           
  noiseScale = 3.0,       
  noiseAmp = 0.1,        
  noiseFreq = 0.0,       
  noiseWarpFreq = 0.8,   
  noiseAnim = 0.2,       
  breatheAmp = 0.8,      
  breatheFreq = 0.4,      

  blur = 5.0,

  colorA = "#0a0222",
  colorB = "#081c44",
  colorC = "#150332",
}) {
  const mat = useRef()

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },

      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uColorC: { value: new THREE.Color(colorC) },

      uNoiseScale: { value: noiseScale },
      uNoiseAmp: { value: noiseAmp },
      uNoiseFreq: { value: noiseFreq },
      uNoiseWarpFreq: { value: noiseWarpFreq },
      uNoiseAnim: { value: noiseAnim },

      uBreatheAmp: { value: breatheAmp },
      uBreatheFreq: { value: breatheFreq },

      uBlur: { value: blur },
    }
  }, [
    colorA,
    colorB,
    colorC,
    noiseScale,
    noiseAmp,
    noiseFreq,
    noiseWarpFreq,
    noiseAnim,
    breatheAmp,
    breatheFreq,
    blur,
  ])

  useFrame((state) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value = state.clock.elapsedTime * speed

    // si tu changes les props à chaud, ça suit
    mat.current.uniforms.uNoiseScale.value = noiseScale
    mat.current.uniforms.uNoiseAmp.value = noiseAmp
    mat.current.uniforms.uNoiseFreq.value = noiseFreq
    mat.current.uniforms.uNoiseWarpFreq.value = noiseWarpFreq
    mat.current.uniforms.uNoiseAnim.value = noiseAnim
    mat.current.uniforms.uBreatheAmp.value = breatheAmp
    mat.current.uniforms.uBreatheFreq.value = breatheFreq
    mat.current.uniforms.uBlur.value = blur

    mat.current.uniforms.uColorA.value.set(colorA)
    mat.current.uniforms.uColorB.value.set(colorB)
    mat.current.uniforms.uColorC.value.set(colorC)
  })

  return (
    <mesh position={[0, 0, z]} scale={scale} frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={ `
          precision highp float;

          uniform float uTime;

          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;

          uniform float uNoiseScale;
          uniform float uNoiseAmp;
          uniform float uNoiseFreq;
          uniform float uNoiseWarpFreq;
          uniform float uNoiseAnim;

          uniform float uBreatheAmp;
          uniform float uBreatheFreq;

          uniform float uBlur;

          varying vec2 vUv;

          float hash(vec2 p){
            p = fract(p * vec2(123.34, 345.45));
            p += dot(p, p + 34.345);
            return fract(p.x * p.y);
          }

          float noise(vec2 p){
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          float fbm(vec2 p){
            float v = 0.0;
            float a = 0.55;
            for(int i=0;i<5;i++){
              v += a * noise(p);
              p *= 2.0;
              a *= 0.5;
            }
            return v;
          }

          mat2 rot(float a){
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
          }

          void main() {
            vec2 uv = vUv - 0.5;

            float r = length(uv);
            float vignette = smoothstep(0.9, 0.2, r);

            vec2 p = uv * uNoiseScale;
   
            p = rot(uTime * uNoiseFreq) * p;

            p *= 1.0 + sin(uTime * uBreatheFreq) * uBreatheAmp;

            vec2 warp;
            warp.x = fbm(p + vec2(1.3,  uTime * uNoiseWarpFreq));
            warp.y = fbm(p + vec2(8.1, -uTime * uNoiseWarpFreq * 0.9));
            p += (warp - 0.5) * uNoiseAmp;

            float n1 = fbm(p);
            float n2 = fbm(p * 0.75 + 2.3 + uTime * uNoiseAnim);
            float n = mix(n1, n2, 0.5);

            n = smoothstep(
              0.2 + uBlur * 0.2,
              0.8 - uBlur * 0.2,
              n
            );

            float g1 = clamp(0.5 + uv.y * 0.9 + (n - 0.5) * 0.35, 0.0, 1.0);
            float g2 = clamp(0.5 + uv.x * 0.9 + (n - 0.5) * 0.35, 0.0, 1.0);

            vec3 col = mix(uColorA, uColorB, g1);
            col = mix(col, uColorC, g2 * 0.8);

            float clouds = smoothstep(0.25, 0.95, n) * 0.25;
            col += clouds;

            col *= vignette;

            gl_FragColor = vec4(col, 1.0);
          }
        `}
        depthWrite={false}
        depthTest={true}
        transparent={false}
      />
    </mesh>
  )
}
