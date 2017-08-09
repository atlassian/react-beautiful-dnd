// flow-typed signature: 4ac48f4fd64107e73b1a6d72c0909364
// flow-typed version: e1e459c0cd/styled-components_v2.x.x/flow_>=v0.34.x

// @flow

type $npm$styledComponents$Interpolation = ((executionContext: Object) => string) | string | number;
type $npm$styledComponents$NameGenerator = (hash: number) => string;

type $npm$styledComponents$ReactComponentClass<P> = Class<React$Component<*, P, *>>
type $npm$styledComponents$FunctionalReactComponent<P: {}> = P => React$Element<*>

type $npm$styledComponents$TaggedTemplateLiteral<R> = {
  (Array<string>, $npm$styledComponents$Interpolation): R,
  attrs: <O: {}, P>(O) => $npm$styledComponents$TaggedTemplateLiteral<
    & $npm$styledComponents$ReactComponentClass<P>
    & $npm$styledComponents$FunctionalReactComponent<P>
    >
}

type $npm$styledComponents$ReactComponentConstructorUnion<P> =
  | $npm$styledComponents$ReactComponentClass<P>
  | $npm$styledComponents$FunctionalReactComponent<P>;

type $npm$styledComponents$ReactComponentConstructorIntersection<P> =
  & $npm$styledComponents$ReactComponentClass<P>
  & $npm$styledComponents$FunctionalReactComponent<P>

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

declare module 'styled-components' {
  declare type Interpolation = $npm$styledComponents$Interpolation;
  declare type NameGenerator = $npm$styledComponents$NameGenerator;
  declare type TaggedTemplateLiteral<R> = $npm$styledComponents$TaggedTemplateLiteral<R>;
  declare type StyledComponent<Component: $npm$styledComponents$ReactComponentConstructorUnion<*>> = TaggedTemplateLiteral<Component>;
  declare type BaseStyledComponent = StyledComponent<$npm$styledComponents$ReactComponentConstructorIntersection<*>>;
  declare type Theme = $npm$styledComponents$Theme;
  declare type ThemeProviderProps = $npm$styledComponents$ThemeProviderProps;

