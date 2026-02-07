# -*- coding: utf-8 -*-
"""
AGRUPAR TEILANL POR GRUPOS (Cocedor 1 juntos, Cocedor 2 juntos, Reclamo Arroz juntos, etc.)
y calcular ciclo total REAL/ESPERADO por batch + grupo, en MINUTOS.

- SW_ZEIT / IW_ZEIT (AD/AE) vienen en SEGUNDOS -> se convierten a MINUTOS.
- Usa SZ/EZ para detectar huecos (gaps) entre pasos:
    * max_gap_min por ciclo = hueco máximo entre pasos
    * idle_wall_minus_sumsteps_min = tiempo muerto estimado por timestamps
- Imprime en consola con nombres cortos para que NO se “wrappee” en PowerShell.
- [NUEVO] Genera 'brew_data.json' para el dashboard web.

Salidas:
  ./salidas
  ./salidas/por_grupo_teilanl/                 (un CSV por TEILANL_GRUPO)
  ./salidas/12_ciclos_por_grupo_TEILANL.xlsx   (una hoja por TEILANL_GRUPO)
  ./salidas/13_resumen_por_grupo_TEILANL.csv   (resumen completo por grupo)
  ./salidas/02_ciclos_por_lote_grupo.csv       (ciclos por batch+grupo)
  ./salidas/07_schedule_real_con_gaps.csv      (eventos ordenados con gaps)
  ./salidas/brew_data.json                     (DATOS PARA LA WEB)

Requisitos:
  pip install pandas numpy openpyxl
"""

import os
import re
import argparse
import unicodedata
import shutil
import numpy as np
import pandas as pd

DEFAULT_INPUT = "76E15543.xlsx"
# Puedes cambiar esto a "public" si quieres que vaya directo a la web
DEFAULT_OUTDIR = "salidas" 


# =========================
# HELPERS
# =========================
def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def read_input(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"No existe el archivo: {path}")

    ext = os.path.splitext(path)[1].lower()
    if ext in [".xlsx", ".xlsm", ".xls"]:
        return pd.read_excel(path)  # requiere openpyxl
    if ext == ".csv":
        return pd.read_csv(path, encoding="utf-8", low_memory=False)
    raise ValueError(f"Extensión no soportada: {ext}")


def build_timestamp(df: pd.DataFrame, prefix: str) -> pd.Series:
    y = pd.to_numeric(df.get(f"{prefix}_JAHR"), errors="coerce")
    y = np.where(pd.notna(y) & (y < 100), y + 2000, y)

    return pd.to_datetime(
        dict(
            year=y,
            month=pd.to_numeric(df.get(f"{prefix}_MONAT"), errors="coerce"),
            day=pd.to_numeric(df.get(f"{prefix}_TAG"), errors="coerce"),
            hour=pd.to_numeric(df.get(f"{prefix}_STUNDE"), errors="coerce"),
            minute=pd.to_numeric(df.get(f"{prefix}_MINUTE"), errors="coerce"),
            second=pd.to_numeric(df.get(f"{prefix}_SEKUNDE"), errors="coerce"),
        ),
        errors="coerce",
    )


