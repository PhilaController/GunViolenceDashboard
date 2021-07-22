<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      height: 300,
      labelWidth: 250,
      color: "#65aa63",
      chartTitle: "Race/Ethnicity",
      dataKey: (d) => d.properties.race,
      categories: ["W", "B", "H", "Other/Unknown"],
      aliases: {
        W: "White (Non-Hispanic)",
        B: "Black (Non-Hispanic)",
        H: "Hispanic (Black or White)",
      },
      shortAliases: {
        W: ["White", "(Non-Hispanic)"],
        B: ["Black", "(Non-Hispanic)"],
        H: ["Hispanic", "(Black or White)"],
      },
    };
  },
};
</script>
