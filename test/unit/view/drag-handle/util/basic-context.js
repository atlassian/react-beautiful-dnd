// @flow
import {
  styleContextKey,
  canLiftContextKey,
} from '../../../../../src/view/context-keys';

const basicContext = {
  [styleContextKey]: 'hello',
  [canLiftContextKey]: () => true,
};

export default basicContext;
