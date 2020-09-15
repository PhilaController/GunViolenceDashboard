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
      dataKey: (d) => d.properties.age_group,
      categories: [
        "Younger than 18",
        "19 to 30",
        "31 to 45",
        "Older than 45",
        "Unknown",
      ],
      aliases: {},
      shortAliases: {
        "Younger than 18": ["Younger", "than 18"],
        "Older than 45": ["Older", "than 45"],
      },
    };
  },
};
</script>