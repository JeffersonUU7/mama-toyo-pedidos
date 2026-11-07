import { app, NODE_ID } from './app';

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`[${NODE_ID}] Servidor escuchando en el puerto ${PORT}`);
});
