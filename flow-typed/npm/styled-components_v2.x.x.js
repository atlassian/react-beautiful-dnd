// flow-typed signature: 64126b8277036fc88f1a62e360936ba9
// flow-typed version: 1be5dad600/styled-components_v2.x.x/flow_>=v0.42.x <=v0.52.x

// @flow

type $npm$styledComponents$Interpolation = ((executionContext: Object) => string) | string | number;
type $npm$styledComponents$NameGenerator = (hash: number) => string;

type $npm$styledComponents$TaggedTemplateLiteral<R> = {| (Array<string>, $npm$styledComponents$Interpolation): R |};

type $npm$styledComponents$ReactComponentFunctional<Props: {}> = Props => React$Element<*>
type $npm$styledComponents$ReactComponentClass<Props, DefaultProps = *> = Class<React$Component<DefaultProps, Props, *>>

type $npm$styledComponents$ReactComponentUnion<Props> =
  | $npm$styledComponents$ReactComponentFunctional<Props>
  | $npm$styledComponents$ReactComponentClass<Props>;

type $npm$styledComponents$ReactComponentIntersection<Props, DefaultProps = *> =
  & $npm$styledComponents$ReactComponentFunctional<Props>
  & $npm$styledComponents$ReactComponentClass<Props, DefaultProps>;

type $npm$styledComponents$ReactComponentStyledStaticPropsWithComponent<ComponentList> = <
  Props, DefaultProps,
  Input:
    | ComponentList
    | $npm$styledComponents$ReactComponentStyled<Props, DefaultProps>
    | $npm$styledComponents$ReactComponentClass<Props, DefaultProps>
    | $npm$styledComponents$ReactComponentFunctional<Props>,
>(Input) => $npm$styledComponents$ReactComponentStyled<Props, DefaultProps>

type $npm$styledComponents$ReactComponentStyledStaticProps<Props, ComponentList> = {|
  attrs: <O: {}>(O) => $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<Props, ComponentList>,
  extend: $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<Props, ComponentList>,
  withComponent: $npm$styledComponents$ReactComponentStyledStaticPropsWithComponent<ComponentList>,
|}

type $npm$styledComponents$ReactComponentStyled<Props, ComponentList, DefaultProps = *> =
  & $npm$styledComponents$ReactComponentStyledStaticProps<Props, ComponentList>
  & $npm$styledComponents$ReactComponentIntersection<Props, DefaultProps>

type $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<Props, ComponentList> =
  & $npm$styledComponents$ReactComponentStyledStaticProps<Props, ComponentList>
  & $npm$styledComponents$TaggedTemplateLiteral<$npm$styledComponents$ReactComponentStyled<Props, ComponentList>>

type $npm$styledComponents$WithThemeReactComponentClass = <
  InputProps: { theme: $npm$styledComponents$Theme },
  InputDefaultProps: {},
  OutputProps: $Diff<InputProps, { theme: $npm$styledComponents$Theme }>,
  OutputDefaultProps: InputDefaultProps & { theme: $npm$styledComponents$Theme },
>($npm$styledComponents$ReactComponentClass<InputProps, InputDefaultProps>) => $npm$styledComponents$ReactComponentClass<OutputProps, OutputDefaultProps>

type $npm$styledComponents$WithThemeReactComponentClassUndefinedDefaultProps = <
  InputProps: { theme: $npm$styledComponents$Theme },
  OutputProps: $Diff<InputProps, { theme: $npm$styledComponents$Theme }>,
>($npm$styledComponents$ReactComponentClass<InputProps, void>) => $npm$styledComponents$ReactComponentClass<OutputProps, { theme: $npm$styledComponents$Theme }>

type $npm$styledComponents$WithThemeReactComponentFunctional = <
  InputProps: { theme: $npm$styledComponents$Theme },
  OutputProps: $Diff<InputProps, { theme: $npm$styledComponents$Theme }>
>($npm$styledComponents$ReactComponentFunctional<InputProps>) => $npm$styledComponents$ReactComponentFunctional<OutputProps>

type $npm$styledComponents$WithTheme =
  & $npm$styledComponents$WithThemeReactComponentClass
  & $npm$styledComponents$WithThemeReactComponentClassUndefinedDefaultProps
  & $npm$styledComponents$WithThemeReactComponentFunctional

type $npm$styledComponents$Theme = {[key: string]: mixed};
type $npm$styledComponents$ThemeProviderProps = {
  theme: $npm$styledComponents$Theme | ((outerTheme: $npm$styledComponents$Theme) => void)
};

