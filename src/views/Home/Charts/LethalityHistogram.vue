<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      labelWidth: 125,
      height: 175,
      color: "#49bf9a",
      chartTitle: "Outcome",
      key: "fatal",
      dataKey: (d) => d.properties.fatal == 1,
    };
  },
};
</script>