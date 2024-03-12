import { memo } from 'react'
import Filter from './components/Filter'
import More from './components/More'
import Refresh from './components/Refresh'
import Search from './components/Search'

function ImageActions() {
  return (
    <div className={'space-x-2'}>
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
