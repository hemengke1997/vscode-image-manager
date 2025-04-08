import { memo } from 'react'
import Highlighter from 'react-highlight-words'
import { type FuseResultMatch } from 'fuse.js'

function Highlight(props: {
  text: string
  caseSensitive: boolean
  matches: readonly FuseResultMatch[] | undefined
  preLen?: number
}) {
  const { text, caseSensitive, matches, preLen = 0 } = props
  return (
    <Highlighter
      findChunks={() =>
        matches?.length
          ? matches?.map((match) => ({
              start: match.indices[0][0] + preLen,
              end: match.indices[0][1] + 1 + preLen,
            }))
          : []
      }
      highlightClassName='bg-ant-color-primary rounded-sm text-ant-color-text mx-0.5'
      textToHighlight={text}
      searchWords={[]}
      caseSensitive={caseSensitive}
    ></Highlighter>
  )
}

export default memo(Highlight)
