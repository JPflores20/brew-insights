import pandas as pd

df = pd.read_excel('public/76E15543.xlsx')
filtro = df[df['TEILANL'].str.contains('filtro', case=False, na=False)]
params = set()

for idx, r in filtro.iterrows():
    for i in range(1, 25):
        name_col = f'NAME_DFM{i}'
        dim_col = f'DIM_DFM{i}'
        if pd.notna(r[name_col]):
            params.add((str(r[name_col]).strip(), str(r[dim_col]).strip()))

with open('params_output_all.txt', 'w', encoding='utf-8') as f:
    for p in sorted(list(params)):
        f.write(f"{p[0]} | {p[1]}\n")
