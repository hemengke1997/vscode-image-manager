import { describe, expect, it } from 'vitest'
import { type ImageType } from '@/webview/ImageManager'
import { filterImages } from '@/webview/ImageManager/utils'
import { DirTree, type TreeParams } from '@/webview/ImageManager/utils/DirTree'

const visibleListFixture = [
  {
    name: 'blender.png',
    path: '/Users/path/to/project/vscode-image-manager-debug/src/webview/blender.png',
    dirPath: 'webview',
    absDirPath: '/Users/path/to/project/vscode-image-manager-debug/src/webview',
    fileType: 'png',
    workspaceFolder: 'src',
    absWorkspaceFolder: '/Users/path/to/project/vscode-image-manager-debug/src',
    basePath: '/Users/path/to/project/vscode-image-manager-debug',
  },
  {
    name: 'blender.png',
    path: '/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images/blender.png',
    dirPath: 'ui-framework/src/images',
    absDirPath: '/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images',
    fileType: 'png',
    workspaceFolder: 'src',
    absWorkspaceFolder: '/Users/path/to/project/vscode-image-manager-debug/src',
    basePath: '/Users/path/to/project/vscode-image-manager-debug',
  },
  {
    name: 'd3.png',
    path: '/Users/path/to/project/vscode-image-manager-debug/src/d3.png',
    dirPath: '',
    absDirPath: '/Users/path/to/project/vscode-image-manager-debug/src',
    fileType: 'png',
    workspaceFolder: 'src',
    absWorkspaceFolder: '/Users/path/to/project/vscode-image-manager-debug/src',
    basePath: '/Users/path/to/project/vscode-image-manager-debug',
  },
  {
    name: 'd3.png',
    path: '/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview/d3.png',
    dirPath: 'ui-framework/webview',
    absDirPath: '/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview',
    fileType: 'png',
    workspaceFolder: 'src',
    absWorkspaceFolder: '/Users/path/to/project/vscode-image-manager-debug/src',
    basePath: '/Users/path/to/project/vscode-image-manager-debug',
  },
] as ImageType[]

const displayMapFixture = {
  workspace: {
    imageKey: {
      id: 'absWorkspaceFolder',
    },
    list: filterImages(
      visibleListFixture,
      (image) => ({
        label: image.workspaceFolder,
        value: image.absWorkspaceFolder,
      }),
      'value',
    ),
    priority: 1,
  },
  dir: {
    imageKey: {
      id: 'absDirPath',
    },
    list: filterImages(
      visibleListFixture,
      (image) => ({
        label: image.dirPath,
        value: image.absDirPath,
      }),
      'value',
    ),
    priority: 2,
  },
  type: {
    imageKey: {
      id: 'fileType',
    },
    list: filterImages(
      visibleListFixture,
      (image) => ({
        label: image.fileType,
        value: image.fileType,
      }),
      'value',
    ),
    priority: 3,
  },
  all: {
    contextMenu: true,
    priority: null,
  },
}

/**
 * Test render tree
 * There are a variety of rendering scenarios consisting of groupings and dir display options
 *
 * 1. group by dir + nested
 * 2. group by dir + compact
 * 3. group by type + nested
 * 4. group by type + compact
 * 5. group by both dir and type + nested
 * 6. group by both dir and type + compact
 * 7. group by none + nested
 * 8. group by none + compact
 */

describe('Convert direcotry to tree', () => {
  it('1. should render correctly with Group_by_dir + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    expect(renderedTree).toMatchSnapshot()
  })

  it('2. should render correctly with Group_by_dir + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    tree.compactFolders(renderedTree)

    expect(renderedTree).toMatchSnapshot()
  })

  it('3. should render correctly with Group_by_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    expect(renderedTree).toMatchSnapshot()
  })

  it('4. should render correctly with Group_by_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    tree.compactFolders(renderedTree)

    expect(renderedTree).toMatchSnapshot()
  })

  it('5. should render correctly with Group_by_dir_and_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    expect(renderedTree).toMatchSnapshot()
  })

  it('6. should render correctly with Group_by_dir_and_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    tree.compactFolders(renderedTree)

    expect(renderedTree).toMatchSnapshot()
  })

  it('7. should render correctly with Group_by_none + Nested', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    expect(renderedTree).toMatchSnapshot()
  })

  it('8. should render correctly with Group_by_none + Compact', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }
    const tree = new DirTree({
      visibleList: visibleListFixture,
      displayMap: displayMapFixture,
      ...fixture,
    } as unknown as TreeParams)

    const renderedTree = tree.buildRenderTree()

    tree.compactFolders(renderedTree)

    expect(renderedTree).toMatchSnapshot()
  })
})
