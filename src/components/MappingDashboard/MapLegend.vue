<template>
  <div id="map-legend" v-if="visible">
    <div id="map-legend-inner">
      <div class="legend-title">{{ options.title }}</div>
      <svg :width="width" :height="height">
        <g id="map-legend-canvas"></g>
      </svg>
    </div>
  </div>
</template>

<script>
import { scaleLinear } from "d3-scale";
import { axisBottom } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
const d3ScaleChromatic = require("d3-scale-chromatic");

export default {
  name: "MapLegend",
  props: {
    width: {
      type: Number,
      required: true,
    },
    barHeight: { type: Number, required: true },
    tickSize: { type: Number, default: 12 },
    tickFormat: { type: String, default: ",.0f" },
  },
  data() {
    return {
      visible: false,
      options: {
        colorScheme: "Reds",
        range: [0, 1],
        domain: [0, 1],
        title: "Total",
      },
      margin: { right: 20, bottom: 40, left: 10, top: 5 },
    };
  },
  computed: {
    height() {
      return this.barHeight + this.margin.top + this.margin.bottom;
    },
    colorScale() {
      return scaleLinear()
        .domain(this.options.domain)
        .range(this.options.range);
    },
    axisScale() {
      return scaleLinear()
        .domain(this.colorScale.domain())
        .range([this.margin.left, this.width - this.margin.right]);
    },
  },
  methods: {
    show({ colorScheme, range, domain, title }) {
      this.visible = true;
      this.options = {
        colorScheme: colorScheme,
        domain: domain,
        range: range,
        title: title,
      };

      this.$nextTick(() => {
        this.refreshLegend();
      });
    },
    hide() {
      this.visible = false;
    },
    refreshLegend() {
      this.removeLegend();
      this.addLegend();
    },
    addAxis(g) {
      return g
        .attr("class", `x-axis`)
        .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
        .call(
          axisBottom(this.axisScale)
            .tickValues(this.options.domain)
            .tickSize(this.tickSize)
            .tickFormat(format(this.tickFormat))
        );
    },
    removeLegend() {
      // Remove existing
      let svg = select("#map-legend-canvas");
      svg.selectAll("defs").remove();
      svg.selectAll("g").remove();
    },
    addLegend() {
      let svg = select("#map-legend-canvas");
      const defs = svg.append("defs");

      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

      linearGradient
        .selectAll("stop")
        .data(
          this.colorScale.ticks().map((t, i, n) => ({
            offset: `${(100 * i) / n.length}%`,
            color: d3ScaleChromatic[`interpolate${this.options.colorScheme}`](
              this.colorScale(t)
            ),
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
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("fill", "url(#linear-gradient)");

      svg.append("g").call(this.addAxis);
    },
  },
};
</script>

<style>
.legend-title {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
  margin-left: 10px !important;
}
.x-axis line,
.x-axis path {
  stroke: #fff;
}
.tick text {
  font-size: 1rem;
}
#map-legend {
  position: absolute;
  top: 10px;
  left: 10px;
}
#map-legend-inner {
  padding: 10px;
  margin-bottom: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
}
</style>
