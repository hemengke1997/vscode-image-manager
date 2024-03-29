import { useMemoizedFn } from '@minko-fe/react-hook'
import { Card, type CollapseProps, ConfigProvider, Empty } from 'antd'
import { motion } from 'framer-motion'
import { type ReactNode, memo, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { IoMdFolderOpen } from 'react-icons/io'
import { VscFileMedia } from 'react-icons/vsc'
import { mergeClass } from '~/webview/utils'
import SettingsContext from '../../contexts/SettingsContext'
import TreeContext from '../../contexts/TreeContext'
import { DirTree, type DisplayMapType, type FileNode } from '../../utils/DirTree'
import { type CollapseContextMenuType } from '../ContextMenus/components/CollapseContextMenu'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'
import styles from './index.module.css'

function CollapseTree() {
  const { t } = useTranslation()

  const { displayGroup, displayStyle } = SettingsContext.usePicker(['displayGroup', 'displayStyle'])

  const { dirs, imageTypes, workspaceFolder, originalWorkspaceFolder } = TreeContext.usePicker([
    'dirs',
    'imageTypes',
    'workspaceFolder',
    'originalWorkspaceFolder',
  ])

  const visibleList = TreeContext.useSelector((ctx) => ctx.imageSingleTree.visibleList)

  const dirTree = useRef<DirTree>()

  const displayMap: DisplayMapType<{
    icon: (props: { path: string }) => ReactNode
    contextMenu: CollapseContextMenuType
  }> = useMemo(
    () => ({
      workspace: {
        imageKey: {
          id: 'absWorkspaceFolder',
        },
        list: [workspaceFolder].filter(Boolean),
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 1,
      },
      dir: {
        imageKey: {
          id: 'absDirPath',
        },
        list: dirs,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 2,
      },
      type: {
        imageKey: {
          id: 'fileType',
        },
        list: imageTypes,
        icon: () => <VscFileMedia className={'mr-1'} />,
        contextMenu: {
          open_in_os_explorer: false,
          open_in_vscode_explorer: false,
          compress_in_recursive_directories: false,
        },
        priority: 3,
      },
      // Special case, when no group checked, show all images
      all: {
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegImages />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: null,
      },
    }),
    [workspaceFolder, dirs, imageTypes],
  )

  const nestedDisplay = useMemoizedFn(
    (
      tree: FileNode[],
      collapseProps?: CollapseProps,
      options?: {
        defaultOpen?: boolean
      },
    ) => {
      if (!tree.length) return null

      const { defaultOpen } = options || {}

      return (
        <div className={'space-y-2'}>
          {tree.map((node) => {
            const { groupType, value, label, children, renderList, underFolderList, underFolderDeeplyList } = node
            if (!groupType) return null
            return (
              <ImageCollapse
                key={value}
                id={value}
                collapseProps={{
                  bordered: false,
                  defaultActiveKey: defaultOpen ? [value] : undefined,
                  className: mergeClass(styles.collapse),
                  ...collapseProps,
                }}
                labelContainer={(label) => (
                  <div className={'flex items-center space-x-1'}>
                    <div className={'flex items-center'}>{displayMap[groupType].icon({ path: value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={displayMap[groupType].contextMenu}
                label={label}
                joinLabel={!!displayMap[groupType].priority}
                nestedChildren={label ? nestedDisplay(children) : null}
                images={renderList}
                underFolderImages={underFolderList}
                underFolderDeeplyImages={underFolderDeeplyList}
              ></ImageCollapse>
            )
          })}
        </div>
      )
    },
  )

  const displayByPriority = useMemoizedFn(() => {
    dirTree.current = new DirTree({
      displayGroup,
      displayMap,
      visibleList,
    })

    const tree = dirTree.current.buildRenderTree()

    if (displayStyle === 'compact') {
      dirTree.current.compactFolders(tree)
    }

    if (!tree.length) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, delay: 0.15 }}>
          <Card
            title={<div className={'text-ant-color-warning'}>{originalWorkspaceFolder}</div>}
            bordered={false}
            type='inner'
          >
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
          </Card>
        </motion.div>
      )
    }

    // render tree
    return nestedDisplay(tree, { bordered: true }, { defaultOpen: true })
  })

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            lineWidth: 0,
          },
        },
      }}
    >
      {displayByPriority()}
    </ConfigProvider>
  )
}

export default memo(CollapseTree)
