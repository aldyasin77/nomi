import React, { useEffect, useRef } from 'react'

/**
 * Parses a hex color string (#rrggbb or #rgb) into normalized RGB [0..1]
 */
function hexToRgb(hex) {
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

const FRAGMENT_SHADER_SRC = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_slat_count;
  uniform float u_bend;
  uniform float u_angle;
  uniform float u_speed;
  uniform float u_light_radius;

  // 3-stop gradient sampler
  vec3 sampleGradient(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.5) {
      return mix(u_color1, u_color2, t * 2.0);
    } else {
      return mix(u_color2, u_color3, (t - 0.5) * 2.0);
    }
  }

  // 2D Rotation
  vec2 rotate(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  // Random hash for fine-grain texture
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Normalized coordinates [0..1]
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Centered coordinates aspect-corrected
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    // Pointer / Spotlight position in UV space
    vec2 spotUv = u_mouse;
    float distToSpot = length(uv - spotUv);

    // Rotate frame for angled slats
    vec2 rotP = rotate(p, u_angle);

    // Gentle sine bend across the run of slats
    rotP.x += sin(rotP.y * 3.2 + u_time * 0.7) * u_bend;

    // Slat / Louvre division
    float slats = u_slat_count;
    float slatCoord = rotP.x * slats;
    float slatFrac = fract(slatCoord); // [0..1] across slat width
    float slatIdx = floor(slatCoord);

    // Louvre bevel profile (each shaded like a slat turned toward light)
    float louvreProfile = pow(slatFrac, 0.85) * (1.0 - smoothstep(0.85, 1.0, slatFrac) * 0.5);
    // Bevel ridge lighting
    float bevelLight = pow(slatFrac, 1.4) * 0.7 + 0.3;
    float slatShade = louvreProfile * bevelLight;

    // Fine groove / gap between slats
    float slatGap = smoothstep(0.0, 0.035, slatFrac) * smoothstep(1.0, 0.965, slatFrac);
    slatShade = mix(0.18, slatShade, slatGap);

    // Axis-drifting 3-stop gradient
    float gradAxis = rotP.y * 0.75 + u_time * u_speed + slatIdx * 0.015;
    float gradT = 0.5 + 0.5 * sin(gradAxis * 3.14159);
    vec3 gradColor = sampleGradient(gradT);

    // Spotlight illumination (inside it gradient shines, outside it slats fall to dark)
    float spotFalloff = smoothstep(u_light_radius, 0.0, distToSpot);
    float ambient = 0.22; // Rich dark navy tone when outside light
    float light = mix(ambient, 1.0, spotFalloff);

    // Specular highlight along slat surface near spotlight
    float specular = pow(max(0.0, 1.0 - distToSpot * 1.6), 2.5) * pow(slatFrac, 2.5) * 0.38;

    // Slat edge reflection with subtle sapphire tint
    float edgeReflect = smoothstep(0.03, 0.08, slatFrac) * (1.0 - smoothstep(0.08, 0.15, slatFrac));
    vec3 edgeHighlight = mix(gradColor, vec3(0.65, 0.8, 1.0), 0.3) * edgeReflect * light * 0.7;

    // Final color composite
    vec3 color = gradColor * slatShade * light + vec3(specular) + edgeHighlight;

    // Filmic grain overlay to prevent color banding
    float grain = (hash(gl_FragCoord.xy + u_time * 5.0) - 0.5) * 0.025;
    color += grain;

    // Smooth vignette around edges
    float vignette = smoothstep(1.25, 0.25, length(p));
    color *= mix(0.8, 1.0, vignette);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`

export default function LouvresShader({
  className = '',
  colors = ['#0b1320', '#1A2C4C', '#2d4c82'],
  slatCount = 30.0,
  bend = 0.028,
  angle = -0.35,
  speed = 0.22,
  lightRadius = 0.65,
}) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const mousePosRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const isInteractingRef = useRef(false)
  const lastInteractionTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Initialize WebGL context
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS background')
      return
    }

    // Compile shader helper
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
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC)
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

    // Full-screen quad geometry
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

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    const uTimeLoc = gl.getUniformLocation(program, 'u_time')
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse')
    const uColor1Loc = gl.getUniformLocation(program, 'u_color1')
    const uColor2Loc = gl.getUniformLocation(program, 'u_color2')
    const uColor3Loc = gl.getUniformLocation(program, 'u_color3')
    const uSlatCountLoc = gl.getUniformLocation(program, 'u_slat_count')
    const uBendLoc = gl.getUniformLocation(program, 'u_bend')
    const uAngleLoc = gl.getUniformLocation(program, 'u_angle')
    const uSpeedLoc = gl.getUniformLocation(program, 'u_speed')
    const uLightRadiusLoc = gl.getUniformLocation(program, 'u_light_radius')

    // Set static uniforms
    const rgb1 = hexToRgb(colors[0] || '#080c1d')
    const rgb2 = hexToRgb(colors[1] || '#4338ca')
    const rgb3 = hexToRgb(colors[2] || '#06b6d4')
    gl.uniform3f(uColor1Loc, rgb1[0], rgb1[1], rgb1[2])
    gl.uniform3f(uColor2Loc, rgb2[0], rgb2[1], rgb2[2])
    gl.uniform3f(uColor3Loc, rgb3[0], rgb3[1], rgb3[2])
    gl.uniform1f(uSlatCountLoc, slatCount)
    gl.uniform1f(uBendLoc, bend)
    gl.uniform1f(uAngleLoc, angle)
    gl.uniform1f(uSpeedLoc, speed)
    gl.uniform1f(uLightRadiusLoc, lightRadius)

    // Resize handling with DPR limit
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

      // If no pointer interaction for > 2 seconds, gently float the spotlight
      const timeSinceInteraction = now - lastInteractionTimeRef.current
      if (!isInteractingRef.current && timeSinceInteraction > 2000) {
        targetMouseRef.current.x = 0.5 + 0.32 * Math.sin(elapsed * 0.75)
        targetMouseRef.current.y = 0.5 + 0.25 * Math.cos(elapsed * 0.6)
      }

      // Smooth pointer interpolation (lerp)
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * 0.08
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * 0.08

      gl.uniform1f(uTimeLoc, elapsed)
      gl.uniform2f(uMouseLoc, mousePosRef.current.x, 1.0 - mousePosRef.current.y)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    // Pointer interaction listeners
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
  }, [colors, slatCount, bend, angle, speed, lightRadius])

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full pointer-events-auto ${className}`}
      style={{ touchAction: 'none' }}
    />
  )
}
