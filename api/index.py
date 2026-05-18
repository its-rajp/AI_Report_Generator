import sys
import os
from pathlib import Path

# Add backend directory to Python path so imports work correctly in Vercel
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from src.api.main import app
