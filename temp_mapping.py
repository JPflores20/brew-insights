import pandas as pd
df = pd.read_excel('public/76E15543.xlsx')

mapping = {}
for idx, r in df.iterrows():
    teil = str(r['TEILANL']).strip()
    for i in range(1, 25):
        n = str(r[f'NAME_DFM{i}']).strip()
        if 'temp. lavado' in n.lower() or 'agua' in n.lower() or 'temperatura' in n.lower():
            if n not in mapping:
                mapping[n] = set()
            mapping[n].add(teil)

with open('temp_mapping.txt', 'w', encoding='utf-8') as f:
    for k, v in mapping.items():
        f.write(f"{k} -> {v}\n")
