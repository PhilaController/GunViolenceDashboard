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

<script lang="ts">
import { defineComponent } from "vue";

// d3 module
import { scaleLinear } from "d3-scale";
import { axisBottom } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
import * as d3ScaleChromatic from "d3-scale-chromatic";

interface LegendOptions {
  colorScheme: string;
  range: number[];
  domain: [number, number];
  title: string;
}

interface Margin {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

type indexable = { [index: string]: any };

export default defineComponent({
  name: "MapLegend",
  props: {
    /**
     * Width of the legend
     */
    width: {
      type: Number,
      required: true,
    },

    /**
     * Height of the colorbar
     */
    barHeight: { type: Number, required: true },

    /**
     * Size of the ticks
     */
    tickSize: { type: Number, default: 12 },

    /**
     * Format of ticks
     */
    tickFormat: { type: String, default: ",.0f" },
  },
  data() {
    return {
      /**
       * Currently visible?
       */
      visible: false,

      /**
       * Legend options
       */
      options: {
        colorScheme: "Reds",
        range: [0, 1],
        domain: [0, 1],
        title: "Total",
      } as LegendOptions,

      /**
       * Margin
       */
      margin: { right: 20, bottom: 40, left: 10, top: 5 } as Margin,
    };
  },

  computed: {
    /**
     * Total height of the SVG container
     */
    height(): number {
      return this.barHeight + this.margin.top + this.margin.bottom;
    },

    /**
     * Colorbar scale
     */
    colorScale(): any {
      return scaleLinear()
        .domain(this.options.domain)
        .range(this.options.range);
    },

    /**
     * The d3 axis scale
     */
    axisScale(): any {
      return scaleLinear()
        .domain(this.colorScale.domain())
        .range([this.margin.left, this.width - this.margin.right]);
    },
  },

  methods: {
    /**
     * Show the legend with the specified options
     */
    show(options: LegendOptions) {
      // Make it visible
      this.visible = true;

      // Set the options
      this.options = {
        colorScheme: options.colorScheme,
        domain: options.domain,
        range: options.range,
        title: options.title,
      };

      // Wait for update and then refresh
      this.$nextTick(() => {
        this.refreshLegend();
      });
    },

    /**
     * Hide the legend
     */
    hide() {
      this.visible = false;
    },

    /**
     * Refresh the legend
     */
    refreshLegend() {
      // Remove and then add it
      this.removeLegend();
      this.addLegend();
    },

    /**
     * Add the axis to the svg selection
     */
    addAxis(g: any) {
      return g
        .attr("class", `x-axis`)
        .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
        .call(
          axisBottom(this.axisScale)
            .tickValues(this.options.domain)
            .tickSize(this.tickSize)
            // @ts-expect-error: d3 issue
            .tickFormat(format(this.tickFormat))
        );
    },

    /**
     * Remove the legend
     */
    removeLegend() {
      // Remove existing
      let svg = select("#map-legend-canvas");
      svg.selectAll("defs").remove();
      svg.selectAll("g").remove();
    },

    /**
     * Add the legend
     */
    addLegend() {
      let svg = select("#map-legend-canvas");
      const defs = svg.append("defs");

      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

      let key = `interpolate${this.options.colorScheme}`;
      linearGradient
        .selectAll("stop")
        .data(
          this.colorScale.ticks().map((t: number, i: number, n: number[]) => ({
            offset: `${(100 * i) / n.length}%`,
            color: (d3ScaleChromatic as indexable)[key](this.colorScale(t)),
          }))
        )
        .enter()
        .append("stop")
        .attr("offset", (d: any) => d.offset)
        .attr("stop-color", (d: any) => d.color);

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
});
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
