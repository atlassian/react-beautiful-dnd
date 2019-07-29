// @flow
import type { EventBinding, EventOptions } from './event-types';

type UnbindFn = () => void;

function getOptions(
  shared?: EventOptions,
  fromBinding: ?EventOptions,
): EventOptions {
  return {
    ...shared,
    ...fromBinding,
  };
}

export default function bindEvents(
  el: HTMLElement,
  bindings: EventBinding[],
  sharedOptions?: EventOptions,
): Function {
  const unbindings: UnbindFn[] = bindings.map(
    (binding: EventBinding): UnbindFn => {
      const options: Object = getOptions(sharedOptions, binding.options);

      el.addEventListener(binding.eventName, binding.fn, options);

      return function unbind() {
        el.removeEventListener(binding.eventName, binding.fn, options);
      };
    },
  );

  // Return a function to unbind events
  return function unbindAll() {
    unbindings.forEach((unbind: UnbindFn) => {
      unbind();
    });
  };
}
