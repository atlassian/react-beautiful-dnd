// @flow
import type { Announce } from '../../types';

export type Announcer = {|
  announce: Announce,
  id: string,
  mount: () => void,
  unmount: () => void,
|};
