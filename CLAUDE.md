# Lost Project Dashboard

## Proyecto
Dashboard financiero para Lost Project, marca de moda/lifestyle. React SPA monolitico con datos de Shopify y persistencia en Supabase.

## Arquitectura
- **Frontend**: React SPA en `src/App.jsx` (~4400 lineas, componente unico)
- **Backend**: Vercel serverless functions en repo separado (`lost-project-api`)
- **Base de datos**: Supabase (tabla `dashboard_data`, key-value con JSONB)
- **Datos de ventas**: Shopify GraphQL Admin API
- **Deploy**: Vercel auto-deploy desde branch `main`

## URLs
- Dashboard: https://lost-project-dashboard.vercel.app/
- API: https://lost-project-api.vercel.app/
- Supabase: https://hrhccvuhnedahznewgaj.supabase.co
- Tienda Shopify: true-house-1052.myshopify.com

## Stack Tecnico
- React (hooks: useState, useEffect, useCallback, useMemo, useRef)
- recharts (graficas)
- lucide-react (iconos)
- CSS-in-JS inline (sin framework UI, sin Tailwind)
- JavaScript vanilla (no TypeScript)

## Estructura del Archivo Principal (src/App.jsx)
El dashboard es un componente monolitico. Estructura general:
1. Imports (recharts, lucide-react)
2. Design tokens (objeto `colors`)
3. Shopify config (SHOPIFY_API_URL, STORE_DOMAIN)
4. Supabase config (SUPABASE_URL, SUPABASE_ANON_KEY, helpers supaRead/supaWrite)
5. Data store centralizado (DEFAULT_DATA con datos demo)
6. Estados principales (useState declarations)
7. Persistencia Supabase (useEffect para cargar y guardar)
8. Utils y estilos (formatMXN, buttonStyle, cardStyle, etc.)
9. Sub-componentes internos (GastosSection, ComprasSection, etc.)
10. Render principal con tabs

## Tabs del Dashboard
- Inicio, Ventas, Gastos, Compras, Marketing, Objetivos, Forecast, Activos

## Persistencia Supabase
Tabla `dashboard_data` con columnas: key (TEXT PK), value (JSONB), updated_at (TIMESTAMPTZ).
Keys guardadas: pending, fixedExpenses, recurrentes, gastosDiarios, comprasActivas, comprasHistorial, proveedores, mobiliario, pasivos, contentTracker, collabs.
Flujo: carga todo al iniciar -> flag supaLoaded -> useEffect guarda cambios solo despues de carga.

## Moneda y Idioma
- Todo en MXN (pesos mexicanos)
- Interfaz en espanol (Mexico)

## Notas Importantes
- La anon key de Supabase esta embebida en el frontend (variable SUPABASE_ANON_KEY)
- RLS habilitado con politicas abiertas para anon
- GastosSection y ComprasSection tienen estados internos con React.useState que cargan de Supabase al montar
- Los gastos del dia a dia no tienen boton de eliminar aun
- El costo de mercancia se calcula como ~70% de las ventas (hardcoded)
- Comision Ana Sofia = 10% sobre utilidad despues de gastos

## Comandos
```bash
npm install    # Instalar dependencias
npm run dev    # Desarrollo local
npm run build  # Build de produccion
```
