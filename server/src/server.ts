import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { meRoutes } from './routes/me.routes';
import { televendasRoutes } from './routes/televendas.routes';
import { categoriaRoutes } from './routes/categoria.routes';
import { clienteRoutes } from './routes/cliente.routes';
import { pedidoAdminRoutes } from './routes/pedidoAdmin.routes';
import { configuracoesRoutes } from './routes/configuracoes.routes';
import { bannerRoutes } from './routes/banner.routes';
import { connCiss } from './database/ciss.database.ts';
import { ensureUploadsRoot, UPLOADS_ROOT } from './services/upload.service';

const app = fastify();

await app.register(cors, {
    origin: ['https://hub.lojanovamix.com.br', 'http://localhost:5173'],
    credentials: true
});

if(!process.env.SERVER_PORT) {
    throw new Error('Erro ao encontrar SERVER_PORT no .env.')
} else if (!process.env.JWT_SECRET) {
    throw new Error('Erro ao encontrar JWT_SECRET no .env.')
} else if (!process.env.CISS_DATABASE_URL) {
    throw new Error('Erro ao encontrar CISS_DATABASE_URL no .env.')
} else if (!process.env.SUPABASE_DATABASE_URL) {
    throw new Error('Erro ao encontrar SUPABASE_DATABASE_URL no .env.')
};

ensureUploadsRoot();

app.register(cookie);
app.register(multipart);
app.register(fastifyStatic, { root: UPLOADS_ROOT, prefix: '/uploads/' });
app.register(meRoutes);
app.register(televendasRoutes);
app.register(categoriaRoutes);
app.register(clienteRoutes);
app.register(pedidoAdminRoutes);
app.register(configuracoesRoutes);
app.register(bannerRoutes);

async function start() {
    await app.listen({ host: '0.0.0.0', port: process.env.SERVER_PORT})
    console.log(`Servidor rodando em ${process.env.SERVER_PORT}`);
    
    const conn = await connCiss()
    await conn.query(`SELECT CURRENT TIMESTAMP FROM SYSIBM.SYSDUMMY1`)
    console.log(`Banco CISS conectado.`);
    await conn.close()
}

start()