class Npm$StyledComponents$ThemeProvider extends React$Component {
  props: $npm$styledComponents$ThemeProviderProps;
}

type $npm$styledComponents$StyleSheetManagerProps = {
  sheet: mixed
}

class Npm$StyledComponents$StyleSheetManager extends React$Component {
  props: $npm$styledComponents$StyleSheetManagerProps;
}

class Npm$StyledComponents$ServerStyleSheet {
  instance: StyleSheet
  collectStyles: (children: any) => React$Element<*>
  getStyleTags: () => string
  getStyleElement: () => React$Element<*>
}

type $npm$styledComponents$StyledComponentsComponentListKeys =
  $Subtype<$Keys<$npm$styledComponents$StyledComponentsComponentList>>

type $npm$styledComponents$StyledComponentsComponentListValue =
  $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<{}, $npm$styledComponents$StyledComponentsComponentListKeys>

type $npm$styledComponents$StyledComponentsComponentList = {|
  a:                        $npm$styledComponents$StyledComponentsComponentListValue,
  abbr:                     $npm$styledComponents$StyledComponentsComponentListValue,
  address:                  $npm$styledComponents$StyledComponentsComponentListValue,
  area:                     $npm$styledComponents$StyledComponentsComponentListValue,
  article:                  $npm$styledComponents$StyledComponentsComponentListValue,
  aside:                    $npm$styledComponents$StyledComponentsComponentListValue,
  audio:                    $npm$styledComponents$StyledComponentsComponentListValue,
  b:                        $npm$styledComponents$StyledComponentsComponentListValue,
  base:                     $npm$styledComponents$StyledComponentsComponentListValue,
  bdi:                      $npm$styledComponents$StyledComponentsComponentListValue,
  bdo:                      $npm$styledComponents$StyledComponentsComponentListValue,
  big:                      $npm$styledComponents$StyledComponentsComponentListValue,
  blockquote:               $npm$styledComponents$StyledComponentsComponentListValue,
  body:                     $npm$styledComponents$StyledComponentsComponentListValue,
  br:                       $npm$styledComponents$StyledComponentsComponentListValue,
  button:                   $npm$styledComponents$StyledComponentsComponentListValue,
  canvas:                   $npm$styledComponents$StyledComponentsComponentListValue,
  caption:                  $npm$styledComponents$StyledComponentsComponentListValue,
  cite:                     $npm$styledComponents$StyledComponentsComponentListValue,
  code:                     $npm$styledComponents$StyledComponentsComponentListValue,
  col:                      $npm$styledComponents$StyledComponentsComponentListValue,
  colgroup:                 $npm$styledComponents$StyledComponentsComponentListValue,
  data:                     $npm$styledComponents$StyledComponentsComponentListValue,
  datalist:                 $npm$styledComponents$StyledComponentsComponentListValue,
  dd:                       $npm$styledComponents$StyledComponentsComponentListValue,
  del:                      $npm$styledComponents$StyledComponentsComponentListValue,
  details:                  $npm$styledComponents$StyledComponentsComponentListValue,
  dfn:                      $npm$styledComponents$StyledComponentsComponentListValue,
  dialog:                   $npm$styledComponents$StyledComponentsComponentListValue,
  div:                      $npm$styledComponents$StyledComponentsComponentListValue,
  dl:                       $npm$styledComponents$StyledComponentsComponentListValue,
  dt:                       $npm$styledComponents$StyledComponentsComponentListValue,
  em:                       $npm$styledComponents$StyledComponentsComponentListValue,
  embed:                    $npm$styledComponents$StyledComponentsComponentListValue,
  fieldset:                 $npm$styledComponents$StyledComponentsComponentListValue,
  figcaption:               $npm$styledComponents$StyledComponentsComponentListValue,
  figure:                   $npm$styledComponents$StyledComponentsComponentListValue,
  footer:                   $npm$styledComponents$StyledComponentsComponentListValue,
  form:                     $npm$styledComponents$StyledComponentsComponentListValue,
  h1:                       $npm$styledComponents$StyledComponentsComponentListValue,
  h2:                       $npm$styledComponents$StyledComponentsComponentListValue,
  h3:                       $npm$styledComponents$StyledComponentsComponentListValue,
  h4:                       $npm$styledComponents$StyledComponentsComponentListValue,
  h5:                       $npm$styledComponents$StyledComponentsComponentListValue,
  h6:                       $npm$styledComponents$StyledComponentsComponentListValue,
  head:                     $npm$styledComponents$StyledComponentsComponentListValue,
  header:                   $npm$styledComponents$StyledComponentsComponentListValue,
  hgroup:                   $npm$styledComponents$StyledComponentsComponentListValue,
  hr:                       $npm$styledComponents$StyledComponentsComponentListValue,
  html:                     $npm$styledComponents$StyledComponentsComponentListValue,
  i:                        $npm$styledComponents$StyledComponentsComponentListValue,
  iframe:                   $npm$styledComponents$StyledComponentsComponentListValue,
  img:                      $npm$styledComponents$StyledComponentsComponentListValue,
  input:                    $npm$styledComponents$StyledComponentsComponentListValue,
  ins:                      $npm$styledComponents$StyledComponentsComponentListValue,
  kbd:                      $npm$styledComponents$StyledComponentsComponentListValue,
  keygen:                   $npm$styledComponents$StyledComponentsComponentListValue,
  label:                    $npm$styledComponents$StyledComponentsComponentListValue,
  legend:                   $npm$styledComponents$StyledComponentsComponentListValue,
  li:                       $npm$styledComponents$StyledComponentsComponentListValue,
  link:                     $npm$styledComponents$StyledComponentsComponentListValue,
  main:                     $npm$styledComponents$StyledComponentsComponentListValue,
  map:                      $npm$styledComponents$StyledComponentsComponentListValue,
  mark:                     $npm$styledComponents$StyledComponentsComponentListValue,
  menu:                     $npm$styledComponents$StyledComponentsComponentListValue,
  menuitem:                 $npm$styledComponents$StyledComponentsComponentListValue,
  meta:                     $npm$styledComponents$StyledComponentsComponentListValue,
  meter:                    $npm$styledComponents$StyledComponentsComponentListValue,
  nav:                      $npm$styledComponents$StyledComponentsComponentListValue,
  noscript:                 $npm$styledComponents$StyledComponentsComponentListValue,
  object:                   $npm$styledComponents$StyledComponentsComponentListValue,
  ol:                       $npm$styledComponents$StyledComponentsComponentListValue,
  optgroup:                 $npm$styledComponents$StyledComponentsComponentListValue,
  option:                   $npm$styledComponents$StyledComponentsComponentListValue,
  output:                   $npm$styledComponents$StyledComponentsComponentListValue,
  p:                        $npm$styledComponents$StyledComponentsComponentListValue,
  param:                    $npm$styledComponents$StyledComponentsComponentListValue,
  picture:                  $npm$styledComponents$StyledComponentsComponentListValue,
  pre:                      $npm$styledComponents$StyledComponentsComponentListValue,
  progress:                 $npm$styledComponents$StyledComponentsComponentListValue,
  q:                        $npm$styledComponents$StyledComponentsComponentListValue,
  rp:                       $npm$styledComponents$StyledComponentsComponentListValue,
  rt:                       $npm$styledComponents$StyledComponentsComponentListValue,
  ruby:                     $npm$styledComponents$StyledComponentsComponentListValue,
  s:                        $npm$styledComponents$StyledComponentsComponentListValue,
  samp:                     $npm$styledComponents$StyledComponentsComponentListValue,
  script:                   $npm$styledComponents$StyledComponentsComponentListValue,
  section:                  $npm$styledComponents$StyledComponentsComponentListValue,
  select:                   $npm$styledComponents$StyledComponentsComponentListValue,
  small:                    $npm$styledComponents$StyledComponentsComponentListValue,
  source:                   $npm$styledComponents$StyledComponentsComponentListValue,
  span:                     $npm$styledComponents$StyledComponentsComponentListValue,
  strong:                   $npm$styledComponents$StyledComponentsComponentListValue,
  style:                    $npm$styledComponents$StyledComponentsComponentListValue,
  sub:                      $npm$styledComponents$StyledComponentsComponentListValue,
  summary:                  $npm$styledComponents$StyledComponentsComponentListValue,
  sup:                      $npm$styledComponents$StyledComponentsComponentListValue,
  table:                    $npm$styledComponents$StyledComponentsComponentListValue,
  tbody:                    $npm$styledComponents$StyledComponentsComponentListValue,
  td:                       $npm$styledComponents$StyledComponentsComponentListValue,
  textarea:                 $npm$styledComponents$StyledComponentsComponentListValue,
  tfoot:                    $npm$styledComponents$StyledComponentsComponentListValue,
  th:                       $npm$styledComponents$StyledComponentsComponentListValue,
  thead:                    $npm$styledComponents$StyledComponentsComponentListValue,
  time:                     $npm$styledComponents$StyledComponentsComponentListValue,
  title:                    $npm$styledComponents$StyledComponentsComponentListValue,
  tr:                       $npm$styledComponents$StyledComponentsComponentListValue,
  track:                    $npm$styledComponents$StyledComponentsComponentListValue,
  u:                        $npm$styledComponents$StyledComponentsComponentListValue,
  ul:                       $npm$styledComponents$StyledComponentsComponentListValue,
  var:                      $npm$styledComponents$StyledComponentsComponentListValue,
  video:                    $npm$styledComponents$StyledComponentsComponentListValue,
  wbr:                      $npm$styledComponents$StyledComponentsComponentListValue,

  // SVG
  circle:                   $npm$styledComponents$StyledComponentsComponentListValue,
  clipPath:                 $npm$styledComponents$StyledComponentsComponentListValue,
  defs:                     $npm$styledComponents$StyledComponentsComponentListValue,
  ellipse:                  $npm$styledComponents$StyledComponentsComponentListValue,
  g:                        $npm$styledComponents$StyledComponentsComponentListValue,
  image:                    $npm$styledComponents$StyledComponentsComponentListValue,
  line:                     $npm$styledComponents$StyledComponentsComponentListValue,
  linearGradient:           $npm$styledComponents$StyledComponentsComponentListValue,
  mask:                     $npm$styledComponents$StyledComponentsComponentListValue,
  path:                     $npm$styledComponents$StyledComponentsComponentListValue,
  pattern:                  $npm$styledComponents$StyledComponentsComponentListValue,
  polygon:                  $npm$styledComponents$StyledComponentsComponentListValue,
  polyline:                 $npm$styledComponents$StyledComponentsComponentListValue,
  radialGradient:           $npm$styledComponents$StyledComponentsComponentListValue,
  rect:                     $npm$styledComponents$StyledComponentsComponentListValue,
  stop:                     $npm$styledComponents$StyledComponentsComponentListValue,
  svg:                      $npm$styledComponents$StyledComponentsComponentListValue,
  text:                     $npm$styledComponents$StyledComponentsComponentListValue,
  tspan:                    $npm$styledComponents$StyledComponentsComponentListValue,
|}

