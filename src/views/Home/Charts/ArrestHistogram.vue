<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      labelWidth: 100,
      height: 175,
      color: "#868b8e",
      chartTitle: "Associated Court Cases",
      key: "has_court_case",
    };
  },
};
</script>