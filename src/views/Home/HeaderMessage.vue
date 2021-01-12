<template>
  <div class="header-wrapper">
    <div class="header-message-wrapper">
      <!-- Title -->
      <div class="header-message">
        Mapping Philadelphia's Gun Violence Crisis
      </div>
      <div class="header-submessage">
        <template>
          <span v-if="currentYear == selectedYear">To date</span
          ><span v-else>In total</span>, there
          <span v-if="currentYear == selectedYear">have been</span
          ><span v-else>were</span>
          <span class="fatal"> {{ homicideTotal }} homicides</span><br />
          in <span class="date-color">{{ selectedYear }}</span
          >, {{ homicideChange }} from {{ selectedYear - 1 }}.
        </template>
      </div>

      <!-- Submessage -->
      <div class="header-submessage">
        This app maps the victims of gun violence:<br />
        <span class="nonfatal">{{ formatNumber(nonfatal) }} nonfatal</span> and
        <span class="fatal">{{ formatNumber(fatal) }} fatal</span>
        shooting victims
        <template v-if="selectedYear == currentYear">
          as of
          <span class="date-color"
            >{{ formattedMaxDate }}, {{ selectedYear }}
          </span>
        </template>
        <template v-else>
          in
          <span class="date-color">{{ selectedYear }} </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { max } from "d3-array";

export default {
  props: [
    "fatal",
    "nonfatal",
    "selectedYear",
    "currentYear",
    "maxDate",
    "homicideData",
  ],
  computed: {
    homicideTotal() {
      if (this.homicideData) {
        return this.getHomicideTotal(this.selectedYear);
      }
    },
    maxHomicideYear() {
      return max(Object.keys(this.homicideData));
    },
    homicideChange() {
      if (this.homicideTotal) {
        let thisYear = this.homicideTotal;
        let lastYear = this.getHomicideTotal(this.selectedYear - 1);
        let change = 100 * (thisYear / lastYear - 1);

        if (change > 0) {
          return `a ${change.toFixed(0)}% increase`;
        } else if (change < 0) {
          return `a ${Math.abs(change).toFixed(0)}% decrease`;
        } else return "no change";
      }
    },
    formattedMaxDate() {
      if (this.maxDate) {
        return this.formatDate(this.maxDate);
      }
    },
  },
  methods: {
    getHomicideTotal(year) {
      if (this.selectedYear == this.maxHomicideYear)
        return this.homicideData[year].ytd;
      else return this.homicideData[year].annual;
    },
    formatNumber(d) {
      return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
.nonfatal {
  color: #e5dc8e;
}

.fatal {
  color: #d84545;
}

.date-color {
  color: #b2beb5;
}

.header-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-left: 60px;
  margin-right: 60px;
  margin-top: 50px;
}
.header-message-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.header-message {
  font-size: 3rem;
  font-weight: 500;
  line-height: 1.1;
  font-family: Montserrat, sans-serif;
}

.header-submessage {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.2;
  font-family: Montserrat, sans-serif;
  margin-top: 30px;
  max-width: 700px;
}
.header-submessage:nth-child(3) {
  margin-top: 50px;
}
@media only screen and (max-width: 768px) {
  .header-submessage {
    font-size: 1.8rem;
    margin-top: 50px;
  }
}
</style>