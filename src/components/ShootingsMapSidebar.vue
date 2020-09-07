<template>
  <div class="shootings-map-sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">
        Map Filters
      </div>
      <div class="sidebar-data-totals">
        Viewing data for {{ formatNumber(pointsOnMap) }} out of
        {{ formatNumber(dataSize) }} shootings that occurred from
        {{ minDate }} to {{ maxDate }}, {{ selectedYear }}
      </div>
    </div>

    <div class="sidebar-inner-content">
      <!-- Fatal Filter -->
      <div class="fatal-filter">
        <div class="pretty p-default p-round p-smooth">
          <input type="checkbox" v-model="fatalOnly" />
          <div class="state">
            <label class="sidebar-subtitle">Fatal shootings only</label>
          </div>
        </div>
      </div>

      <!-- Race Filter -->
      <div class="race-filter">
        <div class="sidebar-subtitle">Race/Ethnicity</div>
        <div class="race-filter-content mt-1">
          <div
            class="pretty p-default p-round p-smooth mb-3"
            v-for="raceValue in allowedRaces"
            :key="raceValue"
          >
            <input type="checkbox" :value="raceValue" v-model="selectedRaces" />
            <div class="state">
              <label>{{ getAlias(raceValue, "race") }}</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Gender Filter -->
      <div class="gender-filter">
        <div class="sidebar-subtitle">Gender</div>
        <div class="gender-filter-content mt-1">
          <div
            class="pretty p-default p-round p-smooth mb-3"
            v-for="genderValue in allowedGenders"
            :key="genderValue"
          >
            <input
              type="checkbox"
              :value="genderValue"
              v-model="selectedGenders"
            />
            <div class="state">
              <label>{{ getAlias(genderValue, "gender") }}</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Age Filter -->
      <div class="age-filter">
        <div class="age-filter-inputs">
          <div
            class="form-group"
            :class="{ 'form-group--error': $v.minAge.$error }"
          >
            <label class="form__label sidebar-subtitle">Min Age</label>
            <input class="form__input" v-model.trim.lazy="$v.minAge.$model" />
          </div>

          <div
            class="form-group ml-3"
            :class="{ 'form-group--error': $v.maxAge.$error }"
          >
            <label class="form__label sidebar-subtitle">Max Age</label>
            <input class="form__input" v-model.trim.lazy="$v.maxAge.$model" />
          </div>
        </div>
        <div class="error" v-if="$v.maxAge.$invalid">
          Error: Minimum age must be less than the maximum age.
        </div>
      </div>
    </div>

    <!-- Note -->
    <div
      class="sidebar-note"
      :style="{ color: missingPoints > 0 ? '#fff' : 'rgba(0,0,0,0.0)' }"
    >
      Note: {{ missingPoints }} shootings are not shown due to missing
      locations.
    </div>
  </div>
</template>

<script>
import { between } from "vuelidate/lib/validators";
import "pretty-checkbox/dist/pretty-checkbox.min.css";

export default {
  props: ["dataSize", "pointsOnMap", "filteredSize", "selectedYear"],
  data() {
    return {
      allowedRaces: ["W", "B", "H", "Other/Unknown"],
      allowedGenders: ["M", "F"],
      fatalOnly: false,
      selectedRaces: ["W", "B", "H", "Other/Unknown"],
      selectedGenders: ["M", "F"],
      minAge: "",
      maxAge: "",
      aliases: {
        race: {
          W: "White (Non-Hispanic)",
          B: "Black (Non-Hispanic)",
          H: "Hispanic (Black or White)",
        },
        gender: {
          M: "Male",
          F: "Female",
        },
      },
    };
  },
  validations() {
    return {
      minAge: {
        between(value) {
          let maxAge = this.maxAge == "" ? 200 : +this.maxAge - 1;
          return between(0, maxAge)(value);
        },
      },
      maxAge: {
        between(value) {
          let minAge = this.minAge == "" ? 0 : +this.minAge + 1;
          return between(+minAge, 200)(value);
        },
      },
    };
  },
  watch: {
    fatalOnly(nextValue, prevValue) {
      this.$emit("update-fatal", nextValue);
    },
    selectedRaces(nextValue, prevValue) {
      this.$emit("update-race", nextValue);
    },
    selectedGenders(nextValue, prevValue) {
      this.$emit("update-gender", nextValue);
    },
    minAge(nextValue, prevValue) {
      if (!this.$v.minAge.$invalid) this.sendAgeUpdate();
    },
    maxAge(nextValue, prevValue) {
      if (!this.$v.maxAge.$invalid) this.sendAgeUpdate();
    },
  },

  methods: {
    getAlias(value, kind) {
      let out = this.aliases[kind][value];
      if (out) return out;
      else return value;
    },
    sendAgeUpdate() {
      let minAge = this.minAge == "" ? 0 : +this.minAge;
      let maxAge = this.maxAge == "" ? 200 : +this.maxAge;
      this.$emit("update-age", [minAge, maxAge]);
    },
    formatNumber(d) {
      return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
  },
  computed: {
    missingPoints() {
      return this.filteredSize - this.pointsOnMap;
    },
    minDate() {
      return this.$store.state.minFormattedDate;
    },
    maxDate() {
      return this.$store.state.maxFormattedDate;
    },
  },
};
</script>

<style>
.age-filter-inputs {
  display: flex;
}
.sidebar-subtitle {
  font-weight: 500 !important;
}
.race-filter {
  margin-bottom: 1.5rem;
}
.fatal-filter {
  margin-bottom: 1.5rem;
}
.gender-filter {
  margin-bottom: 1.5rem;
}

.age-filter input {
  max-width: 50px;
}
.race-filter-content {
  font-size: 0.9rem;
}
.gender-filter-content {
  font-size: 0.9rem;
}
.race-filter-content {
  display: flex;
  flex-direction: column;
}
.sidebar-note {
  font-size: 0.8rem;
  font-style: italic;
  border-top: 3px solid #cfcfcf;
  padding-top: 0.25rem;
}
.shootings-map-sidebar {
  width: 20%;
  min-width: 300px;
  border-left: 5px solid #cfcfcf;
  text-align: left;
  padding-left: 10px;
  padding-bottom: 5px;
  padding-right: 10px;
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.sidebar-data-totals {
  font-style: italic;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  padding: 5px;
}
.sidebar-header {
  text-align: center;
  padding: 5px;
  border-bottom: 3px solid #cfcfcf;
}
.sidebar-title {
  font-weight: 500;
  font-size: 1.3rem;
  border-bottom: 3px solid #cfcfcf;
}

.form-group {
  margin-bottom: 0rem;
}

.form-group--error input {
  border: 2px solid #af2828;
  border-radius: 5px;
}

.form__input {
  padding-left: 5px;
}
.form__label {
  min-width: 75px;
  font-size: 16px;
}
.error {
  font-size: 0.8rem;
  color: #fff;
  font-style: italic;
  padding: 3px;
}
.sidebar-inner-content {
  margin-top: auto;
  margin-bottom: auto;
}
</style>