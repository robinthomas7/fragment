import { useEffect, useLayoutEffect } from "react"
import { rockPaintFragment } from "../shaders/rockPaintFragment"
import { rockPaintVertex } from "../shaders/rockPaintVertex"
import { RockAsset } from "../RockAsset"

export function useRockPaintShader({
  mat,
  shaderRef,

  MAX_IMPACTS,
  MAX_ZONES,

  impactCenters,
  impactTimes,
  impactZones,
}) {
  useLayoutEffect(() => {
    if (!mat.current) return

    mat.current.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uCenters = { value: impactCenters }
      shader.uniforms.uTimes = { value: impactTimes }
      shader.uniforms.uZones = { value: impactZones }
      shader.uniforms.uEffectScale = { value: RockAsset.effectScale }
      shader.uniforms.uFadeDuration = { value: RockAsset.effectFadeDuration }
      shader.uniforms.uSpeed = { value: RockAsset.effectSpeed}


      shader.vertexShader = rockPaintVertex(shader.vertexShader)
      shader.fragmentShader = rockPaintFragment(shader.fragmentShader, {
        MAX_IMPACTS,
        MAX_ZONES,
      })

      shaderRef.current = shader
      mat.current.needsUpdate = true

    }
  }, [mat, shaderRef, MAX_IMPACTS, MAX_ZONES, impactCenters, impactTimes, impactZones])

  
}
