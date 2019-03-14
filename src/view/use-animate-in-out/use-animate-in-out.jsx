// @flow
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import type { InOutAnimationMode } from '../../types';

export type AnimateProvided = {|
  onClose: () => void,
  animate: InOutAnimationMode,
  data: mixed,
|};

type Args = {|
  on: mixed,
  shouldAnimate: boolean,
|};

type State = {|
  data: mixed,
  isVisible: boolean,
  animate: InOutAnimationMode,
|};

function useAnimateInOut(args: Args): ?AnimateProvided {
  const [isVisible, setIsVisible] = useState<boolean>(Boolean(args.on));
  const [data, setData] = useState<mixed>(args.on);
  const [animate, setAnimate] = useState<InOutAnimationMode>(
    args.shouldAnimate && args.on ? 'open' : 'none',
  );

  useEffect(() => {
    if (!args.shouldAnimate) {
      setIsVisible(Boolean(args.on));
      setData(args.on);
      setAnimate('none');
      return;
    }

    // need to animate in
    if (args.on) {
      setIsVisible(true);
      setData(args.on);
      setAnimate('open');
      return;
    }

    // need to animate out if there was data

    if (isVisible) {
      setAnimate('close');
      return;
    }

    // close animation no longer visible

    setIsVisible(false);
    setAnimate('close');
    setData(null);
  });

  const onClose = useCallback(() => {
    if (animate !== 'close') {
      return;
    }

    setIsVisible(false);
  }, [animate]);

  const provided: AnimateProvided = useMemo(
    () => ({
      onClose,
      data,
      animate,
    }),
    [animate, data, onClose],
  );

  if (!isVisible) {
    return null;
  }

  return provided;
}

export default useAnimateInOut;

export class AnimateInOut extends React.PureComponent<Props, State> {
  state: State = {
    isVisible: Boolean(this.props.on),
    data: this.props.on,
    // not allowing to animate close on mount
    animate: this.props.shouldAnimate && this.props.on ? 'open' : 'none',
  };

  static getDerivedStateFromProps(props: Props, state: State): State {
    if (!props.shouldAnimate) {
      return {
        isVisible: Boolean(props.on),
        data: props.on,
        animate: 'none',
      };
    }

    // need to animate in
    if (props.on) {
      return {
        isVisible: true,
        // have new data to animate in with
        data: props.on,
        animate: 'open',
      };
    }

    // need to animate out if there was data

    if (state.isVisible) {
      return {
        isVisible: true,
        // use old data for animating out
        data: state.data,
        animate: 'close',
      };
    }

    // close animation no longer visible
    return {
      isVisible: false,
      animate: 'close',
      data: null,
    };
  }

  onClose = () => {
    if (this.state.animate !== 'close') {
      return;
    }

    this.setState({
      isVisible: false,
    });
  };

  render() {
    if (!this.state.isVisible) {
      return null;
    }

    const provided: AnimateProvided = {
      onClose: this.onClose,
      data: this.state.data,
      animate: this.state.animate,
    };
    return this.props.children(provided);
  }
}
