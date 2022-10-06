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
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  distanceToEdges: Spacing,
  bufferMinScroll: number,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
|};

export default ({
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  bufferMinScroll,
  thresholdsHorizontal,
  thresholdsVertical,
}: Args): ScrollConditions => ({
  xAxis: calcAxisScrollConditions({
    axis: horizontal,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    bufferMinScroll,
    thresholds: thresholdsHorizontal,
    windowScrollOffset: window.scrollX,
  }),
  yAxis: calcAxisScrollConditions({
    axis: vertical,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    bufferMinScroll,
    thresholds: thresholdsVertical,
    windowScrollOffset: window.scrollY,
  }),
});
