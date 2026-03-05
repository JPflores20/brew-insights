import pandas as pd
df = pd.read_excel('public/76E15543.xlsx')

params = set()
for i in range(1, 25):
    names = df[f'NAME_DFM{i}'].dropna().astype(str)
    for n in names:
        nl = n.lower()
        if 'temp' in nl or 'grados' in nl or '°' in nl:
            params.add(n)

with open('temp_params_global.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(sorted(list(params))))
