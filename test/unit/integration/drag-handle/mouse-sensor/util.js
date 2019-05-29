// @flow
import { simpleLift, mouse } from '../controls';

export const primaryButton = 0;

export function simpleMouseLift(handle: HTMLElement) {
  return simpleLift(mouse, handle);
}
