// @flow
import invariant from 'tiny-invariant';
import { useEffect } from 'react';
import type { Sensor } from '../../types';
import usePreviousRef from '../use-previous-ref';

export default function useValidateSensorHooks(sensorHooks: Sensor[]) {
  const previousRef = usePreviousRef<Sensor[]>(sensorHooks);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        previousRef.current.length === sensorHooks.length,
        'Cannot change the amount of sensor hooks after mounting',
      );
    }
  });
}
