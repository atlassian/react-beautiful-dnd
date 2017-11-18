// @flow
import * as React from 'react';
import type { Position } from '../../types';

export type Speed = 'INSTANT' | 'STANDARD' | 'FAST';

export type Style = {|
  transform: ?string,
|}

export type Props = {|
  speed: Speed,
  destination: Position,
  onMoveEnd: () => void,
  children: (Style) => React.Node,
|}

export type DefaultProps = {|
  destination: Position,
|}
