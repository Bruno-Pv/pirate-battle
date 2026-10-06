import { useEffect, useState } from 'react'

const MOBILE_WIDTH_THRESHOLD = 900

function computeIsPortraitMobile(): boolean {
  return window.innerWidth < MOBILE_WIDTH_THRESHOLD && window.innerHeight > window.innerWidth
}

/** True when the viewport looks like a phone held in portrait — the game needs landscape. */
export function useIsPortraitMobile(): boolean {
  const [isPortraitMobile, setIsPortraitMobile] = useState(computeIsPortraitMobile)

  useEffect(() => {
    function handleChange() {
      setIsPortraitMobile(computeIsPortraitMobile())
    }
    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)
    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
    }
  }, [])

  return isPortraitMobile
}
