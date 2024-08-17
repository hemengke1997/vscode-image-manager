import { memo } from 'react'
import Filter from './components/filter'
import More from './components/more'
import Refresh from './components/refresh'
import Search from './components/search'

function ImageActions() {
  return (
    <div className={'flex items-center gap-x-2'}>
      {/* Filter */}
      <Filter />
      {/* Refresh images */}
      <Refresh />
      {/* Search */}
      <Search />
      {/* Action */}
      <More />
    </div>
  )
}

export default memo(ImageActions)
