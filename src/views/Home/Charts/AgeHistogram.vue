<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      height: 300,
      color: "#d6793a",
      chartTitle: "Age",
      key: "age_group",
      shortAliases: {
        "Younger than 18": ["Younger", "than 18"],
        "Older than 45": ["Older", "than 45"],
      },
    };
  },
};
</script>