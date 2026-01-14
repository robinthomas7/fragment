import * as THREE from "three"

export function addBarycentric(geometry) {
  if (!geometry) return null

  const g = geometry.index
    ? geometry.toNonIndexed()
    : geometry.clone()

  const count = g.attributes.position.count
  const bary = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 3) {
    // sommet 0
    bary[(i + 0) * 3 + 0] = 1
    bary[(i + 0) * 3 + 1] = 0
    bary[(i + 0) * 3 + 2] = 0

    // sommet 1
    bary[(i + 1) * 3 + 0] = 0
    bary[(i + 1) * 3 + 1] = 1
    bary[(i + 1) * 3 + 2] = 0

    // sommet 2
    bary[(i + 2) * 3 + 0] = 0
    bary[(i + 2) * 3 + 1] = 0
    bary[(i + 2) * 3 + 2] = 1
  }

  g.setAttribute("aBary", new THREE.BufferAttribute(bary, 3))
  return g
}
