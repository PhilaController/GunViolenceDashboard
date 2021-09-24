<template>
  <div class="container about-page">
    <!-- Data Sources -->
    <div class="data-section">
      <h3>Data</h3>

      <!-- Disclaimer -->
      <p>
        This application was developed by the City Controller's Office using
        publicly available data from the City of Philadelphia and Pennsylvania's
        Unified Judicial System. The data is provided for informational purposes
        only in accordance with the office's goals of transparency,
        accountability, and good government.
      </p>

      <!-- List original data sources -->
      <h5 class="mt-4">Data Sources</h5>
      <ul>
        <li>
          <a
            href="https://www.opendataphilly.org/dataset/shooting-victims"
            target="blank_"
            ><i class="fas fa-external-link-alt"></i
            ><span class="ml-2">Shooting victims data</span></a
          >
          from the City of Philadelphia's open data portal Open Data Philly
        </li>
        <li>
          <a
            href="https://www.phillypolice.com/crime-maps-stats/"
            target="blank_"
            ><i class="fas fa-external-link-alt"></i>
            <span class="ml-2">Total homicide count</span></a
          >
          from the Philadelphia Police Department's crime statistics website
        </li>
        <li>
          <a href="https://ujsportal.pacourts.us/CaseSearch" target="blank_"
            ><i class="fas fa-external-link-alt"></i
            ><span class="ml-2">Information on court cases</span></a
          >
          from the web portal for the Unified Judicial System of Pennsylvania
        </li>
      </ul>

      <!-- List original data sources -->
      <h5 class="mt-4">Data Downloads</h5>

      <div>
        <ul>
          <li class="shooting-victims-download">
            <span class="mr-3">Shooting Victims Data:</span>
            <div v-for="year in dataYears" :key="year">
              <a
                :href="getShootingDataUrl"
                @click.prevent="
                  downloadItem({
                    url: getShootingDataUrl(year),
                    label: `shootings_${year}.geojson`,
                  })
                "
                ><i class="fas fa-download mr-2"></i>{{ year }}
              </a>
            </div>
          </li>

          <li class="shooting-victims-download">
            <span class="mr-3"
              >Court Cases Associated with Shooting Incidents:</span
            >
            <a
              :href="courtsDataUrl"
              @click.prevent="
                downloadItem({
                  url: courtsDataUrl,
                  label: `pa_ujs_data_by_incident.json`,
                })
              "
              ><i class="fas fa-download mr-2"></i>All Years</a
            >
          </li>
        </ul>
      </div>
    </div>

    <!-- Methods -->
    <div class="methods-section">
      <h3 class="mt-5">Methods</h3>
      <p>
        The data for shooting victims in this application is automatically
        updated daily. As noted on Open Data Philly's
        <a
          href="https://metadata.phila.gov/#home/datasetdetails/5719551277d6389f3005a610/representationdetails/5719551277d6389f3005a614/"
          target="blank_"
          >documentation page</a
        >:
      </p>
      <p class="indented">
        The shooting victims data source is maintained by the Statistics Unit
        within the Philadelphia Police Department (only staffed on weekdays).
        The shooting victim information is entered manually to the source
        database by examining investigative reports from Detectives. Due to this
        manual process, shooting victim data are updated on Open Data Philly
        daily by ~10:30 am.
      </p>

      <p>
        It is important to note that the total homicide count, as given on the
        Philadelphia Police Department's crime statistics website includes
        homicides of all kinds, rather than just firearm-related homicides.
      </p>

      <p>
        All data presented in this application is preliminary and may not agree
        with criminal incident data publicly available from other sources. In
        particular, information on fatal shootings from the shooting victims
        dataset may underestimate the total number of firearm-related homicides.
      </p>

      <p>
        Information on court cases associated with shooting incidents is updated
        on a weekly basis. Court case information is determiend by searching for
        the police incident number for each shooting incident (the "DC number")
        using the Philadelphia Municipal Court interface of the Unified Judicial
        System of Pennsylvania web portal.
      </p>

      <p>
        The software behind this application is publicly available on the
        <a href="https://github.com/PhiladelphiaController" target="blank_"
          >Controller's Office's GitHub:</a
        >:
      </p>
      <ul>
        <li>
          <a
            href="https://github.com/PhiladelphiaController/GunViolenceDashboard"
            target="blank_"
          >
            <i class="fas fa-external-link-alt mr-2"></i>
            <span class="url-break">
              https://github.com/PhiladelphiaController/GunViolenceDashboard</span
            ></a
          >
        </li>
        <li>
          <a
            href="https://github.com/PhiladelphiaController/gun-violence-dashboard-data"
            target="blank_"
          >
            <i class="fas fa-external-link-alt mr-2"></i>
            <span class="url-break">
              https://github.com/PhiladelphiaController/gun-violence-dashboard-data
            </span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Feedback -->
    <div class="feedback-section">
      <h3 class="mt-5">Application Feedback</h3>
      <p>
        If you've noticed a bug in this application or have suggestions for how
        to make it better, please send an email to
        <a href="mailto:controller@phila.gov">controller@phila.gov</a> to let us
        know. You can also send
        <a href="https://twitter.com/PhilaController" target="blank_"
          >@PhilaController</a
        >
        a tweet or open up a new
        <a
          href="https://github.com/PhiladelphiaController/gun-violence-dashboard/issues"
          >GitHub Issue</a
        >.
      </p>
    </div>
  </div>
</template>

<script>
import { blob } from "d3-fetch";

export default {
  data() {
    return {
      minYear: 2015,
      currentYear: new Date().getFullYear(),
      courtsDataUrl:
        "https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/raw/scraped_courts_data.json",
    };
  },
  computed: {
    dataYears() {
      return this.$store.state.dataYears;
    },
  },
  mounted() {
    if (window.FontAwesome) window.FontAwesome.dom.i2svg();
  },
  methods: {
    getShootingDataUrl(year) {
      return `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/shootings_${year}.json`;
    },
    downloadItem({ url, label }) {
      blob(url)
        .then((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = label;
          link.click();
          URL.revokeObjectURL(link.href);
        })
        .catch(console.error);
    },
  },
};
</script>

<style>
.url-break {
  word-wrap: break-word;
}
.shooting-victims-download div:not(:last-child) {
  margin-right: 1.5rem;
}
.shooting-victims-download {
  display: flex;
  flex-direction: row;
}

@media only screen and (max-width: 767px) {
  .shooting-victims-download {
    display: flex;
    flex-direction: column;
  }
  .shooting-victims-download:nth-child(2) {
    margin-top: 1rem;
  }
}

.about-page {
  text-align: left;
}

.indented {
  margin-left: 50px;
  font-style: italic;
}

.about-page ul {
  list-style-type: none;
  line-height: 2;
}

.about-page a {
  color: #7ab5e5 !important;
}
.about-page a:hover {
  text-decoration: underline;
}
.fa-external-link-alt {
  color: #7ab5e5 !important;
}
.fa-external-link-alt:hover {
  color: #3681bf !important;
}
</style>