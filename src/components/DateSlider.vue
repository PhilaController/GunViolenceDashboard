<template>
  <div class="date-slider-wrapper">
    <vue-slider
      class="date-slider"
      :width="300"
      v-model="value"
      :min="1"
      :max="366"
      :lazy="false"
      tooltip-placement="bottom"
      tooltip="always"
      :enableCross="false"
      :tooltip-formatter="formatSliderTooltip"
      @drag-start="() => (drag = true)"
      @drag-end="handleDragEnd"
      :dot-options="dotOptions"
    ></vue-slider>
  </div>
</template>

<script>
import { getDayOfYear, dateFromDay, formatDate } from "@/tools.js";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

export default {
  props: ["selectedYear", "maxAllowedValue"],
  components: { VueSlider },
  data() {
    return {
      drag: false,
      currentYear: new Date().getFullYear(),
      value: [1, 366],
    };
  },
  computed: {
    dotOptions() {
      if (!this.drag) {
        return;
      }
      if (this.value[1] <= this.maxAllowedValue) {
        return [
          {},
          {
            max: this.maxAllowedValue,
          },
        ];
      }
      return;
    },
  },
  watch: {
    value(nextValue, prevValue) {
      if (nextValue[1] > this.maxAllowedValue) {
        this.$nextTick(() => {
          this.value = prevValue;
        });
      } else if (!this.drag) this.$emit("update", nextValue);
    },
    maxAllowedValue: function (val) {
      if (val < this.value[1]) {
        this.value = [this.value[0], val];
      }
    },
  },
  methods: {
    formatSliderTooltip(day) {
      return formatDate(this.selectedYear, day);
    },
    handleDragEnd() {
      this.drag = false;
      this.$emit("update", this.value);
    },
  },
};
</script>

<style>
</style>