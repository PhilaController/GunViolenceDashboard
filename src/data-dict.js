
// Dimensions of data that be filtered
const DIMS = ["year", "date", "time", "fatal", "race", "age", "sex", "has_court_case", "weekday"]

// Output
const OUTPUT_COLUMNS = {
    "dc_key": "Police Incident Number",
    "race": "Race/Ethnicity",
    "sex": "Gender",
    "age": "Age",
    "fatal": "Outcome",
    "date": "Date",
    "block_number": "Block Number",
    "street_name": "Street Name",
    "has_court_case": "Associated Court Case",
    "zip": "ZIP Code",
    "council": "Council District",
    "police": "Police District",
    "hood": "Neighborhood",
    "school": "Elementary School Catchment",
    "house_district": "PA House District",
    "lat": "Latitude",
    "lng": "Longitude"
}

// Categories for specific dimensions
const CATEGORIES = {
    "fatal": [true, false],
    "race": ["W", "B", "H", "A", "Other/Unknown"],
    "sex": ["M", "F"],
    "age_group": [
        "Younger than 18",
        "18 to 30",
        "31 to 45",
        "Older than 45",
        "Unknown",
    ],
    "has_court_case": [true, false]
}

// Display aliases for dimensions
const ALIASES = {
    fatal: { 1: "Fatal", 0: "Nonfatal", true: "Fatal", false: "Nonfatal" },
    has_court_case: { true: "Yes", false: "No" },
    weekday: {
        0: "Sunday",
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
    },
    race: {
        W: "White (Non-Hispanic)",
        B: "Black (Non-Hispanic)",
        H: "Hispanic (Black or White)",
        A: "Asian",
        "Other/Unknown": "Other/Unknown"
    },
    sex: {
        M: "Male",
        F: "Female",
    },
    layer: {
        points: "Point locations",
        heatmap: "Heat map",
        streets: "Hot spots by street block",
    },
    aggLayer: {
        council: "Council Districts",
        police: "Police Districts",
        zip: "ZIP Codes",
        hood: "Neighborhoods",
        school: "Elementary School Catchments",
        house_district: "PA House Districts",
    },
}

// Aggregation Layers
const AGG_LAYER_URLS = {
    police:
        "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Boundaries_District/FeatureServer/0",
    council:
        "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Council_Districts_2016/FeatureServer/0/",
    zip: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_ZCTA_2018/FeatureServer/0",
    hood: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philly_NTAs/FeatureServer/0",
    house_district:
        "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PA_House_Districts/FeatureServer/0",
    school:
        "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Elementary_School_Catchments_SY_2019_2020/FeatureServer/0",
}

const AGG_LAYERS = Array.from(Object.keys(AGG_LAYER_URLS))


export { AGG_LAYER_URLS, AGG_LAYERS, ALIASES, CATEGORIES, DIMS, OUTPUT_COLUMNS }