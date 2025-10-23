// Script para criar um áudio de fallback simples
const fs = require('fs');
const path = require('path');

// Cria um arquivo de áudio silencioso de 5 segundos no formato WAV
const audioData = Buffer.from(
  'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00' +
  'D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00',
  'binary'
);

const outputPath = path.join(__dirname, '..', 'public', 'audio', 'fallback', 'placeholder.mp3');

// Cria o diretório se não existir
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Escreve o arquivo
fs.writeFileSync(outputPath, audioData);

console.log(`Arquivo de áudio de fallback criado em: ${outputPath}`);
