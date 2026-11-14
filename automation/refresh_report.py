"""Run the report notebook after successful data collection."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
notebook = root / 'daily_ship_pipeline.ipynb'
with notebook.open(encoding='utf-8') as handle:
    data = json.load(handle)
namespace = {'__name__': '__main__'}
for cell in data['cells']:
    if cell['cell_type'] == 'code':
        exec(compile(''.join(cell['source']), str(notebook), 'exec'), namespace)
