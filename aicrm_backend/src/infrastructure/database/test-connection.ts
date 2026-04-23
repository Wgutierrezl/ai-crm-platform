import { AppDataSource } from './data-source';

async function testConnection() {
  try {
    const dataSource = await AppDataSource.initialize();

    // Ejecuta una consulta simple para validar conectividad real.
    const result = await dataSource.query('SELECT 1 AS ok');

    console.log('Conexion a la base de datos exitosa.');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Resultado de prueba: ${JSON.stringify(result)}`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error al conectar con la base de datos.');
    console.error(error);
    process.exit(1);
  }
}

void testConnection();
