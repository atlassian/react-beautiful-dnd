// @flow
/* eslint-disable react-hooks/rules-of-hooks */
import { invariant } from '../../invariant';
import type { Sensor } from '../../types';
import usePreviousRef from '../use-previous-ref';
import useDevSetupWarning from '../use-dev-setup-warning';
import useDev from '../use-dev';

export default function useValidateSensorHooks(sensorHooks: Sensor[]) {
  useDev(() => {
    const previousRef = usePreviousRef<Sensor[]>(sensorHooks);

    useDevSetupWarning(() => {
      invariant(
        previousRef.current.length === sensorHooks.length,
        'Cannot change the amount of sensor hooks after mounting',
      );
    });
  });
}