  declare module.exports: {
      injectGlobal: TaggedTemplateLiteral<void>,
      css: TaggedTemplateLiteral<Array<Interpolation>>,
      keyframes: TaggedTemplateLiteral<string>,
      withTheme: <P, U: $npm$styledComponents$ReactComponentConstructorUnion<P>>(U) => $npm$styledComponents$ReactComponentConstructorIntersection<P & { theme: Theme }>,
      ServerStyleSheet: typeof Npm$StyledComponents$ServerStyleSheet,
      StyleSheetManager: typeof Npm$StyledComponents$StyleSheetManager,
      ThemeProvider: typeof Npm$StyledComponents$ThemeProvider,

      <P, C: $npm$styledComponents$ReactComponentConstructorUnion<P>>(C): TaggedTemplateLiteral<C>,

      a:                        BaseStyledComponent,
      abbr:                     BaseStyledComponent,
      address:                  BaseStyledComponent,
      area:                     BaseStyledComponent,
      article:                  BaseStyledComponent,
      aside:                    BaseStyledComponent,
      audio:                    BaseStyledComponent,
      b:                        BaseStyledComponent,
      base:                     BaseStyledComponent,
      bdi:                      BaseStyledComponent,
      bdo:                      BaseStyledComponent,
      big:                      BaseStyledComponent,
      blockquote:               BaseStyledComponent,
      body:                     BaseStyledComponent,
      br:                       BaseStyledComponent,
      button:                   BaseStyledComponent,
      canvas:                   BaseStyledComponent,
      caption:                  BaseStyledComponent,
      cite:                     BaseStyledComponent,
      code:                     BaseStyledComponent,
      col:                      BaseStyledComponent,
      colgroup:                 BaseStyledComponent,
      data:                     BaseStyledComponent,
      datalist:                 BaseStyledComponent,
      dd:                       BaseStyledComponent,
      del:                      BaseStyledComponent,
      details:                  BaseStyledComponent,
      dfn:                      BaseStyledComponent,
      dialog:                   BaseStyledComponent,
      div:                      BaseStyledComponent,
      dl:                       BaseStyledComponent,
      dt:                       BaseStyledComponent,
      em:                       BaseStyledComponent,
      embed:                    BaseStyledComponent,
      fieldset:                 BaseStyledComponent,
      figcaption:               BaseStyledComponent,
      figure:                   BaseStyledComponent,
      footer:                   BaseStyledComponent,
      form:                     BaseStyledComponent,
      h1:                       BaseStyledComponent,
      h2:                       BaseStyledComponent,
      h3:                       BaseStyledComponent,
      h4:                       BaseStyledComponent,
      h5:                       BaseStyledComponent,
      h6:                       BaseStyledComponent,
      head:                     BaseStyledComponent,
      header:                   BaseStyledComponent,
      hgroup:                   BaseStyledComponent,
      hr:                       BaseStyledComponent,
      html:                     BaseStyledComponent,
      i:                        BaseStyledComponent,
      iframe:                   BaseStyledComponent,
      img:                      BaseStyledComponent,
      input:                    BaseStyledComponent,
      ins:                      BaseStyledComponent,
      kbd:                      BaseStyledComponent,
      keygen:                   BaseStyledComponent,
      label:                    BaseStyledComponent,
      legend:                   BaseStyledComponent,
      li:                       BaseStyledComponent,
      link:                     BaseStyledComponent,
      main:                     BaseStyledComponent,
      map:                      BaseStyledComponent,
      mark:                     BaseStyledComponent,
      menu:                     BaseStyledComponent,
      menuitem:                 BaseStyledComponent,
      meta:                     BaseStyledComponent,
      meter:                    BaseStyledComponent,
      nav:                      BaseStyledComponent,
      noscript:                 BaseStyledComponent,
      object:                   BaseStyledComponent,
      ol:                       BaseStyledComponent,
      optgroup:                 BaseStyledComponent,
      option:                   BaseStyledComponent,
      output:                   BaseStyledComponent,
      p:                        BaseStyledComponent,
      param:                    BaseStyledComponent,
      picture:                  BaseStyledComponent,
      pre:                      BaseStyledComponent,
      progress:                 BaseStyledComponent,
      q:                        BaseStyledComponent,
      rp:                       BaseStyledComponent,
      rt:                       BaseStyledComponent,
      ruby:                     BaseStyledComponent,
      s:                        BaseStyledComponent,
      samp:                     BaseStyledComponent,
      script:                   BaseStyledComponent,
      section:                  BaseStyledComponent,
      select:                   BaseStyledComponent,
      small:                    BaseStyledComponent,
      source:                   BaseStyledComponent,
      span:                     BaseStyledComponent,
      strong:                   BaseStyledComponent,
      style:                    BaseStyledComponent,
      sub:                      BaseStyledComponent,
      summary:                  BaseStyledComponent,
      sup:                      BaseStyledComponent,
      table:                    BaseStyledComponent,
      tbody:                    BaseStyledComponent,
      td:                       BaseStyledComponent,
      textarea:                 BaseStyledComponent,
      tfoot:                    BaseStyledComponent,
      th:                       BaseStyledComponent,
      thead:                    BaseStyledComponent,
      time:                     BaseStyledComponent,
      title:                    BaseStyledComponent,
      tr:                       BaseStyledComponent,
      track:                    BaseStyledComponent,
      u:                        BaseStyledComponent,
      ul:                       BaseStyledComponent,
      var:                      BaseStyledComponent,
      video:                    BaseStyledComponent,
      wbr:                      BaseStyledComponent,

      // SVG
      circle:                   BaseStyledComponent,
      clipPath:                 BaseStyledComponent,
      defs:                     BaseStyledComponent,
      ellipse:                  BaseStyledComponent,
      g:                        BaseStyledComponent,
      image:                    BaseStyledComponent,
      line:                     BaseStyledComponent,
      linearGradient:           BaseStyledComponent,
      mask:                     BaseStyledComponent,
      path:                     BaseStyledComponent,
      pattern:                  BaseStyledComponent,
      polygon:                  BaseStyledComponent,
      polyline:                 BaseStyledComponent,
      radialGradient:           BaseStyledComponent,
      rect:                     BaseStyledComponent,
      stop:                     BaseStyledComponent,
      svg:                      BaseStyledComponent,
      text:                     BaseStyledComponent,
      tspan:                    BaseStyledComponent,
  };
}

