<template>
  <table>
    <caption>
      {{
        caption
      }}
    </caption>
    <!-- Header -->
    <thead>
      <tr>
        <th scope="col">Category</th>
        <th scope="col">Total Shooting Victims (Percentage)</th>
      </tr>
    </thead>
    <!-- Body -->
    <tbody>
      <tr
        v-for="(category, rowIndex) in categories"
        :key="`row-header-${rowIndex}`"
      >
        <th scope="row">{{ getAlias(category) }}</th>
        <td>
          {{ getValue(category) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { format } from "d3-format";

export default defineComponent({
  name: "a11yTable",
  props: {
    /** Table caption */
    caption: { type: String, required: true },

    /** Table data */
    tableData: {
      type: Map as PropType<Map<any, number> | null>,
      required: true,
    },

    /** Data categories; these are the keys of the Map */
    categories: { type: Array, required: true },

    /** Sum over all table rows */
    total: { type: Number as PropType<number | null>, required: true },

    /** Aliases for categories */
    aliases: { type: Object, required: true },
  },
  methods: {
    /**
     * Get the value for a specific category
     */
    getValue(category: any) {
      if (this.tableData && this.total) {
        let value: number = this.tableData.get(category) || 0;
        let f = format(",.0f")(value);
        let pct = (100 * value) / this.total;
        return `${f} (${pct.toFixed(0)}%)`;
      } else return "";
    },

    /**
     * Get the alias for specific category
     */
    getAlias(category: any) {
      let out = this.aliases[category];
      if (out) return out;
      else return category;
    },
  },
});
</script>
