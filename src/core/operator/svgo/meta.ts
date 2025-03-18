import { flatten } from 'es-toolkit'
import {
  type BuiltinsWithOptionalParams,
  type BuiltinsWithRequiredParams,
  type DefaultPlugins,
} from 'svgo/plugins/plugins-types'

export const svgoDefaultPlugins: Array<keyof DefaultPlugins> = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeEditorsNSData',
  'cleanupAttrs',
  'mergeStyles',
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
  'convertEllipseToCircle',
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
  'sortDefsChildren',
  'removeTitle',
  'removeDesc',
]

const _svgoBuiltinsWithOptionalParamsPlugins: Array<keyof BuiltinsWithOptionalParams> = [
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

const _svgoBuiltinsWithRequiredParamsPlugins: Array<keyof BuiltinsWithRequiredParams> = [
  'removeAttrs',
  'removeAttributesBySelector',
  'removeElementsByAttr',
  'addClassesToSVGElement',
  'addAttributesToSVGElement',
]

export const svgoPlugins = flatten([
  svgoDefaultPlugins,
  // _svgoBuiltinsWithOptionalParamsPlugins,
  // _svgoBuiltinsWithRequiredParamsPlugins,
])

export type SvgoPlugin = {
  [key in (typeof svgoPlugins)[number]]?: boolean
}
