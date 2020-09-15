<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      labelWidth: 100,
      height: 175,
      color: "#49bf9a",
      chartTitle: "Outcome",
      dataKey: (d) => d.properties.fatal == 1,
      categories: [true, false],
      aliases: {
        true: "Fatal",
        false: "Nonfatal",
      },
    };
  },
};
</script>