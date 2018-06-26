// @flow
import { type Element } from 'react';
import { type Position } from 'css-box-model';

export type Speed = 'INSTANT' | 'STANDARD' | 'FAST';

export type Props = {|
  speed: Speed,
  destination: Position,
  onMoveEnd: () => void,
  children: Position => Element<*>,
|};

export type DefaultProps = {|
  destination: Position,
|};
