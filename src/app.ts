import express from 'express';
import cors from 'cors';
import routes from './infrastructure/http/routes';
import { obterOpcoesCors } from './infrastructure/http/config/cors';
import { criarRateLimitGlobal } from './infrastructure/http/config/rateLimit';

const app = express();

app.set('trust proxy', 1);

app.use(cors(obterOpcoesCors()));
app.use(express.json());
app.use(criarRateLimitGlobal());

app.use(routes);

export default app;
