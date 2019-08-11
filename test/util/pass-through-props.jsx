// @flow
import { type Node } from 'react';

type Props<T> = {|
  ...T,
  children: (value: T) => Node,
|};

export default function PassThroughProps(props: Props<*>) {
  const { children, ...rest } = props;
  return children(rest);
}
