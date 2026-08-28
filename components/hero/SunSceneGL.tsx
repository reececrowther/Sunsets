'use client'

import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Fullscreen vertex — bypasses camera matrices, stays in clip space ──────
const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv        = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// ── Volumetric sun fragment ────────────────────────────────────────────────
//
//  Three analytical pass approximation of Bloom + Mie scattering:
//  c1  tight inner corona   (mimics small Bloom radius)
//  c2  mid corona           (mimics medium Bloom)
//  c3  wide diffuse haze    (mimics large Bloom)
//  streak  horizontal Mie scatter streak, strongest at horizon
//
const FRAG = /* glsl */`
  precision highp float;

  uniform vec2  uSunPos;     // UV 0..1, sun centre
  uniform vec3  uDiscColor;  // bright inner disc colour
  uniform vec3  uRimColor;   // limb edge colour
  uniform vec3  uGlowColor;  // corona + bloom tint
  uniform float uRadius;     // disc radius in UV (aspect-corrected)
  uniform float uScale;      // bloom spread multiplier (glowBoost)
  uniform float uAlt;        // solar altitude: 0 = horizon, 1 = high
  uniform float uAspect;     // canvas width / height

  varying vec2 vUv;

  void main() {
    vec2  d    = vUv - uSunPos;
    d.x       *= uAspect;           // aspect-correct so disc is round
    float dist = length(d);
    float r    = uRadius;

    // Disc — smooth edge + limb darkening
    float edge  = smoothstep(r + 0.006, r - 0.002, dist);
    float limb  = clamp(dist / max(r, 0.0001), 0.0, 1.0);
    float dark  = 1.0 - 0.32 * pow(limb, 2.2);
    vec3  disc  = mix(uRimColor, uDiscColor, dark) * edge;

    // Three-term corona (simulates HDR Bloom convolution analytically)
    float c1 = exp(-dist *  9.0 / (r * uScale));  // tight
    float c2 = exp(-dist *  3.0 / (r * uScale));  // mid
    float c3 = exp(-dist *  0.8 / (r * uScale));  // wide diffuse

    // Horizontal Mie scattering streak — maximal at horizon, fades high up
    vec2  ds     = d;
    ds.x        *= 0.15;            // flatten to horizontal ellipse
    float streak = exp(-length(ds) * 1.5 / (r * uScale)) * (1.0 - uAlt * 0.82);

    float glow = c1 * 0.58 + c2 * 0.27 + c3 * 0.13 + streak * 0.22;

    vec3  color = disc + uGlowColor * glow;
    float alpha = clamp(edge + glow, 0.0, 1.0);

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

// ── Bridges React props into the R3F render loop via a live ref ───────────
interface MeshProps {
  xPct:       number
  yPct:       number
  sunColor:   string
  innerColor: string
  glowR:      string   // "r,g,b" string, matching PhaseLook.glowR
  glowScale:  number
  sizevh:     number
  alt:        number   // 0 = horizon, 1 = high
}

function SunMesh(props: MeshProps) {
  const { size } = useThree()

  // Stable uniform object — updated each frame from live ref, never recreated
  const uniforms = useRef<Record<string, THREE.IUniform>>({
    uSunPos:    { value: new THREE.Vector2(props.xPct / 100, 1 - props.yPct / 100) },
    uDiscColor: { value: new THREE.Color(props.innerColor) },
    uRimColor:  { value: new THREE.Color(props.sunColor) },
    uGlowColor: { value: new THREE.Color() },
    uRadius:    { value: Math.max(0.008, props.sizevh / 200) },
    uScale:     { value: props.glowScale },
    uAlt:       { value: props.alt },
    uAspect:    { value: 1 },
  })

  // Always-current prop mirror — avoids stale closure in useFrame
  const live = useRef(props)
  live.current = props

  useFrame(() => {
    const { xPct, yPct, sunColor, innerColor, glowR, glowScale, sizevh, alt } = live.current
    const u = uniforms.current

    u.uSunPos.value.set(xPct / 100, 1 - yPct / 100)
    ;(u.uDiscColor.value as THREE.Color).set(innerColor)
    ;(u.uRimColor.value  as THREE.Color).set(sunColor)

    const [r, g, b] = glowR.split(',').map(Number)
    ;(u.uGlowColor.value as THREE.Color).setRGB(r / 255, g / 255, b / 255)

    u.uRadius.value = Math.max(0.008, sizevh / 200)
    u.uScale.value  = glowScale
    u.uAlt.value    = alt
    u.uAspect.value = size.width / size.height
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms.current}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  )
}

// Fires onReady on the first actual R3F render frame
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onReady()
  })
  return null
}

// ── Public component ───────────────────────────────────────────────────────
export interface SunSceneGLProps extends MeshProps {
  onReady: () => void
}

export default function SunSceneGL({ onReady, ...meshProps }: SunSceneGLProps) {
  return (
    <Canvas
      gl={{
        alpha:             true,
        antialias:         false,
        premultipliedAlpha: false,
        toneMapping:       THREE.NoToneMapping,
        powerPreference:   'high-performance',
      }}
      style={{
        position:      'absolute',
        inset:         0,
        zIndex:        56,
        pointerEvents: 'none',
      }}
    >
      <ReadySignal onReady={onReady} />
      <SunMesh {...meshProps} />
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.08}
          luminanceSmoothing={0.82}
          intensity={2.2}
          radius={1.0}
        />
      </EffectComposer>
    </Canvas>
  )
}
