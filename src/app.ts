import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './infrastructure/http/routes';
import { obterOpcoesCors } from './infrastructure/http/config/cors';
import { criarRateLimitGlobal } from './infrastructure/http/config/rateLimit';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(obterOpcoesCors()));
app.use(express.json({ limit: '500kb' }));
app.use(criarRateLimitGlobal());

app.use(routes);

export default app;
