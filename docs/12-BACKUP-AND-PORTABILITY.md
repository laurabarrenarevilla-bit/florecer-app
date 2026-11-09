# 12 — Copias de seguridad, importación y portabilidad (fase 2)

## Objetivo

El usuario puede descargar una copia legible/portable de sus registros y recuperar los datos en su cuenta mediante una importación segura. Supabase guarda en la nube, pero una copia descargable aporta control y recuperabilidad. **JSON descargado no está cifrado**, avisar sobre custodia segura.

## Formato de exportación versión 1

```json
{
  "format": "florecer-journal",
  "schemaVersion": 1,
  "exportedAt": "2026-11-09T13:00:00.000Z",
  "entries": [
    {
      "date": "2026-11-09",
      "mood": "neutral",
      "reflection": "Ejemplo ficticio",
      "achievement": ""
    }
  ]
}
```

- No incluir contraseña, token, `user_id`, email ni metadatos internos innecesarios.
- Exportación pagina TODAS las filas del usuario autenticado y ordena por fecha.
- Nombre sugerido `florecer-backup-YYYY-MM-DD.json`; MIME `application/json`.
- Verificar el tamaño de archivo antes de importación, por ejemplo 5 MiB como límite revisable y documentado; no confiar solo en extension.

## Importación segura

1. Elegir archivo local. Leer sin enviarlo a terceros.
2. Validar schemaVersion, formato, fechas `YYYY-MM-DD` válidas, mood permitido, textos límites, duplicados internos, entradas futuras prohibidas, máximo elementos/tamaño.
3. Previsualizar cuántas se agregarán, cuántas están duplicadas y cuántas son inválidas; mostrar errores por entrada sin contenido sensible en logs.
4. Estrategia por defecto: **omitir entradas existentes** de la cuenta actual (no sobrescribir); opcional "reemplazar" solo si se implementa y requiere confirmación adicional.
5. No enviar nunca `user_id` desde archivo: asignarlo con la sesión real.
6. Enviar operaciones con controles apropiados; si no hay atomicidad total, reportar éxitos/fallos **parciales**; no afirmar "restaurado" si ocurrió error.
7. Refetch datos y comprobar resultados; ofrecer resumen.
8. Probar export→import en cuenta limpia de test y duplicado de mismo fichero.

## Eliminación

Borrar una entrada o todas: confirmación con alcance preciso "datos de tu cuenta en la nube", NO "de este dispositivo"; verificar DB tras ejecutar. Borrado total puede requerir confirmación escrita; no eliminar cuenta Auth salvo que se especifique y se implemente de forma segura separada.

## Retención y copia

Evitar guardar copia plaintext en `localStorage`, logs o almacenamiento de servidor sin necesidad. Informar de que la exportación es un archivo que el usuario guarda bajo su responsabilidad. No afirmar que importación sustituye un sistema corporativo de backups/point-in-time-recovery de Supabase.
