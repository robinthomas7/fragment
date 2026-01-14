

export const RockAsset = {

    //ATTENTION : le glb doit etre triangulé (se fait automatiquement à l'export si tu utilises Blender)
    //Le wireframe qui apparait utilise le wireframe du mesh
    //Le material doit etre dans le glb
    modelUrl : "./fragv3.glb",
    modelScale : 5,
    modelRotation : [Math.PI * -0.4, Math.PI * -0.1, 0],

    effectScale: 1.0, // Augmenter si mesh trop grand et effet peu visible.

    //Si visuellement ok, pour plus de propagation 
    // tu peux augmenter ces deux paramètres
    effectFadeDuration : 1.2,
    effectSpeed : 1.2
}