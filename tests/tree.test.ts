import { flatten } from 'es-toolkit'
import { setAutoFreeze } from 'immer'
import { describe, expect, it } from 'vitest'
import { SortByType, SortType } from '~/core/persist/workspace/common'
import { UpdateEvent, UpdateOrigin } from '~/webview/image-manager/utils/tree/const'
import { TreeStyle } from '~/webview/image-manager/utils/tree/tree'
import { TreeManager, type UpdatePayload } from '~/webview/image-manager/utils/tree/tree-manager'

setAutoFreeze(false)

function mockImages() {
  const images: ImageType[] = [
    {
      basename: 'root.svg',
      name: 'root',
      path: '/Users/path/to/project/root.svg',
      dirPath: '',
      absDirPath: '/Users/path/to/project',
      extname: 'svg',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059200000,
        size: 1024,
      },
    },
    {
      basename: 'c#.png',
      name: 'c#',
      path: '/Users/path/to/project/webview/c#.png',
      dirPath: 'webview',
      absDirPath: '/Users/path/to/project/webview',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059200313,
        size: 12,
      },
    },
    {
      basename: 'app.png',
      name: 'app',
      path: '/Users/path/to/project/webview/app.png',
      dirPath: 'webview',
      absDirPath: '/Users/path/to/project/webview',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059200443,
        size: 15,
      },
    },
    {
      basename: 'blender.png',
      name: 'blender',
      path: '/Users/path/to/project/webview/blender.png',
      dirPath: 'webview',
      absDirPath: '/Users/path/to/project/webview',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059200343,
        size: 20,
      },
    },
    {
      basename: 'blender.png',
      name: 'blender',
      path: '/Users/path/to/project/ui-framework/src/images/blender.png',
      dirPath: 'ui-framework/src/images',
      absDirPath: '/Users/path/to/project/ui-framework/src/images',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059300313,
        size: 52,
      },
    },
    {
      basename: 'd3.png',
      name: 'd3',
      path: '/Users/path/to/project/d3.png',
      dirPath: '',
      absDirPath: '/Users/path/to/project',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1692059200313,
        size: 12311213,
      },
    },
    {
      basename: 'd3.png',
      name: 'd3',
      path: '/Users/path/to/project/ui-framework/webview/d3.png',
      dirPath: 'ui-framework/webview',
      absDirPath: '/Users/path/to/project/ui-framework/webview',
      extname: 'png',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697059500313,
        size: 1442321003,
      },
    },
  ] as ImageType[]

  return images
}

const images = mockImages()

const imageUpdates: UpdatePayload[] = [
  {
    type: UpdateEvent.create,
    payload: {
      path: '/Users/path/to/project/path/to/new.png',
      dirPath: 'path/to',
      name: 'new',
      extname: 'png',
      workspaceFolder: 'project',
      basename: 'new.png',
      stats: {
        mtimeMs: 1697059500313,
        size: 14423210,
      },
    } as ImageType,
  },
  {
    type: UpdateEvent.create,
    payload: {
      basename: 'vite.svg',
      name: 'vite',
      path: '/Users/path/to/project/webview/vite.svg',
      dirPath: 'webview',
      absDirPath: '/Users/path/to/project/webview',
      extname: 'svg',
      workspaceFolder: 'project',
      absWorkspaceFolder: '/Users/path/to/project',
      stats: {
        mtimeMs: 1697055500313,
        size: 521003,
      },
    } as ImageType,
  },
  {
    type: UpdateEvent.create,
    payload: {
      path: '/Users/path/to/project/ui-framework/src/images/new-blender.png',
      dirPath: 'ui-framework/src/images',
      extname: 'png',
      workspaceFolder: 'project',
      basename: 'new-blender.png',
      stats: {
        mtimeMs: 1697052500313,
        size: 134,
      },
    } as ImageType,
  },
  {
    type: UpdateEvent.delete,
    payload: {
      path: '/Users/path/to/project/ui-framework/src/images/blender.png',
      dirPath: 'ui-framework/src/images',
      extname: 'png',
      workspaceFolder: 'project',
      basename: 'blender.png',
      stats: {
        mtimeMs: 1697052500313,
        size: 134,
      },
    } as ImageType,
  },
].map(item => ({
  origin: UpdateOrigin.image,
  data: item,
}))

