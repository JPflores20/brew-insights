"""
Script Auxiliar: Extraer parámetros del Filtro
----------------------------------------------
Este script lee el archivo Excel original y busca todas las columnas de parámetros
(NAME_DFMx y DIM_DFMx) para las filas que corresponden a la maquinaria 'filtro'.
Guarda los parámetros únicos encontrados en un archivo de texto para referencia.
"""
import pandas as pd

# 1. Carga el archivo base de datos
df = pd.read_excel('public/76E15543.xlsx')

# 2. Filtra solo las filas donde la columna TEILANL contiene la palabra 'filtro'
filtro = df[df['TEILANL'].str.contains('filtro', case=False, na=False)]

all_params = []
# 3. Itera sobre las filas del filtro y extrae los nombres de los parámetros y sus unidades (DIM)
for idx, r in filtro.iterrows():
    for i in range(1, 25): # Asume que hay hasta 24 columnas DFM
        name_col = f'NAME_DFM{i}'
        dim_col = f'DIM_DFM{i}'
        name = str(r[name_col]).strip()
        dim = str(r[dim_col]).strip()
        
        # Ignora los valores nulos (nan)
        if pd.notna(r[name_col]) and name.lower() != 'nan':
            all_params.append((name, dim))

# 4. Elimina duplicados convirtiendo a set y luego ordenando la lista
unique_params = sorted(list(set(all_params)))

# 5. Guarda la lista de parámetros únicos en un archivo de texto
with open('temp_params_filtro.txt', 'w', encoding='utf-8') as f:
    for p in unique_params:
        f.write(f"NAME: {p[0]} | UNIT: {p[1]}\n")
