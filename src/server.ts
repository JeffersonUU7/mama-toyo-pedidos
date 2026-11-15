
import { app, NODE_ID } from './app';
import { inicializarPedidos } from './pedidos';

const PORT = Number(process.env.PORT ?? 3000);

async function iniciarServidor() {
  try {
    await inicializarPedidos();
    app.listen(PORT, () => {
      console.log(`[${NODE_ID}] Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

iniciarServidor();
