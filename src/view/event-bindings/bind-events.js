// @flow
import type { EventBinding, EventOptions } from './event-types';

const getOptions = (
  shared?: EventOptions,
  fromBinding: ?EventOptions,
): EventOptions => ({
  ...shared,
  ...fromBinding,
});

const unbindEvents = (
  el: HTMLElement,
  bindings: EventBinding[],
  sharedOptions?: EventOptions,
) => {
  bindings.forEach((binding: EventBinding) => {
    const options: Object = getOptions(sharedOptions, binding.options);

    el.removeEventListener(binding.eventName, binding.fn, options);
  });
};

export default function bindEvents(
  el: HTMLElement,
  bindings: EventBinding[],
  sharedOptions?: EventOptions,
): Function {
  bindings.forEach((binding: EventBinding) => {
    const options: Object = getOptions(sharedOptions, binding.options);

    el.addEventListener(binding.eventName, binding.fn, options);
  });

  // Return a function to unbind events
  return function unbind() {
    unbindEvents(el, bindings, sharedOptions);
  };
}
