import { describe, expect, it } from 'vitest'
import { type ImageType } from '~/webview/ImageManager'
import { filterImages } from '~/webview/ImageManager/utils'
import { DirTree, type TreeParams } from '~/webview/ImageManager/utils/DirTree'

function displayMapFixture(visibleListFixture: ImageType[]) {
  return {
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
}

function generateTree(
  displayGroup: string[],
  options: {
    compact?: boolean
    isWindows?: boolean
  } = {
    compact: false,
    isWindows: false,
  },
) {
  function generatePath(p: string) {
    const prefix = options.isWindows ? 'c:' : ''
    return `${prefix}${p}`
  }

  const visibleListFixture = [
    {
      name: 'root.svg',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/root.svg'),
      dirPath: '',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      fileType: 'svg',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      basePath: generatePath('/Users/path/to/project/vscode-image-manager-debug'),
    },
    {
      name: 'blender.png',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/webview/blender.png'),
      dirPath: 'webview',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/webview'),
      fileType: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      basePath: generatePath('/Users/path/to/project/vscode-image-manager-debug'),
    },
    {
      name: 'blender.png',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images/blender.png'),
      dirPath: generatePath('ui-framework/src/images'),
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images'),
      fileType: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      basePath: generatePath('/Users/path/to/project/vscode-image-manager-debug'),
    },
    {
      name: 'd3.png',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/d3.png'),
      dirPath: '',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      fileType: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      basePath: generatePath('/Users/path/to/project/vscode-image-manager-debug'),
    },
    {
      name: 'd3.png',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview/d3.png'),
      dirPath: 'ui-framework/webview',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview'),
      fileType: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      basePath: generatePath('/Users/path/to/project/vscode-image-manager-debug'),
    },
  ] as ImageType[]

  const tree = new DirTree({
    visibleList: visibleListFixture,
    displayMap: displayMapFixture(visibleListFixture),
    displayGroup,
  } as TreeParams)

  const renderedTree = tree.buildRenderTree()

  if (options.compact) {
    tree.compactFolders(renderedTree)
  }

  return renderedTree
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

describe('Convert direcotry to tree on Unix', () => {
  it('1. should render correctly with Group_by_dir + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('2. should render correctly with Group_by_dir + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('3. should render correctly with Group_by_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('4. should render correctly with Group_by_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('5. should render correctly with Group_by_dir_and_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('6. should render correctly with Group_by_dir_and_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('7. should render correctly with Group_by_none + Nested', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('8. should render correctly with Group_by_none + Compact', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })
})

describe('Convert direcotry to tree on Windows', () => {
  it('1. should render correctly with Group_by_dir + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('2. should render correctly with Group_by_dir + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('3. should render correctly with Group_by_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('4. should render correctly with Group_by_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'type'],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('5. should render correctly with Group_by_dir_and_type + Nested', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('6. should render correctly with Group_by_dir_and_type + Compact', () => {
    const fixture = {
      displayGroup: ['workspace', 'dir', 'type'],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('7. should render correctly with Group_by_none + Nested', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('8. should render correctly with Group_by_none + Compact', () => {
    const fixture = {
      displayGroup: ['workspace'],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })
})
