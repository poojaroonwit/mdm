export interface Component {
  id: string
  x: number
  y: number
  width: number
  height: number
  groupId?: string
  isGroup?: boolean
  children?: string[]
}

export interface ComponentGroup {
  id: string
  name: string
  components: string[]
  x: number
  y: number
  width: number
  height: number
  isCollapsed: boolean
}

export function createGroup(
  components: Component[],
  selectedComponentIds: string[],
  groupName: string = 'Group'
): { updatedComponents: Component[], newGroup: ComponentGroup } {
  const selectedComponents = components.filter(comp => selectedComponentIds.includes(comp.id))
  
  if (selectedComponents.length < 2) {
    return { updatedComponents: components, newGroup: null as any }
  }

  const groupId = `group-${Date.now()}`
  const bounds = getGroupBounds(selectedComponents)
  
  const newGroup: ComponentGroup = {
    id: groupId,
    name: groupName,
    components: selectedComponentIds,
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    isCollapsed: false
  }

  const updatedComponents = components.map(component => {
    if (selectedComponentIds.includes(component.id)) {
      return {
        ...component,
        groupId
      }
    }
    return component
  })

  return { updatedComponents, newGroup }
}

export function ungroupComponents(
  components: Component[],
  groups: ComponentGroup[],
  groupId: string
): { updatedComponents: Component[], updatedGroups: ComponentGroup[] } {
  const group = groups.find(g => g.id === groupId)
  if (!group) {
    return { updatedComponents: components, updatedGroups: groups }
  }

  const updatedComponents = components.map(component => {
    if (component.groupId === groupId) {
      const { groupId: _, ...componentWithoutGroup } = component
      return componentWithoutGroup
    }
    return component
  })

  const updatedGroups = groups.filter(g => g.id !== groupId)

  return { updatedComponents, updatedGroups }
}

export function moveGroup(
  components: Component[],
  groups: ComponentGroup[],
  groupId: string,
  deltaX: number,
  deltaY: number
): Component[] {
  const group = groups.find(g => g.id === groupId)
  if (!group) return components

  return components.map(component => {
    if (component.groupId === groupId) {
      return {
        ...component,
        x: component.x + deltaX,
        y: component.y + deltaY
      }
    }
    return component
  })
}

export function resizeGroup(
  components: Component[],
  groups: ComponentGroup[],
  groupId: string,
  newWidth: number,
  newHeight: number
): Component[] {
  const group = groups.find(g => g.id === groupId)
  if (!group) return components

  const groupComponents = components.filter(comp => comp.groupId === groupId)
  if (groupComponents.length === 0) return components

  const bounds = getGroupBounds(groupComponents)
  const scaleX = newWidth / (bounds.maxX - bounds.minX)
  const scaleY = newHeight / (bounds.maxY - bounds.minY)

  return components.map(component => {
    if (component.groupId === groupId) {
      const relativeX = component.x - bounds.minX
      const relativeY = component.y - bounds.minY
      
      return {
        ...component,
        x: bounds.minX + (relativeX * scaleX),
        y: bounds.minY + (relativeY * scaleY),
        width: component.width * scaleX,
        height: component.height * scaleY
      }
    }
    return component
  })
}

export function getGroupBounds(components: Component[]) {
  if (components.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  components.forEach(component => {
    minX = Math.min(minX, component.x)
    minY = Math.min(minY, component.y)
    maxX = Math.max(maxX, component.x + component.width)
    maxY = Math.max(maxY, component.y + component.height)
  })

  return { minX, minY, maxX, maxY }
}

export function getSelectedComponents(
  components: Component[],
  selectedIds: string[]
): Component[] {
  return components.filter(comp => selectedIds.includes(comp.id))
}

export function isComponentInGroup(
  component: Component,
  groups: ComponentGroup[]
): ComponentGroup | null {
  if (!component.groupId) return null
  return groups.find(g => g.id === component.groupId) || null
}

export function getGroupComponents(
  components: Component[],
  groupId: string
): Component[] {
  return components.filter(comp => comp.groupId === groupId)
}
