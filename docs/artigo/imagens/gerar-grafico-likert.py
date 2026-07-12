# -*- coding: utf-8 -*-
"""Gera o grafico Likert (imagens/grafico-likert.png) a partir do xlsx do formulario.

Uso: python gerar-grafico-likert.py
Requisitos: pip install openpyxl matplotlib

Se chegarem novas respostas, atualize o xlsx em docs/artigo e ajuste
LINHAS_EXCLUIDAS (indices 0-based das respostas invalidas, na ordem do xlsx)
e as estatisticas citadas no texto do artigo (medias, %concordancia, n).
"""
import os
from collections import Counter

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import openpyxl

AQUI = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(AQUI, "..", "Avaliação exploratória do sistema Movy (respostas).xlsx")
SAIDA = os.path.join(AQUI, "grafico-likert.png")

# Resposta 11 (2026-07-04 20:54): so as respostas ABERTAS eram descartadas na
# limpeza (texto incompativel com o questionario). Os itens FECHADOS (escala
# Likert) sao coerentes e
# permanecem validos, entao nenhuma linha e excluida do calculo (as 19 contam).
# As respostas abertas dessa resposta seguem descartadas apenas na analise qualitativa.
LINHAS_EXCLUIDAS = set()

COLS_LIKERT = list(range(21, 29))
ROTULOS = [
    "I1 – Facilidade de uso",
    "I2 – Clareza das informações",
    "I3 – Simplicidade do fluxo",
    "I4 – Funcionamento no dispositivo",
    "I5 – Mais organizado que listas",
    "I6 – Intenção de uso real",
    "I7 – Utilidade percebida",
    "I8 – Satisfação geral",
]
ESCALA = {
    "discordo totalmente": 1,
    "discordo parcialmente": 2,
    "neutro": 3,
    "concordo parcialmente": 4,
    "concordo totalmente": 5,
}
CATEGORIAS = ["Discordo totalmente", "Discordo parcialmente", "Neutro",
              "Concordo parcialmente", "Concordo totalmente"]
CORES = ["#b2182b", "#ef8a62", "#bdbdbd", "#67a9cf", "#2166ac"]

wb = openpyxl.load_workbook(XLSX, data_only=True)
linhas = list(wb.worksheets[0].iter_rows(values_only=True))[1:]
dados = [r for i, r in enumerate(linhas) if i not in LINHAS_EXCLUIDAS]
n = len(dados)
print(f"respostas validas: {n}")

dist, medias = [], []
for ci in COLS_LIKERT:
    vals = [ESCALA[str(r[ci]).strip().lower()] for r in dados if r[ci]]
    c = Counter(vals)
    dist.append([c.get(k, 0) for k in (1, 2, 3, 4, 5)])
    medias.append(sum(vals) / len(vals))
    print(f"{ROTULOS[COLS_LIKERT.index(ci)]:38s} dist={dist[-1]} media={medias[-1]:.2f}")

# I1 no topo do grafico
rotulos, dist, medias = ROTULOS[::-1], dist[::-1], medias[::-1]
pct = np.array(dist, dtype=float) / n * 100

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
fig, ax = plt.subplots(figsize=(9.2, 4.6))
esquerda = np.zeros(len(rotulos))
for ci in range(5):
    vals = pct[:, ci]
    ax.barh(np.arange(len(rotulos)), vals, left=esquerda, color=CORES[ci],
            edgecolor="white", linewidth=0.6, label=CATEGORIAS[ci], height=0.62)
    for bi, (v, l) in enumerate(zip(vals, esquerda)):
        cnt = dist[bi][ci]
        if cnt > 0:
            cor = "white" if ci in (0, 4) else "black"
            ax.text(l + v / 2, bi, str(cnt), ha="center", va="center",
                    fontsize=9, color=cor, fontweight="bold")
    esquerda += vals

for bi, m in enumerate(medias):
    ax.text(101.5, bi, f"média {f'{m:.2f}'.replace('.', ',')}",
            va="center", fontsize=9, color="#333333")

ax.set_yticks(np.arange(len(rotulos)))
ax.set_yticklabels(rotulos, fontsize=10)
ax.set_xlim(0, 114)
ax.set_xticks([0, 20, 40, 60, 80, 100])
ax.set_xticklabels([f"{v} %" for v in (0, 20, 40, 60, 80, 100)])
ax.set_xlabel(f"Percentual das respostas válidas (n = {n})", fontsize=10)
ax.spines[["top", "right"]].set_visible(False)
ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.16), ncol=5, fontsize=8.3,
          frameon=False, handlelength=1.2, handletextpad=0.45, columnspacing=0.9)
fig.tight_layout()
fig.savefig(SAIDA, dpi=300, bbox_inches="tight", facecolor="white")
print("salvo:", SAIDA)
