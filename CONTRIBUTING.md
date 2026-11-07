# Cómo trabajamos en el repositorio

## Reglas básicas

1. **Nadie sube directo a `main`.** `main` siempre debe funcionar y es lo que se entrega.
2. Cada tarea va en su **propia rama**, creada desde `main` actualizado.
3. Se integra con un **Pull Request (PR)**. El **coordinador lo revisa y lo aprueba**.
4. Cada PR actualiza **tu archivo de `avances/`** con lo que hiciste.
5. Edita solo **tu** archivo de avances, para no generar conflictos.
6. Commits pequeños y con mensajes claros, en español.
7. Nunca subir contraseñas, llaves ni el archivo `.env`.

## Flujo paso a paso

Los comandos se escriben en **Git Bash, dentro de la carpeta `mama-toyo-pedidos`**.

```bash
git checkout main
git pull
git checkout -b avance/nombre-tarea

# ...trabajas, pruebas, y completas tu archivo en avances/...

git add .
git commit -m "Agrega ruta /cocina con pedidos pendientes"
git push -u origin avance/nombre-tarea
```

Luego abre el Pull Request en GitHub con el botón **Compare & pull request**.

## Nombres de ramas

- `avance/nombre-tarea` para todo el trabajo normal (`avance/ana-pagina-menu`)
- `fix/...` para corregir errores
- `docs/...` para documentación

## Mensajes de commit (ejemplos)

- `Agrega health check en /health`
- `Configura Nginx con dos nodos`
- `Corrige total del pedido con redondeo`

## Si el coordinador pide cambios

Haz los cambios en **la misma rama**, haz commit y push de nuevo. El PR se actualiza solo.

## Antes de abrir un PR

- [ ] El proyecto compila: `npm run build`
- [ ] Probé mi cambio
- [ ] No subí `.env` ni `node_modules`
- [ ] Actualicé mi archivo en `avances/`
