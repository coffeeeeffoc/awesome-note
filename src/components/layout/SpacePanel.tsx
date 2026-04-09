import { FolderPlus } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { SpaceTree } from '../space/SpaceTree'
import { SpaceModal } from '../space/SpaceModal'
import { useSpaces } from '../../hooks/useSpaces'
import { useNotes } from '../../hooks/useNotes'
import { useState } from 'react'
import styles from './SpacePanel.module.css'

export function SpacePanel() {
  const { spaces, expandedIds, addSpace, renameSpace, removeSpace, toggleExpanded } =
    useSpaces()
  const { notes } = useNotes()
  const [showAddRoot, setShowAddRoot] = useState(false)

  return (
    <div className={styles.panel} style={{ gridArea: 'left' }}>
      <div className={styles.header}>
        <span className={styles.label}>空间</span>
        <IconButton label="新建空间" size="sm" onClick={() => setShowAddRoot(true)}>
          <FolderPlus size={13} />
        </IconButton>
      </div>

      <SpaceTree
        spaces={spaces}
        notes={notes}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        onAdd={addSpace}
        onRename={renameSpace}
        onDelete={removeSpace}
      />

      {showAddRoot && (
        <SpaceModal
          mode="add"
          siblings={spaces.filter((s) => s.parentId === null)}
          onConfirm={(name) => {
            addSpace(name, null)
            setShowAddRoot(false)
          }}
          onClose={() => setShowAddRoot(false)}
        />
      )}
    </div>
  )
}
