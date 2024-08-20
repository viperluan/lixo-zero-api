import app from './app';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API executando no endereço: http://localhost:${PORT}`);
});
