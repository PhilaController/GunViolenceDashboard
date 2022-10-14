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

<script>
import { max } from "d3-array";
import { format } from "d3-format";
import { githubFetch } from "@/utils/io";

export default {
  props: [
    "fatal",
    "nonfatal",
    "selectedYear",
    "currentYear",
    "minYear",
    "latestDataDate",
    "showOverlay",
  ],
  data() {
    return { homicideData: null };
  },
  async created() {
    // Load the data
    this.homicideData = await githubFetch("homicide_totals.json");
  },
  computed: {
    /* Formatted homicide total for the selected year */
    homicideTotal() {
      if (this.homicideData) {
        return format(",.0f")(this.getHomicideTotal(this.selectedYear));
      }
      return null;
    },
    /* Latest year with homicide data */
    latestHomicideYear() {
      return max(Object.keys(this.homicideData));
    },
    /* Formatted YoY in the homicide total */
    homicideChange() {
      if (this.homicideTotal) {
        // Calculate the year-over-year change
        let thisYear = this.homicideTotal;
        let lastYear = this.getHomicideTotal(this.selectedYear - 1);
        let change = 100 * (thisYear / lastYear - 1);

        // Format the change
        if (change > 0) {
          return `a ${change.toFixed(0)}% increase`;
        } else if (change < 0) {
          return `a ${Math.abs(change).toFixed(0)}% decrease`;
        } else return "no change";
      }
      return null;
    },
    /* Formatted latest date */
    formattedlatestDataDate() {
      if (this.latestDataDate) {
        return this.formatDate(this.latestDataDate);
      }
      return null;
    },
  },
  methods: {
    /* Get the homicide total for a given year */
    getHomicideTotal(year) {
      // Selected year is defined
      if (this.selectedYear !== undefined) {
        // When selected year is null, we're doing all years
        if (this.selectedYear === null) {
          // Sum up homicides from all years
          let total = 0;
          for (let yr = this.minYear; yr <= this.currentYear; yr++) {
            if (yr == this.currentYear) total += this.homicideData[yr].ytd;
            else total += this.homicideData[yr].annual;
          }
          return total;
        }

        // Either return YTD for current year or annual for past year
        if (this.selectedYear == this.latestHomicideYear)
          return this.homicideData[year].ytd;
        else return this.homicideData[year].annual;
      } else return null;
    },
    formatNumber(d) {
      return format(",.0f")(d);
    },
    formatDate(dt) {
      return dt.toLocaleString("default", {
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<style>
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
