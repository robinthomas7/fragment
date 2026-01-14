import * as THREE from "three"
import { useMemo, useRef } from "react"

export function useRockPaintImpacts(MAX_IMPACTS, MAX_ZONES) {
  const impactZones = useMemo(() => new Float32Array(MAX_IMPACTS), [MAX_IMPACTS])
  const currentZone = useRef(0)

  const impactCenters = useMemo(
    () => Array.from({ length: MAX_IMPACTS }, () => new THREE.Vector3(9999, 9999, 9999)),
    [MAX_IMPACTS]
  )
  const impactTimes = useMemo(() => new Float32Array(MAX_IMPACTS), [MAX_IMPACTS])
  const impactIndex = useRef(0)
  const liveIndex = 0

  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(16, 64, 64).toNonIndexed()
    const count = g.attributes.position.count

    const bary = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 3) {
      bary[(i + 0) * 3 + 0] = 1
      bary[(i + 1) * 3 + 1] = 1
      bary[(i + 2) * 3 + 2] = 1
    }

    g.setAttribute("aBary", new THREE.BufferAttribute(bary, 3))
    return g
  }, [])

  return {
    impactZones,
    currentZone,

    impactCenters,
    impactTimes,
    impactIndex,
    liveIndex,

    geo,
  }
}
