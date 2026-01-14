export function rockPaintFragment(fragmentShader, { MAX_IMPACTS, MAX_ZONES }) {
    let fs = fragmentShader

    fs = fs.replace(
      "void main() {",
      `
        uniform float uTime;
        uniform vec3 uCenters[${MAX_IMPACTS}];
        uniform float uTimes[${MAX_IMPACTS}];
        uniform float uZones[${MAX_IMPACTS}];
        uniform float uEffectScale;
        uniform float uSpeed;
        uniform float uFadeDuration;

        varying vec3 vWorldPos;
        varying vec3 vBary;

        float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

        float noise3(vec3 p){
          vec3 a = floor(p);
          vec3 d = p - a;
          d = d * d * (3.0 - 2.0 * d);

          vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
          vec4 k1 = perm(b.xyxy);
          vec4 k2 = perm(k1.xyxy + b.zzww);

          vec4 c = k2 + a.zzzz;
          vec4 k3 = perm(c);
          vec4 k4 = perm(c + 1.0);

          vec4 o1 = fract(k3 * (1.0 / 41.0));
          vec4 o2 = fract(k4 * (1.0 / 41.0));

          vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
          vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

          return o4.y * d.y + o4.x * (1.0 - d.y);
        }

        float wireFactor(vec3 bary, float thickness) {
          vec3 d = fwidth(bary);
          vec3 a = smoothstep(vec3(0.0), d * thickness, bary);
          float edge = 1.0 - min(min(a.x, a.y), a.z);
          return edge;
        }

        void main() {
      `
    )

    fs = fs.replace(
      "#include <dithering_fragment>",
      `
        float effectScale = uEffectScale;
        float speed = uSpeed;
        float fadeDuration = uFadeDuration;

        float warpAmp = 0.08 * effectScale;
        float warpFreq = 3.0 ;
        float intensity = 0.5;

        float warp = (noise3(vWorldPos * warpFreq + vec3(0.0, uTime * 0.35, 0.0)) - 0.5) * 2.0 * warpAmp;

        float insideSoft = 0.02 * effectScale;

        // --- per zone ---
        float sMinZ[${MAX_ZONES}];      
        float wireZ[${MAX_ZONES}];      

        float tRingZ[${MAX_ZONES}];     
        float sRingZ[${MAX_ZONES}];
        float fadeRingZ[${MAX_ZONES}];

        for (int z = 0; z < ${MAX_ZONES}; z++) {
          sMinZ[z] = 1e9;
          wireZ[z] = 0.0;

          tRingZ[z] = -1.0;
          sRingZ[z] = 0.0;
          fadeRingZ[z] = 0.0;
        }

        // =====================
        // PASS A : sMinZ + wire
        // =====================
        for (int i = 0; i < ${MAX_IMPACTS}; i++) {
          float t0 = uTimes[i];
          float t = uTime - t0;
          if (t < 0.0) continue;
          t = max(t, 0.01);
          if (t > fadeDuration) continue;

          int z = int(floor(uZones[i] + 0.5));
          if (z < 0 || z >= ${MAX_ZONES}) continue;

          vec3 c = uCenters[i];
          float d = distance(vWorldPos, c) + warp;
          float r = t * speed;
          float si = d - r;

          // front extérieur = min(si)
          sMinZ[z] = min(sMinZ[z], si);

          // wire "recouvrant" basé sur impacts récents (comme tu voulais)
          float timeFade = 1.0 - smoothstep(0.0, fadeDuration, t);
          float inside = smoothstep(0.0, -insideSoft, si);
          wireZ[z] = max(wireZ[z], inside * timeFade);
        }

        // ===============================================
        // PASS B 
        // ===============================================
        for (int i = 0; i < ${MAX_IMPACTS}; i++) {
          float t0 = uTimes[i];
          float t = uTime - t0;
          if (t < 0.0) continue;
          t = max(t, 0.01);
          if (t > fadeDuration) continue;

          int z = int(floor(uZones[i] + 0.5));
          if (z < 0 || z >= ${MAX_ZONES}) continue;

          vec3 c = uCenters[i];
          float d = distance(vWorldPos, c) + warp;
          float r = t * speed;
          float si = d - r;

          float aa = fwidth(si);
          float nearWidth = 0.04 + aa * 2.0;
          float near = 1.0 - smoothstep(0.0, nearWidth * 3.0, abs(si));
          float timeFade = 1.0 - smoothstep(0.0, fadeDuration, t);
          float fade = timeFade * near;

          if (fade <= 0.001) continue;

          float eps = max(fwidth(si) * 2.0, 0.002);
          if (abs(si - sMinZ[z]) > eps) continue;

          if (tRingZ[z] < 0.0 || t < tRingZ[z]) {
            tRingZ[z] = t;
            sRingZ[z] = si;
            fadeRingZ[z] = fade;
          }
        }

        // --- RING ---
        float ringMask = 0.0;

        for (int z = 0; z < ${MAX_ZONES}; z++) {
          float tSel = tRingZ[z];
          if (tSel < 0.0) continue;

          float s = sRingZ[z];
          float fadeSel = fadeRingZ[z];

          float distToFront = abs(s);

          float thickness = 0.2 * effectScale;
          float core = 0.12 * effectScale;
          float falloff = 0.04 * effectScale;
          float x = distToFront / thickness;

          float plateau = 1.0 - smoothstep(core, core + 1e-6, distToFront);
          float fadeB = 1.0 - smoothstep(core, core + falloff, distToFront);
          float band = max(plateau, fadeB);

          band *= band;
          band *= smoothstep(1.0, 0.0, x);

          float earlyBoost = 1.0 + 1.5 * (1.0 - smoothstep(0.0, 0.06, tSel));
          float ring = clamp(band * fadeSel * intensity * earlyBoost * 0.6, 0.0, 1.0);

          ringMask = max(ringMask, ring);
        }

        // --- COMPOSE ---
        vec3 baseColor = gl_FragColor.rgb;

        float wire = wireFactor(vBary, 0.8 * effectScale);
        float wireMask = 0.0;
        for (int z = 0; z < ${MAX_ZONES}; z++) {
          wireMask = max(wireMask, wireZ[z]);
        }

        float wireOpacity = 0.35;
        vec3 wireColor = vec3(1.0);
        baseColor = mix(baseColor, wireColor, wire * wireMask * wireOpacity);

        vec3 ringColor = vec3(1.0);
        gl_FragColor.rgb = baseColor + ringColor * ringMask;

        #include <dithering_fragment>

      `
    )

    return fs
}
