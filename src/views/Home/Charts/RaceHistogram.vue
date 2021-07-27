<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      height: 300,
      labelWidth: 250,
      responsiveLabelWidth: 175,
      color: "#65aa63",
      chartTitle: "Race/Ethnicity",
      dataKey: (d) => d.properties.race,
      categories: ["W", "B", "H", "A", "Other/Unknown"],
      aliases: {
        W: "White (Non-Hispanic)",
        B: "Black (Non-Hispanic)",
        H: "Hispanic (Black or White)",
        A: "Asian",
      },
      shortAliases: {
        W: ["White", "(Non-Hispanic)"],
        B: ["Black", "(Non-Hispanic)"],
        H: ["Hispanic", "(Black or White)"],
        A: ["Asian"],
      },
    };
  },
};
</script>
