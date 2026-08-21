import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import type { MultipartFile } from '@fastify/multipart'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_ROOT = path.join(__dirname, '../../uploads')

const EXTENSOES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

function ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * Grava um arquivo de upload multipart em `uploads/<pasta>/`, com nome gerado
 * (evita path traversal e colisão) - retorna o path público (ex.: /uploads/banners/xxx.png).
 */
export async function salvarArquivo(pasta: string, arquivo: MultipartFile) {
    const dir = path.join(UPLOADS_ROOT, pasta)
    ensureDirExists(dir)

    const ext = path.extname(arquivo.filename).toLowerCase()
    const extSegura = EXTENSOES_PERMITIDAS.includes(ext) ? ext : ''
    const nomeArquivo = `${Date.now()}-${crypto.randomUUID()}${extSegura}`

    const buffer = await arquivo.toBuffer()

    // @fastify/multipart trunca o arquivo em silêncio quando passa do limite configurado
    // (não lança erro sozinho) - sem essa checagem, salvaríamos uma imagem corrompida com 201 de sucesso.
    if (arquivo.file.truncated) {
        throw new Error('Arquivo maior que o limite permitido (8MB).')
    }

    fs.writeFileSync(path.join(dir, nomeArquivo), buffer)

    return `/uploads/${pasta}/${nomeArquivo}`
}

/** Remove um arquivo a partir do path público salvo no banco (ex.: /uploads/banners/xxx.png). */
export function removerArquivo(pathPublico: string) {
    const relativo = pathPublico.replace(/^\/uploads\//, '')
    const caminhoAbsoluto = path.join(UPLOADS_ROOT, relativo)

    fs.unlink(caminhoAbsoluto, () => {})
}

export function ensureUploadsRoot() {
    ensureDirExists(UPLOADS_ROOT)
}

export { UPLOADS_ROOT }
