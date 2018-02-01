// @flow
import type { Area } from '../../types';

export default (frame: Area, subject: Area): boolean =>
  subject.width > frame.width || subject.height > frame.height;
