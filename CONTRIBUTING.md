# Cómo trabajamos en el repositorio

## Reglas básicas

1. **Nadie sube directo a `main`.** `main` siempre debe funcionar y es lo que se entrega.
2. Cada tarea va en su **propia rama**, creada desde `main` actualizado.
3. Se integra con un **Pull Request (PR)** y al menos **1 compañero lo revisa** antes de aprobar.
4. Commits pequeños y con mensajes claros, en español.
5. Nunca subir contraseñas, llaves ni el archivo `.env`.

## Flujo paso a paso

```bash
git checkout main
git pull
git checkout -b feature/nombre-corto-de-la-tarea

# ...trabajas, pruebas...

git add .
git commit -m "Agrega ruta /cocina con pedidos pendientes"
git push -u origin feature/nombre-corto-de-la-tarea
```

Luego abre el Pull Request en GitHub, asigna a un revisor y espera su aprobación.

## Nombres de ramas

- `feature/...` para funcionalidad nueva (`feature/pagina-menu`)
- `fix/...` para corregir errores
- `docs/...` para documentación (`docs/diagrama-arquitectura`)

## Mensajes de commit (ejemplos)

- `Agrega health check en /health`
- `Configura Nginx con dos nodos`
- `Corrige total del pedido con redondeo`

## Antes de abrir un PR

- [ ] El proyecto compila: `npm run build`
- [ ] Probé mi cambio
- [ ] No subí `.env` ni archivos de `node_modules`