declare module 'styled-components' {
  declare type Interpolation                                    = $npm$styledComponents$Interpolation;
  declare type NameGenerator                                    = $npm$styledComponents$NameGenerator;
  declare type Theme                                            = $npm$styledComponents$Theme;
  declare type ThemeProviderProps                               = $npm$styledComponents$ThemeProviderProps;
  declare type TaggedTemplateLiteral<R>                         = $npm$styledComponents$TaggedTemplateLiteral<R>;

  declare type ReactComponentFunctional<Props: {}>              = $npm$styledComponents$ReactComponentFunctional<Props>;
  declare type ReactComponentClass<Props, DefaultProps = *>     = $npm$styledComponents$ReactComponentClass<Props, DefaultProps>;
  declare type ReactComponentUnion<Props>                       = $npm$styledComponents$ReactComponentUnion<Props>;
  declare type ReactComponentIntersection<Props>                = $npm$styledComponents$ReactComponentIntersection<Props>;
  declare type ReactComponentStyledStaticProps<Props>           = $npm$styledComponents$ReactComponentStyledStaticProps<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsComponentList<*>>>>;
  declare type ReactComponentStyled<Props>                      = $npm$styledComponents$ReactComponentStyled<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsComponentList<*>>>>;
  declare type ReactComponentStyledTaggedTemplateLiteral<Props> = $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsComponentList<*>>>>;

