#!/usr/bin/env bash
set -e

echo "🎄 Compilando Roleta Natalina 3D..."
npm run build

echo "🚀 Enviando para o GitHub Pages..."
npm run deploy

echo "✅ Deploy concluído com sucesso!"
