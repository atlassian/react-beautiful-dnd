// @flow
import { type PublicArgs } from '../../../../../../src/state/auto-scroller/fluid-scroller';

export default (): PublicArgs => ({
  scrollWindow: jest.fn(),
  scrollDroppable: jest.fn(),
});
