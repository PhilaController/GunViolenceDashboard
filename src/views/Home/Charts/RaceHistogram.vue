<script>
import HistogramBase from "./HistogramBase";

export default {
  props: ["data"],
  mixins: [HistogramBase],
  data() {
    return {
      height: 300,
      labelWidth: 300,
      responsiveLabelWidth: 150,
      color: "#65aa63",
      chartTitle: "Race/Ethnicity",
      key: "race",
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
