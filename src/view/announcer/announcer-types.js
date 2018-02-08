// @flow
import type { Announce } from '../../types';

export type Announcer = {|
  announce: Announce,
  describedBy: string,
  mount: () => void,
  unmount: () => void,
|}
