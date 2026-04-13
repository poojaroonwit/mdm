/**
 * Spaces Feature
 * Main export file for the spaces feature
 */

// Components
export { SpaceSelection } from './components/SpaceSelection'
export { SpaceLayoutsAdmin } from './components/SpaceLayoutsAdmin'
export { SpaceSettingsAdmin } from './components/SpaceSettingsAdmin'

// Types
export type {
  Space,
  LayoutTemplate,
} from './types'

// Utils
export {
  isSpaceActive,
  isSpaceDefault,
  isSpaceArchived,
  filterSpacesByStatus,
  filterSpacesBySearch,
  filterSpacesByTags,
  sortSpacesByName,
  getAllTags,
  formatSpaceSlug,
} from './utils'