  declare module.exports: {
    <Props>(ReactComponentUnion<Props>): ReactComponentStyledTaggedTemplateLiteral<Props>,

    injectGlobal: TaggedTemplateLiteral<void>,
    css: TaggedTemplateLiteral<Array<Interpolation>>,
    keyframes: TaggedTemplateLiteral<string>,
    withTheme: $npm$styledComponents$WithTheme,
    ServerStyleSheet: typeof Npm$StyledComponents$ServerStyleSheet,
    StyleSheetManager: typeof Npm$StyledComponents$StyleSheetManager,
    ThemeProvider: typeof Npm$StyledComponents$ThemeProvider,

    ...$npm$styledComponents$StyledComponentsComponentList,
  };
}

type $npm$styledComponents$StyledComponentsNativeComponentListKeys =
  $Subtype<$Keys<$npm$styledComponents$StyledComponentsNativeComponentList>>

type $npm$styledComponents$StyledComponentsNativeComponentListValue =
  $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<{}, $npm$styledComponents$StyledComponentsNativeComponentListKeys>

type $npm$styledComponents$StyledComponentsNativeComponentList = {|
  ActivityIndicator:            $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ActivityIndicatorIOS:         $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ART:                          $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Button:                       $npm$styledComponents$StyledComponentsNativeComponentListValue,
  DatePickerIOS:                $npm$styledComponents$StyledComponentsNativeComponentListValue,
  DrawerLayoutAndroid:          $npm$styledComponents$StyledComponentsNativeComponentListValue,
  FlatList:                     $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Image:                        $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ImageEditor:                  $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ImageStore:                   $npm$styledComponents$StyledComponentsNativeComponentListValue,
  KeyboardAvoidingView:         $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ListView:                     $npm$styledComponents$StyledComponentsNativeComponentListValue,
  MapView:                      $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Modal:                        $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Navigator:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  NavigatorIOS:                 $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Picker:                       $npm$styledComponents$StyledComponentsNativeComponentListValue,
  PickerIOS:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ProgressBarAndroid:           $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ProgressViewIOS:              $npm$styledComponents$StyledComponentsNativeComponentListValue,
  RecyclerViewBackedScrollView: $npm$styledComponents$StyledComponentsNativeComponentListValue,
  RefreshControl:               $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ScrollView:                   $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SectionList:                  $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SegmentedControlIOS:          $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Slider:                       $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SliderIOS:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SnapshotViewIOS:              $npm$styledComponents$StyledComponentsNativeComponentListValue,
  StatusBar:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SwipeableListView:            $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Switch:                       $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SwitchAndroid:                $npm$styledComponents$StyledComponentsNativeComponentListValue,
  SwitchIOS:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TabBarIOS:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Text:                         $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TextInput:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ToastAndroid:                 $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ToolbarAndroid:               $npm$styledComponents$StyledComponentsNativeComponentListValue,
  Touchable:                    $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TouchableHighlight:           $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TouchableNativeFeedback:      $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TouchableOpacity:             $npm$styledComponents$StyledComponentsNativeComponentListValue,
  TouchableWithoutFeedback:     $npm$styledComponents$StyledComponentsNativeComponentListValue,
  View:                         $npm$styledComponents$StyledComponentsNativeComponentListValue,
  ViewPagerAndroid:             $npm$styledComponents$StyledComponentsNativeComponentListValue,
  VirtualizedList:              $npm$styledComponents$StyledComponentsNativeComponentListValue,
  WebView:                      $npm$styledComponents$StyledComponentsNativeComponentListValue,
|}

