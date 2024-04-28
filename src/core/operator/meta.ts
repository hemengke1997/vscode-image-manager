import { flatten } from '@minko-fe/lodash-pro'
import {
  type BuiltinsWithOptionalParams,
  type BuiltinsWithRequiredParams,
  type DefaultPlugins,
} from 'svgo/plugins/plugins-types'

export const COMPRESSED_META = 'compressed'

export const svgoDefaultPlugins: Array<keyof DefaultPlugins> = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeEditorsNSData',
  'cleanupAttrs',
  // 'mergeStyles',
  'inlineStyles',
  'minifyStyles',
  'cleanupIds',
  'removeUselessDefs',
  'cleanupNumericValues',
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'removeViewBox',
  'cleanupEnableBackground',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  // 'convertEllipseToCircle',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'removeUnusedNS',
  'sortAttrs',
  // 'sortDefsChildren',
  'removeTitle',
  'removeDesc',
]

export const svgoBuiltinsWithOptionalParamsPlugins: Array<keyof BuiltinsWithOptionalParams> = [
  'removeXMLNS',
  'convertStyleToAttrs',
  'prefixIds',
  'removeRasterImages',
  'cleanupListOfValues',
  'removeDimensions',
  'removeStyleElement',
  'removeScriptElement',
  'removeOffCanvasPaths',
  'reusePaths',
]

export const svgoBuiltinsWithRequiredParamsPlugins: Array<keyof BuiltinsWithRequiredParams> = [
  'removeAttrs',
  'removeAttributesBySelector',
  'removeElementsByAttr',
  'addClassesToSVGElement',
  'addAttributesToSVGElement',
]

export const svgoPlugins = flatten([
  svgoDefaultPlugins,
  svgoBuiltinsWithOptionalParamsPlugins,
  svgoBuiltinsWithRequiredParamsPlugins,
])

export type SvgoPlugin = {
  [key in (typeof svgoPlugins)[number]]?: boolean
}
