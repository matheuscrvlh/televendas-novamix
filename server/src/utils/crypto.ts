import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey() {
    const raw = process.env.CPF_ENCRYPTION_KEY
    if (!raw) throw new Error('Erro ao encontrar CPF_ENCRYPTION_KEY no .env.')

    const key = Buffer.from(raw, 'base64')
    if (key.length !== 32) {
        throw new Error('CPF_ENCRYPTION_KEY precisa ser uma chave base64 de 32 bytes (AES-256).')
    }
    return key
}

/**
 * Criptografa com AES-256-GCM. Formato salvo: "iv:authTag:ciphertext" (tudo em base64),
 * cabe direto numa coluna text sem esquema extra.
 */
export function encrypt(valor: string) {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`
}

/**
 * Descriptografa. Dado legado (gravado antes de existir criptografia, ou corrompido)
 * não tem o formato "iv:authTag:ciphertext" ou falha na autenticação — nesses casos volta
 * como veio em vez de derrubar a tela que está exibindo o dado.
 */
export function decrypt(valor: string) {
    const partes = valor.split(':')
    if (partes.length !== 3) return valor

    const [ivB64, authTagB64, ciphertextB64] = partes
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'))
        decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
        const texto = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()])
        return texto.toString('utf8')
    } catch {
        return valor
    }
}

export function encryptNullable(valor: string | null | undefined) {
    return valor == null ? null : encrypt(valor)
}

export function decryptNullable(valor: string | null) {
    return valor == null ? null : decrypt(valor)
}
