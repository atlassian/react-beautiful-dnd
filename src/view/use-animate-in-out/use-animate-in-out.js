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
  const [isVisible, setIsVisible] = useState<boolean>(Boolean(args.on));
  const [data, setData] = useState<mixed>(args.on);
  const [animate, setAnimate] = useState<InOutAnimationMode>(
    args.shouldAnimate && args.on ? 'open' : 'none',
  );

  useLayoutEffect(() => {
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

    // content is no longer visible
    // 1. animate closed if there was previous data
    // 2. instantly close if there was no previous data
    setIsVisible(false);
    if (data) {
      setAnimate('close');
    } else {
      setAnimate('none');
    }
    setData(null);
  });

  const onClose = useCallback(() => {
    if (animate !== 'close') {
      console.log('no need to close');
      return;
    }

    console.log('setting is visible to false');
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
