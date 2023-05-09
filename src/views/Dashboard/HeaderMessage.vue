<template>
  <div class="header-message-wrapper w-100">
    <!-- Title -->
    <div class="header-message pl-2 pr-2">
      Mapping Philadelphia's Gun Violence Crisis
    </div>

    <div>
      <!-- Overlay a loader -->
      <v-overlay :value="showOverlay" opacity="0.3" color="#353d42" />

      <!-- Main message -->
      <div style="position: relative">
        <v-overlay
          :value="showOverlay"
          opacity="0.9"
          absolute
          color="#353d42"
        />
        <div
          class="header-submessage pl-5 pr-5"
          v-if="selectedYear == currentYear"
        >
          To date, there have been
          <span class="fatal"> {{ homicideTotal }} homicides</span> in
          <span class="date-color">{{ selectedYear }}</span
          >, {{ homicideChange }} from {{ selectedYear - 1 }}.
        </div>
        <div
          class="header-submessage pl-5 pr-5"
          v-else-if="selectedYear == null"
        >
          In total, there have been
          <span class="fatal"> {{ homicideTotal }} homicides</span>
          <span class="date-color"> since 2015</span>.
        </div>
        <div class="header-submessage pl-5 pr-5" v-else>
          In total, there were
          <span class="fatal"> {{ homicideTotal }} homicides</span> in
          <span class="date-color">{{ selectedYear }}</span
          >, {{ homicideChange }} from {{ selectedYear - 1 }}.
        </div>

        <!-- Submessage -->
        <div class="header-submessage pl-5 pr-5">
          This app maps the victims of gun violence:
          <span class="nonfatal">{{ formatNumber(nonfatal) }} nonfatal</span>
          and
          <span class="fatal">{{ formatNumber(fatal) }} fatal</span>
          shooting victims
          <template
            v-if="selectedYear === currentYear || selectedYear === null"
          >
            as of
            <span class="date-color"
              >{{ formattedlatestDataDate }}, {{ currentYear }}.
            </span>
          </template>
          <template v-else>
            in
            <span class="date-color">{{ selectedYear }}.</span></template
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { max } from "d3-array";
import { format } from "d3-format";
import { githubFetch } from "@/utils/io";
import { HomicideTotals } from "@/types/HomicideTotals";

export default defineComponent({
  props: {
    /**
     * The number of fatal shootings in the selected year
     */
    fatal: { type: Number },
    /**
     * The number of nonfatal shootings in the selected year
     */
    nonfatal: { type: Number },

    /**
     * The selected year for the data
     */
    selectedYear: { type: Number as PropType<number | null> },

    /**
     * The current year
     */
    currentYear: { type: Number, required: true },

    /**
     * The first year we have data for
     */
    minYear: { type: Number, required: true },

    /**
     * The latest date we have data for
     */
    latestDataDate: { type: Date as PropType<Date | null> },

    /**
     * The
     */
    showOverlay: { type: Boolean, default: true },
  },
  data() {
    return {
      /**
       * The annual/YTD homicide total data
       */
      homicideData: undefined as HomicideTotals | undefined,
    };
  },

  /**
   * When created, load the annual/YTD homicide totals
   */
  async created() {
    this.homicideData = await githubFetch("homicide_totals.json");
  },
  computed: {
    /**
     * Formatted YTD homicide total for the selected year
     */
    homicideTotal(): string | null {
      // Specific year
      if (this.homicideData && this.selectedYear) {
        let ytd = this.getHomicideTotal(this.selectedYear);
        if (ytd) return format(",.0f")(ytd);
      }
      // All years
      else if (this.selectedYear === null) {
        let total = this.getTotalHomicideCount();
        if (total) return format(",.0f")(total);
      }
      return null;
    },
    /**
     * Latest year with homicide data
     */
    latestHomicideYear(): number | undefined | null {
      // Data years as int
      if (this.homicideData) {
        let years = Object.keys(this.homicideData).map((d) => parseInt(d));
        return max(years);
      } else return null;
    },

    /**
     * Formatted year-over-year change in homcide total
     */
    homicideChange(): string | null {
      // Make sure we have a YTD homicide for this year
      if (this.homicideTotal && this.selectedYear) {
        // This year and last year
        let thisYear = this.getHomicideTotal(this.selectedYear);
        let lastYear = this.getHomicideTotal(this.selectedYear - 1);
        if (thisYear !== null && lastYear !== null) {
          let change = 100 * (thisYear / lastYear - 1);

          // Format the change
          if (change > 0) {
            return `a ${change.toFixed(0)}% increase`;
          } else if (change < 0) {
            return `a ${Math.abs(change).toFixed(0)}% decrease`;
          } else return "no change";
        }
      }
      return null;
    },

    /**
     * Formated latest date
     */
    formattedlatestDataDate(): string | null {
      if (this.latestDataDate) {
        return this.formatDate(this.latestDataDate);
      }
      return null;
    },
  },
  methods: {
    /**
     * Get total homicides
     */
    getTotalHomicideCount() {
      if (this.homicideData) {
        // Sum up homicides from all years
        let total = 0;
        for (let yr = this.minYear; yr <= this.currentYear; yr++) {
          let d = this.homicideData[yr];
          if (d) {
            if (d.annual === null) total += d.ytd;
            else total += d.annual;
          }
        }
        return total;
      }
      return null;
    },
    /**
     * Get the homicide total for a given year
     */
    getHomicideTotal(year: number) {
      // Do nothing yet (this shouldn't happen)
      if (!this.homicideData) return null;

      // Selected year is defined
      if (this.selectedYear !== undefined) {
        // Either return YTD for current year or annual for past year
        if (this.selectedYear == this.latestHomicideYear)
          return this.homicideData[year].ytd;
        else return this.homicideData[year].annual;
      } else return null;
    },

    /**
     * Format the input number into a zero-decimal integer
     */
    formatNumber(d: number | undefined): string {
      if (typeof d == "number") return format(",.0f")(d);
      else return "";
    },

    /**
     * Format the input date into short numeric format
     */
    formatDate(dt: Date | undefined) {
      if (dt instanceof Date)
        return dt.toLocaleString("default", {
          month: "short",
          day: "numeric",
        });
      else return "";
    },
  },
});
</script>

<style scoped>
/* Colors for specific  */
.nonfatal {
  color: #e5dc8e;
}
.fatal {
  color: #d84545;
}
.date-color {
  color: #b2beb5;
}

/* Header message */
.header-message-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
}
.header-message {
  font-size: 3rem;
  font-weight: 500;
  line-height: 1.1;
  font-family: Montserrat, sans-serif;
  text-align: center;
}

.header-submessage {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.2;
  font-family: Montserrat, sans-serif;
  margin-top: 30px;
  max-width: 700px;
  text-align: center;
}
.header-submessage:nth-child(3) {
  margin-top: 50px;
}
@media only screen and (max-width: 767px) {
  .header-submessage {
    font-size: 1.6rem;
    margin-top: 50px;
    text-align: center;
    line-height: 1.2;
  }
  .header-message {
    text-align: center;
    font-size: 2.7rem;
  }
}
</style>
