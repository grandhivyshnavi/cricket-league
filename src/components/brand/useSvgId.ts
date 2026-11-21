import { useId } from 'react'

/** Unique, url()-safe id prefix for SVG gradients/filters rendered multiple times. */
export function useSvgId() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (name: string) => `${id}-${name}`
}
