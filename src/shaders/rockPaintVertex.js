export function rockPaintVertex(vertexShader) {
  let vs = vertexShader

  vs = vs.replace(
    "void main() {",
    `
    varying vec3 vWorldPos;
    varying vec3 vBary;
    attribute vec3 aBary;
    void main() {
    `
  )

  vs = vs.replace(
    "#include <begin_vertex>",
    `
    #include <begin_vertex>
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vBary = aBary;
    `
  )

  return vs
}
