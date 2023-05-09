<template>
  <div>
    <!-- Top app navbar -->
    <navbar :data-years="dataYears" />

    <!-- About page -->
    <div class="container about-page">
      <!-- Data Sources -->
      <div class="data-section section">
        <h2>Data</h2>

        <!-- Disclaimer -->
        <p>
          This application was developed by the City Controller's Office using
          publicly available data from the City of Philadelphia and
          Pennsylvania's Unified Judicial System. The data is provided for
          informational purposes only in accordance with the office's goals of
          transparency, accountability, and good government.
        </p>

        <!-- List original data sources -->
        <ul>
          <li>
            <a
              href="https://www.opendataphilly.org/dataset/shooting-victims"
              target="blank_"
              ><i class="fas fa-external-link-alt"></i
              ><span class="ml-2">Shooting victims data</span></a
            >
            from the City of Philadelphia's open data program, posted on
            OpenDataPhilly.org
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
      </div>

      <!-- Methods -->
      <div class="methods-section section">
        <h2>Methods</h2>
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
          database by examining investigative reports from Detectives. Due to
          this manual process, shooting victim data are updated on Open Data
          Philly daily by ~10:30 am.
        </p>

        <p>
          It is important to note that the total homicide count, as given on the
          Philadelphia Police Department's crime statistics website includes
          homicides of all kinds, rather than just firearm-related homicides.
        </p>

        <p>
          All data presented in this application is preliminary and may not
          agree with criminal incident data publicly available from other
          sources. In particular, information on fatal shootings from the
          shooting victims dataset may underestimate the total number of
          firearm-related homicides.
        </p>

        <p>
          Information on court cases associated with shooting incidents is
          updated on a weekly basis. Court case information is determined by
          searching for the police incident number for each shooting incident
          (the "DC number") using the Philadelphia Municipal Court interface of
          the Unified Judicial System of Pennsylvania web portal.
        </p>

        <p>
          The software behind this application is publicly available on the
          <a href="https://github.com/PhilaController" target="blank_"
            >Controller's Office's GitHub:</a
          >:
        </p>
        <ul>
          <li>
            <a
              href="https://github.com/PhilaController/GunViolenceDashboard"
              target="blank_"
            >
              <i class="fas fa-external-link-alt mr-2"></i>
              <span class="url-break">
                https://github.com/PhilaController/GunViolenceDashboard</span
              ></a
            >
          </li>
          <li>
            <a
              href="https://github.com/PhilaController/gun-violence-dashboard-data"
              target="blank_"
            >
              <i class="fas fa-external-link-alt mr-2"></i>
              <span class="url-break">
                https://github.com/PhilaController/gun-violence-dashboard-data
              </span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Feedback -->
      <div class="feedback-section section">
        <h2>Application Feedback</h2>
        <p>
          If you've noticed a bug in this application or have suggestions for
          how to make it better, please send an email to
          <a href="mailto:controller@phila.gov">controller@phila.gov</a> to let
          us know. You can also send
          <a href="https://twitter.com/PhilaController" target="blank_"
            >@PhilaController</a
          >
          a tweet or open up a new
          <a
            href="https://github.com/PhilaController/gun-violence-dashboard/issues"
            >GitHub Issue</a
          >.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Navbar from "@/components/Navbar.vue";

export default defineComponent({
  props: { dataYears: { type: Array, required: true } },
  components: { Navbar },
  mounted() {
    // Convert icons explicitly
    if (window.FontAwesome) window.FontAwesome.dom.i2svg();
  },
});
</script>

<style scoped>
.section {
  margin-top: 60px;
}
.url-break {
  word-wrap: break-word;
}

.about-page {
  text-align: left;
}

.about-page h2 {
  margin-bottom: 1rem;
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
