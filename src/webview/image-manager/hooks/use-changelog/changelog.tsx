import MarkdownIt from 'markdown-it'
import { memo } from 'react'
import { markdown } from '~root/CHANGELOG.md'

const md = MarkdownIt()

function Changelog() {
  return (
    <div className='max-h-[60vh] overflow-auto' dangerouslySetInnerHTML={{ __html: md.render(markdown) || '' }} />
  )
}

export default memo(Changelog)
