// @flow
import type { ScrollOptions } from '../../types';

const immediate = {
  passive: false,
};
const delayed = {
  passive: true,
};

export default (options: ScrollOptions) =>
  options.shouldPublishImmediately ? immediate : delayed;
