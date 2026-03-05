import pandas as pd

df = pd.read_excel('public/76E15543.xlsx')
filtro = df[df['TEILANL'].str.contains('filtro', case=False, na=False)]
if not filtro.empty:
    r = filtro.iloc[0]
    with open('params_output.txt', 'w', encoding='utf-8') as f:
        for i in range(1, 25):
            name_col = f'NAME_DFM{i}'
            dim_col = f'DIM_DFM{i}'
            iw_col = f'IW_DFM{i}'
            if pd.notna(r[name_col]):
                f.write(f"{r[name_col]} | {r[dim_col]} | {r[iw_col]}\n")
else:
    with open('params_output.txt', 'w', encoding='utf-8') as f:
        f.write("No filtro found\n")
