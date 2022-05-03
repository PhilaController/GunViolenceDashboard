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
        <th scope="col"></th>
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

<script>
import { format } from "d3-format";

export default {
  name: "a11yTable",
  props: ["caption", "data", "categories", "total", "aliases"],
  methods: {
    getValue(category) {
      let d = this.data.get(category) || 0;
      let fmt = format(",.0f");
      return `${fmt(d)} (${((100 * d) / this.total).toFixed(0)}%)`;
    },
    getAlias(value) {
      let out = this.aliases[value];
      if (out) return out;
      else return value;
    },
  },
};
</script>