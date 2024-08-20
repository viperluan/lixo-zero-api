import supertest from 'supertest';
import app from '../src/app.js';

const request = supertest(app);

describe('Categoria API Tests', () => {
  it('should allow creating a new categoria', async () => {
    const res = await request.post('/categorias').send({ descricao: 'Reciclagem' }).expect(201);
    expect(res.body.descricao).toEqual('Reciclagem');
  });

  it('should allow creating a new categoria', async () => {
    const res = await request.post('/categorias').send({ descricao: '' }).expect(201);
    expect(res.body.descricao).toEqual('Reciclagem');
  });

  it('should get all categorias', async () => {
    await request
      .get('/categorias')
      .expect(200)
      .then((response) => {
        expect(Array.isArray(response.body)).toBeTruthy();
      });
  });
});