describe('目录树展示', () => {
  it('按目录分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.dir,
    }).generateTree(images)
    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src
            |-- images
              |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)
  })

  it('按图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.extension,
    }).generateTree(images)
    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- app.png
          |-- blender.png
          |-- blender.png
          |-- c#.png
          |-- d3.png
          |-- d3.png
        |-- svg
          |-- root.svg
      "
    `)
  })

  it('按目录和图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.dir_extension,
    }).generateTree(images)
    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- d3.png
        |-- svg
          |-- root.svg
        |-- ui-framework
          |-- src
            |-- images
              |-- png
                |-- blender.png
          |-- webview
            |-- png
              |-- d3.png
        |-- webview
          |-- png
            |-- app.png
            |-- blender.png
            |-- c#.png
      "
    `)
  })

  it('不分组，平铺展示', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.flat,
    }).generateTree(images)
    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- app.png
        |-- blender.png
        |-- blender.png
        |-- c#.png
        |-- d3.png
        |-- d3.png
        |-- root.svg
      "
    `)
  })
})

describe('增量更新', () => {
  it('按目录分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.dir,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path
          |-- to
            |-- new.png
        |-- ui-framework
          |-- src
            |-- images
              |-- new-blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)

    // 修改目录名称
    treeManager.updateTree([
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            workspaceFolder: 'project',
            dirPath: 'webview',
            absDirPath: '/Users/path/to/project/webview',
          },
          type: UpdateEvent.delete,
        },
      },
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            workspaceFolder: 'project',
            dirPath: 'path/to',
            absDirPath: '/Users/path/to/project/path/to',
          },
          type: UpdateEvent.delete,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src
            |-- images
              |-- new-blender.png
          |-- webview
            |-- d3.png
      "
    `)

    // 更新目录
    treeManager.updateTree([
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            workspaceFolder: 'project',
            dirPath: 'path/to/a',
            absDirPath: '/Users/path/to/project/path/to/a',
          },
          type: UpdateEvent.create,
        },
      },
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            dirPath: 'webview',
            absDirPath: '/Users/path/to/project/webview',
            workspaceFolder: 'project',
          },
          type: UpdateEvent.create,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src
            |-- images
              |-- new-blender.png
          |-- webview
            |-- d3.png
      "
    `)
  })

  it('按图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.extension,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- d3.png
          |-- d3.png
          |-- new-blender.png
          |-- new.png
        |-- svg
          |-- root.svg
          |-- vite.svg
      "
    `)
  })

  it('按目录和图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.dir_extension,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- path
          |-- to
            |-- png
              |-- new.png
        |-- png
          |-- d3.png
        |-- svg
          |-- root.svg
        |-- ui-framework
          |-- src
            |-- images
              |-- png
                |-- new-blender.png
          |-- webview
            |-- png
              |-- d3.png
        |-- webview
          |-- png
            |-- app.png
            |-- blender.png
            |-- c#.png
          |-- svg
            |-- vite.svg
      "
    `)
  })

  it('不分组，平铺展示', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: false,
      treeStyle: TreeStyle.flat,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- app.png
        |-- blender.png
        |-- c#.png
        |-- d3.png
        |-- d3.png
        |-- new-blender.png
        |-- new.png
        |-- root.svg
        |-- vite.svg
      "
    `)
  })
})

