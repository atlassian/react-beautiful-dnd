// @flow
import type { SpringConfig } from 'wobble'

export const physics = (() => {
  const base = {
    stiffness: 1000,
    damping: 60,
  }

  const standard: SpringConfig = {
    ...base,
  }

  const fast: SpringConfig = {
    ...base,
    stiffness: base.stiffness * 2,
  }

  return { standard, fast }
})()

export const css = {
  outOfTheWay: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
}