declare module 'styled-components/native' {
  declare type Interpolation = $npm$styledComponents$Interpolation;
  declare type NameGenerator = $npm$styledComponents$NameGenerator;
  declare type TaggedTemplateLiteral<R> = $npm$styledComponents$TaggedTemplateLiteral<R>;
  declare type StyledComponent<Component: $npm$styledComponents$ReactComponentConstructorUnion<*>> = TaggedTemplateLiteral<Component>;
  declare type BaseStyledComponent = StyledComponent<$npm$styledComponents$ReactComponentConstructorIntersection<*>>;
  declare type Theme = $npm$styledComponents$Theme;
  declare type ThemeProviderProps = $npm$styledComponents$ThemeProviderProps;

  declare module.exports: {
    css: TaggedTemplateLiteral<Array<Interpolation>>,
    keyframes: TaggedTemplateLiteral<string>,
    withTheme: <P, U: $npm$styledComponents$ReactComponentConstructorUnion<P>>(U) => $npm$styledComponents$ReactComponentConstructorIntersection<P & { theme: Theme }>,
    ThemeProvider: typeof Npm$StyledComponents$ThemeProvider,

    <P, C: $npm$styledComponents$ReactComponentConstructorUnion<P>>(C): TaggedTemplateLiteral<C>,

    ActivityIndicator:            BaseStyledComponent,
    ActivityIndicatorIOS:         BaseStyledComponent,
    ART:                          BaseStyledComponent,
    Button:                       BaseStyledComponent,
    DatePickerIOS:                BaseStyledComponent,
    DrawerLayoutAndroid:          BaseStyledComponent,
    FlatList:                     BaseStyledComponent,
    Image:                        BaseStyledComponent,
    ImageEditor:                  BaseStyledComponent,
    ImageStore:                   BaseStyledComponent,
    KeyboardAvoidingView:         BaseStyledComponent,
    ListView:                     BaseStyledComponent,
    MapView:                      BaseStyledComponent,
    Modal:                        BaseStyledComponent,
    Navigator:                    BaseStyledComponent,
    NavigatorIOS:                 BaseStyledComponent,
    Picker:                       BaseStyledComponent,
    PickerIOS:                    BaseStyledComponent,
    ProgressBarAndroid:           BaseStyledComponent,
    ProgressViewIOS:              BaseStyledComponent,
    RecyclerViewBackedScrollView: BaseStyledComponent,
    RefreshControl:               BaseStyledComponent,
    ScrollView:                   BaseStyledComponent,
    SectionList:                  BaseStyledComponent,
    SegmentedControlIOS:          BaseStyledComponent,
    Slider:                       BaseStyledComponent,
    SliderIOS:                    BaseStyledComponent,
    SnapshotViewIOS:              BaseStyledComponent,
    StatusBar:                    BaseStyledComponent,
    SwipeableListView:            BaseStyledComponent,
    Switch:                       BaseStyledComponent,
    SwitchAndroid:                BaseStyledComponent,
    SwitchIOS:                    BaseStyledComponent,
    TabBarIOS:                    BaseStyledComponent,
    Text:                         BaseStyledComponent,
    TextInput:                    BaseStyledComponent,
    ToastAndroid:                 BaseStyledComponent,
    ToolbarAndroid:               BaseStyledComponent,
    Touchable:                    BaseStyledComponent,
    TouchableHighlight:           BaseStyledComponent,
    TouchableNativeFeedback:      BaseStyledComponent,
    TouchableOpacity:             BaseStyledComponent,
    TouchableWithoutFeedback:     BaseStyledComponent,
    View:                         BaseStyledComponent,
    ViewPagerAndroid:             BaseStyledComponent,
    VirtualizedList:              BaseStyledComponent,
    WebView:                      BaseStyledComponent,
  };
}
