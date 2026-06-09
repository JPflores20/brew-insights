"""
Script Auxiliar: Mapeo de Temperaturas
--------------------------------------
Este script explora el archivo Excel para buscar parámetros relacionados
con temperaturas o agua (temp. lavado, agua, temperatura) y genera un mapeo
de qué máquinas (TEILANL) reportan cada uno de estos parámetros.
"""
import pandas as pd

# 1. Carga el archivo de datos de Excel
df = pd.read_excel('public/76E15543.xlsx')

mapping = {}
# 2. Itera sobre todas las filas del archivo
for idx, r in df.iterrows():
    teil = str(r['TEILANL']).strip() # Nombre de la máquina
    
    # 3. Revisa las 24 columnas posibles de parámetros (NAME_DFM1 a NAME_DFM24)
    for i in range(1, 25):
        n = str(r[f'NAME_DFM{i}']).strip()
        
        # 4. Busca palabras clave: lavado, agua o temperatura
        if 'temp. lavado' in n.lower() or 'agua' in n.lower() or 'temperatura' in n.lower():
            if n not in mapping:
                mapping[n] = set() # Usamos un 'set' para evitar duplicados
            mapping[n].add(teil)

# 5. Guarda el mapeo (Parámetro -> Máquinas que lo tienen) en un archivo txt
with open('temp_mapping.txt', 'w', encoding='utf-8') as f:
    for k, v in mapping.items():
        f.write(f"{k} -> {v}\n")
