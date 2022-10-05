// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type {
  ScrollConditions,
  ScrollDetails,
  DistanceThresholds,
} from '../../../../../types';
import { horizontal, vertical } from '../../../../axis';
import calcScrollConditions from './calc-scroll-conditions';

type Args = {|
  distanceToEdges: Spacing,
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
|};

export default ({
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  thresholdsHorizontal,
  thresholdsVertical,
}: Args): ScrollConditions => ({
  xAxis: calcScrollConditions({
    axis: horizontal,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsHorizontal,
    windowScrollOffset: window.scrollX,
  }),
  yAxis: calcScrollConditions({
    axis: vertical,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsVertical,
    windowScrollOffset: window.scrollY,
  }),
});
