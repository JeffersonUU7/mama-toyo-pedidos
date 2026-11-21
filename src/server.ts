import { app, NODE_ID } from './app';
import { inicializarPedidos, cerrarPedidos } from './pedidos';

const PORT = Number(process.env.PORT ?? 3000);

async function iniciarServidor() {
  try {
    await inicializarPedidos();

    const servidor = app.listen(PORT, () => {
      console.log(`[${NODE_ID}] Servidor escuchando en el puerto ${PORT}`);
    });

    // Cierre ordenado: deja de aceptar peticiones, espera las abiertas y cierra el pool.
    const apagar = (senal: string) => {
      console.log(`[${NODE_ID}] ${senal} recibido: cerrando servidor`);

      servidor.close(async () => {
        try {
          await cerrarPedidos();
        } catch (error) {
          console.error(
            `[${NODE_ID}] Error al cerrar PostgreSQL:`,
            error
          );
        }

        process.exit(0);
      });
    };

    process.on('SIGTERM', () => apagar('SIGTERM'));
    process.on('SIGINT', () => apagar('SIGINT'));
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

iniciarServidor();