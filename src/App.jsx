import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { ChevronDown, Plus, Check, AlertCircle, TrendingUp, Eye, EyeOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const LostProjectDashboard = () => {
  // ════ DESIGN TOKENS ════
  const colors = {
    bg: '#0b0b0d',
    bg1: '#111114',
    bg2: '#18181c',
    bg3: '#1e1e23',
    br: 'rgba(255,255,255,0.07)',
    br2: 'rgba(255,255,255,0.12)',
    t1: '#e8e8ee',
    t2: '#8a8a9a',
    t3: '#555566',
    cyan: '#00c8e0',
    gold: '#f0b429',
    green: '#22c55e',
    red: '#ef4444',
    orange: '#f97316',
    blue: '#3b82f6',
    purple: '#a855f7',
    teal: '#14b8a6',
    pink: '#ec4899',
  };

  // ════ SHOPIFY CONFIG ════
  // Cambia esta URL a tu endpoint de Vercel cuando hagas el deploy
  const SHOPIFY_API_URL = 'https://lost-project-api.vercel.app/api/shopify';
  const STORE_DOMAIN = 'true-house-1052.myshopify.com';

  // ════ DATA STORE CENTRALIZADO ════
  // Todos los datos de Shopify viven aquí — cuando conectemos la API, solo se actualiza este state
  const DEFAULT_DATA = {
    ventas2026: [308636, 197691, 180106, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pedidos2026: [96, 67, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ventas2025: [305147, 400590, 248153, 258806, 244455, 308643, 254677, 419489, 260799, 169944, 312343, 728293],
    pedidos2025: [92, 122, 74, 81, 72, 98, 90, 121, 75, 55, 87, 183],
    metaDef: [400000, 520000, 325000, 295000, 310000, 350000, 295000, 480000, 310000, 210000, 410000, 850000],
    orders: [
      { num: '#2772', cliente: 'Carlos M.', productos: 'Veja Campo Verde Olivo 27', monto: 3890, canal: 'POS', estado: 'Completado', fecha: 'Hoy' },
      { num: '#2771', cliente: 'Sofía R.', productos: 'Nude Project Cherry Tee S', monto: 1290, canal: 'POS', estado: 'Completado', fecha: 'Hoy' },
      { num: '#2770', cliente: 'Diego F.', productos: 'Fear of God Essentials Grey M', monto: 2490, canal: 'Online', estado: 'En tránsito', fecha: 'Ayer' },
      { num: '#2769', cliente: 'Ana L.', productos: 'Veja Campo Beige 25, Tee Negro S', monto: 5180, canal: 'WhatsApp', estado: 'Preparando', fecha: 'Ayer' },
      { num: '#2768', cliente: 'Rodrigo T.', productos: 'Golden Goose Ballstar Blue 28', monto: 8900, canal: 'POS', estado: 'Completado', fecha: '22 mar' },
      { num: '#2767', cliente: 'Mariana P.', productos: 'Onitsuka Tiger Mexico 66 26.5', monto: 3200, canal: 'Instagram', estado: 'Completado', fecha: '22 mar' },
      { num: '#2766', cliente: 'Luis H.', productos: 'Nude Project Tennis Tee M, Hoodie M', monto: 2580, canal: 'POS', estado: 'Completado', fecha: '21 mar' },
      { num: '#2765', cliente: 'Valeria G.', productos: 'Fear of God Essentials Black L', monto: 2490, canal: 'Online', estado: 'Completado', fecha: '21 mar' },
    ],
    catalog: [
      { nombre: 'Veja Campo Verde Olivo', marca: 'Veja', cat: 'tenis', precio: 3890, costo: 2334, uds: 53, ventas: 185400, stock: 3 },
      { nombre: 'New Balance 9060 Negro', marca: 'New Balance', cat: 'tenis', precio: 3400, costo: 2040, uds: 42, ventas: 142800, stock: 0 },
      { nombre: 'NB 574 Beige', marca: 'New Balance', cat: 'tenis', precio: 3200, costo: 1920, uds: 40, ventas: 128000, stock: 2 },
      { nombre: 'Fear of God Essentials Tee', marca: 'Fear of God', cat: 'ropa', precio: 1660, costo: 830, uds: 68, ventas: 112600, stock: 5 },
      { nombre: 'Palm Angels Track Jacket', marca: 'Palm Angels', cat: 'ropa', precio: 4480, costo: 2688, uds: 22, ventas: 98400, stock: 2 },
      { nombre: 'NB 530 Blanco', marca: 'New Balance', cat: 'tenis', precio: 2530, costo: 1518, uds: 38, ventas: 96200, stock: 6 },
    ],
  };

  const [shopData, setShopData] = useState(DEFAULT_DATA);
  const [dataSource, setDataSource] = useState('local'); // 'local' | 'live'
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // ── Aliases: destructuring para mantener compatibilidad con todo el dashboard ──
  const VENTAS_2026 = shopData.ventas2026;
  const PEDIDOS_2026 = shopData.pedidos2026;
  const VENTAS_2025 = shopData.ventas2025;
  const PEDIDOS_2025 = shopData.pedidos2025;
  const META_DEF = shopData.metaDef;
  const DEMO_ORDERS = shopData.orders;
  const CATALOG = shopData.catalog;

  // ── Fetch de datos desde Shopify via Vercel API ──
  const fetchShopifyData = useCallback(async () => {
    if (!SHOPIFY_API_URL) {
      setSyncError('API no configurada — configura SHOPIFY_API_URL con tu endpoint de Vercel');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(SHOPIFY_API_URL + '/sync', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      // El API de Vercel devuelve el mismo shape que DEFAULT_DATA
      setShopData(prev => ({
        ...prev,
        ventas2026: data.ventas2026 || prev.ventas2026,
        pedidos2026: data.pedidos2026 || prev.pedidos2026,
        ventas2025: data.ventas2025 || prev.ventas2025,
        pedidos2025: data.pedidos2025 || prev.pedidos2025,
        orders: data.orders || prev.orders,
        catalog: data.catalog || prev.catalog,
      }));
      setDataSource('live');
      setLastSync(new Date());
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [SHOPIFY_API_URL]);

  // ── Auto-sync cada 5 minutos si hay API configurada ──
  useEffect(() => {
    if (!SHOPIFY_API_URL) return;
    fetchShopifyData(); // sync inicial
    const interval = setInterval(fetchShopifyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchShopifyData, SHOPIFY_API_URL]);

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const FRASES = [
    { t: 'La innovación distingue a los líderes de los seguidores.', a: 'Steve Jobs' },
    { t: 'El lujo es una necesidad que empieza donde termina la necesidad.', a: 'Coco Chanel' },
    { t: 'El precio es lo que pagas. El valor es lo que obtienes.', a: 'Warren Buffett' },
    { t: 'Construye algo que el mundo no pueda ignorar.', a: 'Mark Zuckerberg' },
    { t: 'El fracaso no es lo contrario del éxito; es parte del éxito.', a: 'Arianna Huffington' },
    { t: 'Todos los sueños se pueden hacer realidad si tenemos el valor de perseguirlos.', a: 'Walt Disney' },
    { t: 'El secreto del éxito es hacer cosas ordinarias extraordinariamente bien.', a: 'John D. Rockefeller' },
    { t: 'Una marca es la suma de las buenas experiencias que ofrece.', a: 'Seth Godin' },
    { t: 'Los clientes no compran productos, compran mejores versiones de sí mismos.', a: 'Samuel Hulick' },
    { t: 'El éxito es ir de fracaso en fracaso sin perder el entusiasmo.', a: 'Winston Churchill' },
    { t: 'La simplicidad es la máxima sofisticación.', a: 'Leonardo da Vinci' },
    { t: 'El único modo de hacer un gran trabajo es amar lo que haces.', a: 'Steve Jobs' },
    { t: 'No esperes oportunidades extraordinarias. Aprovecha las ordinarias.', a: 'Samuel Smiles' },
    { t: 'La excelencia nunca es un accidente. Siempre es el resultado de alta intención.', a: 'Aristóteles' },
    { t: 'Construye tu propio sueño o alguien te contratará para construir el suyo.', a: 'Farrah Gray' },
    { t: 'El riesgo más grande es no correr ningún riesgo.', a: 'Mark Zuckerberg' },
    { t: 'Un buen negocio es la solución a los problemas de alguien.', a: 'Richard Branson' },
    { t: 'La creatividad es la inteligencia divirtiéndose.', a: 'Albert Einstein' },
  ];

  // ════ STATE ════
  const [activeTab, setActiveTab] = useState('inicio');
  const [year2026View, setYear2026View] = useState(true);
  const [pending, setPending] = useState([]);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([
    { nombre: 'Renta', categoria: 'Local', monto: 12000 },
    { nombre: 'Servicios (luz, internet)', categoria: 'Local', monto: 2500 },
    { nombre: 'Nómina Ana Sofía', categoria: 'Equipo', monto: 8000 },
    { nombre: 'Canva + Edición', categoria: 'Herramientas', monto: 1500 },
  ]);
  const [sugPage, setSugPage] = useState(0);

  // ── Marketing: tracker de contenido ──
  const [contentTracker, setContentTracker] = useState([]);
  const [showFormContent, setShowFormContent] = useState(false);
  const [newContent, setNewContent] = useState({ dia: 'Lunes', pilar: 'Entretenimiento', formato: 'Reel', descripcion: '' });

  // ── Marketing: colaboraciones / influencers ──
  const [collabs, setCollabs] = useState([]);
  const [showFormCollab, setShowFormCollab] = useState(false);
  const [newCollab, setNewCollab] = useState({ influencer: '', plataforma: 'Instagram', seguidores: '', producto: '', costo: '', ventasGeneradas: '', estado: 'Enviado', notas: '' });

  // ── Marketing: ROAS histórico para calculadora ──
  const [roasHistorico, setRoasHistorico] = useState(3.5);

  // ── Forecast: análisis de costos interactivo ──
  const [costView, setCostView] = useState('marca'); // 'marca' | 'categoria'
  const [expandedBrand, setExpandedBrand] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);

  // ── Objetivos: gastos proyectados (editables para planear crecimiento) ──
  const [metaGastosFijos, setMetaGastosFijos] = useState(24000); // inicializado con el total actual
  const [metaGastosVar, setMetaGastosVar] = useState(15000);
  const [metaPctTope, setMetaPctTope] = useState(12);

  // ── Activos: inventario, mobiliario, pasivos ──
  const [mobiliario, setMobiliario] = useState([
    { nombre: 'Estantes de exhibición', categoria: 'Mobiliario', cantidad: 4, costoUnit: 3500, fechaCompra: '2025-01-15', ubicacion: 'Tienda', id: 1 },
    { nombre: 'Computadora (punto de venta)', categoria: 'Equipo', cantidad: 1, costoUnit: 18000, fechaCompra: '2025-03-01', ubicacion: 'Tienda', id: 2 },
    { nombre: 'Cámara para contenido', categoria: 'Equipo', cantidad: 1, costoUnit: 12000, fechaCompra: '2025-06-10', ubicacion: 'Oficina', id: 3 },
    { nombre: 'Maniquíes', categoria: 'Mobiliario', cantidad: 3, costoUnit: 2800, fechaCompra: '2025-01-15', ubicacion: 'Tienda', id: 4 },
  ]);
  const [showFormMob, setShowFormMob] = useState(false);
  const [newMob, setNewMob] = useState({ nombre: '', categoria: 'Mobiliario', cantidad: 1, costoUnit: '', fechaCompra: '', ubicacion: 'Tienda' });
  const [pasivos, setPasivos] = useState([]);
  const [showFormPasivo, setShowFormPasivo] = useState(false);
  const [newPasivo, setNewPasivo] = useState({ concepto: '', tipo: 'Préstamo', monto: '', montoPagado: 0, acreedor: '', fechaInicio: '', fechaVence: '', notas: '' });
  const [efectivoCaja, setEfectivoCaja] = useState(0);
  const [saldoBanco, setSaldoBanco] = useState(0);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(0);

  // Gastos variables recurrentes — estado compartido (fuente: Marketing, consumido por Gastos)
  const [recurrentes, setRecurrentes] = useState([
    { mes: 0, concepto: 'Inversión Meta Ads', monto: 8500 },
    { mes: 0, concepto: 'Comisión Clip', monto: 4200 },
    { mes: 1, concepto: 'Inversión Meta Ads', monto: 9200 },
    { mes: 1, concepto: 'Comisión Clip', monto: 3500 },
    { mes: 2, concepto: 'Inversión Meta Ads', monto: 7000 },
    { mes: 2, concepto: 'Comisión Clip', monto: 2900 },
  ]);

  // ════ UTILS ════
  const formatMXN = (num) => {
    return '$' + Math.round(num).toLocaleString('es-MX');
  };

  const getDayOfYear = () => {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  };

  // ════ STYLES ════
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '52px',
    background: 'rgba(11,11,13,0.88)',
    backdropFilter: 'blur(24px)',
    borderBottom: `1px solid ${colors.br}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  };

  const mainStyle = {
    paddingTop: '80px',
    paddingBottom: '60px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px 60px',
  };

  const cardStyle = {
    background: colors.bg2,
    border: `1px solid ${colors.br}`,
    borderRadius: '12px',
    padding: '20px',
  };

  const statCardStyle = (accentColor) => ({
    background: colors.bg2,
    border: `1px solid ${colors.br}`,
    borderRadius: '10px',
    padding: '16px 18px',
    position: 'relative',
    borderBottom: `2px solid ${accentColor}`,
  });

  const heroCardStyle = {
    background: colors.bg2,
    border: `1px solid rgba(0,200,224,0.2)`,
    borderRadius: '14px',
    padding: '28px',
    position: 'relative',
    overflow: 'hidden',
  };

  const buttonStyle = (variant = 'default') => {
    if (variant === 'gold') {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '7px',
        border: `1px solid ${colors.gold}`,
        background: colors.gold,
        color: '#000',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
      };
    }
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '7px',
      border: `1px solid ${colors.br2}`,
      background: colors.bg3,
      color: colors.t1,
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
    };
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  };

  const thStyle = {
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: colors.t2,
    padding: '8px 12px',
    background: colors.bg1,
    borderBottom: `1px solid ${colors.br}`,
  };

  const tdStyle = {
    padding: '10px 12px',
    borderBottom: `1px solid ${colors.br}`,
    verticalAlign: 'middle',
    color: colors.t1,
  };

  // ════ COMPONENTS ════

  const NavBar = () => (
    <div style={navStyle}>
      <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: colors.t1 }}>
        LOST <span style={{ color: colors.gold }}>PROJECT</span>
      </div>
      <div style={{ display: 'flex', gap: '2px', background: colors.bg2, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '3px' }}>
        {['Inicio', 'Ventas', 'Gastos', 'Compras', 'Marketing', 'Objetivos', 'Forecast', 'Activos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              padding: '5px 14px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: activeTab === tab.toLowerCase() ? '600' : '500',
              color: activeTab === tab.toLowerCase() ? colors.t1 : colors.t2,
              cursor: 'pointer',
              background: activeTab === tab.toLowerCase() ? colors.bg3 : 'transparent',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* ── Indicador de conexión Shopify ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {dataSource === 'live' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wifi size={13} color={colors.green} />
            <span style={{ fontSize: '10px', color: colors.green, fontWeight: '600' }}>Live</span>
            {lastSync && (
              <span style={{ fontSize: '9px', color: colors.t3 }}>
                · {lastSync.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <WifiOff size={13} color={colors.t3} />
            <span style={{ fontSize: '10px', color: colors.t3 }}>Datos locales</span>
          </div>
        )}
        <button
          onClick={fetchShopifyData}
          disabled={syncing || !SHOPIFY_API_URL}
          title={!SHOPIFY_API_URL ? 'Configura SHOPIFY_API_URL para conectar' : syncing ? 'Sincronizando...' : 'Sincronizar con Shopify'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            background: syncing ? colors.cyan + '15' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${syncing ? colors.cyan + '30' : colors.br}`,
            cursor: !SHOPIFY_API_URL ? 'not-allowed' : 'pointer',
            opacity: !SHOPIFY_API_URL ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={13} color={syncing ? colors.cyan : colors.t2} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        {syncError && (
          <div title={syncError} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <AlertCircle size={12} color={colors.red} />
          </div>
        )}
      </div>
    </div>
  );

  const StatCard = ({ label, value, note, color }) => (
    <div style={statCardStyle(color)}>
      <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.09em', textTransform: 'uppercase', color: colors.t2, marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.03em', color: colors.t1, marginBottom: '4px' }}>
        {value}
      </div>
      {note && <div style={{ fontSize: '11px', color: colors.t2, marginTop: '6px' }}>{note}</div>}
    </div>
  );

  const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '4px', color: colors.t1 }}>
        {children}
      </div>
      <div style={{ fontSize: '13px', color: colors.t2 }}>{sub || '2026 en curso'}</div>
    </div>
  );

  // ════ SECTIONS ════

  const InicioSection = () => {
    const now = new Date();
    const mes = now.getMonth();
    const ventaMes = VENTAS_2026[mes];
    const metaMes = META_DEF[mes];
    const pct = metaMes > 0 ? Math.round((ventaMes / metaMes) * 100) : 0;
    const ytd = VENTAS_2026.reduce((a, b) => a + b, 0);
    const doy = getDayOfYear();
    const frase = FRASES[doy % FRASES.length];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '6px' }}>
              — CENTRO DE CONTROL
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1', color: colors.t1 }}>
              Central Lost Project
            </div>
            <div style={{ fontSize: '13px', color: colors.t2, marginTop: '5px' }}>
              {now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,200,224,0.06),rgba(0,200,224,0.01))', border: `1px solid rgba(0,200,224,0.15)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '6px' }}>
            — FRASE DEL DÍA
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: '6px' }}>
            "{frase.t}"
          </div>
          <div style={{ fontSize: '11px', color: colors.t2 }}>— {frase.a}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div style={heroCardStyle}>
            {/* Gradient bottom border */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #00c8e0 0%, #3b82f6 50%, #a855f7 100%)' }} />
            {/* Radial glow top-right */}
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,224,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,200,224,0.7)', marginBottom: '6px' }}>
                  — VENTAS DEL MES
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  {MESES_FULL[mes]}
                </div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '4px', background: 'rgba(240,180,41,0.12)', color: colors.gold, border: `1px solid rgba(240,180,41,0.2)` }}>
                {pct >= 80 ? 'EN CAMINO ✓' : pct >= 50 ? 'POR DEBAJO' : 'REQUIERE ATENCIÓN'}
              </div>
            </div>

            <div style={{ fontSize: '72px', fontWeight: '800', letterSpacing: '-0.05em', lineHeight: '0.9', color: colors.gold, marginBottom: '8px' }}>
              {formatMXN(ventaMes)}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>
              {now.getDate()} días transcurridos
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  Avance vs meta
                </span>
                <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: pct >= 80 ? colors.green : pct >= 50 ? colors.gold : colors.red }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: pct >= 80 ? colors.green : pct >= 50 ? colors.gold : colors.red, width: Math.min(pct, 100) + '%', transition: 'width 0.8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Meta: {formatMXN(metaMes)}</span>
                <span style={{ fontWeight: '700', color: ventaMes >= metaMes ? colors.green : colors.red }}>
                  {ventaMes >= metaMes ? '+' : ''}{formatMXN(ventaMes - metaMes)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.18)`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.blue, marginBottom: '6px' }}>
                  Pedidos del mes
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.blue }}>{PEDIDOS_2026[mes]}</div>
              </div>
              <div style={{ background: 'rgba(168,85,247,0.08)', border: `1px solid rgba(168,85,247,0.18)`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.purple, marginBottom: '6px' }}>
                  Ticket promedio
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.purple }}>
                  {PEDIDOS_2026[mes] > 0 ? formatMXN(ventaMes / PEDIDOS_2026[mes]) : '—'}
                </div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: `1px solid rgba(34,197,94,0.18)`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '6px' }}>
                  Ventas hoy
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.green }}>—</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Acumulado 2026 — cyan accent */}
            <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.cyan }} />
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '10px' }}>
                — ACUMULADO 2026
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', color: colors.cyan, marginBottom: '4px' }}>
                {formatMXN(ytd)}
              </div>
              <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '14px' }}>
                {((ytd / (META_DEF[0] + META_DEF[1] + META_DEF[2])) * 100).toFixed(1)}% de meta Q1
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue})`, width: Math.min((ytd / (META_DEF[0] + META_DEF[1] + META_DEF[2])) * 100, 100) + '%', transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.t2 }}>
                <span>Ene · Feb · Mar</span>
                <span style={{ fontWeight: '600' }}>{formatMXN(ytd)} / {formatMXN(META_DEF[0] + META_DEF[1] + META_DEF[2])}</span>
              </div>
            </div>

            {/* Objetivo anual — gold accent */}
            <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.gold }} />
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.gold, marginBottom: '10px' }}>
                — OBJETIVO ANUAL 2026
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', color: colors.gold, marginBottom: '4px' }}>
                $5,000,000
              </div>
              <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '14px' }}>+27.8% vs 2025</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.t2 }}>Faltan</span>
                <span style={{ color: colors.gold, fontWeight: '700' }}>{formatMXN(5000000 - ytd)}</span>
              </div>
            </div>

            {/* Ganancia estimada — green accent */}
            {(() => {
              const totalGastos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
              const beneficioBruto = ventaMes * 0.301;
              const ganancia = beneficioBruto - totalGastos;
              return (
                <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.green }} />
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.green, marginBottom: '10px' }}>
                    — GANANCIA ESTIMADA
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', color: ganancia >= 0 ? colors.green : colors.red, marginBottom: '4px' }}>
                    {formatMXN(ganancia)}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '12px' }}>
                    ventas × 30.1% margen − gastos fijos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: colors.t2 }}>Beneficio bruto</span>
                      <span style={{ color: colors.green, fontWeight: '600' }}>{formatMXN(beneficioBruto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: colors.t2 }}>Gastos fijos</span>
                      <span style={{ color: colors.red, fontWeight: '600' }}>−{formatMXN(totalGastos)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Conclusión del negocio */}
        {(() => {
          const totalGastos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
          const beneficioBruto = ventaMes * 0.301;
          const ganancia = beneficioBruto - totalGastos;
          const ventasPrevYear = VENTAS_2025[mes];
          const yoyChange = ventasPrevYear > 0 ? ((ventaMes - ventasPrevYear) / ventasPrevYear * 100).toFixed(1) : 0;
          const conclusion = ganancia >= 0
            ? `El mes de ${MESES_FULL[mes]} muestra un margen positivo de ${formatMXN(ganancia)} después de gastos fijos. Las ventas acumulan ${formatMXN(ventaMes)} con ${PEDIDOS_2026[mes]} pedidos (${yoyChange > 0 ? '+' : ''}${yoyChange}% vs ${MESES_FULL[mes]} 2025). El negocio opera en números verdes — mantener el ritmo actual para cerrar por encima de la meta mensual de ${formatMXN(metaMes)}.`
            : `El mes de ${MESES_FULL[mes]} presenta un déficit de ${formatMXN(Math.abs(ganancia))} después de gastos fijos. Las ventas suman ${formatMXN(ventaMes)} con ${PEDIDOS_2026[mes]} pedidos. Se requiere aumentar el volumen de ventas o reducir gastos fijos para alcanzar el punto de equilibrio de ${formatMXN(totalGastos / 0.301)}.`;
          return (
            <div style={{ ...cardStyle, marginTop: '14px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '12px', display