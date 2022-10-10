// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type {
  ScrollConditions,
  ScrollDetails,
  DistanceThresholds,
} from '../../../../../types';
import { horizontal, vertical } from '../../../../axis';
import calcAxisScrollConditions from './calc-axis-scroll-conditions';

type Args = {|
  bufferMinScroll: number,
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  distanceToEdges: Spacing,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
  windowScrollOffset: Position,
|};

export default ({
  bufferMinScroll,
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  thresholdsHorizontal,
  thresholdsVertical,
  windowScrollOffset,
}: Args): ScrollConditions => ({
  xAxis: calcAxisScrollConditions({
    axis: horizontal,
    bufferMinScroll,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsHorizontal,
    windowScrollOffset,
  }),
  yAxis: calcAxisScrollConditions({
    axis: vertical,
    bufferMinScroll,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsVertical,
    windowScrollOffset,
  }),
});
