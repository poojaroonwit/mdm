function hasBuildPhase() {
  const nextPhase = process.env?.NEXT_PHASE
  return nextPhase === 'phase-production-build' ||
    nextPhase === 'phase-production-compile' ||
    nextPhase === 'phase-export' ||
    nextPhase?.includes('build') ||
    nextPhase?.includes('compile')
}

function hasBuildCommand() {
  const args = process.argv || []
  return args.some((arg) => {
    if (typeof arg !== 'string') return false
    const lowerArg = arg.toLowerCase()
    return lowerArg.includes('build') ||
      lowerArg.includes('next-build') ||
      lowerArg.includes('next build')
  })
}

function hasClearRuntime() {
  return process.env?.NEXT_RUNTIME ||
    process.env?.VERCEL ||
    process.env?.NETLIFY ||
    process.env?.PORT ||
    process.env?.HOSTNAME ||
    (process.env?.NODE_ENV === 'development' && process.env?.PORT)
}

export function detectBuildTime(): boolean {
  if (typeof process === 'undefined') return false
  if (hasBuildPhase() || hasBuildCommand()) return true
  if (hasClearRuntime()) return false
  if (process.env?.NODE_ENV === 'production') return true
  return true
}

export const IS_BUILD_TIME = detectBuildTime()

export function checkBuildTimeAtRuntime(): boolean {
  return detectBuildTime()
}
