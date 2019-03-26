// @flow
import { useMemo, useCallback, useLayoutEffect, useState } from 'react';
import type { InOutAnimationMode } from '../../types';

export type AnimateProvided = {|
  onClose: () => void,
  animate: InOutAnimationMode,
  data: mixed,
|};

export type Args = {|
  on: mixed,
  shouldAnimate: boolean,
|};

export default function useAnimateInOut(args: Args): ?AnimateProvided {
  console.log('args.on', args.on);
  const [isVisible, setIsVisible] = useState<boolean>(() => Boolean(args.on));
  const [data, setData] = useState<mixed>(() => args.on);
  const [animate, setAnimate] = useState<InOutAnimationMode>(() =>
    args.shouldAnimate && args.on ? 'open' : 'none',
  );
  console.log('render', { isVisible, data, animate });

  // Instant changes
  useLayoutEffect(() => {
    const shouldChangeInstantly: boolean = !args.shouldAnimate;
    if (shouldChangeInstantly) {
      return;
    }
    setIsVisible(Boolean(args.on));
    setData(args.on);
    setAnimate('none');
  }, [args.on, args.shouldAnimate]);

  // We have data and need to either animate in or not
  useLayoutEffect(() => {
    const shouldShowWithAnimation: boolean =
      Boolean(args.on) && args.shouldAnimate;

    if (!shouldShowWithAnimation) {
      return;
    }
    // first swap over to having data
    // if we previously had data, we can just use the last value
    if (!data) {
      console.log('opening');
      setAnimate('open');
    }

    setIsVisible(true);
    setData(args.on);
  }, [animate, args.on, args.shouldAnimate, data]);

  // Animating out
  useLayoutEffect(() => {
    const shouldAnimateOut: boolean =
      args.shouldAnimate && !args.on && isVisible;

    if (shouldAnimateOut) {
      setAnimate('close');
    }
  }, [args.on, args.shouldAnimate, isVisible]);

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

  return isVisible ? provided : null;
}
