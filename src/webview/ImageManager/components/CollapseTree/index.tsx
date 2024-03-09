import { useMemoizedFn } from '@minko-fe/react-hook'
import { type CollapseProps, Empty } from 'antd'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { type ReactNode, memo, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { FaRegObjectGroup } from 'react-icons/fa6'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
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

  const { dirs, imageType, workspaceFolders } = TreeContext.usePicker([
    'imageSingleTree',
    'dirs',
    'imageType',
    'workspaceFolders',
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
        list: workspaceFolders,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegObjectGroup />
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
        list: imageType,
        icon: () => <PiFileImage />,
        contextMenu: {
          openInOsExplorer: false,
          openInVscodeExplorer: false,
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
    [workspaceFolders, dirs, imageType],
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
            return (
              <ImageCollapse
                key={node.value}
                id={node.value}
                collapseProps={{
                  bordered: false,
                  defaultActiveKey: defaultOpen ? [node.value] : undefined,
                  className: classNames(styles.collapse),
                  ...collapseProps,
                }}
                labelContainer={(label) => (
                  <div className={'flex items-center space-x-2'}>
                    <div className={'flex-center'}>{displayMap[node.groupType!].icon({ path: node.value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={displayMap[node.groupType!].contextMenu}
                label={node.label}
                joinLabel={!!displayMap[node.groupType!].priority}
                nestedChildren={node.label ? nestedDisplay(node.children) : null}
                images={node.renderList}
                underFolderImages={node.underFolderList}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1, delay: 0.2 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
        </motion.div>
      )
    }

    // render tree
    return nestedDisplay(tree, { bordered: true }, { defaultOpen: true })
  })

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
