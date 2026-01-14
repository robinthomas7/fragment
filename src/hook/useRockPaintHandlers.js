import * as THREE from "three"
import { useRef } from "react"

export const logActiveImpactsAndZones = (
  time,
  fadeDuration,
  impactTimes,
  impactZones
) => {
  let activeImpacts = 0
  const activeZones = new Set()

  for (let i = 1; i < impactTimes.length; i++) {
    const t0 = impactTimes[i]
    if (t0 <= 0) continue

    if (time - t0 < fadeDuration) {
      activeImpacts++
      activeZones.add(impactZones[i])
    }
  }

  console.log(
    `[t=${time.toFixed(2)}] impacts actifs: ${activeImpacts} | zones actives: ${activeZones.size}`,
    [...activeZones]
  )
}



export function useRockPaintHandlers({
  MAX_ZONES,
  currentZone,
  impactCenters,
  impactTimes,
  impactZones,
  impactIndex,
  liveIndex,
  shaderRef,
}) {
  const prevDir = useRef(new THREE.Vector3(0, 0, 0))
  const lastMoveT = useRef(0)
  const wasPaused = useRef(true)


  const lastTrailTime = useRef(0)
  const lastTrailPoint = useRef(new THREE.Vector3(9999, 9999, 9999))
  const lastTrailStampPoint = useRef(new THREE.Vector3(9999, 9999, 9999))


  const updateLiveImpact = (point) => {
    const shader = shaderRef.current
    if (!shader) return

    impactCenters[liveIndex].copy(point)
    impactTimes[liveIndex] = shader.uniforms.uTime.value - 0.001
    impactZones[liveIndex] = currentZone.current
  }

  const stampImpact = (point, t0Override) => {
    const shader = shaderRef.current
    if (!shader) return

    const now = shader.uniforms.uTime.value
    const t0 = (t0Override !== undefined) ? t0Override : now - 0.001

    let i = impactIndex.current
    if (i === 0) i = 1

    impactCenters[i].copy(point)
    impactTimes[i] = t0
    impactZones[i] = currentZone.current

    impactIndex.current = (i + 1) % impactTimes.length
    if (impactIndex.current === 0) impactIndex.current = 1

    shader.uniforms.uCenters.needsUpdate = true
    shader.uniforms.uTimes.needsUpdate = true
    shader.uniforms.uZones.needsUpdate = true
  }


  const handlePointerEnter = (e) => {
    const shader = shaderRef.current
    if (!shader) return

    currentZone.current = (currentZone.current + 1) % MAX_ZONES

    lastTrailTime.current = shader.uniforms.uTime.value
    lastMoveT.current = shader.uniforms.uTime.value
    wasPaused.current = false

    lastTrailPoint.current.copy(e.point)
    lastTrailStampPoint.current.copy(e.point)

    prevDir.current.set(0, 0, 0)

    updateLiveImpact(e.point)
  }

  const handlePointerMove = (e) => {
    const shader = shaderRef.current
    if (!shader) return

    const now = shader.uniforms.uTime.value
    lastMoveT.current = now

    const to = e.point.clone()

    // --- always update cursor tracking point (not stamp point) ---
    const fromCursor = lastTrailPoint.current.clone()
    lastTrailPoint.current.copy(to)

    // pause detection (based on cursor movement)
    const stillEps = 0.002
    const distCursor = fromCursor.distanceTo(to)
    if (distCursor < stillEps) {
      wasPaused.current = true
      return
    }

    // live follows cursor
    updateLiveImpact(to)

    // init stamp point if needed
    if (lastTrailStampPoint.current.x > 9000) {
      lastTrailStampPoint.current.copy(to)
      lastTrailTime.current = now
      prevDir.current.set(0, 0, 0)
      wasPaused.current = false
      stampImpact(to)
      return
    }

    // stamping distance from last stamped point (prevents straight chords)
    const fromStamp = lastTrailStampPoint.current.clone()
    const distStamp = fromStamp.distanceTo(to)

    // resume after pause
    const resumeDist = 0.03
    const resumed = wasPaused.current && distCursor >= resumeDist

    // direction / turn detection based on cursor segment
    const dir = new THREE.Vector3().subVectors(to, fromCursor)
    const hasDir = dir.lengthSq() > 1e-8
    if (hasDir) dir.normalize()

    let turned = false
    if (hasDir && prevDir.current.lengthSq() > 1e-8) {
      const dot = THREE.MathUtils.clamp(prevDir.current.dot(dir), -1, 1)
      const angle = Math.acos(dot)
      turned = angle > 2.0
    }

    const stampInterpolated = (a, b) => {
      const step = 0.3
      const d = a.distanceTo(b)
      if (d > step) {
        const n = Math.ceil(d / step)
        for (let k = 1; k <= n; k++) {
          stampImpact(a.clone().lerp(b, k / n))
        }
      } else {
        stampImpact(b)
      }
    }

    // new zone on resume or sharp turn
    if (resumed || turned) {
      currentZone.current = (currentZone.current + 1) % MAX_ZONES
    }

    // gating (based on stamp distance / time)
    const minDist = 0.04
    const maxDt = 0.5                                           

    const movedEnough = distStamp >= minDist
    const timeEnough = (now - lastTrailTime.current) >= maxDt

    if (!movedEnough && !timeEnough) {
      wasPaused.current = false
      return
    }

    // commit stamp state
    lastTrailStampPoint.current.copy(to)
    lastTrailTime.current = now
    if (hasDir) prevDir.current.copy(dir)
    wasPaused.current = false

    // stamp from last stamped point to current cursor
    stampInterpolated(fromStamp, to)
  }


  const handlePointerLeave = () => {
    const shader = shaderRef.current
    if (!shader) return

    wasPaused.current = true
    lastTrailPoint.current.set(9999, 9999, 9999)
    prevDir.current.set(0, 0, 0)

    impactCenters[liveIndex].set(9999, 9999, 9999)
    impactTimes[liveIndex] = 0

    shader.uniforms.uCenters.needsUpdate = true
    shader.uniforms.uTimes.needsUpdate = true
  }

  return { handlePointerEnter, handlePointerMove, handlePointerLeave }
}
