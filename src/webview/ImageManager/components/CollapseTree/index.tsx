import { useMemoizedFn } from '@minko-fe/react-hook'
import { type CollapseProps } from 'antd'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { FaRegObjectGroup } from 'react-icons/fa6'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import TreeContext from '../../contexts/TreeContext'
import {
  type BuildRenderOption,
  type FileNode,
  buildRenderTree,
  callBeforeTreeify,
  compactFolders,
  shouldShowImage,
} from '../../utils/tree'
import { type GroupType } from '../DisplayGroup'
import { type DisplayStyleType } from '../DisplayStyle'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'

type GroupOption = Option

type CollapseTreeProps = {
  workspaceFolders: GroupOption[]
  dirs: GroupOption[]
  imageTypes: GroupOption[]
  displayGroup: GroupType[]
  displayStyle: DisplayStyleType
}

function CollapseTree(props: CollapseTreeProps) {
  const { workspaceFolders, dirs, imageTypes, displayGroup, displayStyle } = props
  const { imageSingleTree } = TreeContext.usePicker(['imageSingleTree'])
  const { t } = useTranslation()

  const displayMap = useMemo(
    () => ({
      workspace: {
        absolutePath: 'absWorkspaceFolder',
        relativePath: 'workspaceFolder',
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
        absolutePath: 'absDirPath',
        relativePath: 'dirPath',
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
        absolutePath: 'fileType',
        relativePath: 'fileType',
        list: imageTypes,
        icon: () => <PiFileImage />,
        contextMenu: false,
        priority: 3,
      },
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
    [workspaceFolders, dirs, imageTypes],
  )

  const nestedDisplay = useMemoizedFn((tree: FileNode[], collapseProps?: CollapseProps) => {
    if (!tree.length) return null

    return (
      <div className={'space-y-2'}>
        {tree.map((node) => {
          const renderList =
            node.renderList || imageSingleTree.visibleList.filter((img) => shouldShowImage(node, img)) || []

          return (
            <ImageCollapse
              key={node.value}
              id={node.value}
              collapseProps={{
                bordered: false,
                ...collapseProps,
              }}
              labelContainer={(label) => (
                <div className={'flex items-center space-x-2'}>
                  <div className={'flex-center'}>{displayMap[node.type!].icon({ path: node.value })}</div>
                  {label}
                </div>
              )}
              contextMenu={displayMap[node.type!].contextMenu}
              label={node.label}
              joinLabel={!!displayMap[node.type!].priority}
              images={renderList}
              nestedChildren={node.label ? nestedDisplay(node.children) : null}
            ></ImageCollapse>
          )
        })}
      </div>
    )
  })

  const displayByPriority = useMemoizedFn(() => {
    const toBeBuild: BuildRenderOption['toBeBuild'] = {}
    displayGroup.forEach((g) => {
      toBeBuild[g] = displayMap[g].list.filter((t) => !!t.label)
    })
    // const sortedKeys = sortGroup(displayGroup)

    callBeforeTreeify({
      displayGroup,
      displayMap,
      visibleList: imageSingleTree.visibleList,
    })
    let tree = buildRenderTree({ toBeBuild })
    if (!tree.length) {
      tree = [
        {
          label: t('ia.all'),
          type: 'all',
          fullLabel: '',
          value: workspaceFolders[0].value,
          children: [],
        },
      ]
    }

    if (displayStyle === 'compact') {
      compactFolders(tree)
    }

    console.log('render tree', tree)

    // render tree
    return nestedDisplay(tree, { bordered: true })
  })

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
