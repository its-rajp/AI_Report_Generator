import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# On Vercel, only /tmp is writable. Detect Vercel via its environment variable.
IS_VERCEL = os.environ.get("VERCEL") == "1"

if IS_VERCEL:
    BASE_DIR = Path("/tmp")
else:
    BASE_DIR = Path(__file__).parent.parent

DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
PROCESSED_DIR = BASE_DIR / "processed"
TEMPLATES_DIR = BASE_DIR / "templates"
DB_DIR = BASE_DIR / "db"

# Ensure directories exist
for directory in [DATA_DIR, UPLOADS_DIR, PROCESSED_DIR, TEMPLATES_DIR, DB_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDUSTRIES = ["Oil & Gas", "Chemicals", "Pharmaceuticals", "Food & Beverages", "Metal & Mining", "Power Generation"]
SERVICES = ["CFD", "FEA", "DEM", "Process Modeling", "EFD"]
DATABASE_URL = f"sqlite:///{DB_DIR}/reports.db"
