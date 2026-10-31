import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 로컬 개발: npm run dev 에서도 /api/* 서버 함수가 동작하도록 연결 (.env.local의 키 사용)
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), {
      name: 'visync-api-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith('/api/')) return next();
          const name = req.url.slice(5).split('?')[0];
          if (!/^[a-z]+$/.test(name)) { res.statusCode = 404; return res.end(); }
          try {
            const mod = await server.ssrLoadModule('/api/' + name + '.ts');
            const fn = mod[req.method || 'GET'];
            if (typeof fn !== 'function') { res.statusCode = 405; return res.end(); }
            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            const headers = Object.entries(req.headers).filter(([, v]) => typeof v === 'string') as [string, string][];
            const out: Response = await fn(new Request('http://' + req.headers.host + req.url, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }));
            res.statusCode = out.status;
            out.headers.forEach((v, k) => res.setHeader(k, v));
            res.end(Buffer.from(await out.arrayBuffer()));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      }
    }]
  };
});
