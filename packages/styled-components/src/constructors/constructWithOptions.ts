import {
  Attrs,
  Interpolation,
  IStyledComponent,
  IStyledComponentFactory,
  RuleSet,
  StyledObject,
  StyledOptions,
  StyledTarget,
  StyleFunction,
} from '../types';
import { EMPTY_OBJECT } from '../utils/empties';
import styledError from '../utils/error';
import css from './css';

interface Styled<
  Target extends StyledTarget,
  Constructor extends IStyledComponentFactory<any>,
  OuterProps = undefined
> {
  (
    initialStyles: TemplateStringsArray | StyledObject | StyleFunction<OuterProps>,
    ...interpolations: Interpolation<OuterProps>[]
  ): IStyledComponent<Target>;
  attrs<Props = OuterProps>(attrs: Attrs<Props>): Styled<Target, Constructor, Props>;
  withConfig(config: StyledOptions): Styled<Target, Constructor, OuterProps>;
}
export interface Construct<
  Target extends StyledTarget,
  Constructor extends IStyledComponentFactory<any> = IStyledComponentFactory<Target>,
  OuterProps = undefined // used for styled<{}>().attrs() so attrs() gets the generic prop context
> {
  (componentConstructor: Constructor, tag: Target, options?: StyledOptions): Styled<
    Target,
    Constructor,
    OuterProps
  >;

  attrs<Props = OuterProps>(attrs: Attrs<Props>): Construct<Target, Constructor, Props>;
  withConfig(config: StyledOptions): Construct<Target, Constructor, OuterProps>;
}

export default function constructWithOptions<
  Target extends StyledTarget,
  Constructor extends IStyledComponentFactory<any> = IStyledComponentFactory<Target>,
  OuterProps = undefined // used for styled<{}>().attrs() so attrs() gets the generic prop context
>(
  componentConstructor: Constructor,
  tag: Target,
  options: StyledOptions = EMPTY_OBJECT as Object
): ReturnType<Construct<Target, Constructor, OuterProps>> {
  // We trust that the tag is a valid component as long as it isn't falsish
  // Typically the tag here is a string or function (i.e. class or pure function component)
  // However a component may also be an object if it uses another utility, e.g. React.memo
  // React will output an appropriate warning however if the `tag` isn't valid
  if (!tag) {
    throw styledError(1, tag);
  }

  /* This is callable directly as a template function */
  const templateFunction = <Props = OuterProps>(
    initialStyles: TemplateStringsArray | StyledObject | StyleFunction<Props>,
    ...interpolations: Interpolation<Props>[]
  ) => componentConstructor(tag, options, css(initialStyles, ...interpolations) as RuleSet);

  /* Modify/inject new props at runtime */
  templateFunction.attrs = <Props = OuterProps>(attrs: Attrs<Props>) =>
    constructWithOptions<Target, Constructor, Props>(componentConstructor, tag, {
      ...options,
      attrs: Array.prototype.concat(options.attrs, attrs).filter(Boolean),
    });

  /**
   * If config methods are called, wrap up a new template function and merge options */
  templateFunction.withConfig = (config: StyledOptions) =>
    constructWithOptions<Target, Constructor, OuterProps>(componentConstructor, tag, {
      ...options,
      ...config,
    });

  return templateFunction;
}
