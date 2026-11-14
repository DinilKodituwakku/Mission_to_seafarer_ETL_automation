import json, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from openpyxl import Workbook

rows = json.load(sys.stdin)
now = datetime.now(ZoneInfo('Australia/Melbourne'))
folder = Path(__file__).resolve().parent.parent / 'data' / 'port_snapshots'
folder.mkdir(parents=True, exist_ok=True)
path = folder / f'portview_{now:%Y-%m-%d_%H%M%S}.xlsx'
w = Workbook()
s = w.active
for row in rows:
    s.append(row)
w.save(path)
print(f'Saved {len(rows)-1} ships to {path}')