def safe_numeric(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce")


def strip_accents(s: str) -> str:
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    return "".join(ch for ch in s if not unicodedata.combining(ch))


def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = str(s).strip()
    if not s:
        return ""
    s = strip_accents(s).lower()
    s = s.replace("_", " ").replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def title_keep_acronyms(base: str) -> str:
    if not base:
        return "SIN_TEILANL"
    words = base.split()
    out = []
    for w in words:
        if w == "ve":
            out.append("VE")
        else:
            out.append(w.capitalize())
    return " ".join(out)


def teil_group(teil: str) -> str:
    """
    Regla de agrupación:
    - Reclamo * => ignora número final (Reclamo Arroz 1/2 -> Reclamo Arroz)
    - Cocedor/Macerador/Enfriador/Rotapool/Tanque/etc. => conserva número final si existe
    - Otros => ignora número final (más agrupación)
    """
    s = normalize_text(teil)
    if not s:
        return "SIN_TEILANL"

    s = re.sub(r"[^\w\s\.]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()

    m = re.match(r"^(.*?)(?:\s+0*(\d+))?$", s)
    base = (m.group(1) or "").strip()
    num = m.group(2)

    base = re.sub(r"\s+", " ", base).strip()

    if base.startswith("reclamo "):
        return title_keep_acronyms(base)

    keep_num_prefixes = (
        "cocedor", "macerador", "enfriador", "rotapool", "olla",
        "tanque", "tq", "filtro", "lavado", "trub", "ve",
        "molienda", "grits", "linea",
    )

    if num and any(base.startswith(p) for p in keep_num_prefixes):
        return f"{title_keep_acronyms(base)} {int(num)}"

    return title_keep_acronyms(base)


def sanitize_filename(name: str) -> str:
    name = (name or "").strip() or "SIN_TEILANL"
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', "_", name)
    return name.replace(" ", "_")[:120]


def sanitize_sheet(name: str) -> str:
    name = (name or "").strip() or "SIN_TEILANL"
    name = re.sub(r"[:\\/?*\[\]]", "_", name)
    name = re.sub(r"\s+", " ", name)
    return name[:31]


def normalize_id_series(s: pd.Series) -> pd.Series:
    """
    Normaliza IDs para comparar contra lo que escribe el usuario:
    - quita espacios
    - quita comas
    - convierte 7609.0 -> 7609
    """
    out = s.astype("string").str.strip()
    out = out.str.replace(",", "", regex=False)
    out = out.str.replace(r"\.0+$", "", regex=True)
    out = out.replace({"nan": pd.NA, "None": pd.NA, "NaT": pd.NA})
    return out


def prompt_cocimiento() -> str | None:
    print("\n=== ANALISIS INDUSTRIAL ===")
    print("Te voy a pedir el número de cocimiento.")
    print("TIP: si presionas ENTER sin escribir nada, se analizan TODOS.\n")
    raw = input("Ingresa el número de cocimiento: ").strip()
    if raw == "":
        return None
    raw = raw.replace(",", "").replace(" ", "")
    raw = re.sub(r"\.0+$", "", raw)
    return raw


# =========================
# MAIN
# =========================
def run(path_in: str, out_dir: str) -> None:
    ensure_dir(out_dir)

    cocimiento_in = prompt_cocimiento()

    print(f"\n--- Leyendo archivo: {path_in} ---")
    df = read_input(path_in)

    # -------------------------
    # Asegurar columnas base
    # -------------------------
    for col in ["CHARG_NR", "TEILANL", "GOP_NAME"]:
        if col not in df.columns:
            df[col] = pd.NA

    # Fallback: si CHARG_NR viene con otro nombre
    if (df["CHARG_NR"].isna().all()) and (len(df.columns) > 22):
        cand = df.columns[22]  # W (0-based 22)
        if cand != "CHARG_NR":
            df = df.rename(columns={cand: "CHARG_NR"})

    # -------------------------
    # FILTRO POR COCIMIENTO (ANTES DE TODO)
    # -------------------------
    if cocimiento_in is not None:
        candidates = []
        if "CHARG_NR" in df.columns:
            candidates.append("CHARG_NR")
        for extra in ["COCIMIENTO", "NUM_COCIMIENTO", "COCIMIENTO_NR"]:
            if extra in df.columns and extra not in candidates:
                candidates.append(extra)
        if len(df.columns) > 22 and df.columns[22] not in candidates:
            candidates.append(df.columns[22])

        filtered = pd.DataFrame()
        used_col = None

        for c in candidates:
            s_norm = normalize_id_series(df[c])
            m = df[s_norm == cocimiento_in]
            if not m.empty:
                filtered = m.copy()
                used_col = c
                break

        if filtered.empty:
            print(f"\n⚠️ No se encontraron datos para el cocimiento {cocimiento_in}.")
            return

        df = filtered
        print(f"\n✅ Filtrado aplicado: cocimiento={cocimiento_in} (columna: {used_col})")
        print(f"   Filas después del filtro: {len(df):,}")

    # -------------------------
    # SW_ZEIT / IW_ZEIT
    # -------------------------
    if "SW_ZEIT" not in df.columns or "IW_ZEIT" not in df.columns:
        cols = list(df.columns)
        if len(cols) >= 31:
            df = df.rename(columns={cols[29]: "SW_ZEIT", cols[30]: "IW_ZEIT"})
        else:
            raise KeyError("No encuentro SW_ZEIT/IW_ZEIT (AD/AE) en el archivo.")

    df["TEILANL"] = df["TEILANL"].astype("string").str.strip()
    df["GOP_NAME"] = df["GOP_NAME"].astype("string").str.strip()

    # Grupo normalizado
    df["TEILANL_GRUPO"] = df["TEILANL"].apply(teil_group)

    print("Procesando fechas inicio/fin (SZ/EZ)...")
    df["Inicio_Real"] = build_timestamp(df, "SZ")
    df["Fin_Real"] = build_timestamp(df, "EZ")

    # SW/IW vienen en segundos -> convertir a minutos
    df["sw_min"] = safe_numeric(df["SW_ZEIT"]) / 60.0
    df["iw_min"] = safe_numeric(df["IW_ZEIT"]) / 60.0

    # Duración por timestamps (min)
    df["dur_ts_min"] = (df["Fin_Real"] - df["Inicio_Real"]).dt.total_seconds() / 60.0

    # Orden de eventos
    keys = ["CHARG_NR", "TEILANL_GRUPO"]
    evt = df.sort_values(keys + ["Inicio_Real"]).copy()

    # =========================
    # 1) CICLO TOTAL POR BATCH+GRUPO (min)
    # =========================
    ciclo = (
        evt.groupby(keys, dropna=False)
        .agg(
            ciclo_inicio=("Inicio_Real", "min"),
            ciclo_fin=("Fin_Real", "max"),
            pasos=("GOP_NAME", "count"),
            esperado_total_min=("sw_min", "sum"),
            real_total_min=("iw_min", "sum"),
            suma_ts_min=("dur_ts_min", "sum"),
        )
        .reset_index()
    )

    ciclo["ciclo_wall_min"] = (ciclo["ciclo_fin"] - ciclo["ciclo_inicio"]).dt.total_seconds() / 60.0
    ciclo["idle_wall_minus_sumsteps_min"] = (ciclo["ciclo_wall_min"] - ciclo["suma_ts_min"]).clip(lower=0)

    ciclo["delta_total_min"] = ciclo["real_total_min"] - ciclo["esperado_total_min"]
    ciclo["pct_delta_total"] = np.where(
        ciclo["esperado_total_min"] > 0,
        ciclo["delta_total_min"] / ciclo["esperado_total_min"],
        np.nan,
    )

    # =========================
    # 2) SCHEDULE REAL + GAPS (para max_gap)
    # =========================
    sched = evt[
        ["CHARG_NR", "TEILANL_GRUPO", "GOP_NAME", "Inicio_Real", "Fin_Real", "sw_min", "iw_min", "dur_ts_min"]
    ].copy()
    sched = sched.sort_values(keys + ["Inicio_Real"])

    sched["prev_fin"] = sched.groupby(keys, dropna=False)["Fin_Real"].shift(1)
    sched["gap_before_min"] = (sched["Inicio_Real"] - sched["prev_fin"]).dt.total_seconds() / 60.0
    sched["gap_before_min"] = sched["gap_before_min"].fillna(0).clip(lower=0)

    gaps_ciclo = (
        sched.groupby(keys, dropna=False)
        .agg(
            idle_gap_min=("gap_before_min", "sum"),
            max_gap_min=("gap_before_min", "max"),
        )
        .reset_index()
    )
    ciclo = ciclo.merge(gaps_ciclo, on=keys, how="left")

    # =========================
    # 3) RESUMEN COMPLETO POR GRUPO
    # =========================
    resumen_grupo = (
        ciclo.groupby("TEILANL_GRUPO", dropna=False)
        .agg(
            n_ciclos=("CHARG_NR", "count"),
            avg_real_total_min=("real_total_min", "mean"),
            avg_esperado_total_min=("esperado_total_min", "mean"),
            avg_delta_min=("delta_total_min", "mean"),
            avg_pct_delta_total=("pct_delta_total", "mean"),
            avg_idle_min=("idle_wall_minus_sumsteps_min", "mean"),
            avg_max_gap_min=("max_gap_min", "mean"),
        )
        .reset_index()
    )

    # % humano
    resumen_grupo["avg_pct_delta_total"] = resumen_grupo["avg_pct_delta_total"] * 100.0

    # Orden por nombre
    sort_m = resumen_grupo["TEILANL_GRUPO"].astype(str).str.extract(r"^(.*?)(?:\s+(\d+))?$")
    resumen_grupo["_base"] = sort_m[0].str.strip()
    resumen_grupo["_num"] = pd.to_numeric(sort_m[1], errors="coerce").fillna(9999).astype(int)
    resumen_grupo = resumen_grupo.sort_values(["_base", "_num", "n_ciclos"], ascending=[True, True, False]).drop(columns=["_base", "_num"])

    # =========================
    # EXPORTAR POR GRUPO
    # =========================
    por_grupo_dir = os.path.join(out_dir, "por_grupo_teilanl")
    ensure_dir(por_grupo_dir)

    ciclo_sorted = ciclo.sort_values(["TEILANL_GRUPO", "CHARG_NR"])
    ciclo_sorted.to_csv(os.path.join(out_dir, "02_ciclos_por_lote_grupo.csv"), index=False)

    for grp, g in ciclo_sorted.groupby("TEILANL_GRUPO", dropna=False):
        grp_name = "SIN_TEILANL" if pd.isna(grp) else str(grp)
        g.to_csv(os.path.join(por_grupo_dir, f"ciclos_{sanitize_filename(grp_name)}.csv"), index=False)

    xlsx_path = os.path.join(out_dir, "12_ciclos_por_grupo_TEILANL.xlsx")
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        for grp, g in ciclo_sorted.groupby("TEILANL_GRUPO", dropna=False):
            grp_name = "SIN_TEILANL" if pd.isna(grp) else str(grp)
            g.to_excel(writer, sheet_name=sanitize_sheet(grp_name), index=False)

    # Guardar outputs principales
    evt.to_csv(os.path.join(out_dir, "01_eventos_pasos.csv"), index=False)
    sched.to_csv(os.path.join(out_dir, "07_schedule_real_con_gaps.csv"), index=False)
    resumen_grupo.to_csv(os.path.join(out_dir, "13_resumen_por_grupo_TEILANL.csv"), index=False)

    # =========================================================
    # 4) EXPORTAR JSON PARA LA WEB (BLOQUE NUEVO)
    # =========================================================
    print("\nGenerando JSON para Dashboard Web...")
    json_df = ciclo.copy()
    
    # Formato de fecha estándar ISO 8601 (compatible con JavaScript)
    if "ciclo_inicio" in json_df.columns:
        json_df["timestamp"] = json_df["ciclo_inicio"].dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')
    else:
        json_df["timestamp"] = ""

    # Limpiar valores nulos e infinitos que rompen JSON
    cols_check = ["real_total_min", "esperado_total_min", "delta_total_min", "idle_wall_minus_sumsteps_min"]
    for c in cols_check:
        if c in json_df.columns:
            json_df[c] = json_df[c].replace([np.inf, -np.inf], 0).fillna(0).round(2)

    # Seleccionar columnas exactas para BatchRecord en TypeScript
    json_export = json_df[[
        "CHARG_NR", 
        "TEILANL_GRUPO", 
        "real_total_min", 
        "esperado_total_min", 
        "delta_total_min", 
        "idle_wall_minus_sumsteps_min", 
        "timestamp"
    ]]

    # Guardar archivo JSON
    json_path = os.path.join(out_dir, "brew_data.json")
    json_export.to_json(json_path, orient="records", indent=2)
    print(f"✅ Archivo JSON creado: {json_path}")
    print(">> Importante: Copia este archivo a la carpeta 'public' de tu proyecto web.")

    # =========================
    # IMPRESIÓN CONSOLA
    # =========================
    print("\n--- RESUMEN ---")
    print(f"Eventos (filas):              {len(evt):,}")
    print(f"Ciclos (batch+grupo):         {len(ciclo):,}")
    print(f"TEILANL_GRUPO únicos:         {resumen_grupo['TEILANL_GRUPO'].nunique(dropna=False):,}")

    print("\n--- RESUMEN COMPLETO POR EQUIPO/GRUPO (MINUTOS) ---")
    pretty_console = resumen_grupo.rename(columns={
        "TEILANL_GRUPO": "Grupo",
        "n_ciclos": "Ciclos",
        "avg_real_total_min": "Real_min",
        "avg_esperado_total_min": "Esp_min",
        "avg_delta_min": "Delta_min",
        "avg_pct_delta_total": "%Delta",
        "avg_idle_min": "Idle_min",
        "avg_max_gap_min": "MaxGap_min",
    }).copy()

    for c in ["Real_min", "Esp_min", "Delta_min", "%Delta", "Idle_min", "MaxGap_min"]:
        if c in pretty_console.columns:
            pretty_console[c] = pd.to_numeric(pretty_console[c], errors="coerce").round(2)

    term_w = shutil.get_terminal_size((140, 20)).columns
    with pd.option_context(
        "display.max_rows", None,
        "display.max_columns", None,
        "display.width", term_w,
        "display.expand_frame_repr", False,
    ):
        print(pretty_console.to_string(index=False))

    print("\nSe creó:")
    print(" - salidas/por_grupo_teilanl/  (un CSV por cada grupo)")
    print(" - salidas/12_ciclos_por_grupo_TEILANL.xlsx  (una hoja por grupo)")
    print(" - salidas/13_resumen_por_grupo_TEILANL.csv  (resumen completo por grupo)")
    print(" - salidas/02_ciclos_por_lote_grupo.csv      (ciclos por batch+grupo)")
    print(" - salidas/07_schedule_real_con_gaps.csv     (orden + gaps)")
    print(" - salidas/brew_data.json                    (JSON para la web)")
    print("\nListo. Revisa la carpeta 'salidas'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", default=DEFAULT_INPUT, help="Archivo .xlsx o .csv")
    parser.add_argument("-o", "--out", default=DEFAULT_OUTDIR, help="Carpeta de salida")
    args = parser.parse_args()

    run(args.input, args.out)