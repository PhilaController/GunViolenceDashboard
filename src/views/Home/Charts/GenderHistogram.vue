<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      labelWidth: 125,
      height: 175,
      color: "#964a92",
      chartTitle: "Gender",
      key: "sex",
    };
  },
};
</script>