# Api-Bank

Api-Bank es una API desarrollada con NestJS, Prisma y PostgreSQL que simula transacciones bancarias basicas entre usuarios. Incluye abm de usuarios, manejo de saldos, depositos, transferencias por alias, dni o username, y validaciones de seguridad.

---

## Funcionalidades

### ABM y Autenticacion de Usuarios
- Registro de usuarios con validacion de datos unicos (email, dni, username y alias).
- Creacion automatica de cuenta bancaria al registrarse con numero de cuenta y alias por defecto.
- Encriptacion de contraseñas con bcryptjs y autenticacion con JWT.

### Cuentas y Alias
- Consulta de informacion de cuenta propia (saldo, alias, numero de cuenta y titular).
- Actualizacion de alias personalizado validando que no este en uso.

### Transacciones
- Depositos: Cargar saldo en la cuenta propia.
- Transferencias: Enviar dinero a otro usuario buscandolo por su alias, dni, username, email o numero de cuenta.
- Historial de movimientos: Consulta de ingresos y egresos con detalle de la contraparte.

### Validaciones
- Validacion de existencia de saldo antes de realizar transferencias.
- Validacion para impedir que un usuario se transfiera dinero a si mismo.
- Transacciones atomicas con prisma para asegurar la consistencia de saldos.
- Validaciones en DTOs con class-validator para tipos de datos, formatos y montos positivos.

---

## Tecnologias utilizadas

- NestJS
- PostgreSQL
- Prisma ORM
- Docker y Docker Compose
- Passport y JWT
- bcryptjs
- class-validator y class-transformer
- Swagger (OpenAPI)

---

## Instalacion y ejecucion

### 1. Clonar el repositorio
```bash
git clone https://github.com/leitoov/api-bank.git
cd api-bank
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raiz tomando como base `.env.example`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bank_db?schema=public"
JWT_SECRET="clave_secreta_jwt"
JWT_EXPIRES_IN="1d"
```

### 4. Levantar la base de datos con Docker
```bash
docker compose up -d
```

### 5. Aplicar migraciones de Prisma
```bash
npx prisma migrate dev --name init
```

### 6. Iniciar el servidor
```bash
npm run start:dev
```

La API quedara corriendo en: `http://localhost:3000/api`

---

## Documentacion con Swagger

Para ver y probar los endpoints desde el navegador:
`http://localhost:3000/api/docs`

### Endpoints disponibles:

| Modulo | Metodo | Endpoint | Descripcion | Requiere Token |
| :--- | :---: | :--- | :--- | :---: |
| Auth | POST | /api/auth/register | Registro de nuevo usuario y cuenta | No |
| Auth | POST | /api/auth/login | Iniciar sesion y obtener JWT | No |
| Auth | GET | /api/auth/profile | Obtener perfil del usuario autenticado | Si (Bearer) |
| Accounts | GET | /api/accounts/my-account | Ver saldo y datos de la cuenta propia | Si (Bearer) |
| Accounts | PATCH | /api/accounts/change-alias | Cambiar alias de la cuenta | Si (Bearer) |
| Transactions | POST | /api/transactions/deposit | Cargar saldo en la cuenta | Si (Bearer) |
| Transactions | POST | /api/transactions/transfer | Transferir dinero por alias, dni, username o email | Si (Bearer) |
| Transactions | GET | /api/transactions/history | Ver historial de transferencias y movimientos | Si (Bearer) |

---

## Prisma Studio
Para explorar y administrar la base de datos de forma visual:
```bash
npx prisma studio
```
Se abre en: `http://localhost:5555`
