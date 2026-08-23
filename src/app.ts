import express from 'express';
import cors from 'cors';
import routes from './infrastructure/http/routes';
import { obterOpcoesCors } from './infrastructure/http/config/cors';

const app = express();

app.use(cors(obterOpcoesCors()));
app.use(express.json());

app.use(routes);

export default app;
