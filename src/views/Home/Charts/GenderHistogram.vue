<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      labelWidth: 100,
      height: 175,
      color: "#964a92",
      chartTitle: "Gender",
      dataKey: (d) => d.properties.sex,
      categories: ["M", "F"],
      aliases: {
        M: "Male",
        F: "Female",
      },
    };
  },
};
</script>