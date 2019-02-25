// @flow
import { styleKey, canLiftKey } from '../../../../../src/view/context-keys';

const basicContext = {
  [styleKey]: 'hello',
  [canLiftKey]: () => true,
};

export default basicContext;