describe('compact 紧凑模式', () => {
  it('按目录分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)
  })

  it('按图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.extension,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- app.png
          |-- blender.png
          |-- blender.png
          |-- c#.png
          |-- d3.png
          |-- d3.png
        |-- svg
          |-- root.svg
      "
    `)
  })

  it('按目录和图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir_extension,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- d3.png
        |-- svg
          |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- png
              |-- blender.png
          |-- webview
            |-- png
              |-- d3.png
        |-- webview
          |-- png
            |-- app.png
            |-- blender.png
            |-- c#.png
      "
    `)
  })

  it('不分组，平铺展示', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.flat,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- app.png
        |-- blender.png
        |-- blender.png
        |-- c#.png
        |-- d3.png
        |-- d3.png
        |-- root.svg
      "
    `)
  })
})

describe('compact 紧凑模式 - 增量更新', () => {
  it('按目录分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)

    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- src/images
            |-- new-blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)
  })

  it('紧凑情况下，增删图片，目录紧凑正确', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)

    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- src/images
            |-- new-blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)

    // 创建深层图片
    treeManager.updateTree([
      {
        origin: UpdateOrigin.image,
        data: {
          type: UpdateEvent.create,
          payload: {
            path: '/Users/path/to/project/ui-framework/src/ui-framework/src/images/x/y/z/xxx.png',
            dirPath: 'ui-framework/src/images/x/y/z',
            extname: 'png',
            workspaceFolder: 'project',
            basename: 'xxx.png',
            stats: {
              mtimeMs: 1697052500313,
              size: 134,
            },
          } as ImageType,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- src/images
            |-- new-blender.png
            |-- x/y/z
              |-- xxx.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)

    // 删除图片
    treeManager.updateTree([
      {
        origin: UpdateOrigin.image,
        data: {
          type: UpdateEvent.delete,
          payload: {
            path: '/Users/path/to/project/ui-framework/src/images/new-blender.png',
            dirPath: 'ui-framework/src/images',
            extname: 'png',
            workspaceFolder: 'project',
            basename: 'new-blender.png',
            stats: {
              mtimeMs: 1697052500313,
              size: 134,
            },
          } as ImageType,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- src/images/x/y/z
            |-- xxx.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)

    // 再创建深层图片
    treeManager.updateTree([
      {
        origin: UpdateOrigin.image,
        data: {
          type: UpdateEvent.create,
          payload: {
            path: '/Users/path/to/project/ui-framework/a/b/yyy.png',
            dirPath: 'ui-framework/a/b',
            extname: 'png',
            workspaceFolder: 'project',
            basename: 'yyy.png',
            stats: {
              mtimeMs: 1697052500313,
              size: 134,
            },
          } as ImageType,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- a/b
            |-- yyy.png
          |-- src/images/x/y/z
            |-- xxx.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)

    treeManager.updateTree([
      {
        origin: UpdateOrigin.image,
        data: {
          type: UpdateEvent.create,
          payload: {
            path: '/Users/path/to/project/ui-framework/src/images/x/y/yyy.png',
            dirPath: 'ui-framework/src/images/x/y',
            extname: 'png',
            workspaceFolder: 'project',
            basename: 'yyy.png',
            stats: {
              mtimeMs: 1697052500313,
              size: 134,
            },
          } as ImageType,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- path/to
          |-- new.png
        |-- ui-framework
          |-- a/b
            |-- yyy.png
          |-- src/images/x/y
            |-- yyy.png
            |-- z
              |-- xxx.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- vite.svg
      "
    `)
  })

  it('按图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.extension,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- png
          |-- app.png
          |-- blender.png
          |-- c#.png
          |-- d3.png
          |-- d3.png
          |-- new-blender.png
          |-- new.png
        |-- svg
          |-- root.svg
          |-- vite.svg
      "
    `)
  })

  it('按目录和图片类型分组', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir_extension,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- path/to
          |-- png
            |-- new.png
        |-- png
          |-- d3.png
        |-- svg
          |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- png
              |-- new-blender.png
          |-- webview
            |-- png
              |-- d3.png
        |-- webview
          |-- png
            |-- app.png
            |-- blender.png
            |-- c#.png
          |-- svg
            |-- vite.svg
      "
    `)
  })

  it('不分组，平铺展示', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.flat,
    })
    treeManager.generateTree(images)
    treeManager.updateTree(imageUpdates)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- app.png
        |-- blender.png
        |-- c#.png
        |-- d3.png
        |-- d3.png
        |-- new-blender.png
        |-- new.png
        |-- root.svg
        |-- vite.svg
      "
    `)
  })

  it('修改目录', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir,
    })
    treeManager.generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)

    treeManager.updateTree([
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            workspaceFolder: 'project',
            dirPath: 'ui-framework/new-src',
            absDirPath: '/Users/path/to/project/ui-framework/new-src',
          },
          type: UpdateEvent.create,
        },
      },
      {
        origin: UpdateOrigin.dir,
        data: {
          payload: {
            workspaceFolder: 'project',
            dirPath: 'ui-framework/src',
            absDirPath: '/Users/path/to/project/ui-framework/src',
          },
          type: UpdateEvent.delete,
        },
      },
    ])

    // 模拟watcher中的获取新目录下的图片
    treeManager.updateTree([
      {
        origin: UpdateOrigin.image,
        data: {
          type: UpdateEvent.create,
          payload: {
            basename: 'blender.png',
            name: 'blender',
            path: '/Users/path/to/project/ui-framework/new-src/images/blender.png',
            dirPath: 'ui-framework/new-src/images',
            absDirPath: '/Users/path/to/project/ui-framework/new-src/images',
            extname: 'png',
            workspaceFolder: 'project',
            absWorkspaceFolder: '/Users/path/to/project',
            stats: {
              mtimeMs: 1697059300313,
              size: 52,
            },
          } as ImageType,
        },
      },
    ])

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- new-src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)
  })
})

describe('tree manager 方法测试', () => {
  it('获取指定节点的图片', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      compact: true,
      treeStyle: TreeStyle.dir,
    }).generateTree(images)

    expect(treeManager.getNodeImages('project/ui-framework')).toHaveLength(0)
    expect(treeManager.getNodeImages('project/ui-framework/src')).toHaveLength(1)
    expect(treeManager.getSubnodeImages('project/webview')).toHaveLength(3)
    expect(treeManager.getSubnodeImages('project')).toHaveLength(7)
  })
})

describe('节点中图片的排序和visible过滤', () => {
  it('按名称排序 - 升序', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      treeStyle: TreeStyle.dir,
    }).generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)

    treeManager.toNestedArray()

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- app.png
          |-- blender.png
          |-- c#.png
      "
    `)
  })

  it('按名称排序 - 降序', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      sort: [SortByType.basename, SortType.desc],
      treeStyle: TreeStyle.dir,
    }).generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- root.svg
        |-- d3.png
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- c#.png
          |-- blender.png
          |-- app.png
      "
    `)

    treeManager.toNestedArray()

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- root.svg
        |-- d3.png
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- c#.png
          |-- blender.png
          |-- app.png
      "
    `)
  })

  it('按修改时间排序 - 升序', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      sort: [SortByType.mtime, SortType.asc],
      treeStyle: TreeStyle.dir,
    }).generateTree(images)

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- c#.png
          |-- blender.png
          |-- app.png
      "
    `)

    const nested = treeManager.toNestedArray()

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- d3.png
        |-- root.svg
        |-- ui-framework
          |-- src/images
            |-- blender.png
          |-- webview
            |-- d3.png
        |-- webview
          |-- c#.png
          |-- blender.png
          |-- app.png
      "
    `)

    expect(flatten(treeManager.toArray(nested, node => node.data.images)).length).toEqual(
      treeManager.getSubnodeImages('project')?.length,
    )
  })

  it('过滤', () => {
    const treeManager = new TreeManager(images[0].workspaceFolder, {
      filter: {
        exclude_types: ['png'],
      },
      treeStyle: TreeStyle.dir,
    }).generateTree(images)

    expect(treeManager.tree.nodes).matchSnapshot()

    expect(treeManager.printTree()).toMatchInlineSnapshot(`
      "|-- project
        |-- root.svg
      "
    `)
  })
})
