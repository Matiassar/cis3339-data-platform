<!--
  DataTable.vue (F3)
  One reusable table used by the client, event, and service list pages.
  Before this, each page had its own copy-pasted table. Now they all share this one.

  Props:
    columns: array of { label, field, render?, cellClass? }
      - label:     text shown in the column header
      - field:     which property of each row to show (nested works, e.g. 'address.city')
      - render:    optional function (row) => text, to change what the cell displays
                   (sorting still uses the raw field value, e.g. real dates)
      - cellClass: optional extra CSS classes for that column's cells
    rows:     array of records to display (whatever the page already loaded)
    pageSize: rows per page (default 10)
    rowKey:   unique id field on each row (default '_id' from MongoDB)

  Emits:
    row-click: sends the clicked row up to the page (used to open the details page)

  Sorting and paging happen here in the browser, on the rows already loaded.
-->
<template>
  <div>
    <table class="min-w-full shadow-md rounded">
      <!-- Header row: one clickable header per column -->
      <thead class="bg-gray-50 text-xl">
        <tr>
          <th
            v-for="col in columns"
            :key="col.field"
            class="p-4 text-left"
            :aria-sort="ariaSort(col)"
          >
            <!-- Clicking the header cycles: ascending -> descending -> unsorted -->
            <button
              type="button"
              class="p-0 font-bold text-left whitespace-nowrap"
              @click="toggleSort(col)"
            >
              {{ col.label }}
              <!-- Arrow shows the current sort direction for this column -->
              <span class="text-sm text-gray-500">{{ sortIcon(col) }}</span>
            </button>
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-300">
        <!-- Empty state: shown when there are no rows (e.g. a search found nothing) -->
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="p-4 text-center text-gray-500 italic">
            No results
          </td>
        </tr>

        <!-- Data rows: only the rows for the current page -->
        <tr
          v-for="(row, index) in pagedRows"
          :key="row[rowKey] ?? index"
          class="cursor-pointer"
          :class="{ hoverRow: hoverId === row[rowKey] }"
          @mouseenter="hoverId = row[rowKey]"
          @mouseleave="hoverId = null"
          @click="emit('row-click', row)"
        >
          <!-- One cell per column; render() is used if the column has one -->
          <td
            v-for="col in columns"
            :key="col.field"
            class="p-2 text-left"
            :class="col.cellClass"
          >
            {{ displayValue(row, col) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination bar: hidden when there are no rows -->
    <div v-if="rows.length > 0" class="flex flex-wrap items-center justify-between gap-2 mt-4">
      <!-- "Showing X-Y of Z" -->
      <span class="text-gray-700">
        Showing {{ firstShown }}–{{ lastShown }} of {{ rows.length }}
      </span>
      <div class="flex items-center gap-3">
        <!-- Previous page (disabled on page 1) -->
        <button
          type="button"
          class="border border-red-700 bg-white text-red-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="page === 1"
          @click="page--"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <!-- Next page (disabled on the last page) -->
        <button
          type="button"
          class="bg-red-700 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="page === totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ----- Inputs from the parent page -----
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 10 },
  rowKey: { type: String, default: '_id' }
})

// ----- Events sent back to the parent page -----
const emit = defineEmits(['row-click'])

// ----- Table state -----
const sortField = ref(null) // which column is sorted (null = none)
const sortDir = ref(null) // 'asc', 'desc', or null (unsorted)
const page = ref(1) // current page number, starting at 1
const hoverId = ref(null) // id of the row under the mouse (for the red highlight)

// Reads a value from a row, including nested fields like 'address.city'
// e.g. getValue(client, 'address.city') -> client.address.city
// Returns undefined instead of crashing if part of the path is missing.
function getValue(row, field) {
  return field
    .split('.')
    .reduce((obj, key) => (obj == null ? undefined : obj[key]), row)
}

// What a cell actually shows: the column's render() if it has one,
// otherwise the plain field value
function displayValue(row, col) {
  return col.render ? col.render(row) : getValue(row, col.field)
}

// Called when a header is clicked.
// 1st click on a column = ascending, 2nd = descending, 3rd = back to unsorted.
// Clicking a different column starts that column at ascending.
function toggleSort(col) {
  if (sortField.value !== col.field) {
    sortField.value = col.field
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortField.value = null
    sortDir.value = null
  }
  // A new sort order means page 2 would show different rows, so start over
  page.value = 1
}

// Arrow next to each header: ⇅ = not sorted, ▲ = ascending, ▼ = descending
function sortIcon(col) {
  if (sortField.value !== col.field) return '⇅'
  return sortDir.value === 'asc' ? '▲' : '▼'
}

// Tells screen readers how the column is sorted (accessibility)
function ariaSort(col) {
  if (sortField.value !== col.field) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

// All rows in sorted order.
// Sorts a COPY ([...props.rows]) so the original order comes back on "unsorted".
const sortedRows = computed(() => {
  if (!sortField.value) return props.rows // unsorted: original order
  const dir = sortDir.value === 'asc' ? 1 : -1 // flips the result for descending
  return [...props.rows].sort((a, b) => {
    const x = getValue(a, sortField.value)
    const y = getValue(b, sortField.value)
    // Empty values always go to the bottom
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    // Numbers compare as numbers
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    // Everything else compares as text, ignoring upper/lower case,
    // and treating digits as numbers ("Item 2" comes before "Item 10")
    return (
      String(x).localeCompare(String(y), undefined, {
        numeric: true,
        sensitivity: 'base'
      }) * dir
    )
  })
})

// How many pages there are (always at least 1)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.rows.length / props.pageSize))
)

// Just the rows for the current page.
// Page 1 = rows 0-9, page 2 = rows 10-19, and so on.
const pagedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

// Numbers for the "Showing X-Y of Z" text
const firstShown = computed(() =>
  props.rows.length === 0 ? 0 : (page.value - 1) * props.pageSize + 1
)
const lastShown = computed(() =>
  Math.min(page.value * props.pageSize, props.rows.length)
)

// When the page hands us new rows (a search, Clear Search, or Retry),
// jump back to page 1 so no leftover page from the old results is shown
watch(
  () => props.rows,
  () => {
    page.value = 1
  }
)
</script>
