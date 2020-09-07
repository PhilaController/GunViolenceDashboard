import carto2gpd
import numpy as np
import pandas as pd

if __name__ == "__main__":

    data = (
        carto2gpd.get("https://phl.carto.com/api/v2/sql", "shootings")
        .assign(
            time=lambda df: df.time.replace("<Null>", np.nan).fillna("00:00:00"),
            date=lambda df: pd.to_datetime(
                df.date_.str.slice(0, 10).str.cat(df.time, sep=" ")
            ),
            year=lambda df: df.date.dt.year,
            race=lambda df: df.race.fillna("Other/Unknown"),
            age=lambda df: df.age.astype(float),
            age_group=lambda df: np.select(
                [
                    df.age < 18,
                    (df.age >= 18) & (df.age <= 30),
                    (df.age > 30) & (df.age <= 45),
                    (df.age > 45),
                ],
                ["Under 18", "19 to 30", "31 to 45", "Greater than 45"],
                default="Unknown",
            ),
        )
        .drop(labels=["point_x", "point_y", "date_", "time", "objectid"], axis=1)
        .sort_values("date", ascending=False)
        .reset_index(drop=True)
    )

    for year in sorted(data["year"].unique()):

        # This year
        X = data.query(f"year == {year}")

        # Save geojson
        X[
            [
                "geometry",
                "dc_key",
                "race",
                "sex",
                "age",
                "latino",
                "fatal",
                "date",
                "age_group",
            ]
        ].to_file(f"../src/data/shootings_{year}.json", driver="GeoJSON")

        # Daily counts
        N = X.set_index("date").groupby(pd.Grouper(freq="D")).size()
        N.index = N.index.strftime("%Y-%m-%d")
        N.reset_index(name="count").to_json(
            f"../src/data/shootings_{year}_daily.json", orient="records"
        )
