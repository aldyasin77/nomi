import React, { useContext } from 'react'
import { Shader } from './Shader'
import { ShaderContext } from './ShaderContext'

/**
 * Godrays shader component.
 * Can be used standalone as `<Godrays ... />` or inside `<Shader><Godrays ... /></Shader>`.
 */
export function Godrays({
  rayColor = '#0284C7',
  backgroundColor = '#0F172A',
  intensity = 0.9,
  density = 0.5,
  speed = 0.4,
  spotty = 0.8,
  center = { x: 0.5, y: -0.2 },
  className = '',
  ...props
}) {
  const isInsideShader = useContext(ShaderContext)
  if (isInsideShader) {
    return null
  }

  return (
    <Shader className={className}>
      <Godrays
        rayColor={rayColor}
        backgroundColor={backgroundColor}
        intensity={intensity}
        density={density}
        speed={speed}
        spotty={spotty}
        center={center}
        {...props}
      />
    </Shader>
  )
}

Godrays.displayName = 'Godrays'

export default Godrays
