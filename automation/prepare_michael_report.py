"""Prepare privacy-minimised period summaries from the existing pipeline sources."""
import calendar,csv,json,re,sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
root=Path(__file__).resolve().parent.parent
notebook=json.loads((root/'daily_ship_pipeline.ipynb').read_text(encoding='utf-8'))
g={}
for cell in notebook['cells']:
    if cell['cell_type']=='code':
        src=''.join(cell['source'])
        if src.startswith('result = []') or src.startswith('# Times are local'): break
        exec(src,g)
ships=g['ships']; dates=g['dates']; latest=g['latest']; norm=g['ship_key']; input_csv=g['SIGN_INS']
ship_visitors=defaultdict(set); berth_visitors=defaultdict(set)
for path in [input_csv,*sorted({x[1] for x in latest.values()})]:
    if not path.exists(): continue
    with path.open(encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            if not (row.get('Time') or '').strip(): continue
            day=datetime.strptime(row['Time'].strip(),'%d/%m/%Y %H:%M:%S').date()
            if day not in dates or (day in latest and latest[day][1]!=path): continue
            key=(day,norm(row.get('Ship','')))
            person=' '.join((row.get('Name') or '').casefold().split())
            if not person or key not in ships: continue
            ship_visitors[key].add(person)
            for berth in ships[key]['berths']: berth_visitors[(day,key[1],berth)].add(person)
start=min(dates); end=max(dates)
periods=[]
day=start
while day<=end:
    periods.append(('Day',day,day))
    periods.append(('Month to date',day.replace(day=1),day))
    periods.append(('Quarter to date',date(day.year,((day.month-1)//3)*3+1,1),day))
    day+=timedelta(days=1)
# Month and quarter history use the last observed date within the period as the as-of date.
monthends={}; quarterends={}
for day in sorted(dates):
    monthends[(day.year,day.month)]=day
    quarterends[(day.year,(day.month-1)//3)]=day
for (year,month),last in sorted(monthends.items()): periods.append(('Month history',date(year,month,1),last))
for (year,q),last in sorted(quarterends.items()): periods.append(('Quarter history',date(year,q*3+1,1),last))
total_rows=[]; ship_rows=[]; berth_rows=[]
for typ,first,last in periods:
    count_days=(last-first).days+1
    captured={d for d in dates if first<=d<=last}
    records={d for d in g['sign_in_dates'] if first<=d<=last}
    info=f'{len(captured)}/{count_days} days have port snapshots; {len(records)}/{count_days} have sign-in records'
    status='Incomplete coverage' if len(captured)<count_days or len(records)<count_days else 'Observed data; review matches'
    byship=defaultdict(lambda:{'names':set(),'berths':set(),'visitors':set()})
    byberth=defaultdict(lambda:{'ships':set(),'visitors':set()})
    for (day,key),info_ship in ships.items():
        if not first<=day<=last: continue
        a=byship[key]; a['names'].add(info_ship['name']); a['berths'].update(info_ship['berths']); a['visitors'].update(ship_visitors[(day,key)])
        for berth in info_ship['berths']:
            b=byberth[berth]; b['ships'].add(key)
            b['visitors'].update((key,p) for p in berth_visitors[(day,key,berth)])
    any_signin=bool(records & captured)
    prefix=[typ,first.isoformat(),last.isoformat()]
    count=len(byship); visitors=sum(len(x['visitors']) for x in byship.values())
    total_rows.append(prefix+[count if captured else None, visitors if any_signin else None, count*22 if captured else None, visitors/(count*22) if count and any_signin else None, info,status])
    for key,a in sorted(byship.items()):
        countv=len(a['visitors']); ship_rows.append(prefix+[sorted(a['names'])[0],', '.join(sorted(a['berths'])),countv if any_signin else None,22,countv/22 if any_signin else None,info,status])
    for berth,b in sorted(byberth.items()):
        count=len(b['ships']); countv=len(b['visitors']); berth_rows.append(prefix+[berth,count,countv if any_signin else None,count*22,countv/(count*22) if count and any_signin else None,info,status])
out={'source_updated':(root/'reports/daily_ship_report.csv').stat().st_mtime,'earliest':start.isoformat(),'latest':end.isoformat(),'totals':total_rows,'ships':ship_rows,'berths':berth_rows}
Path(sys.argv[1]).write_text(json.dumps(out,ensure_ascii=False),encoding='utf-8')
print('Prepared rows:',len(total_rows),'totals,',len(ship_rows),'ships,',len(berth_rows),'berths.')
