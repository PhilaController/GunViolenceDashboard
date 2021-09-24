<template>
  <div class="legend-wrapper">
    <div class="d-flex justify-content-center" id="defect-rating-legend">
      <div class="d-flex flex-column justify-content-center">
        <div id="hot-spot-legend">
          <svg :width="width" :height="height">
            <g id="hot-spot-canvas"></g>
          </svg>
        </div>
        <div class="d-flex justify-content-between">
          <div class="legend-label">Fewer Shootings</div>
          <div class="legend-label">More Shootings</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";

export default {
  name: "Legend",
  props: ["height", "width", "colorScheme", "range"],
  data() {
    return {
      margin: { right: 0, bottom: 0, left: 0 },
      barHeight: this.height,
    };
  },
  computed: {
    colorScale() {
      return scaleLinear().domain([0, 1]).range(this.range);
    },
  },
  watch: {
    colorScheme() {
      // Remove existing
      let svg = select("#hot-spot-canvas");
      svg.selectAll("linearGradient").remove();
      svg.selectAll("g").remove();

      // Add colorbar
      this.addColorBar();
    },
  },
  methods: {
    addColorBar() {
      let svg = select("#hot-spot-canvas");
      const defs = svg.append("defs");

      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

      linearGradient
        .selectAll("stop")
        .data(
          this.colorScale.ticks().map((t, i, n) => ({
            offset: `${(100 * i) / n.length}%`,
            color: this.colorScheme(this.colorScale(t)),
          }))
        )
        .enter()
        .append("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      svg
        .append("g")
        .attr(
          "transform",
          `translate(0,${this.height - this.margin.bottom - this.barHeight})`
        )
        .append("rect")
        .attr("transform", `translate(${this.margin.left}, 0)`)
        .attr("width", this.width - this.margin.right - this.margin.left)
        .attr("height", this.barHeight)
        .attr("stroke-width", 3)
        .attr("stroke", "#666")
        .style("fill", "url(#linear-gradient)");
    },
  },
  mounted() {
    this.addColorBar();
  },
};
</script>

<style>
.legend-wrapper {
  margin-right: 20px;
  margin-top: 20px;
}

.legend-label {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  max-width: 75px;
  text-shadow: 1px 0px #121516;
}
</style>
