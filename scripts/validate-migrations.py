from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
connection = sqlite3.connect(":memory:")
connection.executescript((root / "drizzle" / "0000_fieldrelay_demo.sql").read_text(encoding="utf-8"))
upgrade = (root / "drizzle" / "0001_primearc_pitch.sql").read_text(encoding="utf-8")
for statement in upgrade.split("--> statement-breakpoint"):
    if statement.strip():
        connection.execute(statement)
columns = {row[1] for row in connection.execute("PRAGMA table_info(demo_sessions)")}
required = {"mode", "profile_json", "receipt_provenance", "failure_code"}
missing = required - columns
if missing:
    raise SystemExit(f"Missing migration columns: {sorted(missing)}")
print("D1-compatible SQLite migrations validated: " + ", ".join(sorted(required)))
