// @flow
/* eslint-disable react-hooks/rules-of-hooks */
import { invariant } from '../../invariant';
import type { Sensor } from '../../types';
import usePreviousRef from '../use-previous-ref';
import useDevSetupWarning from '../use-dev-setup-warning';

export default function useValidateSensorHooks(sensorHooks: Sensor[]) {
  // Wrapping so that ref is not created
  if (process.env.NODE_ENV !== 'production') {
    const previousRef = usePreviousRef<Sensor[]>(sensorHooks);

    useDevSetupWarning(() => {
      invariant(
        previousRef.current.length === sensorHooks.length,
        'Cannot change the amount of sensor hooks after mounting',
      );
    });
  }
}
