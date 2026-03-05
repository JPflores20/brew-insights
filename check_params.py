import pandas as pd

df = pd.read_excel('public/76E15543.xlsx')
filtro = df[df['TEILANL'].str.contains('filtro', case=False, na=False)]

all_params = []
for idx, r in filtro.iterrows():
    for i in range(1, 25):
        name_col = f'NAME_DFM{i}'
        dim_col = f'DIM_DFM{i}'
        name = str(r[name_col]).strip()
        dim = str(r[dim_col]).strip()
        if pd.notna(r[name_col]) and name.lower() != 'nan':
            all_params.append((name, dim))

unique_params = sorted(list(set(all_params)))

with open('temp_params_filtro.txt', 'w', encoding='utf-8') as f:
    for p in unique_params:
        f.write(f"NAME: {p[0]} | UNIT: {p[1]}\n")
