import { describe, expect, it } from 'vitest'
import { DisplayGroupType } from '~/core/persist/workspace/common'
import { uniqSortByThenMap } from '~/webview/image-manager/utils'
import { DirTree, type TreeParams } from '~/webview/image-manager/utils/dir-tree'

function displayMapFixture(visibleListFixture: ImageType[]) {
  return {
    [DisplayGroupType.workspace]: {
      imageKey: 'absWorkspaceFolder',
      list: uniqSortByThenMap(visibleListFixture, 'absWorkspaceFolder', (image) => ({
        label: image.workspaceFolder,
        value: image.absWorkspaceFolder,
      })),
      priority: 1,
    },
    [DisplayGroupType.dir]: {
      imageKey: 'absDirPath',
      list: uniqSortByThenMap(visibleListFixture, 'absDirPath', (image) => ({
        label: image.dirPath,
        value: image.absDirPath,
      })),
      priority: 2,
    },
    [DisplayGroupType.extname]: {
      imageKey: 'extname',
      list: uniqSortByThenMap(visibleListFixture, 'extname', (image) => ({
        label: image.extname,
        value: image.extname,
      })),
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

  const visibleListFixture: ImageType[] = [
    {
      basename: 'root.svg',
      name: 'root',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/root.svg'),
      dirPath: '',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      extname: 'svg',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
    },
    {
      basename: 'blender.png',
      name: 'blender',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/webview/blender.png'),
      dirPath: 'webview',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/webview'),
      extname: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
    },
    {
      basename: 'blender.png',
      name: 'blender',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images/blender.png'),
      dirPath: generatePath('ui-framework/src/images'),
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/src/images'),
      extname: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
    },
    {
      basename: 'd3.png',
      name: 'd3',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/d3.png'),
      dirPath: '',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
      extname: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
    },
    {
      basename: 'd3.png',
      name: 'd3',
      path: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview/d3.png'),
      dirPath: 'ui-framework/webview',
      absDirPath: generatePath('/Users/path/to/project/vscode-image-manager-debug/src/ui-framework/webview'),
      extname: 'png',
      workspaceFolder: 'src',
      absWorkspaceFolder: generatePath('/Users/path/to/project/vscode-image-manager-debug/src'),
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
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir],
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
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.extname],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('4. should render correctly with Group_by_type + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.extname],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('5. should render correctly with Group_by_dir_and_type + Nested', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir, DisplayGroupType.extname],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('6. should render correctly with Group_by_dir_and_type + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir, DisplayGroupType.extname],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('7. should render correctly with Group_by_none + Nested', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('8. should render correctly with Group_by_none + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace],
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
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('2. should render correctly with Group_by_dir + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('3. should render correctly with Group_by_type + Nested', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.extname],
    }

    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('4. should render correctly with Group_by_type + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.extname],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('5. should render correctly with Group_by_dir_and_type + Nested', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir, DisplayGroupType.extname],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('6. should render correctly with Group_by_dir_and_type + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace, DisplayGroupType.dir, DisplayGroupType.extname],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('7. should render correctly with Group_by_none + Nested', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: false,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })

  it('8. should render correctly with Group_by_none + Compact', () => {
    const fixture = {
      displayGroup: [DisplayGroupType.workspace],
    }
    const renderedTree = generateTree(fixture.displayGroup, {
      compact: true,
      isWindows: true,
    })

    expect(renderedTree).toMatchSnapshot()
  })
})
