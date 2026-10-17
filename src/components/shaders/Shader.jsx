import React, { useEffect, useRef } from 'react'
import { Satin } from './Satin'
import { Godrays } from './Godrays'

/**
 * Parses a hex color string (#rrggbb or #rgb) into normalized RGB [0..1]
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0]
  let c = hex.replace(/^#/, '')
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('')
  }
  const num = parseInt(c, 16) || 0
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ]
}

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const SATIN_FRAGMENT_SHADER_SRC = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_color;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_darkColor;
  uniform float u_roughness;
  uniform float u_speed;
  uniform float u_intensity;

  float getFoldHeight(vec2 p, float t) {
    float w1 = sin(p.x * 2.6 + p.y * 1.8 + t * 0.9);
    float w2 = cos(p.x * 3.8 - p.y * 2.4 - t * 1.2 + w1 * 0.85);
    float w3 = sin(p.x * 1.4 + p.y * 3.6 + t * 0.6 + w2 * 0.5);
    float w4 = cos(p.y * 5.2 - t * 1.4 + w3 * 0.7);
    return (w1 * 0.4 + w2 * 0.3 + w3 * 0.2 + w4 * 0.1);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * u_speed;

    vec2 mouseUv = u_mouse * 2.0 - 1.0;
    mouseUv.x *= u_resolution.x / u_resolution.y;
    float distToMouse = length(p - mouseUv);
    float touchRipple = sin(distToMouse * 9.0 - t * 3.5) * exp(-distToMouse * 2.8) * 0.14;

    float h = getFoldHeight(p, t) + touchRipple;

    float eps = 0.008;
    float hRight = getFoldHeight(vec2(p.x + eps, p.y), t);
    float hUp = getFoldHeight(vec2(p.x, p.y + eps), t);
    
    vec3 normal = normalize(vec3(
      (h - hRight) / eps * 0.65,
      (h - hUp) / eps * 0.65,
      max(0.12, u_roughness * 1.6)
    ));

    vec3 lightDir = normalize(vec3(0.55, 0.75, 0.95));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);

    float diff = max(dot(normal, lightDir), 0.0);

    float NdotH = max(dot(normal, halfVec), 0.0);
    float shininess = mix(36.0, 10.0, u_roughness);
    float spec = pow(NdotH, shininess) * u_intensity;

    float NdotV = max(dot(normal, viewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 3.0) * 0.85;

    float foldFactor = clamp(h * 0.5 + 0.5, 0.0, 1.0);

    vec3 fabricColor = mix(u_darkColor, u_secondaryColor, smoothstep(0.12, 0.65, foldFactor));
    fabricColor = mix(fabricColor, u_color, smoothstep(0.48, 0.95, foldFactor));

    vec3 ambientLight = u_darkColor * 0.35;
    vec3 diffuseLight = fabricColor * (diff * 0.55 + 0.45);
    
    vec3 sheenColor = mix(u_color, vec3(1.0, 0.96, 0.98), 0.45) * (spec * 0.9 + fresnel * 0.5) * u_intensity;

    vec3 finalColor = ambientLight + diffuseLight + sheenColor;

    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 0.02 - 0.01;
    finalColor += grain;

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`

const GODRAYS_FRAGMENT_SHADER_SRC = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_rayColor;
  uniform vec3 u_backgroundColor;
  uniform float u_intensity;
  uniform float u_density;
  uniform float u_speed;
  uniform float u_spotty;
  uniform vec2 u_center;

  void main() {
    // Normalized screen coords with top-left as (0, 0)
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 webUv = vec2(uv.x, 1.0 - uv.y);

    // Vector from light emission center to fragment
    vec2 delta = webUv - u_center;
    delta.x *= u_resolution.x / u_resolution.y;
    
    float dist = length(delta);
    float angle = atan(delta.y, delta.x);

    float t = u_time * u_speed;

    // Multi-frequency angular ray beams (volumetric crepuscular rays)
    float baseFreq = 20.0 * max(0.2, u_density);
    float r1 = sin(angle * baseFreq + t * 0.7);
    float r2 = sin(angle * (baseFreq * 1.83) - t * 0.9 + 1.2);
    float r3 = cos(angle * (baseFreq * 3.17) + t * 1.3 - 0.7);
    float r4 = sin(angle * (baseFreq * 5.11) - t * 1.7 + 2.3);

    float combinedRays = r1 * 0.4 + r2 * 0.3 + r3 * 0.2 + r4 * 0.1;
    float beamMask = clamp(combinedRays * 0.5 + 0.5, 0.0, 1.0);
    float beamSharpness = mix(1.2, 3.8, u_spotty);
    beamMask = pow(beamMask, beamSharpness);

    // Radial distance falloff
    float falloff = 1.0 / (1.0 + dist * 1.6 + dist * dist * 0.7);

    // Atmospheric halo glow near the light source
    float coreGlow = exp(-dist * 2.0) * 0.85;

    // Spotty / dust mote turbulence along the beam rays
    float dust = 1.0;
    if (u_spotty > 0.05) {
      float d1 = sin(dist * 16.0 - t * 2.0 + angle * 3.0);
      float d2 = cos(dist * 28.0 + t * 2.5 - angle * 5.0);
      float dustNoise = clamp(0.7 + 0.3 * (d1 * d2), 0.0, 1.0);
      dust = mix(1.0, dustNoise, u_spotty * 0.65);
    }

    // Combine ray luminance
    float rayIllumination = (beamMask * falloff * dust * 1.6 + coreGlow) * u_intensity;

    // Mix between deep navy background and brand ray color
    vec3 finalColor = mix(u_backgroundColor, u_rayColor, clamp(rayIllumination, 0.0, 1.0));

    // Luminous bright core highlight near center
    vec3 coreHighlight = mix(u_rayColor, vec3(1.0), 0.45) * pow(clamp(rayIllumination, 0.0, 1.5), 2.2) * 0.4;
    finalColor += coreHighlight;

    // Micro dither grain to prevent any 8-bit banding on dark display panels
    float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;
    finalColor += grain;

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`

import { ShaderContext } from './ShaderContext'

export function Shader({ children, className = '' }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const mousePosRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const isInteractingRef = useRef(false)
  const lastInteractionTimeRef = useRef(0)

  // Identify shader type and extract props
  let shaderType = 'satin'
  let configProps = {}

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const typeName = child.type?.name || child.type?.displayName || ''
      if (typeName === 'Godrays' || child.props?.rayColor) {
        shaderType = 'godrays'
      }
      configProps = {
        ...configProps,
        ...child.props,
      }
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS background')
      return
    }

    const createShader = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC)
    const fragShader = createShader(
      gl.FRAGMENT_SHADER,
      shaderType === 'godrays' ? GODRAYS_FRAGMENT_SHADER_SRC : SATIN_FRAGMENT_SHADER_SRC
    )
    if (!vertShader || !fragShader) return

    const program = gl.createProgram()
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Full screen quad geometry
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const aPositionLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPositionLoc)
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0)

    // Common Uniforms
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    const uTimeLoc = gl.getUniformLocation(program, 'u_time')
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse')

    // Godrays-specific Uniforms
    let uRayColorLoc, uBgColorLoc, uIntensityLoc, uDensityLoc, uSpeedLoc, uSpottyLoc, uCenterLoc
    // Satin-specific Uniforms
    let uColorLoc, uSecondaryColorLoc, uDarkColorLoc, uRoughnessLoc

    if (shaderType === 'godrays') {
      uRayColorLoc = gl.getUniformLocation(program, 'u_rayColor')
      uBgColorLoc = gl.getUniformLocation(program, 'u_backgroundColor')
      uIntensityLoc = gl.getUniformLocation(program, 'u_intensity')
      uDensityLoc = gl.getUniformLocation(program, 'u_density')
      uSpeedLoc = gl.getUniformLocation(program, 'u_speed')
      uSpottyLoc = gl.getUniformLocation(program, 'u_spotty')
      uCenterLoc = gl.getUniformLocation(program, 'u_center')

      const rayRgb = hexToRgb(configProps.rayColor || '#0284C7')
      const bgRgb = hexToRgb(configProps.backgroundColor || '#0F172A')
      const center = configProps.center || { x: 0.5, y: -0.2 }

      gl.uniform3f(uRayColorLoc, rayRgb[0], rayRgb[1], rayRgb[2])
      gl.uniform3f(uBgColorLoc, bgRgb[0], bgRgb[1], bgRgb[2])
      gl.uniform1f(uIntensityLoc, Number(configProps.intensity ?? 0.9))
      gl.uniform1f(uDensityLoc, Number(configProps.density ?? 0.5))
      gl.uniform1f(uSpeedLoc, Number(configProps.speed ?? 0.4))
      gl.uniform1f(uSpottyLoc, Number(configProps.spotty ?? 0.8))
      gl.uniform2f(uCenterLoc, Number(center.x ?? 0.5), Number(center.y ?? -0.2))
    } else {
      uColorLoc = gl.getUniformLocation(program, 'u_color')
      uSecondaryColorLoc = gl.getUniformLocation(program, 'u_secondaryColor')
      uDarkColorLoc = gl.getUniformLocation(program, 'u_darkColor')
      uRoughnessLoc = gl.getUniformLocation(program, 'u_roughness')
      uSpeedLoc = gl.getUniformLocation(program, 'u_speed')
      uIntensityLoc = gl.getUniformLocation(program, 'u_intensity')

      const rgbMain = hexToRgb(configProps.color || '#c92c40')
      const rgbSecondary = hexToRgb(configProps.secondaryColor || '#312E81')
      const rgbDark = hexToRgb(configProps.darkColor || '#0F172A')

      gl.uniform3f(uColorLoc, rgbMain[0], rgbMain[1], rgbMain[2])
      gl.uniform3f(uSecondaryColorLoc, rgbSecondary[0], rgbSecondary[1], rgbSecondary[2])
      gl.uniform3f(uDarkColorLoc, rgbDark[0], rgbDark[1], rgbDark[2])
      gl.uniform1f(uRoughnessLoc, Number(configProps.roughness) || 0.4)
      gl.uniform1f(uSpeedLoc, Number(configProps.speed) || 0.4)
      gl.uniform1f(uIntensityLoc, Number(configProps.intensity) || 1.1)
    }

    // DPR & Resize Handling
    const resize = () => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
        gl.uniform2f(uResolutionLoc, width, height)
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(canvas)

    // Render loop
    const startTime = performance.now()
    let isRunning = true

    const render = (now) => {
      if (!isRunning) return
      const elapsed = (now - startTime) / 1000

      const timeSinceInteraction = now - lastInteractionTimeRef.current
      if (!isInteractingRef.current && timeSinceInteraction > 2000) {
        targetMouseRef.current.x = 0.5 + 0.3 * Math.sin(elapsed * 0.7)
        targetMouseRef.current.y = 0.5 + 0.25 * Math.cos(elapsed * 0.55)
      }

      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * 0.08
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * 0.08

      gl.uniform1f(uTimeLoc, elapsed)
      gl.uniform2f(uMouseLoc, mousePosRef.current.x, 1.0 - mousePosRef.current.y)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      targetMouseRef.current = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
      isInteractingRef.current = true
      lastInteractionTimeRef.current = performance.now()
    }

    const handlePointerLeave = () => {
      isInteractingRef.current = false
    }

    const parent = canvas.parentElement || canvas
    parent.addEventListener('pointermove', handlePointerMove, { passive: true })
    parent.addEventListener('pointerdown', handlePointerMove, { passive: true })
    parent.addEventListener('pointerleave', handlePointerLeave, { passive: true })

    return () => {
      isRunning = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      resizeObserver.disconnect()
      parent.removeEventListener('pointermove', handlePointerMove)
      parent.removeEventListener('pointerdown', handlePointerMove)
      parent.removeEventListener('pointerleave', handlePointerLeave)

      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
    }
  }, [
    shaderType,
    configProps.rayColor,
    configProps.backgroundColor,
    configProps.intensity,
    configProps.density,
    configProps.speed,
    configProps.spotty,
    configProps.center?.x,
    configProps.center?.y,
    configProps.color,
    configProps.secondaryColor,
    configProps.darkColor,
    configProps.roughness,
  ])

  return (
    <ShaderContext.Provider value={true}>
      <canvas
        ref={canvasRef}
        className={`block w-full h-full pointer-events-auto ${className}`}
        style={{ touchAction: 'none' }}
      />
      <div style={{ display: 'none' }}>{children}</div>
    </ShaderContext.Provider>
  )
}

export { Satin, Godrays }
export default Shader