declare module 'styled-components/native' {
  declare type Interpolation                                    = $npm$styledComponents$Interpolation;
  declare type NameGenerator                                    = $npm$styledComponents$NameGenerator;
  declare type Theme                                            = $npm$styledComponents$Theme;
  declare type ThemeProviderProps                               = $npm$styledComponents$ThemeProviderProps;
  declare type TaggedTemplateLiteral<R>                         = $npm$styledComponents$TaggedTemplateLiteral<R>;

  declare type ReactComponentFunctional<Props: {}>              = $npm$styledComponents$ReactComponentFunctional<Props>;
  declare type ReactComponentClass<Props, DefaultProps = *>     = $npm$styledComponents$ReactComponentClass<Props, DefaultProps>;
  declare type ReactComponentUnion<Props>                       = $npm$styledComponents$ReactComponentUnion<Props>;
  declare type ReactComponentIntersection<Props>                = $npm$styledComponents$ReactComponentIntersection<Props>;
  declare type ReactComponentStyledStaticProps<Props>           = $npm$styledComponents$ReactComponentStyledStaticProps<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsNativeComponentList<*>>>>;
  declare type ReactComponentStyled<Props>                      = $npm$styledComponents$ReactComponentStyled<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsNativeComponentList<*>>>>;
  declare type ReactComponentStyledTaggedTemplateLiteral<Props> = $npm$styledComponents$ReactComponentStyledTaggedTemplateLiteral<Props, $Subtype<$Keys<$npm$styledComponents$StyledComponentsNativeComponentList<*>>>>;

  declare module.exports: {
    <Props>(ReactComponentUnion<Props>): ReactComponentStyledTaggedTemplateLiteral<Props>,

    css: TaggedTemplateLiteral<Array<Interpolation>>,
    keyframes: TaggedTemplateLiteral<string>,
    withTheme: $npm$styledComponents$WithTheme,
    ThemeProvider: typeof Npm$StyledComponents$ThemeProvider,

    ...$npm$styledComponents$StyledComponentsNativeComponentList,
  };
}
