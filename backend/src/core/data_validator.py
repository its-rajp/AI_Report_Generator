import pandas as pd
from pathlib import Path
from loguru import logger
from typing import Optional

# Required column keyword groups per service type.
# At least ONE keyword from each group must be present in the CSV columns.
SERVICE_REQUIREMENTS = {
    "CFD": [
        {"label": "Position/Coordinate (x, y, z, step, or iter)", "keywords": ["x", "y", "z", "iter", "step", "node", "pos"]},
        {"label": "Flow variable (pressure, velocity, temperature, or residual)", "keywords": ["press", "vel", "temp", "res", "mach", "turb", "energy", "flow"]},
    ],
    "FEA": [
        {"label": "Node coordinate (x, y, z, or node)", "keywords": ["x", "y", "z", "node"]},
        {"label": "Structural result (stress, displacement, strain, or FOS)", "keywords": ["stress", "disp", "strain", "deflect", "fos", "safety", "mises", "force"]},
    ],
    "DEM": [
        {"label": "Spatial coordinate (x, y, lat, lon, east, north)", "keywords": ["x", "y", "lat", "lon", "east", "north"]},
        {"label": "Elevation or terrain data (elev, z, height, slope)", "keywords": ["elev", "z", "height", "alt", "slope", "dem", "terrain"]},
    ],
    "EFD": [
        {"label": "Sales/revenue column (sale, amount, revenue)", "keywords": ["sale", "amount", "revenue", "gross", "net", "total"]},
        {"label": "Time/date column (time, date, hour, day)", "keywords": ["time", "date", "hour", "day", "shift", "period"]},
    ],
    "Process Modeling": [
        {"label": "Process variable (flow, temp, pressure, or rate)", "keywords": ["flow", "temp", "press", "rate", "conc", "level", "volume"]},
    ],
}

FALLBACK_REQUIREMENT = [
    {"label": "At least one numeric column", "keywords": ["__numeric__"]},
]


class DataValidator:
    """
    Validates uploaded CSV files against service-specific column requirements
    before wasting AI tokens or processing time.
    """

    def validate(self, file_path: str, service: str) -> dict:
        """
        Returns a dict:
        {
            "valid": bool,
            "filename": str,
            "columns_found": [str],
            "checks": [{"label": str, "passed": bool, "matched_column": str|None}]
        }
        """
        filename = Path(file_path).name
        try:
            df = pd.read_csv(file_path, nrows=5)
        except Exception as e:
            return {
                "valid": False,
                "filename": filename,
                "columns_found": [],
                "checks": [{"label": "File readable as CSV", "passed": False, "matched_column": str(e)}]
            }

        lower_cols = {c.lower(): c for c in df.columns}
        all_cols = list(df.columns)

        requirements = SERVICE_REQUIREMENTS.get(service.upper(), FALLBACK_REQUIREMENT)
        checks = []
        all_passed = True

        for req in requirements:
            matched = None

            if req["keywords"] == ["__numeric__"]:
                # Special case: just check for any numeric column
                num_cols = df.select_dtypes(include=["number"]).columns.tolist()
                if num_cols:
                    matched = num_cols[0]
            else:
                for keyword in req["keywords"]:
                    for col_lower, col_orig in lower_cols.items():
                        if keyword in col_lower:
                            matched = col_orig
                            break
                    if matched:
                        break

            passed = matched is not None
            if not passed:
                all_passed = False

            checks.append({
                "label": req["label"],
                "passed": passed,
                "matched_column": matched
            })

        return {
            "valid": all_passed,
            "filename": filename,
            "columns_found": all_cols,
            "checks": checks
        }

    def validate_many(self, file_paths: list, service: str) -> dict:
        """Validate multiple files. Returns overall validity + per-file results."""
        results = [self.validate(fp, service) for fp in file_paths]
        overall_valid = all(r["valid"] for r in results)
        return {
            "overall_valid": overall_valid,
            "files": results
        }
