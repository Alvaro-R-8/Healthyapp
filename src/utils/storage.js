const KEYS = {
  START_DATE: 'happ_start_date',
  COMPLETED: 'happ_completed',
  WEIGHT_INITIAL: 'happ_weight_initial',
  WEIGHT_ENTRIES: 'happ_weight_entries',
}

export function getStartDate() {
  return localStorage.getItem(KEYS.START_DATE) || null
}

export function setStartDate(date) {
  localStorage.setItem(KEYS.START_DATE, date)
}

export function getCompleted() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.COMPLETED) || '[]')
  } catch {
    return []
  }
}

export function toggleCompleted(id) {
  const completed = getCompleted()
  const idx = completed.indexOf(id)
  if (idx >= 0) {
    completed.splice(idx, 1)
  } else {
    completed.push(id)
  }
  localStorage.setItem(KEYS.COMPLETED, JSON.stringify(completed))
  return completed
}

export function isCompleted(id) {
  return getCompleted().includes(id)
}

export function getInitialWeight() {
  const v = localStorage.getItem(KEYS.WEIGHT_INITIAL)
  return v ? parseFloat(v) : null
}

export function setInitialWeight(w) {
  localStorage.setItem(KEYS.WEIGHT_INITIAL, String(w))
}

export function getWeightEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.WEIGHT_ENTRIES) || '[]')
  } catch {
    return []
  }
}

export function addWeightEntry(entry) {
  const entries = getWeightEntries()
  const existing = entries.findIndex(e => e.date === entry.date && e.official === entry.official)
  if (existing >= 0) {
    entries[existing] = entry
  } else {
    entries.push(entry)
  }
  entries.sort((a, b) => a.date.localeCompare(b.date))
  localStorage.setItem(KEYS.WEIGHT_ENTRIES, JSON.stringify(entries))
  return entries
}

export function deleteWeightEntry(date, official) {
  const entries = getWeightEntries().filter(e => !(e.date === date && e.official === official))
  localStorage.setItem(KEYS.WEIGHT_ENTRIES, JSON.stringify(entries))
  return entries
}

export function updateWeightEntry(date, official, newWeight) {
  const entries = getWeightEntries()
  const idx = entries.findIndex(e => e.date === date && e.official === official)
  if (idx >= 0) {
    entries[idx].weight = newWeight
    localStorage.setItem(KEYS.WEIGHT_ENTRIES, JSON.stringify(entries))
  }
  return entries
}
