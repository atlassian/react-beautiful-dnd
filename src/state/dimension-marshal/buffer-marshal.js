// @flow
import invariant from 'tiny-invariant';

type Args = {|
  collector: Collector,
  publisher: Publisher,
|}

type Phase = 'IDLE' | 'RUNNING';

const rafWait = () => new Promise(resolve => requestAnimationFrame(resolve));

export default ({ collector, publisher }: Args) => {
  let phase: Phase = 'IDLE';
  let isRunQueued: boolean = false;

  const reset = () => {
    // forcing phase to IDLE
    phase = 'IDLE';
    isRunQueued = false;
  };

  const stopIfIdle = () => (phase === 'IDLE' ? Promise.reject() : Promise.resolve());

  const run = () => {
    phase = 'RUNNING';

    // This would be easier to read with async/await but the runtime is 10kb

    rafWait()
      .then(stopIfIdle)
      .then(collector.perform)
      .then(rafWait)
      .then(stopIfIdle)
      .then(publisher.perform)
      // collection was stopped - we can just exit
      .catch()
      .then(() => {
        if (isRunQueued) {
          run();
          return;
        }
        reset();
      });
  };

  const execute = () => {
    // A run is already queued
    if (isRunQueued) {
      return;
    }

    // We are already performing a run
    if (phase === 'RUNNING') {
      return;
    }

    run();
  };

  return { execute, reset };
};
