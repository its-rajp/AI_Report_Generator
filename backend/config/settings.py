import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# On Vercel, only /tmp is writable. Detect Vercel via its environment variable.
IS_VERCEL = os.environ.get("VERCEL") == "1"

if IS_VERCEL:
    # Vercel: flat structure under /tmp (only writable dir)
    UPLOADS_DIR = Path("/tmp/uploads")
    PROCESSED_DIR = Path("/tmp/processed")
    TEMPLATES_DIR = Path("/tmp/templates")
    DB_DIR = Path("/tmp/db")
else:
    # Local: original nested structure under backend/data/
    _BASE = Path(__file__).parent.parent
    _DATA = _BASE / "data"
    UPLOADS_DIR = _DATA / "uploads"
    PROCESSED_DIR = _DATA / "processed"
    TEMPLATES_DIR = _DATA / "templates"
    DB_DIR = _BASE / "db"

# Ensure all directories exist at startup
for directory in [UPLOADS_DIR, PROCESSED_DIR, TEMPLATES_DIR, DB_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDUSTRIES = ["Oil & Gas", "Chemicals", "Pharmaceuticals", "Food & Beverages", "Metal & Mining", "Power Generation"]
SERVICES = ["CFD", "FEA", "DEM", "Process Modeling", "EFD"]
DATABASE_URL = f"sqlite:///{DB_DIR}/reports.db"
