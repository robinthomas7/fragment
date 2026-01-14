import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { MeshTransmissionMaterial, useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"

import { useRockPaintImpacts } from "../hook/useRockPaintImpacts"
import { useRockPaintShader } from "../hook/useRockPaintShader"
import { useRockPaintHandlers, logActiveImpactsAndZones } from "../hook/useRockPaintHandlers"
import { addBarycentric } from "../utils/addBarycentric"
import { RockAsset } from "../RockAsset"



export default function RockPaint() {
  const { nodes, materials } = useGLTF(RockAsset.modelUrl)

  const MAX_IMPACTS = 330
  const MAX_ZONES = 10

  const mesh = useRef()
  const mat = useRef()
  const shaderRef = useRef(null)

  const ampX = 0.1
  const ampY = 0.15
  const rotLerp = 0.01
  const baseRot = useMemo(() => new THREE.Euler(...RockAsset.modelRotation), [])


  const targetEuler = useMemo(() => new THREE.Euler(), [])

  const baseGeo = useMemo(() => {
    const firstMesh = Object.values(nodes).find((n) => n && n.isMesh && n.geometry)
    return firstMesh?.geometry || null
  }, [nodes])
  
  const wireGeo = useMemo(
    () => addBarycentric(baseGeo),
    [baseGeo]
  )

  const rockMat = useMemo(() => {
    const firstMesh = Object.values(nodes).find((n) => n && n.isMesh && n.material)
    const m1 = firstMesh?.material
    if (m1) return m1

    const m2 = Object.values(materials).find((m) => m && m.isMaterial)
    return m2 || null
  }, [nodes, materials])

  if (rockMat) mat.current = rockMat


  ///decla des hooks
  const {
    impactZones,
    currentZone,
    impactCenters,
    impactTimes,
    impactIndex,
    liveIndex,
    geo,
  } = useRockPaintImpacts(MAX_IMPACTS, MAX_ZONES)

  useRockPaintShader({
    mat,
    shaderRef,
    MAX_IMPACTS,
    MAX_ZONES,
    impactCenters,
    impactTimes,
    impactZones,
  })

  const { handlePointerEnter, handlePointerMove, handlePointerLeave } = useRockPaintHandlers({
    MAX_ZONES,
    currentZone,
    impactCenters,
    impactTimes,
    impactZones,
    impactIndex,
    liveIndex,
    shaderRef,
  })
  ///fin decla hook///
  useFrame((state) => {
    const shader = shaderRef.current
    if (!shader) return
    shader.uniforms.uTime.value = state.clock.elapsedTime

    const t = state.clock.elapsedTime
    shader.uniforms.uTime.value = t

    const m = mesh.current
    if (!m) return

    const px = state.pointer.x
    const py = state.pointer.y

    targetEuler.x = baseRot.x + (py * ampX)
    targetEuler.y = baseRot.y + (-px * ampY)
    targetEuler.z = baseRot.z

    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, targetEuler.x, rotLerp)
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, targetEuler.y, rotLerp)
    m.rotation.z = THREE.MathUtils.lerp(m.rotation.z, targetEuler.z, rotLerp)
  })

  if (!wireGeo || !rockMat) return null

  return (
    <group dispose={null}>
      <mesh
        ref={mesh}
        geometry={wireGeo}
        material={rockMat}
        scale={RockAsset.modelScale}
        rotation={RockAsset.modelRotation}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </group>
  )
}
useGLTF.preload('/fragv3.glb')