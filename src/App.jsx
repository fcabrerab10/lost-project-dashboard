import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { ChevronDown, Plus, Check, AlertCircle, TrendingUp, Eye, EyeOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const LostProjectDashboard = () => {
  // ââââ DESIGN TOKENS ââââ
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

  // ââââ SHOPIFY CONFIG ââââ
  // Cambia esta URL a tu endpoint de Vercel cuando hagas el deploy
  const SHOPIFY_API_URL = 'https://lost-project-api.vercel.app/api/shopify';
  const STORE_DOMAIN = 'true-house-1052.myshopify.com';

  // ââââ DATA STORE CENTRALIZADO ââââ
  // Todos los datos de Shopify viven aquÃ­ â cuando conectemos la API, solo se actualiza este state
  const DEFAULT_DATA = {
    ventas2026: [308636, 197691, 180106, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pedidos2026: [96, 67, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ventas2025: [305147, 400590, 248153, 258806, 244455, 308643, 254677, 419489, 260799, 169944, 312343, 728293],
    pedidos2025: [92, 122, 74, 81, 72, 98, 90, 121, 75, 55, 87, 183],
    metaDef: [400000, 520000, 325000, 295000, 310000, 350000, 295000, 480000, 310000, 210000, 410000, 850000],
    orders: [
      { num: '#2772', cliente: 'Carlos M.', productos: 'Veja Campo Verde Olivo 27', monto: 3890, canal: 'POS', estado: 'Completado', fecha: 'Hoy' },
      { num: '#2771', cliente: 'SofÃ­a R.', productos: 'Nude Project Cherry Tee S', monto: 1290, canal: 'POS', estado: 'Completado', fecha: 'Hoy' },
      { num: '#2770', cliente: 'Diego F.', productos: 'Fear of God Essentials Grey M', monto: 2490, canal: 'Online', estado: 'En trÃ¡nsito', fecha: 'Ayer' },
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

  // ââ Aliases: destructuring para mantener compatibilidad con todo el dashboard ââ
  const VENTAS_2026 = shopData.ventas2026;
  const PEDIDOS_2026 = shopData.pedidos2026;
  const VENTAS_2025 = shopData.ventas2025;
  const PEDIDOS_2025 = shopData.pedidos2025;
  const META_DEF = shopData.metaDef;
  const DEMO_ORDERS = shopData.orders;
  const CATALOG = shopData.catalog;

  // ââ Fetch de datos desde Shopify via Vercel API ââ
  const fetchShopifyData = useCallback(async () => {
    if (!SHOPIFY_API_URL) {
      setSyncError('API no configurada â configura SHOPIFY_API_URL con tu endpoint de Vercel');
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

  // ââ Auto-sync cada 5 minutos si hay API configurada ââ
  useEffect(() => {
    if (!SHOPIFY_API_URL) return;
    fetchShopifyData(); // sync inicial
    const interval = setInterval(fetchShopifyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchShopifyData, SHOPIFY_API_URL]);

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const FRASES = [
    { t: 'La innovaciÃ³n distingue a los lÃ­deres de los seguidores.', a: 'Steve Jobs' },
    { t: 'El lujo es una necesidad que empieza donde termina la necesidad.', a: 'Coco Chanel' },
    { t: 'El precio es lo que pagas. El valor es lo que obtienes.', a: 'Warren Buffett' },
    { t: 'Construye algo que el mundo no pueda ignorar.', a: 'Mark Zuckerberg' },
    { t: 'El fracaso no es lo contrario del Ã©xito; es parte del Ã©xito.', a: 'Arianna Huffington' },
    { t: 'Todos los sueÃ±os se pueden hacer realidad si tenemos el valor de perseguirlos.', a: 'Walt Disney' },
    { t: 'El secreto del Ã©xito es hacer cosas ordinarias extraordinariamente bien.', a: 'John D. Rockefeller' },
    { t: 'Una marca es la suma de las buenas experiencias que ofrece.', a: 'Seth Godin' },
    { t: 'Los clientes no compran productos, compran mejores versiones de sÃ­ mismos.', a: 'Samuel Hulick' },
    { t: 'El Ã©xito es ir de fracaso en fracaso sin perder el entusiasmo.', a: 'Winston Churchill' },
    { t: 'La simplicidad es la mÃ¡xima sofisticaciÃ³n.', a: 'Leonardo da Vinci' },
    { t: 'El Ãºnico modo de hacer un gran trabajo es amar lo que haces.', a: 'Steve Jobs' },
    { t: 'No esperes oportunidades extraordinarias. Aprovecha las ordinarias.', a: 'Samuel Smiles' },
    { t: 'La excelencia nunca es un accidente. Siempre es el resultado de alta intenciÃ³n.', a: 'AristÃ³teles' },
    { t: 'Construye tu propio sueÃ±o o alguien te contratarÃ¡ para construir el suyo.', a: 'Farrah Gray' },
    { t: 'El riesgo mÃ¡s grande es no correr ningÃºn riesgo.', a: 'Mark Zuckerberg' },
    { t: 'Un buen negocio es la soluciÃ³n a los problemas de alguien.', a: 'Richard Branson' },
    { t: 'La creatividad es la inteligencia divirtiÃ©ndose.', a: 'Albert Einstein' },
  ];

  // ââââ STATE ââââ
  const [activeTab, setActiveTab] = useState('inicio');
  const [year2026View, setYear2026View] = useState(true);
  const [pending, setPending] = useState([]);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([
    { nombre: 'Renta', categoria: 'Local', monto: 12000 },
    { nombre: 'Servicios (luz, internet)', categoria: 'Local', monto: 2500 },
    { nombre: 'NÃ³mina Ana SofÃ­a', categoria: 'Equipo', monto: 8000 },
    { nombre: 'Canva + EdiciÃ³n', categoria: 'Herramientas', monto: 1500 },
  ]);
  const [sugPage, setSugPage] = useState(0);

  // ââ Marketing: tracker de contenido ââ
  const [contentTracker, setContentTracker] = useState([]);
  const [showFormContent, setShowFormContent] = useState(false);
  const [newContent, setNewContent] = useState({ dia: 'Lunes', pilar: 'Entretenimiento', formato: 'Reel', descripcion: '' });

  // ââ Marketing: colaboraciones / influencers ââ
  const [collabs, setCollabs] = useState([]);
  const [showFormCollab, setShowFormCollab] = useState(false);
  const [newCollab, setNewCollab] = useState({ influencer: '', plataforma: 'Instagram', seguidores: '', producto: '', costo: '', ventasGeneradas: '', estado: 'Enviado', notas: '' });

  // ââ Marketing: ROAS histÃ³rico para calculadora ââ
  const [roasHistorico, setRoasHistorico] = useState(3.5);

  // ââ Forecast: anÃ¡lisis de costos interactivo ââ
  const [costView, setCostView] = useState('marca'); // 'marca' | 'categoria'
  const [expandedBrand, setExpandedBrand] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);

  // ââ Objetivos: gastos proyectados (editables para planear crecimiento) ââ
  const [metaGastosFijos, setMetaGastosFijos] = useState(24000); // inicializado con el total actual
  const [metaGastosVar, setMetaGastosVar] = useState(15000);
  const [metaPctTope, setMetaPctTope] = useState(12);

  // ââ Activos: inventario, mobiliario, pasivos ââ
  const [mobiliario, setMobiliario] = useState([
    { nombre: 'Estantes de exhibiciÃ³n', categoria: 'Mobiliario', cantidad: 4, costoUnit: 3500, fechaCompra: '2025-01-15', ubicacion: 'Tienda', id: 1 },
    { nombre: 'Computadora (punto de venta)', categoria: 'Equipo', cantidad: 1, costoUnit: 18000, fechaCompra: '2025-03-01', ubicacion: 'Tienda', id: 2 },
    { nombre: 'CÃ¡mara para contenido', categoria: 'Equipo', cantidad: 1, costoUnit: 12000, fechaCompra: '2025-06-10', ubicacion: 'Oficina', id: 3 },
    { nombre: 'ManiquÃ­es', categoria: 'Mobiliario', cantidad: 3, costoUnit: 2800, fechaCompra: '2025-01-15', ubicacion: 'Tienda', id: 4 },
  ]);
  const [showFormMob, setShowFormMob] = useState(false);
  const [newMob, setNewMob] = useState({ nombre: '', categoria: 'Mobiliario', cantidad: 1, costoUnit: '', fechaCompra: '', ubicacion: 'Tienda' });
  const [pasivos, setPasivos] = useState([]);
  const [showFormPasivo, setShowFormPasivo] = useState(false);
  const [newPasivo, setNewPasivo] = useState({ concepto: '', tipo: 'PrÃ©stamo', monto: '', montoPagado: 0, acreedor: '', fechaInicio: '', fechaVence: '', notas: '' });
  const [efectivoCaja, setEfectivoCaja] = useState(0);
  const [saldoBanco, setSaldoBanco] = useState(0);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(0);

  // Gastos variables recurrentes â estado compartido (fuente: Marketing, consumido por Gastos)
  const [recurrentes, setRecurrentes] = useState([
    { mes: 0, concepto: 'InversiÃ³n Meta Ads', monto: 8500 },
    { mes: 0, concepto: 'ComisiÃ³n Clip', monto: 4200 },
    { mes: 1, concepto: 'InversiÃ³n Meta Ads', monto: 9200 },
    { mes: 1, concepto: 'ComisiÃ³n Clip', monto: 3500 },
    { mes: 2, concepto: 'InversiÃ³n Meta Ads', monto: 7000 },
    { mes: 2, concepto: 'ComisiÃ³n Clip', monto: 2900 },
  ]);

  // ââââ UTILS ââââ
  const formatMXN = (num) => {
    return '$' + Math.round(num).toLocaleString('es-MX');
  };

  const getDayOfYear = () => {
    const now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  };

  // ââââ STYLES ââââ
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

  // ââââ COMPONENTS ââââ

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
      {/* ââ Indicador de conexiÃ³n Shopify ââ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {dataSource === 'live' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wifi size={13} color={colors.green} />
            <span style={{ fontSize: '10px', color: colors.green, fontWeight: '600' }}>Live</span>
            {lastSync && (
              <span style={{ fontSize: '9px', color: colors.t3 }}>
                Â· {lastSync.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
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

  // ââââ SECTIONS ââââ

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
              â CENTRO DE CONTROL
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
            â FRASE DEL DÃA
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: '6px' }}>
            "{frase.t}"
          </div>
          <div style={{ fontSize: '11px', color: colors.t2 }}>â {frase.a}</div>
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
                  â VENTAS DEL MES
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  {MESES_FULL[mes]}
                </div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '4px', background: 'rgba(240,180,41,0.12)', color: colors.gold, border: `1px solid rgba(240,180,41,0.2)` }}>
                {pct >= 80 ? 'EN CAMINO â' : pct >= 50 ? 'POR DEBAJO' : 'REQUIERE ATENCIÃN'}
              </div>
            </div>

            <div style={{ fontSize: '72px', fontWeight: '800', letterSpacing: '-0.05em', lineHeight: '0.9', color: colors.gold, marginBottom: '8px' }}>
              {formatMXN(ventaMes)}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>
              {now.getDate()} dÃ­as transcurridos
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
                  {PEDIDOS_2026[mes] > 0 ? formatMXN(ventaMes / PEDIDOS_2026[mes]) : 'â'}
                </div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: `1px solid rgba(34,197,94,0.18)`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '6px' }}>
                  Ventas hoy
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.green }}>â</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Acumulado 2026 â cyan accent */}
            <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.cyan }} />
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '10px' }}>
                â ACUMULADO 2026
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
                <span>Ene Â· Feb Â· Mar</span>
                <span style={{ fontWeight: '600' }}>{formatMXN(ytd)} / {formatMXN(META_DEF[0] + META_DEF[1] + META_DEF[2])}</span>
              </div>
            </div>

            {/* Objetivo anual â gold accent */}
            <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.gold }} />
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.gold, marginBottom: '10px' }}>
                â OBJETIVO ANUAL 2026
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

            {/* Ganancia estimada â green accent */}
            {(() => {
              const totalGastos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
              const beneficioBruto = ventaMes * 0.301;
              const ganancia = beneficioBruto - totalGastos;
              return (
                <div style={{ ...cardStyle, flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: colors.green }} />
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.green, marginBottom: '10px' }}>
                    â GANANCIA ESTIMADA
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', color: ganancia >= 0 ? colors.green : colors.red, marginBottom: '4px' }}>
                    {formatMXN(ganancia)}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '12px' }}>
                    ventas Ã 30.1% margen â gastos fijos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: colors.t2 }}>Beneficio bruto</span>
                      <span style={{ color: colors.green, fontWeight: '600' }}>{formatMXN(beneficioBruto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: colors.t2 }}>Gastos fijos</span>
                      <span style={{ color: colors.red, fontWeight: '600' }}>â{formatMXN(totalGastos)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ConclusiÃ³n del negocio */}
        {(() => {
          const totalGastos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
          const beneficioBruto = ventaMes * 0.301;
          const ganancia = beneficioBruto - totalGastos;
          const ventasPrevYear = VENTAS_2025[mes];
          const yoyChange = ventasPrevYear > 0 ? ((ventaMes - ventasPrevYear) / ventasPrevYear * 100).toFixed(1) : 0;
          const conclusion = ganancia >= 0
            ? `El mes de ${MESES_FULL[mes]} muestra un margen positivo de ${formatMXN(ganancia)} despuÃ©s de gastos fijos. Las ventas acumulan ${formatMXN(ventaMes)} con ${PEDIDOS_2026[mes]} pedidos (${yoyChange > 0 ? '+' : ''}${yoyChange}% vs ${MESES_FULL[mes]} 2025). El negocio opera en nÃºmeros verdes â mantener el ritmo actual para cerrar por encima de la meta mensual de ${formatMXN(metaMes)}.`
            : `El mes de ${MESES_FULL[mes]} presenta un dÃ©ficit de ${formatMXN(Math.abs(ganancia))} despuÃ©s de gastos fijos. Las ventas suman ${formatMXN(ventaMes)} con ${PEDIDOS_2026[mes]} pedidos. Se requiere aumentar el volumen de ventas o reducir gastos fijos para alcanzar el punto de equilibrio de ${formatMXN(totalGastos / 0.301)}.`;
          return (
            <div style={{ ...cardStyle, marginTop: '14px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>ConclusiÃ³n del negocio
              </h4>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.75' }}>
                {conclusion}
              </div>
            </div>
          );
        })()}

        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '0' }}>Pendientes del dÃ­a</h3>
            <button style={buttonStyle('gold')} onClick={() => setShowPendingForm(!showPendingForm)}>
              + Agregar
            </button>
          </div>

          {showPendingForm && (
            <div style={{ marginBottom: '12px', padding: '12px', background: colors.bg3, borderRadius: '8px' }}>
              <input
                type="text"
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                placeholder="DescripciÃ³n de la tarea..."
                style={{ width: '100%', padding: '8px', background: colors.bg1, border: `1px solid ${colors.br2}`, borderRadius: '6px', color: colors.t1, fontFamily: 'Inter, sans-serif' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (pendingTitle) {
                      setPending([...pending, { id: Date.now(), title: pendingTitle, done: false }]);
                      setPendingTitle('');
                      setShowPendingForm(false);
                    }
                  }}
                  style={buttonStyle('gold')}
                >
                  Agregar
                </button>
                <button onClick={() => setShowPendingForm(false)} style={buttonStyle()}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: colors.t2, fontSize: '13px' }}>
                Sin pendientes hoy. Â¡Buen dÃ­a! ð¯
              </div>
            ) : (
              pending.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: colors.bg3, borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => {
                      setPending(pending.map((p) => (p.id === item.id ? { ...p, done: e.target.checked } : p)));
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none', color: colors.t1 }}>
                    {item.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ââ Preview: Compras ââ */}
        {(() => {
          const stockCritico = CATALOG.filter(p => p.stock <= 2 && p.stock > 0).length;
          const agotados = CATALOG.filter(p => p.stock === 0).length;
          return (
            <div style={{ ...cardStyle, marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Compras Â· Resumen
                </h4>
                <button onClick={() => setActiveTab('compras')} style={{ ...buttonStyle(), fontSize: '11px', padding: '4px 12px' }}>Ver todo â</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.blue, marginBottom: '6px' }}>En trÃ¡nsito</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.blue }}>0</div>
                  <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>pedidos</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.red, marginBottom: '6px' }}>Stock crÃ­tico</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.red }}>{stockCritico}</div>
                  <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>productos â¤2 uds</div>
                </div>
                <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.orange, marginBottom: '6px' }}>Agotados</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.orange }}>{agotados}</div>
                  <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>sin stock</div>
                </div>
                <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.teal, marginBottom: '6px' }}>Capital en camino</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.teal }}>$0</div>
                  <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>MXN invertidos</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ââ Preview: Marketing Â· Meta Ads ââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Marketing Â· Meta Ads
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.06em' }}>PENDIENTE CONEXIÃN</span>
              <button onClick={() => setActiveTab('marketing')} style={{ ...buttonStyle(), fontSize: '11px', padding: '4px 12px' }}>Ver todo â</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.blue, marginBottom: '6px' }}>Gasto en ads</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.t1 }}>{(() => { const adsNow = recurrentes.filter(g => g.mes === new Date().getMonth() && g.concepto === 'InversiÃ³n Meta Ads').reduce((a, g) => a + g.monto, 0); return adsNow > 0 ? formatMXN(adsNow) : 'â'; })()}</div>
              <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>mes actual</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '6px' }}>ROAS</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.t1 }}>â</div>
              <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>retorno por $1</div>
            </div>
            <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.pink, marginBottom: '6px' }}>Conversiones</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.t1 }}>â</div>
              <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>compras atribuidas</div>
            </div>
            <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.purple, marginBottom: '6px' }}>CampaÃ±as</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.t1 }}>3</div>
              <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>en borrador/pausadas</div>
            </div>
          </div>
        </div>

        {/* ââ Preview: Objetivos â suavizado + redistribuciÃ³n ââ */}
        {(() => {
          // Calcular dÃ©ficit acumulado de meses pasados y redistribuir en meses futuros
          const mesesPasados = MESES.slice(0, mes + 1);
          const mesesRestantes = 12 - (mes + 1);
          let deficitAcum = 0;
          for (let i = 0; i <= mes; i++) {
            deficitAcum += META_DEF[i] - VENTAS_2026[i];
          }
          // Solo redistribuir si hay dÃ©ficit positivo
          const extraPorMes = deficitAcum > 0 && mesesRestantes > 0 ? Math.round(deficitAcum / mesesRestantes) : 0;
          // Metas ajustadas: pasadas = lo real, futuras = meta original + porciÃ³n de dÃ©ficit
          const metaAjustada = MESES.map((_, idx) => {
            if (idx <= mes) return META_DEF[idx]; // pasado: meta original
            return META_DEF[idx] + extraPorMes; // futuro: meta + redistribuciÃ³n
          });

          return (
            <div style={{ ...cardStyle, marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Objetivos mensuales 2026
                </h4>
                <button onClick={() => setActiveTab('objetivos')} style={{ ...buttonStyle(), fontSize: '11px', padding: '4px 12px' }}>Ver todo â</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {MESES.slice(0, 6).map((m, idx) => {
                  const esPasado = idx < mes;
                  const esActual = idx === mes;
                  const esFuturo = idx > mes;
                  const cumplido = VENTAS_2026[idx];
                  const metaOriginal = META_DEF[idx];
                  const metaShow = esFuturo ? metaAjustada[idx] : metaOriginal;
                  const pctObj = metaOriginal > 0 ? Math.round((cumplido / metaOriginal) * 100) : 0;

                  return (
                    <div key={idx} style={{
                      background: esPasado ? 'rgba(255,255,255,0.02)' : colors.bg3,
                      border: `1px solid ${esActual ? 'rgba(0,200,224,0.3)' : colors.br}`,
                      borderRadius: '8px', padding: '12px', textAlign: 'center',
                      opacity: esPasado ? 0.7 : 1,
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: esActual ? colors.cyan : colors.t2, marginBottom: '6px' }}>
                        {m} {esActual && 'â'}
                      </div>
                      {esPasado ? (
                        <>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: colors.t2, marginBottom: '2px' }}>{formatMXN(cumplido)}</div>
                          <div style={{ fontSize: '10px', color: colors.t3 }}>cerrado Â· {pctObj}%</div>
                        </>
                      ) : esActual ? (
                        <>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.gold, marginBottom: '4px' }}>{formatMXN(metaOriginal)}</div>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{ height: '100%', borderRadius: '2px', background: colors.cyan, width: Math.min(pctObj, 100) + '%' }} />
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: colors.cyan }}>{pctObj}% avance</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.gold, marginBottom: '2px' }}>{formatMXN(metaShow)}</div>
                          {extraPorMes > 0 && (
                            <div style={{ fontSize: '9px', color: colors.t3 }}>+{formatMXN(extraPorMes)} ajuste</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Segundo semestre */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '8px' }}>
                {MESES.slice(6, 12).map((m, idx) => {
                  const realIdx = idx + 6;
                  const metaShow = metaAjustada[realIdx];
                  return (
                    <div key={realIdx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '6px' }}>{m}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.gold, marginBottom: '2px' }}>{formatMXN(metaShow)}</div>
                      {extraPorMes > 0 && (
                        <div style={{ fontSize: '9px', color: colors.t3 }}>+{formatMXN(extraPorMes)} ajuste</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '10px 14px', background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: colors.t2 }}>Objetivo anual</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: colors.gold }}>$5,000,000</span>
                <span style={{ fontSize: '11px', color: colors.t2 }}>Acumulado: <span style={{ color: colors.cyan, fontWeight: '600' }}>{formatMXN(ytd)}</span></span>
                {deficitAcum > 0 ? (
                  <span style={{ fontSize: '11px', color: colors.gold }}>Redistribuido: <span style={{ fontWeight: '600' }}>+{formatMXN(extraPorMes)}/mes</span></span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: '600', color: colors.green }}>En camino â</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* ââ Preview: Forecast Â· QuÃ© comprar ââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Forecast Â· QuÃ© comprar
            </h4>
            <button onClick={() => setActiveTab('forecast')} style={{ ...buttonStyle(), fontSize: '11px', padding: '4px 12px' }}>Ver todo â</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {CATALOG.filter(p => p.stock <= 2).slice(0, 3).map((prod, idx) => (
              <div key={idx} style={{ background: colors.bg3, border: `1px solid ${prod.stock === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.2)'}`, borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: colors.t2 }}>{prod.marca}</span>
                  <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: prod.stock === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)', color: prod.stock === 0 ? colors.red : colors.orange, border: `1px solid ${prod.stock === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}` }}>
                    {prod.stock === 0 ? 'AGOTADO' : `${prod.stock} UDS`}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1, marginBottom: '6px' }}>{prod.nombre}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: colors.t2 }}>Costo</span>
                  <span style={{ color: colors.gold, fontWeight: '600' }}>{formatMXN(prod.costo)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                  <span style={{ color: colors.t2 }}>Vendidos</span>
                  <span style={{ color: colors.cyan, fontWeight: '600' }}>{prod.uds} uds</span>
                </div>
              </div>
            ))}
          </div>
          {CATALOG.filter(p => p.stock <= 2).length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: colors.t3 }}>
              +{CATALOG.filter(p => p.stock <= 2).length - 3} productos mÃ¡s requieren reposiciÃ³n
            </div>
          )}
        </div>

        {/* Sugerencias de acciÃ³n â con rotaciÃ³n */}
        {(() => {
          const allSugerencias = [
            { icon: 'ð¸', title: 'Contenido en redes', desc: 'Sube stories o reels de productos nuevos para mantener engagement con tu audiencia.' },
            { icon: 'ð¦', title: 'Revisar inventario', desc: 'Verifica stock bajo y programa reposiciÃ³n antes de que se agote lo mÃ¡s vendido.' },
            { icon: 'ð¬', title: 'Seguimiento clientes', desc: 'Contacta compradores recientes para pedir reseÃ±as, referidos o feedback.' },
            { icon: 'ð', title: 'Analizar mÃ©tricas', desc: 'Revisa quÃ© productos tienen mejor margen y enfoca la promociÃ³n en ellos.' },
            { icon: 'ð¯', title: 'Actualizar objetivos', desc: 'Ajusta los objetivos del mes segÃºn el rendimiento actual y la tendencia.' },
            { icon: 'ðï¸', title: 'Lanzar promo', desc: 'Crea una oferta para productos con stock alto o baja rotaciÃ³n para liberar capital.' },
            { icon: 'ð¤', title: 'Alianzas locales', desc: 'Busca colaboraciones con cafeterÃ­as, barberÃ­as o gyms para cross-promotion.' },
            { icon: 'ð§', title: 'Email marketing', desc: 'EnvÃ­a un correo a clientes con nuevos drops o descuento exclusivo para recompra.' },
            { icon: 'ð·ï¸', title: 'Actualizar precios', desc: 'Revisa precios vs competencia y ajusta para maximizar margen sin perder ventas.' },
            { icon: 'ð±', title: 'Optimizar web', desc: 'Revisa la velocidad de tu tienda Shopify y mejora fotos de productos.' },
            { icon: 'ð¥', title: 'Grabar unboxing', desc: 'Haz un video de unboxing de productos nuevos â genera expectativa y FOMO.' },
            { icon: 'â­', title: 'Pedir reseÃ±as', desc: 'Contacta a tus Ãºltimos 10 compradores y pÃ­deles una reseÃ±a en Google o IG.' },
            { icon: 'ð§¹', title: 'Limpiar catÃ¡logo', desc: 'Elimina productos sin movimiento en 60+ dÃ­as o baja el precio para liquidar.' },
            { icon: 'ð', title: 'Planear el mes', desc: 'Define las 3 prioridades del mes: quÃ© vender, quÃ© comprar, quÃ© promover.' },
            { icon: 'ð¥', title: 'Drop semanal', desc: 'Programa un lanzamiento semanal de producto para mantener trÃ¡fico constante.' },
            { icon: 'ð°', title: 'Revisar gastos', desc: 'Busca suscripciones o gastos que puedas reducir este mes.' },
            { icon: 'ð', title: 'Programa de lealtad', desc: 'DiseÃ±a un sistema simple de puntos o descuento por recompra para clientes frecuentes.' },
            { icon: 'ð', title: 'Google My Business', desc: 'Actualiza tu perfil de Google Maps con fotos nuevas y horario correcto.' },
            { icon: 'ð§ª', title: 'A/B test en ads', desc: 'Prepara dos versiones de un anuncio y prueba cuÃ¡l convierte mejor.' },
            { icon: 'ð¥', title: 'Capacitar equipo', desc: 'Comparte tÃ©cnicas de venta o producto del mes con tu equipo de tienda.' },
            { icon: 'ð', title: 'Mejorar displays', desc: 'Reorganiza el layout de la tienda fÃ­sica para destacar los productos estrella.' },
            { icon: 'ð', title: 'Revisar devoluciones', desc: 'Analiza las devoluciones del mes â Â¿hay un patrÃ³n? Â¿Tallas? Â¿Expectativas?' },
            { icon: 'ð', title: 'SEO bÃ¡sico', desc: 'Revisa tÃ­tulos y descripciones de productos en Shopify para mejorar bÃºsqueda orgÃ¡nica.' },
            { icon: 'ð', title: 'WhatsApp Business', desc: 'Configura respuestas rÃ¡pidas y catÃ¡logo en WhatsApp para cerrar ventas mÃ¡s rÃ¡pido.' },
            { icon: 'ð§²', title: 'Lead magnet', desc: 'Crea un descuento de bienvenida (10%) a cambio del email para construir tu lista.' },
            { icon: 'ðï¸', title: 'Calendario de contenido', desc: 'Planea las publicaciones de la semana: 3 feed, 5 stories, 2 reels mÃ­nimo.' },
            { icon: 'ðª', title: 'Visual merchandising', desc: 'Cambia el escaparate de la tienda o la imagen principal de tu web cada 2 semanas.' },
            { icon: 'ð', title: 'Revisar conversiÃ³n web', desc: 'Entra a Shopify Analytics y revisa tu tasa de conversiÃ³n â meta: >2%.' },
            { icon: 'ðï¸', title: 'Colaborar con influencer', desc: 'Contacta micro-influencers locales (1K-10K) para gifting o collab pagada.' },
            { icon: 'ð', title: 'Notificaciones push', desc: 'Configura alertas de back-in-stock y carritos abandonados en Shopify.' },
            { icon: 'ð§¾', title: 'Revisar proveedores', desc: 'Pide cotizaciÃ³n a un nuevo proveedor para comparar precios y tiempos de entrega.' },
            { icon: 'ð¨', title: 'Branding refresh', desc: 'Actualiza banners, highlights de IG y packaging para mantener la marca fresca.' },
            { icon: 'ð¦', title: 'Preparar pre-orders', desc: 'Abre preventa de productos que estÃ¡n por llegar para asegurar ventas anticipadas.' },
            { icon: 'ð', title: 'Espiar competencia', desc: 'Revisa quÃ© estÃ¡n vendiendo, a quÃ© precio y quÃ© promos tienen tus competidores.' },
            { icon: 'ð³', title: 'Revisar comisiones', desc: 'Verifica cuÃ¡nto pagas en comisiones de Clip, Shopify y pasarelas â busca reducirlas.' },
            { icon: 'ð¤³', title: 'UGC (contenido de usuarios)', desc: 'Reposta fotos de clientes usando tus productos â prueba social gratuita.' },
            { icon: 'ð', title: 'Educar al cliente', desc: 'Crea un post o story explicando cÃ³mo cuidar los tenis o la ropa que vendes.' },
            { icon: 'ð', title: 'Giveaway', desc: 'Organiza un sorteo en Instagram: sigue + comenta + comparte = alcance orgÃ¡nico gratis.' },
            { icon: 'ð', title: 'Recuperar carritos', desc: 'Revisa carritos abandonados en Shopify y manda mensaje personalizado por WhatsApp.' },
            { icon: 'ð', title: 'Actualizar descripciones', desc: 'Mejora las descripciones de tus 5 productos mÃ¡s vendidos con beneficios claros.' },
            { icon: 'ð¤', title: 'Automatizar respuestas', desc: 'Configura respuestas automÃ¡ticas en IG DMs para preguntas frecuentes (precio, tallas).' },
            { icon: 'ð', title: 'Lookbook de temporada', desc: 'Arma outfits completos con tus productos y publÃ­calos como guÃ­a de estilo.' },
            { icon: 'ð¡', title: 'Testear nuevo producto', desc: 'Compra 3 unidades de algo nuevo y prueba la demanda antes de invertir fuerte.' },
            { icon: 'ðºï¸', title: 'Expandir canales', desc: 'EvalÃºa vender en Mercado Libre, Amazon o Facebook Marketplace como canal extra.' },
            { icon: 'ð', title: 'Reportar semana', desc: 'Haz un resumen rÃ¡pido de ventas, gastos y pendientes de la semana para tu equipo.' },
            { icon: 'ð§°', title: 'Mantenimiento Shopify', desc: 'Revisa apps instaladas, elimina las que no uses y actualiza las que sÃ­.' },
            { icon: 'ð¶', title: 'Playlist de tienda', desc: 'Actualiza la mÃºsica de la tienda fÃ­sica â el ambiente vende.' },
            { icon: 'ð®', title: 'Packaging premium', desc: 'Agrega una tarjeta de agradecimiento o sticker a los pedidos â detalle memorable.' },
            { icon: 'ð', title: 'Link in bio', desc: 'Actualiza tu Linktree o link en bio con los productos mÃ¡s nuevos y promos activas.' },
            { icon: 'ð¬', title: 'Encuesta a clientes', desc: 'Lanza una encuesta rÃ¡pida en stories: Â¿quÃ© marca quieren ver? Â¿QuÃ© talla falta?' },
            { icon: 'ð§®', title: 'Calcular break-even', desc: 'Revisa cuÃ¡nto necesitas vender este mes para cubrir todos los gastos fijos.' },
            { icon: 'ð', title: 'Revisar envÃ­os', desc: 'Compara tarifas de paqueterÃ­as y negocia mejores precios si envÃ­as +50 paquetes/mes.' },
            { icon: 'ð', title: 'Pinterest Business', desc: 'Sube fotos de productos a Pinterest â trÃ¡fico orgÃ¡nico gratuito a largo plazo.' },
            { icon: 'ð¡ï¸', title: 'Revisar polÃ­ticas', desc: 'Actualiza polÃ­ticas de devoluciÃ³n, cambio y envÃ­o en tu tienda Shopify.' },
            { icon: 'ð', title: 'Aprender algo nuevo', desc: 'Toma un curso corto de marketing digital, fotografÃ­a de producto o Meta Ads.' },
            { icon: 'ð', title: 'Planear eventos', desc: 'Organiza un evento en tienda: lanzamiento, venta nocturna o meet & greet.' },
            { icon: 'ð', title: 'Destacar bestsellers', desc: 'Crea una colecciÃ³n "Lo mÃ¡s vendido" en Shopify y dale visibilidad en tu home.' },
            { icon: 'ð', title: 'Venta privada', desc: 'Manda acceso anticipado a una promo solo para clientes VIP o tu lista de emails.' },
            { icon: 'ð±', title: 'Sustentabilidad', desc: 'Comunica prÃ¡cticas sustentables de tus marcas â cada vez mÃ¡s clientes lo valoran.' },
          ];
          const totalPages = Math.ceil(allSugerencias.length / 3);
          const currentSugs = allSugerencias.slice(sugPage * 3, sugPage * 3 + 3);
          return (
            <div style={{ ...cardStyle, marginTop: '12px', background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Siempre hay algo que hacer
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: colors.t3 }}>{sugPage + 1} / {totalPages}</span>
                  <button
                    onClick={() => setSugPage((sugPage + 1) % totalPages)}
                    style={{ ...buttonStyle(), fontSize: '11px', padding: '4px 12px' }}
                  >
                    â» Otras ideas
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {currentSugs.map((sug, idx) => (
                  <div key={sugPage + '-' + idx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>{sug.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: colors.t1, marginBottom: '4px' }}>{sug.title}</div>
                    <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.5' }}>{sug.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const VentasSection = () => {
    const now = new Date();
    const mes = now.getMonth();
    const ytd26 = VENTAS_2026.reduce((a, b) => a + b, 0);
    const ytd25 = VENTAS_2025.reduce((a, b) => a + b, 0);
    const pedidos26 = PEDIDOS_2026.reduce((a, b) => a + b, 0);
    const pedidos25 = PEDIDOS_2025.reduce((a, b) => a + b, 0);
    const ticketProm = pedidos26 > 0 ? ytd26 / pedidos26 : 0;
    const ventaMes = VENTAS_2026[mes];
    const pedidosMes = PEDIDOS_2026[mes];
    const ventaMesPrev = VENTAS_2025[mes];
    const yoyMes = ventaMesPrev > 0 ? ((ventaMes - ventaMesPrev) / ventaMesPrev * 100).toFixed(1) : 0;

    const ventasChartData = MESES.map((m, idx) => ({
      mes: m,
      '2026': VENTAS_2026[idx] > 0 ? VENTAS_2026[idx] : null,
      '2025': VENTAS_2025[idx],
      meta: META_DEF[idx],
    }));

    const canalData = [
      { name: 'Tienda fÃ­sica (POS)', value: 91, color: colors.gold },
      { name: 'Online (web)', value: 6, color: colors.cyan },
      { name: 'WhatsApp', value: 2, color: '#25D366' },
      { name: 'Instagram DM', value: 1, color: '#E1306C' },
    ];

    const pagoData = [
      { name: 'Clip (terminal)', value: 55, color: '#FF6B35' },
      { name: 'Transferencia', value: 25, color: colors.blue },
      { name: 'Efectivo', value: 20, color: colors.green },
    ];

    return (
      <div>
        <SectionTitle>Ventas</SectionTitle>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={year2026View ? buttonStyle('gold') : buttonStyle()} onClick={() => setYear2026View(true)}>
            2026 en curso
          </button>
          <button style={!year2026View ? buttonStyle('gold') : buttonStyle()} onClick={() => setYear2026View(false)}>
            2025 histÃ³rico
          </button>
        </div>

        {year2026View ? (
          <div>
            {/* âââ INFORMACIÃN GENERAL DEL AÃO âââ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <StatCard label="Ventas netas 2026" value={formatMXN(ytd26)} note="YTD acumulado" color={colors.cyan} />
              <StatCard label="Pedidos totales" value={pedidos26.toString()} note="Ãrdenes procesadas" color={colors.blue} />
              <StatCard label="Ticket promedio" value={formatMXN(ticketProm)} note="Valor por orden" color={colors.purple} />
              <StatCard label="Margen estimado" value="30.1%" note={`Beneficio bruto: ${formatMXN(ytd26 * 0.301)}`} color={colors.green} />
            </div>

            {/* GrÃ¡fica lineal comparativa */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>ComparaciÃ³n 2026 vs 2025
                </h4>
                <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '3px', background: colors.gold, borderRadius: '2px', display: 'inline-block' }} /> 2026</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '3px', background: colors.cyan, borderRadius: '2px', display: 'inline-block' }} /> 2025</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: colors.t3 }}><span style={{ width: '10px', height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', display: 'inline-block' }} /> Meta</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ventasChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.br} />
                  <XAxis dataKey="mes" stroke={colors.t2} fontSize={11} />
                  <YAxis stroke={colors.t2} fontSize={11} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip contentStyle={{ background: colors.bg2, border: `1px solid ${colors.br}`, borderRadius: '8px', fontSize: '12px' }} formatter={(value) => formatMXN(value)} />
                  <Line type="monotone" dataKey="meta" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="2025" stroke={colors.cyan} strokeWidth={2} dot={{ r: 3, fill: colors.cyan }} opacity={0.6} />
                  <Line type="monotone" dataKey="2026" stroke={colors.gold} strokeWidth={3} dot={{ r: 4, fill: colors.gold }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* âââ MES CORRIENTE âââ */}
            <div style={{ marginTop: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>â MES CORRIENTE</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.t1 }}>{MESES_FULL[mes]} 2026</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <StatCard label={`Ventas ${MESES[mes]}`} value={formatMXN(ventaMes)} note={`${yoyMes > 0 ? '+' : ''}${yoyMes}% vs 2025`} color={colors.gold} />
              <StatCard label="Pedidos del mes" value={pedidosMes.toString()} note={`vs ${PEDIDOS_2025[mes]} en 2025`} color={colors.blue} />
              <StatCard label="Ticket promedio mes" value={pedidosMes > 0 ? formatMXN(ventaMes / pedidosMes) : 'â'} note="Valor por orden" color={colors.purple} />
              <StatCard label="Avance vs meta" value={META_DEF[mes] > 0 ? Math.round((ventaMes / META_DEF[mes]) * 100) + '%' : 'â'} note={`Meta: ${formatMXN(META_DEF[mes])}`} color={ventaMes >= META_DEF[mes] * 0.8 ? colors.green : colors.orange} />
            </div>

            {/* Canal de ventas + MÃ©todo de pago â con leyendas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {/* Canal de ventas */}
              <div style={cardStyle}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Canal de ventas
                </h4>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie data={canalData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {canalData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {canalData.map((c, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.t1 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.color, display: 'inline-block' }} />
                            {c.name}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: c.color }}>{c.value}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: c.color, width: c.value + '%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MÃ©todo de pago */}
              <div style={cardStyle}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>MÃ©todo de pago
                </h4>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie data={pagoData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {pagoData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pagoData.map((p, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.t1 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, display: 'inline-block' }} />
                            {p.name}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: p.color }}>{p.value}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: p.color, width: p.value + '%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mejores productos */}
            <div style={{ ...cardStyle, marginTop: '12px' }}>
              <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Mejores productos
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Producto</th>
                      <th style={thStyle}>Marca</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Uds.</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Ventas</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Ticket prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOG.map((prod, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>{idx + 1}</td>
                        <td style={tdStyle}>{prod.nombre}</td>
                        <td style={tdStyle}>{prod.marca}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{prod.uds}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(prod.ventas)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(prod.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ãltimos pedidos */}
            <div style={{ ...cardStyle, marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Ãltimos pedidos
                </h4>
                <span style={{ fontSize: '10px', color: colors.t3 }}>{DEMO_ORDERS.length} Ã³rdenes recientes</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}># Orden</th>
                      <th style={thStyle}>Cliente</th>
                      <th style={thStyle}>Producto(s)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                      <th style={thStyle}>Canal</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_ORDERS.map((order) => {
                      const estadoMap = {
                        'Completado': { bg: 'rgba(34,197,94,0.15)', color: colors.green, border: 'rgba(34,197,94,0.2)' },
                        'En trÃ¡nsito': { bg: 'rgba(59,130,246,0.15)', color: colors.blue, border: 'rgba(59,130,246,0.2)' },
                        'Preparando': { bg: 'rgba(249,115,22,0.15)', color: colors.orange, border: 'rgba(249,115,22,0.2)' },
                      };
                      const est = estadoMap[order.estado] || estadoMap['Preparando'];
                      return (
                        <tr key={order.num}>
                          <td style={tdStyle}>{order.num}</td>
                          <td style={tdStyle}>{order.cliente}</td>
                          <td style={tdStyle}>{order.productos}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>{formatMXN(order.monto)}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: order.canal === 'POS' ? colors.gold : order.canal === 'Online' ? colors.cyan : order.canal === 'WhatsApp' ? '#25D366' : '#E1306C' }}>{order.canal}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: est.bg, color: est.color, border: `1px solid ${est.border}`, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              {order.estado}
                            </span>
                          </td>
                          <td style={tdStyle}>{order.fecha}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.br}`, fontSize: '11px', color: colors.t3, textAlign: 'center' }}>
                Los datos en tiempo real requieren conexiÃ³n a Shopify Live
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <StatCard label="Ventas netas" value={formatMXN(ytd25)} note="Cierre anual 2025" color={colors.gold} />
              <StatCard label="Pedidos totales" value={pedidos25.toLocaleString('es-MX')} note={`Ticket prom ${formatMXN(ytd25 / pedidos25)}`} color={colors.blue} />
              <StatCard label="ArtÃ­culos vendidos" value="1,452" note="Unidades netas" color={colors.teal} />
              <StatCard label="Ticket promedio" value={formatMXN(ytd25 / pedidos25)} note="Por pedido" color={colors.purple} />
            </div>

            <div style={cardStyle}>
              <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Ventas mensuales 2025
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={MESES.map((m, idx) => ({ mes: m, ventas: VENTAS_2025[idx], meta: META_DEF[idx] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.br} />
                  <XAxis dataKey="mes" stroke={colors.t2} fontSize={11} />
                  <YAxis stroke={colors.t2} fontSize={11} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip contentStyle={{ background: colors.bg2, border: `1px solid ${colors.br}`, borderRadius: '8px', fontSize: '12px' }} formatter={(value) => formatMXN(value)} />
                  <Bar dataKey="ventas" fill={colors.gold} radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="meta" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GastosSection = () => {
    const totalFixed = fixedExpenses.reduce((a, b) => a + b.monto, 0);
    const now = new Date();
    const mes = now.getMonth();
    const ventaMes = VENTAS_2026[mes];

    // recurrentes y setRecurrentes vienen del estado padre (compartido con Marketing)
    const [editRec, setEditRec] = React.useState(null);

    const recurrentesMes = recurrentes.filter(g => g.mes === mes);
    const totalRecurrentesMes = recurrentesMes.reduce((a, g) => a + g.monto, 0);

    // Gastos del dÃ­a a dÃ­a (vacÃ­o por ahora, se irÃ¡n agregando)
    const gastosDiarios = [];
    const totalDiariosMes = gastosDiarios.reduce((a, g) => a + g.monto, 0);

    const totalVarMes = totalRecurrentesMes + totalDiariosMes;
    const totalMes = totalFixed + totalVarMes;
    const pctGastos = ventaMes > 0 ? Math.round(totalMes / ventaMes * 100) : 0;

    // Cascada financiera
    const costoMercancia = Math.round(ventaMes * 0.699);
    const gananciaBruta = ventaMes - costoMercancia;
    const gananciaPostGastos = gananciaBruta - totalMes;

    // ComisiÃ³n Ana SofÃ­a = 10% sobre utilidad despuÃ©s de gastos (solo si es positiva)
    const comisionAna = gananciaPostGastos > 0 ? Math.round(gananciaPostGastos * 0.10) : 0;
    const gananciaNeta = gananciaPostGastos - comisionAna;

    const barTotal = ventaMes > 0 ? ventaMes : 1;
    const pctCosto = Math.round(costoMercancia / barTotal * 100);
    const pctGastosBar = Math.round(totalMes / barTotal * 100);
    const pctComision = Math.round(comisionAna / barTotal * 100);
    const pctNeta = Math.max(0, 100 - pctCosto - pctGastosBar - pctComision);

    // EvoluciÃ³n de gastos por mes (lÃ­nea)
    const gastosEvolucion = MESES.map((m, idx) => {
      const recMes = recurrentes.filter(g => g.mes === idx).reduce((a, g) => a + g.monto, 0);
      const totalVar = recMes; // + gastos diarios cuando los haya
      if (idx > mes) return { mes: m, fijos: null, variables: null, total: null };
      return { mes: m, fijos: totalFixed, variables: totalVar > 0 ? totalVar : null, total: totalFixed + totalVar };
    });

    // Comisiones Ana SofÃ­a â registro mensual
    const comisionesHistorial = MESES.slice(0, mes + 1).map((m, idx) => {
      const vMes = VENTAS_2026[idx];
      const cMerc = Math.round(vMes * 0.699);
      const recMes = recurrentes.filter(g => g.mes === idx).reduce((a, g) => a + g.monto, 0);
      const utilPost = vMes - cMerc - totalFixed - recMes;
      const com = utilPost > 0 ? Math.round(utilPost * 0.10) : 0;
      return { mes: MESES_FULL[idx], ventas: vMes, utilidad: utilPost, comision: com };
    }).filter(r => r.ventas > 0);

    const totalComisionesYTD = comisionesHistorial.reduce((a, r) => a + r.comision, 0);

    return (
      <div>
        <SectionTitle sub="Costos operativos del negocio Â· fijos y variables">Gastos</SectionTitle>

        {/* âââ KPIs âââ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <StatCard label="Gastos fijos / mes" value={formatMXN(totalFixed)} note="Costos recurrentes" color={colors.red} />
          <StatCard label="Variables este mes" value={formatMXN(totalVarMes)} note={MESES_FULL[mes] + ' 2026'} color={colors.orange} />
          <StatCard label="Total del mes" value={formatMXN(totalMes)} note="Fijos + variables" color={colors.pink} />
          <StatCard label="% Gastos / ventas" value={pctGastos + '%'} note="Meta: <15%" color={pctGastos < 15 ? colors.green : pctGastos < 25 ? colors.orange : colors.red} />
        </div>

        {/* âââ CASCADA FINANCIERA âââ */}
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Â¿CuÃ¡nto queda despuÃ©s de gastos?</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', textAlign: 'center', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.t2, marginBottom: '8px' }}>Ventas del mes</div>
              <div style={{ fontSize: '26px', fontWeight: '600', color: colors.cyan }}>{formatMXN(ventaMes)}</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', textAlign: 'center', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.t2, marginBottom: '8px' }}>Costo mercancÃ­a (~70%)</div>
              <div style={{ fontSize: '26px', fontWeight: '600', color: colors.orange }}>{formatMXN(costoMercancia)}</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.t2, marginBottom: '8px' }}>Gastos operativos</div>
              <div style={{ fontSize: '26px', fontWeight: '600', color: colors.red }}>{formatMXN(totalMes)}</div>
            </div>
          </div>

          {/* Ganancia neta highlight */}
          <div style={{ marginTop: '12px', padding: '14px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: colors.t2 }}>Ganancia neta estimada del mes</span>
            <span style={{ fontSize: '28px', fontWeight: '700', color: gananciaNeta >= 0 ? colors.green : colors.red }}>{formatMXN(gananciaNeta)}</span>
          </div>

          {/* Barra de distribuciÃ³n â 4 segmentos */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '3px', height: '16px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ background: colors.orange, width: pctCosto + '%', transition: 'width 0.8s ease' }} />
              <div style={{ background: colors.red, width: pctGastosBar + '%', transition: 'width 0.8s ease' }} />
              <div style={{ background: colors.purple, width: pctComision + '%', transition: 'width 0.8s ease' }} />
              <div style={{ background: colors.green, width: pctNeta + '%', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11px', color: colors.t2, flexWrap: 'wrap' }}>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: colors.orange, borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} />Costo inv.</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: colors.red, borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} />Gastos op.</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: colors.purple, borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} />ComisiÃ³n</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: colors.green, borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} />Ganancia</span>
            </div>
          </div>
        </div>

        {/* âââ GASTOS FIJOS MENSUALES âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '0' }}>Gastos fijos mensuales</h3>
            <button style={buttonStyle('gold')} onClick={() => {
              const nombre = prompt('Nombre del nuevo gasto:');
              if (!nombre) return;
              const categoria = prompt('Categor\u00eda (Local, Digital, Equipo, Marketing):', 'Local');
              if (!categoria) return;
              const monto = prompt('Monto mensual (MXN):');
              if (!monto || isNaN(Number(monto))) return;
              setFixedExpenses(prev => [...prev, { nombre, categoria, monto: Number(monto) }]);
            }}>+ Agregar</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Concepto</th>
                  <th style={thStyle}>CategorÃ­a</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto MXN</th>
                  <th style={thStyle}>AcciÃ³n</th>
                </tr>
              </thead>
              <tbody>
                {fixedExpenses.map((exp, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{exp.nombre}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: colors.t2 }}>{exp.categoria}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(exp.monto)}</td>
                    <td style={tdStyle}>
                      <button style={buttonStyle()} onClick={() => {
                        const newNombre = prompt('Nombre del gasto:', exp.nombre);
                        if (newNombre === null) return;
                        const newCat = prompt('Categor\u00eda (Local, Digital, Equipo, Marketing):', exp.categoria);
                        if (newCat === null) return;
                        const newMonto = prompt('Monto mensual (MXN):', exp.monto);
                        if (newMonto === null || isNaN(Number(newMonto))) return;
                        setFixedExpenses(prev => prev.map((item, i) => i === idx ? { nombre: newNombre, categoria: newCat, monto: Number(newMonto) } : item));
                      }}>Editar</button>
                      <button style={{ ...buttonStyle(), background: 'rgba(255,80,80,0.15)', color: '#ff5050', marginLeft: '6px' }} onClick={() => {
                        if (confirm('\u00bfEliminar "' + exp.nombre + '" de gastos fijos?')) {
                          setFixedExpenses(prev => prev.filter((_, i) => i !== idx));
                        }
                      }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <td colSpan="2" style={{ ...tdStyle, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Total mensual</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: colors.red }}>{formatMXN(totalFixed)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* âââ COMISIONES ANA SOFÃA âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.purple}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Comisiones Ana SofÃ­a</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>10% sobre utilidades despuÃ©s de gastos</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.t2 }}>Acumulado YTD</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.purple }}>{formatMXN(totalComisionesYTD)}</div>
            </div>
          </div>

          {/* Calculadora del mes */}
          <div style={{ padding: '14px 18px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.purple, marginBottom: '10px' }}>Calculadora â {MESES_FULL[mes]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '3px' }}>Ventas</div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{formatMXN(ventaMes)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '3px' }}>â Costo (70%)</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: colors.orange }}>â{formatMXN(costoMercancia)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '3px' }}>â Gastos op.</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: colors.red }}>â{formatMXN(totalMes)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '3px' }}>= Utilidad base</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: gananciaPostGastos >= 0 ? colors.green : colors.red }}>{formatMXN(gananciaPostGastos)}</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(168,85,247,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: colors.t2 }}>ComisiÃ³n 10% = {formatMXN(gananciaPostGastos)} Ã 0.10</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: colors.purple }}>{formatMXN(comisionAna)}</span>
            </div>
          </div>

          {/* Registro mensual */}
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Mes</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Ventas</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Utilidad base</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>ComisiÃ³n (10%)</th>
                </tr>
              </thead>
              <tbody>
                {comisionesHistorial.map((r, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{r.mes}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(r.ventas)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: r.utilidad >= 0 ? colors.green : colors.red }}>{formatMXN(r.utilidad)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: colors.purple, fontWeight: '600' }}>{formatMXN(r.comision)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <td colSpan="2" style={{ ...tdStyle, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Total acumulado</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: colors.purple }}>{formatMXN(totalComisionesYTD)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* âââ EVOLUCIÃN DE GASTOS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '0' }}>EvoluciÃ³n de gastos â 2026</h4>
            <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '3px', background: colors.red, borderRadius: '2px', display: 'inline-block' }} /> Fijos</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '3px', background: colors.orange, borderRadius: '2px', display: 'inline-block' }} /> Variables</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '3px', background: colors.cyan, borderRadius: '2px', display: 'inline-block' }} /> Total</span>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: colors.t2, marginBottom: '14px' }}>Gastos operativos mes a mes</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={gastosEvolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.br} />
              <XAxis dataKey="mes" stroke={colors.t2} fontSize={11} />
              <YAxis stroke={colors.t2} fontSize={11} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
              <Tooltip contentStyle={{ background: colors.bg2, border: `1px solid ${colors.br}`, borderRadius: '8px', fontSize: '12px' }} formatter={(value) => formatMXN(value)} />
              <Line type="monotone" dataKey="fijos" stroke={colors.red} strokeWidth={2} dot={{ r: 3, fill: colors.red }} name="Fijos" connectNulls={false} />
              <Line type="monotone" dataKey="variables" stroke={colors.orange} strokeWidth={2} dot={{ r: 3, fill: colors.orange }} name="Variables" connectNulls={false} />
              <Line type="monotone" dataKey="total" stroke={colors.cyan} strokeWidth={3} dot={{ r: 4, fill: colors.cyan }} name="Total" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* âââ GASTOS VARIABLES RECURRENTES (Ads + Clip) âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Variables recurrentes</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>InversiÃ³n en Ads y comisiÃ³n de Clip â haz clic en un monto para editarlo</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Concepto</th>
                  {MESES.slice(0, mes + 1).map((m, idx) => (
                    <th key={idx} style={{ ...thStyle, textAlign: 'right' }}>{m}</th>
                  ))}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {['InversiÃ³n Meta Ads', 'ComisiÃ³n Clip'].map((concepto, ci) => {
                  const meses = MESES.slice(0, mes + 1).map((m, idx) => {
                    const r = recurrentes.find(g => g.mes === idx && g.concepto === concepto);
                    return r ? r.monto : 0;
                  });
                  const acum = meses.reduce((a, b) => a + b, 0);
                  const cColor = concepto.includes('Ads') ? colors.purple : colors.gold;
                  return (
                    <tr key={ci}>
                      <td style={tdStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: cColor, flexShrink: 0 }} />
                          {concepto}
                        </span>
                      </td>
                      {meses.map((v, idx) => {
                        const isEditing = editRec && editRec.concepto === concepto && editRec.mes === idx;
                        return (
                          <td key={idx} style={{ ...tdStyle, textAlign: 'right', padding: '6px 10px' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                autoFocus
                                defaultValue={v}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setRecurrentes(prev => prev.map(r => r.mes === idx && r.concepto === concepto ? { ...r, monto: val } : r));
                                  setEditRec(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.target.blur(); }
                                  if (e.key === 'Escape') { setEditRec(null); }
                                }}
                                style={{ width: '80px', background: colors.bg1, color: colors.t1, border: `1px solid ${colors.cyan}`, borderRadius: '4px', padding: '3px 6px', fontSize: '12px', textAlign: 'right', outline: 'none' }}
                              />
                            ) : (
                              <span
                                onClick={() => setEditRec({ concepto, mes: idx })}
                                style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                              >
                                {v > 0 ? formatMXN(v) : 'â'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: cColor }}>{formatMXN(acum)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ ...tdStyle, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Total</td>
                  {MESES.slice(0, mes + 1).map((m, idx) => {
                    const tot = recurrentes.filter(g => g.mes === idx).reduce((a, g) => a + g.monto, 0);
                    return <td key={idx} style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: colors.orange }}>{tot > 0 ? formatMXN(tot) : 'â'}</td>;
                  })}
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: colors.orange }}>{formatMXN(recurrentes.reduce((a, g) => a + g.monto, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* âââ GASTOS DEL DÃA A DÃA âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Gastos del dÃ­a a dÃ­a</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Empaques, envÃ­os, mantenimiento y otros gastos que surjan</div>
            </div>
            <button style={buttonStyle('gold')}>+ Registrar gasto</button>
          </div>
          {gastosDiarios.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fecha</th>
                    <th style={thStyle}>Concepto</th>
                    <th style={thStyle}>CategorÃ­a</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosDiarios.map((g, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}>{g.fecha}</td>
                      <td style={tdStyle}>{g.concepto}</td>
                      <td style={tdStyle}>{g.categoria}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(g.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>ð</div>
              <div style={{ fontSize: '13px', color: colors.t2, marginBottom: '4px' }}>Sin gastos registrados este mes</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Los gastos que vayas registrando aparecerÃ¡n aquÃ­</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ComprasSection = () => {
    // Estado de compras activas e historial
    const [comprasActivas, setComprasActivas] = React.useState([]);
    const [comprasHistorial, setComprasHistorial] = React.useState([]);
    const [proveedores, setProveedores] = React.useState([]);
    const [showFormCompra, setShowFormCompra] = React.useState(false);
    const [showFormProv, setShowFormProv] = React.useState(false);

    // KPIs calculados
    const enTransito = comprasActivas.filter(c => c.estado === 'En trÃ¡nsito').length;
    const capitalCamino = comprasActivas.reduce((a, c) => a + c.monto, 0);
    const entregadas = comprasHistorial.length;
    const totalProveedores = proveedores.length;

    // Estados posibles para las compras
    const ESTADOS_COMPRA = ['Pedido', 'Pagado', 'En trÃ¡nsito', 'En aduana', 'Entregado'];
    const estadoColors = {
      'Pedido': { bg: 'rgba(138,138,154,0.12)', color: colors.t2, border: 'rgba(138,138,154,0.2)' },
      'Pagado': { bg: 'rgba(59,130,246,0.12)', color: colors.blue, border: 'rgba(59,130,246,0.2)' },
      'En trÃ¡nsito': { bg: 'rgba(0,200,224,0.12)', color: colors.cyan, border: 'rgba(0,200,224,0.2)' },
      'En aduana': { bg: 'rgba(249,115,22,0.12)', color: colors.orange, border: 'rgba(249,115,22,0.2)' },
      'Entregado': { bg: 'rgba(34,197,94,0.12)', color: colors.green, border: 'rgba(34,197,94,0.2)' },
    };

    const EstadoBadge = ({ estado }) => {
      const s = estadoColors[estado] || estadoColors['Pedido'];
      return (
        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
          {estado}
        </span>
      );
    };

    // MÃ©todos de pago
    const METODOS_PAGO = ['Transferencia', 'Tarjeta de crÃ©dito', 'Tarjeta de dÃ©bito', 'PayPal', 'Efectivo', 'Otro'];

    // Formulario nueva compra
    const [newCompra, setNewCompra] = React.useState({ proveedor: '', productos: '', monto: '', metodoPago: 'Transferencia', numPedido: '', paqueteria: '', guia: '', estado: 'Pedido', comentarios: '' });

    const guardarCompra = () => {
      if (!newCompra.proveedor || !newCompra.productos) return;
      setComprasActivas(prev => [...prev, { ...newCompra, monto: parseInt(newCompra.monto) || 0, fecha: new Date().toISOString().split('T')[0] }]);
      setNewCompra({ proveedor: '', productos: '', monto: '', metodoPago: 'Transferencia', numPedido: '', paqueteria: '', guia: '', estado: 'Pedido', comentarios: '' });
      setShowFormCompra(false);
    };

    // Marcar como entregado â mover a historial
    const marcarEntregado = (idx) => {
      const compra = { ...comprasActivas[idx], estado: 'Entregado' };
      setComprasHistorial(prev => [compra, ...prev]);
      setComprasActivas(prev => prev.filter((_, i) => i !== idx));
    };

    // Cambiar estado de compra
    const cambiarEstado = (idx, nuevoEstado) => {
      if (nuevoEstado === 'Entregado') { marcarEntregado(idx); return; }
      setComprasActivas(prev => prev.map((c, i) => i === idx ? { ...c, estado: nuevoEstado } : c));
    };

    // Formulario nuevo proveedor
    const [newProv, setNewProv] = React.useState({ nombre: '', sitioWeb: '', contacto: '', whatsapp: '', tiempoEntrega: '', condiciones: '', notas: '' });

    const guardarProv = () => {
      if (!newProv.nombre) return;
      setProveedores(prev => [...prev, { ...newProv }]);
      setNewProv({ nombre: '', sitioWeb: '', contacto: '', whatsapp: '', tiempoEntrega: '', condiciones: '', notas: '' });
      setShowFormProv(false);
    };

    const inputStyle = { width: '100%', background: colors.bg1, color: colors.t1, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { fontSize: '11px', fontWeight: '600', color: colors.t2, marginBottom: '4px', display: 'block', letterSpacing: '0.04em' };

    return (
      <div>
        <SectionTitle sub="Estado del inventario Â· pedidos a proveedores Â· trÃ¡nsito">Compras</SectionTitle>

        {/* âââ KPIs âââ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <StatCard label="En trÃ¡nsito" value={enTransito.toString()} note="Pedidos en camino" color={colors.blue} />
          <StatCard label="Capital en camino" value={formatMXN(capitalCamino)} note="MXN invertidos" color={colors.teal} />
          <StatCard label="Entregas recibidas" value={entregadas.toString()} note="Historial 2026" color={colors.green} />
          <StatCard label="Proveedores" value={totalProveedores.toString()} note="En directorio" color={colors.purple} />
        </div>

        {/* âââ COMPRAS ACTIVAS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '0' }}>Compras activas</h3>
            <button style={buttonStyle('gold')} onClick={() => setShowFormCompra(!showFormCompra)}>
              {showFormCompra ? 'â Cerrar' : '+ Nueva compra'}
            </button>
          </div>

          {/* Formulario nueva compra */}
          {showFormCompra && (
            <div style={{ padding: '16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '12px' }}>Nueva compra</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Proveedor *</label>
                  <input style={inputStyle} placeholder="Nombre o tienda" value={newCompra.proveedor} onChange={(e) => setNewCompra({ ...newCompra, proveedor: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Productos *</label>
                  <input style={inputStyle} placeholder="DescripciÃ³n" value={newCompra.productos} onChange={(e) => setNewCompra({ ...newCompra, productos: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Monto MXN</label>
                  <input style={inputStyle} type="number" placeholder="0" value={newCompra.monto} onChange={(e) => setNewCompra({ ...newCompra, monto: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>MÃ©todo de pago</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={newCompra.metodoPago} onChange={(e) => setNewCompra({ ...newCompra, metodoPago: e.target.value })}>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}># Pedido</label>
                  <input style={inputStyle} placeholder="Opcional" value={newCompra.numPedido} onChange={(e) => setNewCompra({ ...newCompra, numPedido: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>PaqueterÃ­a</label>
                  <input style={inputStyle} placeholder="DHL, Fedex..." value={newCompra.paqueteria} onChange={(e) => setNewCompra({ ...newCompra, paqueteria: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}># GuÃ­a</label>
                  <input style={inputStyle} placeholder="NÃºmero de rastreo" value={newCompra.guia} onChange={(e) => setNewCompra({ ...newCompra, guia: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={newCompra.estado} onChange={(e) => setNewCompra({ ...newCompra, estado: e.target.value })}>
                    {ESTADOS_COMPRA.filter(e => e !== 'Entregado').map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Comentarios</label>
                  <input style={inputStyle} placeholder="Notas..." value={newCompra.comentarios} onChange={(e) => setNewCompra({ ...newCompra, comentarios: e.target.value })} />
                </div>
              </div>
              <button style={{ ...buttonStyle('gold'), padding: '8px 24px' }} onClick={guardarCompra}>Guardar compra</button>
            </div>
          )}

          {/* Tabla de compras activas */}
          {comprasActivas.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...tableStyle, minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Proveedor</th>
                    <th style={thStyle}>Productos</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                    <th style={thStyle}>Pago</th>
                    <th style={thStyle}># Pedido</th>
                    <th style={thStyle}>PaqueterÃ­a</th>
                    <th style={thStyle}># GuÃ­a</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Notas</th>
                    <th style={thStyle}>AcciÃ³n</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasActivas.map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{c.proveedor}</td>
                      <td style={tdStyle}>{c.productos}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(c.monto)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: 'rgba(59,130,246,0.1)', color: colors.blue, border: '1px solid rgba(59,130,246,0.2)' }}>{c.metodoPago || 'â'}</span>
                      </td>
                      <td style={tdStyle}>{c.numPedido || 'â'}</td>
                      <td style={tdStyle}>{c.paqueteria || 'â'}</td>
                      <td style={{ ...tdStyle, fontSize: '11px', fontFamily: 'monospace' }}>{c.guia || 'â'}</td>
                      <td style={tdStyle}>
                        <select
                          value={c.estado}
                          onChange={(e) => cambiarEstado(idx, e.target.value)}
                          style={{ background: (estadoColors[c.estado] || {}).bg || 'transparent', color: (estadoColors[c.estado] || {}).color || colors.t1, border: `1px solid ${(estadoColors[c.estado] || {}).border || colors.br}`, borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                        >
                          {ESTADOS_COMPRA.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.comentarios || 'â'}</td>
                      <td style={tdStyle}>
                        <button style={{ ...buttonStyle(), fontSize: '10px', padding: '3px 8px' }} onClick={() => marcarEntregado(idx)}>â Recibido</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>ð¦</div>
              <div style={{ fontSize: '13px', color: colors.t2, marginBottom: '4px' }}>Sin compras activas</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Registra una nueva compra con el botÃ³n de arriba</div>
            </div>
          )}
        </div>

        {/* âââ HISTORIAL DE ENTREGAS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Historial â entregas recibidas</h3>
          {comprasHistorial.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...tableStyle, minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fecha</th>
                    <th style={thStyle}>Proveedor</th>
                    <th style={thStyle}>Productos</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                    <th style={thStyle}>Pago</th>
                    <th style={thStyle}># Pedido</th>
                    <th style={thStyle}>PaqueterÃ­a</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasHistorial.map((c, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}>{c.fecha}</td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{c.proveedor}</td>
                      <td style={tdStyle}>{c.productos}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(c.monto)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: 'rgba(59,130,246,0.1)', color: colors.blue, border: '1px solid rgba(59,130,246,0.2)' }}>{c.metodoPago || 'â'}</span>
                      </td>
                      <td style={tdStyle}>{c.numPedido || 'â'}</td>
                      <td style={tdStyle}>{c.paqueteria || 'â'}</td>
                      <td style={tdStyle}><EstadoBadge estado="Entregado" /></td>
                      <td style={{ ...tdStyle, fontSize: '12px' }}>{c.comentarios || 'â'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.t2, fontSize: '13px' }}>Sin historial aÃºn.</div>
          )}
        </div>

        {/* âââ DIRECTORIO DE PROVEEDORES âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Directorio de proveedores</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Datos de contacto, tiempos de entrega y condiciones</div>
            </div>
            <button style={buttonStyle('gold')} onClick={() => setShowFormProv(!showFormProv)}>
              {showFormProv ? 'â Cerrar' : '+ Agregar proveedor'}
            </button>
          </div>

          {/* Formulario nuevo proveedor */}
          {showFormProv && (
            <div style={{ padding: '16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.purple, marginBottom: '12px' }}>Nuevo proveedor</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Nombre / Tienda *</label>
                  <input style={inputStyle} placeholder="Nombre del proveedor" value={newProv.nombre} onChange={(e) => setNewProv({ ...newProv, nombre: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Sitio web</label>
                  <input style={inputStyle} placeholder="https://..." value={newProv.sitioWeb} onChange={(e) => setNewProv({ ...newProv, sitioWeb: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Contacto / WhatsApp</label>
                  <input style={inputStyle} placeholder="Nombre o nÃºmero" value={newProv.contacto} onChange={(e) => setNewProv({ ...newProv, contacto: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Tiempo de entrega</label>
                  <input style={inputStyle} placeholder="Ej: 5-7 dÃ­as" value={newProv.tiempoEntrega} onChange={(e) => setNewProv({ ...newProv, tiempoEntrega: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Condiciones de pago</label>
                  <input style={inputStyle} placeholder="Ej: 50% anticipo, contra entrega..." value={newProv.condiciones} onChange={(e) => setNewProv({ ...newProv, condiciones: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Notas</label>
                  <input style={inputStyle} placeholder="Marcas que maneja, descuentos, etc." value={newProv.notas} onChange={(e) => setNewProv({ ...newProv, notas: e.target.value })} />
                </div>
              </div>
              <button style={{ ...buttonStyle('gold'), padding: '8px 24px' }} onClick={guardarProv}>Guardar proveedor</button>
            </div>
          )}

          {/* Tabla / Cards de proveedores */}
          {proveedores.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {proveedores.map((p, idx) => (
                <div key={idx} style={{ padding: '14px 18px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{p.nombre}</div>
                    <button style={{ ...buttonStyle(), fontSize: '10px', padding: '2px 8px' }} onClick={() => setProveedores(prev => prev.filter((_, i) => i !== idx))}>â</button>
                  </div>
                  {p.sitioWeb && <div style={{ fontSize: '12px', color: colors.cyan, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ð {p.sitioWeb}</div>}
                  {p.contacto && <div style={{ fontSize: '12px', color: colors.t2, marginBottom: '4px' }}>ð¬ {p.contacto}</div>}
                  {p.notas && <div style={{ fontSize: '11px', color: colors.t2, marginBottom: '4px', opacity: 0.7 }}>{p.notas}</div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {p.tiempoEntrega && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,200,224,0.1)', color: colors.cyan, border: '1px solid rgba(0,200,224,0.2)' }}>â± {p.tiempoEntrega}</span>}
                    {p.condiciones && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(240,180,41,0.1)', color: colors.gold, border: '1px solid rgba(240,180,41,0.2)' }}>ð³ {p.condiciones}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>ð¢</div>
              <div style={{ fontSize: '13px', color: colors.t2, marginBottom: '4px' }}>Sin proveedores registrados</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Agrega tus proveedores para tener su info siempre a la mano</div>
            </div>
          )}
        </div>

        {/* âââ FECHAS FUERTES PARA COMPRAR âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Calendario de oportunidades</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>Fechas clave para conseguir mejores precios en inventario</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { mes: 'Enero', fecha: '2 â 15 Ene', evento: 'Farfetch Winter Sale', donde: 'Farfetch', tip: 'Sale final de invierno. Descuentos hasta 60% en diseÃ±ador y streetwear premium. Cettire tambiÃ©n hace rebajas similares.', color: colors.cyan, icon: 'âï¸' },
              { mes: 'Enero', fecha: '5 â 20 Ene', evento: 'SSENSE Sale Final', donde: 'SSENSE', tip: 'Ãltimas reducciones de la sale de invierno. Piezas de Off-White, Balenciaga, Fear of God a 50-70% off.', color: colors.purple, icon: 'ð·ï¸' },
              { mes: 'Febrero', fecha: '14 â 17 Feb', evento: 'Presidents Day Sales US', donde: 'USA', tip: 'Nike, Foot Locker, Nordstrom â descuentos 20-40%. Buen momento para ir a outlets en McAllen, Houston o LA.', color: colors.blue, icon: 'ðºð¸' },
              { mes: 'Marzo', fecha: '10 Mar â 15 Abr', evento: 'Fin de temporada FW', donde: 'Farfetch Â· Cettire Â· SSENSE', tip: 'LiquidaciÃ³n colecciÃ³n otoÃ±o-invierno en todas las plataformas. Ãltimas tallas y piezas Ãºnicas al mejor precio.', color: colors.green, icon: 'ð±' },
              { mes: 'Mayo', fecha: '23 â 26 May', evento: 'Memorial Day Sales US', donde: 'USA', tip: 'Nike, Adidas, outlets premium con 30-50% extra. Ideal para viaje de compras a USA â abastecer antes del verano.', color: colors.teal, icon: 'â­' },
              { mes: 'Junio', fecha: '1 Jun â 15 Jul', evento: 'Summer Sale', donde: 'Farfetch Â· SSENSE Â· Cettire', tip: 'LA MEJOR ÃPOCA. SSENSE sale (hasta 70%), Farfetch mid-season, Cettire summer clearance. Comprar inventario para Q3-Q4.', color: colors.gold, icon: 'âï¸' },
              { mes: 'Julio', fecha: '1â4 Jul Â· 8â9 Jul', evento: '4th of July + Prime Day', donde: 'USA Â· Amazon', tip: 'Doble oportunidad: sales por Independence Day en retailers US + Amazon Prime Day para suministros y sneakers seleccionados.', color: colors.red, icon: 'ð¥' },
              { mes: 'Septiembre', fecha: '29 Ago â 1 Sep', evento: 'Labor Day Sales US', donde: 'USA', tip: 'Ãltimo gran sale de verano en USA. Outlets Nike, premium outlets. Stock para temporada navideÃ±a.', color: colors.orange, icon: 'ðï¸' },
              { mes: 'Noviembre', fecha: '14â17 Nov (MX) Â· 28 Nov (US)', evento: 'Buen Fin + Black Friday', donde: 'Todos', tip: 'Farfetch hasta 50%, SSENSE deals, Cettire extra discounts, Buen Fin MX, Black Friday USA. COMPRAR TODO para diciembre y Q1.', color: colors.red, icon: 'ð¤' },
              { mes: 'Noviembre', fecha: '1 Dic', evento: 'Cyber Monday', donde: 'Farfetch Â· Cettire Â· Online', tip: 'ExtensiÃ³n del Black Friday online. Farfetch y Cettire suelen extender o mejorar descuentos. Ãltimas oportunidades.', color: colors.pink, icon: 'ð»' },
              { mes: 'Diciembre', fecha: '26 â 31 Dic', evento: 'Post-Xmas + Boxing Day', donde: 'Farfetch Â· SSENSE Â· USA', tip: 'Boxing Day sale en plataformas internacionales. Liquidaciones finales. Reabastecer lo que se agotÃ³ en navidad.', color: colors.cyan, icon: 'ð' },
              { mes: 'Todo el aÃ±o', fecha: 'Revisar cada semana', evento: 'Cettire everyday pricing', donde: 'Cettire', tip: 'Cettire maneja precios por debajo de retail todo el aÃ±o en marcas como Balenciaga, Gucci, Prada. Revisar constantemente.', color: colors.t2, icon: 'ð' },
            ].map((f, idx) => {
              const now = new Date();
              const mesMap = { 'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5, 'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11, 'Todo el aÃ±o': -1 };
              const mesIdx = mesMap[f.mes] !== undefined ? mesMap[f.mes] : -1;
              const isPast = mesIdx !== -1 && mesIdx < now.getMonth();
              const isCurrent = mesIdx === now.getMonth();
              return (
                <div key={idx} style={{ padding: '14px 16px', background: isCurrent ? f.color + '10' : colors.bg1, borderRadius: '10px', border: `1px solid ${isCurrent ? f.color + '30' : colors.br}`, opacity: isPast ? 0.5 : 1, position: 'relative' }}>
                  {isCurrent && <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '8px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: f.color + '25', color: f.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ahora</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '20px' }}>{f.icon}</div>
                    <div style={{ fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: colors.t2, border: '1px solid rgba(255,255,255,0.08)' }}>{f.donde}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>{f.evento}</div>
                  <div style={{ fontSize: '11px', color: f.color, fontWeight: '600', marginBottom: '6px' }}>{f.fecha}</div>
                  <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.4' }}>{f.tip}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const MarketingSection = () => {
    // Datos de Meta â cuando se conecte la API, metaConnected = true y los valores se llenarÃ¡n
    const metaConnected = false;
    const mesMkt = new Date().getMonth();
    // adSpend se jala de recurrentes (fuente compartida con Gastos)
    const adSpendFromRecurrentes = recurrentes
      .filter(g => g.mes === mesMkt && g.concepto === 'InversiÃ³n Meta Ads')
      .reduce((a, g) => a + g.monto, 0);
    const adSpend = adSpendFromRecurrentes;
    const impressions = 0;
    const reach = 0;
    const clicks = 0;
    const ctr = 0;
    const cpc = 0;
    const conversions = 0;
    const roas = 0;
    const costPerResult = 0;

    const campaignData = [
      { nombre: 'CampaÃ±a Verano 2026', estado: 'pausada', presupuesto: 5000, gastado: 0, impresiones: 0, clics: 0, conversiones: 0, roas: 0 },
      { nombre: 'Retargeting Web Visitors', estado: 'borrador', presupuesto: 3000, gastado: 0, impresiones: 0, clics: 0, conversiones: 0, roas: 0 },
      { nombre: 'Lookalike - Compradores VIP', estado: 'borrador', presupuesto: 4000, gastado: 0, impresiones: 0, clics: 0, conversiones: 0, roas: 0 },
    ];

    const estadoBadge = (estado) => {
      const map = {
        activa: { bg: 'rgba(34,197,94,0.15)', color: colors.green, border: 'rgba(34,197,94,0.2)' },
        pausada: { bg: 'rgba(240,180,41,0.15)', color: colors.gold, border: 'rgba(240,180,41,0.2)' },
        borrador: { bg: 'rgba(138,138,154,0.15)', color: colors.t2, border: 'rgba(138,138,154,0.2)' },
        finalizada: { bg: 'rgba(59,130,246,0.15)', color: colors.blue, border: 'rgba(59,130,246,0.2)' },
      };
      const s = map[estado] || map.borrador;
      return { fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.04em', textTransform: 'uppercase' };
    };

    return (
      <div>
        <SectionTitle>Marketing</SectionTitle>

        {/* Banner de conexiÃ³n Meta */}
        <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px', background: metaConnected ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)', color: metaConnected ? colors.green : '#60a5fa', border: metaConnected ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(59,130,246,0.2)' }}>
          <span>{metaConnected ? 'â' : 'â¡'}</span>
          <span>
            {metaConnected
              ? 'Conectado a Meta Business Suite â datos actualizÃ¡ndose en tiempo real.'
              : <>Los datos de marketing mostrados son <strong>placeholders</strong>. Conecta <strong>Meta Business Suite</strong> para ver mÃ©tricas reales de Facebook Ads e Instagram en tiempo real.</>
            }
          </span>
        </div>

        {/* KPIs principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <StatCard label="Gasto en ads" value={adSpend > 0 ? formatMXN(adSpend) : 'â'} note="Mes actual Â· sincronizado con Gastos" color={colors.blue} />
          <StatCard label="ROAS" value={roas > 0 ? roas.toFixed(1) + 'x' : 'â'} note="Retorno por $1 invertido" color={colors.green} />
          <StatCard label="CPC promedio" value={cpc > 0 ? formatMXN(cpc) : 'â'} note="Costo por clic" color={colors.purple} />
          <StatCard label="Conversiones" value={conversions > 0 ? conversions.toString() : 'â'} note="Compras atribuidas" color={colors.gold} />
        </div>

        {/* Segunda fila de KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <StatCard label="Impresiones" value={impressions > 0 ? impressions.toLocaleString('es-MX') : 'â'} note="Veces mostrado" color={colors.cyan} />
          <StatCard label="Alcance" value={reach > 0 ? reach.toLocaleString('es-MX') : 'â'} note="Personas Ãºnicas" color={colors.teal} />
          <StatCard label="Clics" value={clicks > 0 ? clicks.toLocaleString('es-MX') : 'â'} note="Clics al sitio" color={colors.orange} />
          <StatCard label="CTR" value={ctr > 0 ? ctr.toFixed(2) + '%' : 'â'} note="Click-through rate" color={colors.pink} />
        </div>

        {/* Embudo de conversiÃ³n */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={cardStyle}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Embudo de conversiÃ³n
            </h4>
            {[
              { label: 'Impresiones', value: impressions, color: colors.cyan, width: '100%' },
              { label: 'Clics', value: clicks, color: colors.blue, width: clicks > 0 ? Math.max((clicks / Math.max(impressions, 1)) * 100, 5) + '%' : '0%' },
              { label: 'Agregar al carrito', value: 0, color: colors.purple, width: '0%' },
              { label: 'Compras', value: conversions, color: colors.green, width: conversions > 0 ? Math.max((conversions / Math.max(impressions, 1)) * 100, 2) + '%' : '0%' },
            ].map((step, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: colors.t2 }}>{step.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: step.color }}>{step.value > 0 ? step.value.toLocaleString('es-MX') : 'â'}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: step.color, width: step.value > 0 ? step.width : '0%', transition: 'width 0.6s', opacity: step.value > 0 ? 1 : 0.2 }} />
                </div>
              </div>
            ))}
            {!metaConnected && (
              <div style={{ textAlign: 'center', padding: '12px 0 4px', fontSize: '11px', color: colors.t3 }}>
                Conecta Meta para ver el embudo en tiempo real
              </div>
            )}
          </div>

          {/* DistribuciÃ³n de gasto por plataforma */}
          <div style={cardStyle}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>DistribuciÃ³n de gasto
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { plataforma: 'Instagram Ads', icon: 'ð·', porcentaje: 0, color: colors.pink, desc: 'Stories, Reels, Feed' },
                { plataforma: 'Facebook Ads', icon: 'ð', porcentaje: 0, color: colors.blue, desc: 'Feed, Marketplace' },
                { plataforma: 'OrgÃ¡nico Instagram', icon: 'â¨', porcentaje: 0, color: colors.purple, desc: 'Posts, Reels, Stories' },
                { plataforma: 'WhatsApp Business', icon: 'ð¬', porcentaje: 0, color: '#25D366', desc: 'Mensajes directos' },
              ].map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>{p.plataforma}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: p.color }}>{p.porcentaje > 0 ? p.porcentaje + '%' : 'â'}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '2px', background: p.color, width: p.porcentaje + '%', opacity: p.porcentaje > 0 ? 1 : 0.15 }} />
                    </div>
                    <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {!metaConnected && (
              <div style={{ textAlign: 'center', padding: '12px 0 4px', fontSize: '11px', color: colors.t3 }}>
                Sin datos â pendiente conexiÃ³n a Meta
              </div>
            )}
          </div>
        </div>

        {/* Tabla de campaÃ±as */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>CampaÃ±as Â· Meta Ads
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: colors.t3 }}>{campaignData.length} campaÃ±as</span>
              <button style={buttonStyle('gold')}>+ Nueva campaÃ±a</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>CampaÃ±a</th>
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Presupuesto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Gastado</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Impresiones</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Clics</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Conv.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map((c, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{c.nombre}</td>
                    <td style={tdStyle}><span style={estadoBadge(c.estado)}>{c.estado}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(c.presupuesto)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.gastado > 0 ? formatMXN(c.gastado) : 'â'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.impresiones > 0 ? c.impresiones.toLocaleString('es-MX') : 'â'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.clics > 0 ? c.clics.toLocaleString('es-MX') : 'â'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.conversiones > 0 ? c.conversiones : 'â'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.roas > 0 ? c.roas.toFixed(1) + 'x' : 'â'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rendimiento orgÃ¡nico */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Rendimiento orgÃ¡nico Â· Instagram
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Seguidores', value: 'â', note: 'Total', color: colors.pink },
              { label: 'Alcance orgÃ¡nico', value: 'â', note: 'Ãltimos 30 dÃ­as', color: colors.purple },
              { label: 'Interacciones', value: 'â', note: 'Likes + comments', color: colors.cyan },
              { label: 'Tasa de engagement', value: 'â', note: '% interacciones/alcance', color: colors.green },
            ].map((m, idx) => (
              <div key={idx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: m.color, marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: colors.t1 }}>{m.value}</div>
                <div style={{ fontSize: '10px', color: colors.t2, marginTop: '3px' }}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* âââ ESTRATEGIA DE CONTENIDO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.pink}` }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Estrategia de contenido Â· Instagram</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>Sugerencias y plan de acciÃ³n para @lostproject.mx</div>
          </div>

          {/* Sugerencias para mejorar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { icon: 'ð¡', titulo: 'Seguir con Reels + humor', desc: 'Es tu mayor fortaleza. Los rankings, POVs y el tono cercano generan comunidad. Duplica la frecuencia.', color: colors.green, tag: 'Mantener' },
              { icon: 'ð¸', titulo: 'Agregar fotos editoriales', desc: 'Complementa los Reels con fotos lifestyle de producto â alguien usÃ¡ndolos, no solo el par en caja.', color: colors.cyan, tag: 'Agregar' },
              { icon: 'ð¯', titulo: 'Organizar highlights', desc: 'Crea highlights por: Marcas, ReseÃ±as de clientes, Tienda, EnvÃ­os, FAQ. Facilita la navegaciÃ³n para nuevos seguidores.', color: colors.purple, tag: 'Mejorar' },
              { icon: 'ð·ï¸', titulo: 'Marcas aspiracionales', desc: 'Muestra tus marcas premium con la misma calidad visual que las tiendas de lujo, pero con tu personalidad.', color: colors.gold, tag: 'Elevar' },
              { icon: 'ð¤³', titulo: 'MÃ¡s caras del equipo', desc: 'Fran y Mathias conectan con la audiencia. MÃ¡s presencia personal = mÃ¡s confianza y engagement.', color: colors.pink, tag: 'Potenciar' },
              { icon: 'ð', titulo: 'Carruseles educativos', desc: 'Agrega 1-2 carruseles por semana: guÃ­as de tallas, cÃ³mo identificar originales, tendencias de temporada.', color: colors.blue, tag: 'Agregar' },
            ].map((s, idx) => (
              <div key={idx} style={{ padding: '14px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                  <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: s.color + '15', color: s.color, border: `1px solid ${s.color}30`, fontWeight: '600' }}>{s.tag}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{s.titulo}</div>
                <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.5' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Pilares de contenido */}
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.pink, marginBottom: '12px' }}>Pilares de contenido â publicar 4-5 veces por semana</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { pilar: 'Reels de entretenimiento', freq: '2x/sem', color: colors.red, icon: 'ð¬', ideas: ['Rankings de pares (ya funciona â seguir)', 'POV humor sneakerhead', 'Reacciones a outfits de clientes', '"Adivina el precio" con productos de la tienda', 'Tendencias de TikTok adaptadas a sneakers'] },
              { pilar: 'Producto + EducaciÃ³n', freq: '1-2x/sem', color: colors.cyan, icon: 'ð', ideas: ['Unboxing de drops nuevos (Farfetch, SSENSE)', 'GuÃ­a "CÃ³mo identificar si es original"', 'Top 5 sneakers por debajo de $X', 'Historia detrÃ¡s de la marca/modelo', 'Comparativa: original vs rÃ©plica'] },
              { pilar: 'DetrÃ¡s de cÃ¡maras', freq: '1x/sem', color: colors.purple, icon: 'ð¦', ideas: ['Empacando pedidos / proceso de envÃ­o', 'Viaje a USA para compras', 'Recibiendo mercancÃ­a nueva', 'Un dÃ­a en la tienda de Lost Project', 'CÃ³mo elegimos quÃ© comprar'] },
              { pilar: 'Comunidad + Social proof', freq: '1x/sem', color: colors.gold, icon: 'ð¤', ideas: ['Clientes recogiendo en tienda', 'Reviews y testimonios reales', 'Encuestas y Q&A en stories', '"Este par lo eligiÃ³ [cliente]" â styling', 'Memes del mundo sneaker'] },
            ].map((p, idx) => (
              <div key={idx} style={{ padding: '14px 16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>{p.pilar}</span>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: p.color + '15', color: p.color, border: `1px solid ${p.color}25`, fontWeight: '600' }}>{p.freq}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {p.ideas.map((idea, i) => (
                    <div key={i} style={{ fontSize: '11px', color: colors.t2, paddingLeft: '10px', borderLeft: `2px solid ${p.color}30`, lineHeight: '1.4' }}>{idea}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Calendario semanal */}
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.pink, marginBottom: '12px' }}>Calendario semanal sugerido</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '20px' }}>
            {[
              { dia: 'LUN', tipo: 'Reel humor', color: colors.red, icon: 'ð¬' },
              { dia: 'MAR', tipo: 'Stories encuesta', color: colors.gold, icon: 'ð' },
              { dia: 'MIE', tipo: 'Producto / Drop', color: colors.cyan, icon: 'ð' },
              { dia: 'JUE', tipo: 'Behind scenes', color: colors.purple, icon: 'ð¦' },
              { dia: 'VIE', tipo: 'Reel trending', color: colors.red, icon: 'ð¥' },
              { dia: 'SAB', tipo: 'Comunidad', color: colors.gold, icon: 'ð¤' },
              { dia: 'DOM', tipo: 'Descanso / Stories', color: colors.t2, icon: 'ð´' },
            ].map((d, idx) => (
              <div key={idx} style={{ padding: '10px 6px', background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: d.color, letterSpacing: '0.1em', marginBottom: '6px' }}>{d.dia}</div>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{d.icon}</div>
                <div style={{ fontSize: '9px', color: colors.t2, lineHeight: '1.3' }}>{d.tipo}</div>
              </div>
            ))}
          </div>

          {/* Tips de crecimiento */}
        </div>

        {/* âââ CALCULADORA DE INVERSIÃN EN ADS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.blue}` }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Calculadora de inversiÃ³n en ads</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>Â¿CuÃ¡nto invertir para alcanzar tu meta de ventas?</div>
          </div>
          {(() => {
            const mesActual = new Date().getMonth();
            const ventasMesActual = VENTAS_2026[mesActual];
            const adsMesActual = recurrentes.filter(g => g.mes === mesActual && g.concepto === 'InversiÃ³n Meta Ads').reduce((a, g) => a + g.monto, 0);
            const roasReal = adsMesActual > 0 && ventasMesActual > 0 ? (ventasMesActual / adsMesActual) : 0;
            const metaMensual = META_DEF[mesActual] || 0;
            const inversionNecesaria = roasHistorico > 0 ? Math.round(metaMensual / roasHistorico) : 0;
            const inversionIdeal = roasHistorico > 0 ? Math.round(500000 / 12 / roasHistorico) : 0;

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.blue, marginBottom: '6px' }}>ROAS estimado</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={roasHistorico}
                        onChange={e => setRoasHistorico(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        style={{ width: '60px', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '6px 8px', color: colors.t1, fontSize: '20px', fontWeight: '700', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '16px', fontWeight: '700', color: colors.t2 }}>x</span>
                    </div>
                    <div style={{ fontSize: '10px', color: colors.t2, marginTop: '4px' }}>Ajusta segÃºn tu historial</div>
                  </div>
                  <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '6px' }}>Meta del mes</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.t1 }}>{formatMXN(metaMensual)}</div>
                    <div style={{ fontSize: '10px', color: colors.t2, marginTop: '4px' }}>en ventas</div>
                  </div>
                  <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '6px' }}>InversiÃ³n necesaria</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.green }}>{formatMXN(inversionNecesaria)}</div>
                    <div style={{ fontSize: '10px', color: colors.t2, marginTop: '4px' }}>para alcanzar la meta</div>
                  </div>
                </div>
                {/* FÃ³rmula visual */}
                <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: colors.t2, marginBottom: '4px' }}>Meta ventas</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.cyan }}>{formatMXN(metaMensual)}</div>
                    </div>
                    <div style={{ fontSize: '18px', color: colors.t2 }}>Ã·</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: colors.t2, marginBottom: '4px' }}>ROAS</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.blue }}>{roasHistorico}x</div>
                    </div>
                    <div style={{ fontSize: '18px', color: colors.t2 }}>=</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: colors.t2, marginBottom: '4px' }}>Invertir en ads</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.green }}>{formatMXN(inversionNecesaria)}</div>
                    </div>
                  </div>
                  {roasReal > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '12px', padding: '8px', background: 'rgba(240,180,41,0.06)', borderRadius: '6px', border: '1px solid rgba(240,180,41,0.15)' }}>
                      <span style={{ fontSize: '11px', color: colors.gold }}>ROAS real este mes: <strong>{roasReal.toFixed(1)}x</strong> ({formatMXN(adsMesActual)} invertidos â {formatMXN(ventasMesActual)} vendidos)</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* âââ TRACKER DE CONTENIDO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.pink}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Tracker de contenido</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Registra y dale seguimiento a las publicaciones de la semana</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {(() => {
                const semana = contentTracker.filter(c => {
                  const d = new Date(c.fecha);
                  const now = new Date();
                  const startOfWeek = new Date(now);
                  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
                  startOfWeek.setHours(0,0,0,0);
                  return d >= startOfWeek;
                });
                const hechos = semana.filter(c => c.hecho).length;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '6px', background: colors.bg1, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (hechos / 5) * 100)}%`, height: '100%', background: colors.green, borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: colors.t2 }}>{hechos}/5 esta semana</span>
                  </div>
                );
              })()}
              <button onClick={() => setShowFormContent(!showFormContent)} style={buttonStyle('pink')}>{showFormContent ? 'â Cerrar' : '+ Registrar publicaciÃ³n'}</button>
            </div>
          </div>
          {showFormContent && (
            <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>DÃ­a</label>
                  <select value={newContent.dia} onChange={e => setNewContent({ ...newContent, dia: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {['Lunes', 'Martes', 'MiÃ©rcoles', 'Jueves', 'Viernes', 'SÃ¡bado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Pilar</label>
                  <select value={newContent.pilar} onChange={e => setNewContent({ ...newContent, pilar: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {['Entretenimiento', 'Producto + EducaciÃ³n', 'DetrÃ¡s de cÃ¡maras', 'Comunidad + Social proof'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Formato</label>
                  <select value={newContent.formato} onChange={e => setNewContent({ ...newContent, formato: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {['Reel', 'Carrusel', 'Historia', 'Foto', 'ColaboraciÃ³n'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>DescripciÃ³n</label>
                  <input value={newContent.descripcion} onChange={e => setNewContent({ ...newContent, descripcion: e.target.value })} placeholder="Ej: Reel ranking top 5 Jordan del aÃ±o" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
              </div>
              <button onClick={() => { if (newContent.descripcion.trim()) { setContentTracker(prev => [...prev, { ...newContent, fecha: new Date().toISOString(), hecho: false, id: Date.now() }]); setNewContent({ dia: 'Lunes', pilar: 'Entretenimiento', formato: 'Reel', descripcion: '' }); setShowFormContent(false); } }} style={{ ...buttonStyle('green'), width: '100%' }}>Agregar al tracker</button>
            </div>
          )}
          {contentTracker.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '40px' }}>â</th>
                    <th style={thStyle}>DÃ­a</th>
                    <th style={thStyle}>Pilar</th>
                    <th style={thStyle}>Formato</th>
                    <th style={thStyle}>DescripciÃ³n</th>
                    <th style={{ ...thStyle, width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {contentTracker.map((c) => {
                    const pilarColors = { 'Entretenimiento': colors.gold, 'Producto + EducaciÃ³n': colors.cyan, 'DetrÃ¡s de cÃ¡maras': colors.purple, 'Comunidad + Social proof': colors.green };
                    const formatoColors = { 'Reel': colors.pink, 'Carrusel': colors.blue, 'Historia': colors.orange, 'Foto': colors.teal, 'ColaboraciÃ³n': colors.gold };
                    return (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input type="checkbox" checked={c.hecho} onChange={() => setContentTracker(prev => prev.map(p => p.id === c.id ? { ...p, hecho: !p.hecho } : p))} style={{ accentColor: colors.green, cursor: 'pointer', width: '16px', height: '16px' }} />
                        </td>
                        <td style={{ ...tdStyle, opacity: c.hecho ? 0.5 : 1 }}>{c.dia}</td>
                        <td style={tdStyle}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: (pilarColors[c.pilar] || colors.t2) + '15', color: pilarColors[c.pilar] || colors.t2, border: `1px solid ${(pilarColors[c.pilar] || colors.t2)}30` }}>{c.pilar}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: (formatoColors[c.formato] || colors.t2) + '15', color: formatoColors[c.formato] || colors.t2, border: `1px solid ${(formatoColors[c.formato] || colors.t2)}30` }}>{c.formato}</span></td>
                        <td style={{ ...tdStyle, textDecoration: c.hecho ? 'line-through' : 'none', opacity: c.hecho ? 0.5 : 1 }}>{c.descripcion}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => setContentTracker(prev => prev.filter(p => p.id !== c.id))} style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: '13px', padding: '2px' }}>â</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ border: `2px dashed ${colors.br}`, borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>ð</div>
              <div style={{ fontSize: '13px', color: colors.t2 }}>Sin publicaciones registradas</div>
              <div style={{ fontSize: '11px', color: colors.t3, marginTop: '4px' }}>Haz clic en "Registrar publicaciÃ³n" para empezar a trackear tu contenido</div>
            </div>
          )}
        </div>

        {/* âââ REGISTRO DE COLABORACIONES / INFLUENCERS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.gold}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Colaboraciones e influencers</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Registra envÃ­os, canjes y colaboraciones pagadas</div>
            </div>
            <button onClick={() => setShowFormCollab(!showFormCollab)} style={buttonStyle('gold')}>{showFormCollab ? 'â Cerrar' : '+ Nueva colaboraciÃ³n'}</button>
          </div>
          {showFormCollab && (
            <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Influencer / Creador</label>
                  <input value={newCollab.influencer} onChange={e => setNewCollab({ ...newCollab, influencer: e.target.value })} placeholder="@usuario" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Plataforma</label>
                  <select value={newCollab.plataforma} onChange={e => setNewCollab({ ...newCollab, plataforma: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Otro'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Seguidores</label>
                  <input value={newCollab.seguidores} onChange={e => setNewCollab({ ...newCollab, seguidores: e.target.value })} placeholder="Ej: 15K" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Producto enviado</label>
                  <input value={newCollab.producto} onChange={e => setNewCollab({ ...newCollab, producto: e.target.value })} placeholder="Ej: Nike Dunk Low" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Costo / Valor ($)</label>
                  <input type="number" value={newCollab.costo} onChange={e => setNewCollab({ ...newCollab, costo: e.target.value })} placeholder="0" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Ventas generadas ($)</label>
                  <input type="number" value={newCollab.ventasGeneradas} onChange={e => setNewCollab({ ...newCollab, ventasGeneradas: e.target.value })} placeholder="0" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Estado</label>
                  <select value={newCollab.estado} onChange={e => setNewCollab({ ...newCollab, estado: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {['Enviado', 'Publicado', 'En negociaciÃ³n', 'Completado', 'Cancelado'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Notas</label>
                  <input value={newCollab.notas} onChange={e => setNewCollab({ ...newCollab, notas: e.target.value })} placeholder="Detalles de la colaboraciÃ³n..." style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
              </div>
              <button onClick={() => { if (newCollab.influencer.trim()) { setCollabs(prev => [...prev, { ...newCollab, costo: Number(newCollab.costo) || 0, ventasGeneradas: Number(newCollab.ventasGeneradas) || 0, fecha: new Date().toISOString(), id: Date.now() }]); setNewCollab({ influencer: '', plataforma: 'Instagram', seguidores: '', producto: '', costo: '', ventasGeneradas: '', estado: 'Enviado', notas: '' }); setShowFormCollab(false); } }} style={{ ...buttonStyle('green'), width: '100%' }}>Registrar colaboraciÃ³n</button>
            </div>
          )}
          {collabs.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Total collabs</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{collabs.length}</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.red, marginBottom: '4px' }}>Invertido</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(collabs.reduce((a, c) => a + c.costo, 0))}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Ventas generadas</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(collabs.reduce((a, c) => a + c.ventasGeneradas, 0))}</div>
                </div>
                <div style={{ background: 'rgba(0,200,224,0.06)', border: '1px solid rgba(0,200,224,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>ROI collabs</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{(() => { const inv = collabs.reduce((a, c) => a + c.costo, 0); const ven = collabs.reduce((a, c) => a + c.ventasGeneradas, 0); return inv > 0 ? (ven / inv).toFixed(1) + 'x' : 'â'; })()}</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Influencer</th>
                      <th style={thStyle}>Plataforma</th>
                      <th style={thStyle}>Seguidores</th>
                      <th style={thStyle}>Producto</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Costo</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Ventas</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collabs.map((c) => {
                      const estadoMap = { 'Enviado': colors.blue, 'Publicado': colors.green, 'En negociaciÃ³n': colors.gold, 'Completado': colors.cyan, 'Cancelado': colors.red };
                      return (
                        <tr key={c.id}>
                          <td style={{ ...tdStyle, fontWeight: '600' }}>{c.influencer}</td>
                          <td style={tdStyle}>{c.plataforma}</td>
                          <td style={tdStyle}>{c.seguidores}</td>
                          <td style={tdStyle}>{c.producto}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(c.costo)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{c.ventasGeneradas > 0 ? formatMXN(c.ventasGeneradas) : 'â'}</td>
                          <td style={tdStyle}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: (estadoMap[c.estado] || colors.t2) + '15', color: estadoMap[c.estado] || colors.t2, border: `1px solid ${(estadoMap[c.estado] || colors.t2)}30` }}>{c.estado}</span></td>
                          <td style={{ ...tdStyle, fontSize: '11px', color: colors.t2 }}>{c.notas || 'â'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ border: `2px dashed ${colors.br}`, borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>ð¤</div>
              <div style={{ fontSize: '13px', color: colors.t2 }}>Sin colaboraciones registradas</div>
              <div style={{ fontSize: '11px', color: colors.t3, marginTop: '4px' }}>Cuando hagas envÃ­os a influencers o canjes, regÃ­stralos aquÃ­ para medir el ROI</div>
            </div>
          )}
        </div>

        {/* GuÃ­a de conexiÃ³n */}
        {!metaConnected && (
          <div style={{ ...cardStyle, marginTop: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>CÃ³mo conectar Meta Business Suite
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              {[
                { paso: '1', titulo: 'Meta Business Suite', desc: 'Accede a business.facebook.com y verifica que tu cuenta de negocio estÃ© activa.' },
                { paso: '2', titulo: 'Crear App en Meta', desc: 'Ve a developers.facebook.com â Mis Apps â Crear App tipo "Business".' },
                { paso: '3', titulo: 'Permisos de API', desc: 'Activa Marketing API y genera un token de acceso con permisos ads_read.' },
                { paso: '4', titulo: 'Conectar aquÃ­', desc: 'Ingresa tu App ID y token â todas las mÃ©tricas se actualizarÃ¡n automÃ¡ticamente.' },
              ].map((p, idx) => (
                <div key={idx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: colors.cyan, marginBottom: '8px' }}>{p.paso}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: colors.t1, marginBottom: '4px' }}>{p.titulo}</div>
                  <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.5' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ObjetivosSection = () => {
    const now = new Date();
    const mes = now.getMonth();
    const ytd = VENTAS_2026.reduce((a, b) => a + b, 0);
    const totalGastosFijos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
    const MARGEN = 0.301;
    const mesesRestantes = 12 - (mes + 1);
    const ventas2025Total = VENTAS_2025.reduce((a, b) => a + b, 0);

    // ââ Escenario CONSERVADOR: +15% vs 2025 ââ
    const factorCons = 1.15;
    const metaVentasCons = Math.round(ventas2025Total * factorCons);
    const metaUtilidadCons = Math.round(metaVentasCons * MARGEN - totalGastosFijos * 12);
    const metaMensualCons = Math.round(metaVentasCons / 12);
    const pctVentasCons = ((ytd / metaVentasCons) * 100).toFixed(1);

    // ââ Escenario AMBICIOSO: +35% vs 2025 ââ
    const factorAmb = 1.35;
    const metaVentasAmb = Math.round(ventas2025Total * factorAmb);
    const metaUtilidadAmb = Math.round(metaVentasAmb * MARGEN - totalGastosFijos * 12);
    const metaMensualAmb = Math.round(metaVentasAmb / 12);
    const pctVentasAmb = ((ytd / metaVentasAmb) * 100).toFixed(1);

    // DistribuciÃ³n mensual proporcional a 2025
    const proporciones = VENTAS_2025.map(v => v / ventas2025Total);
    const metasMensualesCons = proporciones.map(p => Math.round(p * metaVentasCons));
    const metasMensualesAmb = proporciones.map(p => Math.round(p * metaVentasAmb));

    // Utilidad real por mes
    const utilidadReal = VENTAS_2026.map(v => Math.round(v * MARGEN - totalGastosFijos));
    const utilidadYTD = utilidadReal.slice(0, mes + 1).reduce((a, b) => a + b, 0);

    // DÃ©ficit y redistribuciÃ³n conservador
    let deficitCons = 0;
    for (let i = 0; i <= mes; i++) deficitCons += metasMensualesCons[i] - VENTAS_2026[i];
    const extraCons = deficitCons > 0 && mesesRestantes > 0 ? Math.round(deficitCons / mesesRestantes) : 0;

    // DÃ©ficit y redistribuciÃ³n ambicioso
    let deficitAmb = 0;
    for (let i = 0; i <= mes; i++) deficitAmb += metasMensualesAmb[i] - VENTAS_2026[i];
    const extraAmb = deficitAmb > 0 && mesesRestantes > 0 ? Math.round(deficitAmb / mesesRestantes) : 0;

    // Punto de equilibrio
    const puntoEquilibrio = Math.round(totalGastosFijos / MARGEN);

    // Ventas restantes necesarias
    const faltaCons = Math.max(0, metaVentasCons - ytd);
    const faltaAmb = Math.max(0, metaVentasAmb - ytd);
    const porMesCons = mesesRestantes > 0 ? Math.round(faltaCons / mesesRestantes) : 0;
    const porMesAmb = mesesRestantes > 0 ? Math.round(faltaAmb / mesesRestantes) : 0;

    const [escenarioActivo, setEscenarioActivo] = React.useState('conservador');
    const esAmb = escenarioActivo === 'ambicioso';
    const metaVentas = esAmb ? metaVentasAmb : metaVentasCons;
    const metaUtilidad = esAmb ? metaUtilidadAmb : metaUtilidadCons;
    const pctVentas = esAmb ? pctVentasAmb : pctVentasCons;
    const metasMensuales = esAmb ? metasMensualesAmb : metasMensualesCons;
    const deficit = esAmb ? deficitAmb : deficitCons;
    const extra = esAmb ? extraAmb : extraCons;
    const falta = esAmb ? faltaAmb : faltaCons;
    const porMes = esAmb ? porMesAmb : porMesCons;

    return (
      <div>
        <SectionTitle>Objetivos</SectionTitle>

        {/* Toggle de escenarios */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[
            { id: 'conservador', label: 'Conservador Â· +15%', color: colors.cyan, desc: `Meta: ${formatMXN(metaVentasCons)}` },
            { id: 'ambicioso', label: 'Ambicioso Â· +35%', color: colors.gold, desc: `Meta: ${formatMXN(metaVentasAmb)}` },
          ].map(e => (
            <button key={e.id} onClick={() => setEscenarioActivo(e.id)} style={{ flex: 1, padding: '14px 16px', borderRadius: '10px', border: `1px solid ${escenarioActivo === e.id ? e.color + '50' : colors.br}`, background: escenarioActivo === e.id ? e.color + '10' : colors.bg2, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: escenarioActivo === e.id ? e.color : colors.t2, marginBottom: '2px' }}>{e.label}</div>
              <div style={{ fontSize: '11px', color: colors.t3 }}>{e.desc}</div>
            </button>
          ))}
        </div>

        {/* KPIs del escenario activo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <StatCard label="Meta ventas anual" value={formatMXN(metaVentas)} note={`${pctVentas}% completado`} color={esAmb ? colors.gold : colors.cyan} />
          <StatCard label="Utilidad proyectada" value={formatMXN(metaUtilidad)} note="DespuÃ©s de gastos fijos" color={colors.green} />
          <StatCard label="Utilidad YTD real" value={formatMXN(utilidadYTD)} note={utilidadYTD >= 0 ? 'Positiva' : 'En dÃ©ficit'} color={utilidadYTD >= 0 ? colors.green : colors.red} />
          <StatCard label="Venta promedio/mes" value={formatMXN(porMes)} note={`${mesesRestantes} meses restantes`} color={esAmb ? colors.gold : colors.cyan} />
        </div>

        {/* Comparativo visual de escenarios */}
        <div style={cardStyle}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>Comparativo de escenarios
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: '', items: ['Ventas anuales', 'Utilidad neta', 'Venta mensual prom.', 'Ventas restantes', 'Por mes restante', 'vs 2025'] },
              { label: 'Conservador +15%', color: colors.cyan, items: [formatMXN(metaVentasCons), formatMXN(metaUtilidadCons), formatMXN(metaMensualCons), formatMXN(Math.max(0, metaVentasCons - ytd)), formatMXN(porMesCons), '+' + formatMXN(metaVentasCons - ventas2025Total)] },
              { label: 'Ambicioso +35%', color: colors.gold, items: [formatMXN(metaVentasAmb), formatMXN(metaUtilidadAmb), formatMXN(metaMensualAmb), formatMXN(Math.max(0, metaVentasAmb - ytd)), formatMXN(porMesAmb), '+' + formatMXN(metaVentasAmb - ventas2025Total)] },
            ].map((col, ci) => (
              <div key={ci}>
                {ci > 0 && <div style={{ fontSize: '11px', fontWeight: '700', color: col.color, marginBottom: '10px', padding: '6px 10px', background: col.color + '10', borderRadius: '6px', textAlign: 'center', border: `1px solid ${col.color}25` }}>{col.label}</div>}
                {ci === 0 && <div style={{ height: '33px' }} />}
                {col.items.map((item, ii) => (
                  <div key={ii} style={{ padding: '8px 10px', fontSize: ci === 0 ? '11px' : '12px', color: ci === 0 ? colors.t3 : colors.t1, fontWeight: ci === 0 ? '500' : '600', borderBottom: `1px solid ${colors.br}`, textAlign: ci === 0 ? 'left' : 'center' }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${colors.br}`, fontSize: '11px', color: colors.t2, textAlign: 'center' }}>
            Referencia 2025: <span style={{ fontWeight: '600', color: colors.t1 }}>{formatMXN(ventas2025Total)}</span> en ventas totales
          </div>
        </div>

        {/* âââ PROGRESO DEL ESCENARIO ACTIVO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: esAmb ? colors.gold : colors.cyan, marginRight: '8px' }}>â</span>Progreso Â· {esAmb ? 'Ambicioso' : 'Conservador'} Â· {formatMXN(metaVentas)}
          </h4>

          {/* Barra de progreso */}
          <div style={{ marginBottom: '20px', padding: '14px 16px', background: (esAmb ? colors.gold : colors.cyan) + '08', border: `1px solid ${(esAmb ? colors.gold : colors.cyan)}20`, borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>Progreso anual</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: esAmb ? colors.gold : colors.cyan }}>{pctVentas}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${esAmb ? colors.gold : colors.cyan}, ${esAmb ? colors.orange : colors.blue})`, width: Math.min(parseFloat(pctVentas), 100) + '%', transition: 'width 0.8s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.t2 }}>
              <span>Acumulado: <span style={{ color: esAmb ? colors.gold : colors.cyan, fontWeight: '600' }}>{formatMXN(ytd)}</span></span>
              <span>Faltan: <span style={{ fontWeight: '600' }}>{formatMXN(falta)}</span></span>
            </div>
          </div>

          {/* Grid 12 meses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {MESES.slice(0, 6).map((m, idx) => {
              const esPasado = idx < mes;
              const esActual = idx === mes;
              const cumplido = VENTAS_2026[idx];
              const meta = metasMensuales[idx];
              const metaAdj = idx > mes ? meta + extra : meta;
              const pct = meta > 0 ? Math.round((cumplido / meta) * 100) : 0;
              const acColor = esAmb ? colors.gold : colors.cyan;
              return (
                <div key={idx} style={{ background: esPasado ? 'rgba(255,255,255,0.02)' : colors.bg3, border: `1px solid ${esActual ? acColor + '50' : colors.br}`, borderRadius: '8px', padding: '12px', textAlign: 'center', opacity: esPasado ? 0.7 : 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: esActual ? acColor : colors.t2, marginBottom: '6px' }}>{m} {esActual && 'â'}</div>
                  {esPasado ? (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: pct >= 100 ? colors.green : colors.red, marginBottom: '2px' }}>{formatMXN(cumplido)}</div>
                      <div style={{ fontSize: '10px', color: pct >= 100 ? colors.green : colors.t3 }}>{pct}% {pct >= 100 ? 'â' : ''}</div>
                    </>
                  ) : esActual ? (
                    <>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: acColor, marginBottom: '4px' }}>{formatMXN(meta)}</div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ height: '100%', borderRadius: '2px', background: acColor, width: Math.min(pct, 100) + '%' }} />
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '600', color: acColor }}>{pct}%</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: acColor, marginBottom: '2px' }}>{formatMXN(metaAdj)}</div>
                      {extra > 0 && <div style={{ fontSize: '9px', color: colors.t3 }}>+{formatMXN(extra)}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '8px' }}>
            {MESES.slice(6, 12).map((m, idx) => {
              const realIdx = idx + 6;
              const metaAdj = metasMensuales[realIdx] + extra;
              const acColor = esAmb ? colors.gold : colors.cyan;
              return (
                <div key={realIdx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '6px' }}>{m}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: acColor, marginBottom: '2px' }}>{formatMXN(metaAdj)}</div>
                  {extra > 0 && <div style={{ fontSize: '9px', color: colors.t3 }}>+{formatMXN(extra)}</div>}
                </div>
              );
            })}
          </div>
          {deficit > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: (esAmb ? colors.gold : colors.cyan) + '08', border: `1px solid ${(esAmb ? colors.gold : colors.cyan)}20`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: colors.t2 }}>DÃ©ficit acumulado: <span style={{ color: colors.red, fontWeight: '600' }}>{formatMXN(deficit)}</span></span>
              <span style={{ color: esAmb ? colors.gold : colors.cyan }}>Redistribuido: <span style={{ fontWeight: '600' }}>+{formatMXN(extra)}/mes</span> en {mesesRestantes} meses</span>
            </div>
          )}
        </div>

        {/* âââ UTILIDAD âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.green, marginRight: '8px' }}>â</span>Utilidad Â· Margen {(MARGEN * 100).toFixed(1)}% â {formatMXN(totalGastosFijos)} gastos fijos/mes
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Utilidad YTD</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: utilidadYTD >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadYTD)}</div>
            </div>
            <div style={{ background: 'rgba(0,200,224,0.06)', border: '1px solid rgba(0,200,224,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>Punto de equilibrio</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.cyan }}>{formatMXN(puntoEquilibrio)}</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>venta mÃ­nima/mes para $0</div>
            </div>
            <div style={{ background: (esAmb ? 'rgba(240,180,41,0.06)' : 'rgba(0,200,224,0.06)'), border: `1px solid ${esAmb ? 'rgba(240,180,41,0.15)' : 'rgba(0,200,224,0.15)'}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: esAmb ? colors.gold : colors.cyan, marginBottom: '4px' }}>Utilidad anual proyectada</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: esAmb ? colors.gold : colors.cyan }}>{formatMXN(metaUtilidad)}</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>escenario {esAmb ? 'ambicioso' : 'conservador'}</div>
            </div>
          </div>
          {/* Utilidad real por mes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {MESES.slice(0, 6).map((m, idx) => {
              const esPasado = idx < mes;
              const esActual = idx === mes;
              const util = utilidadReal[idx];
              const tieneData = VENTAS_2026[idx] > 0;
              return (
                <div key={idx} style={{ background: esPasado ? 'rgba(255,255,255,0.02)' : colors.bg3, border: `1px solid ${esActual ? 'rgba(34,197,94,0.3)' : colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center', opacity: (!tieneData && !esActual) ? 0.4 : (esPasado ? 0.7 : 1) }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: esActual ? colors.green : colors.t2, marginBottom: '4px' }}>{m}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: tieneData ? (util >= 0 ? colors.green : colors.red) : colors.t3 }}>{tieneData ? formatMXN(util) : 'â'}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '8px' }}>
            {MESES.slice(6, 12).map((m, idx) => (
              <div key={idx + 6} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center', opacity: 0.4 }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '4px' }}>{m}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: colors.t3 }}>â</div>
              </div>
            ))}
          </div>
        </div>

        {/* âââ OBJETIVO DE GASTOS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.red}` }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Objetivo de gastos</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>Planea tus gastos proyectados â ajusta los montos si planeas crecer el equipo, cambiar de local o invertir mÃ¡s</div>
          </div>
          {(() => {
            // Gastos reales actuales
            const gastosFijosReales = totalGastosFijos;
            const gastosVarMesReal = recurrentes.filter(g => g.mes === mes).reduce((a, g) => a + g.monto, 0);
            const totalGastosRealMes = gastosFijosReales + gastosVarMesReal;

            // Gastos proyectados (editables)
            const totalProyectadoMes = metaGastosFijos + metaGastosVar;
            const totalProyectadoAnual = totalProyectadoMes * 12;
            const ventaMesActual = VENTAS_2026[mes];
            const pctGastosReal = ventaMesActual > 0 ? ((totalGastosRealMes / ventaMesActual) * 100).toFixed(1) : 0;
            const pctGastosProy = porMes > 0 ? ((totalProyectadoMes / porMes) * 100).toFixed(1) : 0;
            const gastoOK = parseFloat(pctGastosProy) <= metaPctTope;

            // Impacto en utilidad
            const utilidadConProyectados = Math.round(metaVentas * MARGEN - totalProyectadoAnual);
            const utilidadConActuales = Math.round(metaVentas * MARGEN - (gastosFijosReales + gastosVarMesReal) * 12);
            const diferenciaUtilidad = utilidadConActuales - utilidadConProyectados;

            const inputStyle = { width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px 10px', color: colors.t1, fontSize: '14px', fontWeight: '600', textAlign: 'right' };

            return (
              <>
                {/* Planeador editable */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {/* Columna: Actual */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px' }}>Gastos actuales</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px 10px', background: colors.bg1, borderRadius: '6px' }}>
                      <span style={{ fontSize: '12px', color: colors.t2 }}>Fijos / mes</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.red }}>{formatMXN(gastosFijosReales)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px 10px', background: colors.bg1, borderRadius: '6px' }}>
                      <span style={{ fontSize: '12px', color: colors.t2 }}>Variables / mes</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.orange }}>{formatMXN(gastosVarMesReal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderTop: `2px solid ${colors.br}` }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>Total / mes</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(totalGastosRealMes)}</span>
                    </div>
                    {ventaMesActual > 0 && (
                      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: colors.t3 }}>
                        = <span style={{ fontWeight: '600', color: parseFloat(pctGastosReal) <= metaPctTope ? colors.green : colors.red }}>{pctGastosReal}%</span> de ventas este mes
                      </div>
                    )}
                  </div>

                  {/* Columna: Proyectado (editable) */}
                  <div style={{ padding: '16px', background: (esAmb ? colors.gold : colors.cyan) + '06', borderRadius: '10px', border: `1px solid ${(esAmb ? colors.gold : colors.cyan)}20` }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: esAmb ? colors.gold : colors.cyan, marginBottom: '14px' }}>Gastos proyectados â editable</div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: colors.t2 }}>Fijos / mes</label>
                        <span style={{ fontSize: '9px', color: colors.t3 }}>Renta, nÃ³mina, servicios, herramientas</span>
                      </div>
                      <input type="number" value={metaGastosFijos} onChange={e => setMetaGastosFijos(Number(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: colors.t2 }}>Variables / mes</label>
                        <span style={{ fontSize: '9px', color: colors.t3 }}>Ads, comisiones, envÃ­os, etc.</span>
                      </div>
                      <input type="number" value={metaGastosVar} onChange={e => setMetaGastosVar(Number(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderTop: `2px solid ${(esAmb ? colors.gold : colors.cyan)}30` }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>Total / mes</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: esAmb ? colors.gold : colors.cyan }}>{formatMXN(totalProyectadoMes)}</span>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: colors.t3 }}>
                      = <span style={{ fontWeight: '600', color: gastoOK ? colors.green : colors.red }}>{pctGastosProy}%</span> de venta promedio mensual
                    </div>
                  </div>
                </div>

                {/* Tope de gastos editable */}
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${colors.br}`, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>Tope mÃ¡ximo de gastos</div>
                      <div style={{ fontSize: '11px', color: colors.t3 }}>Porcentaje mÃ¡ximo de gastos sobre ventas</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" value={metaPctTope} onChange={e => setMetaPctTope(Number(e.target.value) || 0)} step="1" min="1" max="50" style={{ width: '55px', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '6px 8px', color: colors.t1, fontSize: '18px', fontWeight: '700', textAlign: 'center' }} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: colors.t2 }}>%</span>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: Math.min((parseFloat(pctGastosProy) / metaPctTope) * 100, 100) + '%', borderRadius: '5px', background: gastoOK ? `linear-gradient(90deg, ${colors.green}, ${colors.teal})` : `linear-gradient(90deg, ${colors.orange}, ${colors.red})`, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: colors.t3, marginTop: '6px' }}>
                    <span>Proyectado: {pctGastosProy}%</span>
                    <span>Tope: {metaPctTope}%</span>
                    <span style={{ color: gastoOK ? colors.green : colors.red, fontWeight: '600' }}>{gastoOK ? 'Dentro del tope' : 'Excede el tope'}</span>
                  </div>
                </div>

                {/* Impacto en utilidad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Utilidad con gastos actuales</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: utilidadConActuales >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadConActuales)}</div>
                    <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>si mantienes todo igual</div>
                  </div>
                  <div style={{ background: (esAmb ? 'rgba(240,180,41,0.06)' : 'rgba(0,200,224,0.06)'), border: `1px solid ${esAmb ? 'rgba(240,180,41,0.15)' : 'rgba(0,200,224,0.15)'}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: esAmb ? colors.gold : colors.cyan, marginBottom: '4px' }}>Utilidad con proyectados</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: utilidadConProyectados >= 0 ? (esAmb ? colors.gold : colors.cyan) : colors.red }}>{formatMXN(utilidadConProyectados)}</div>
                    <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>con los gastos que planeas</div>
                  </div>
                  <div style={{ background: diferenciaUtilidad > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${diferenciaUtilidad > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: diferenciaUtilidad > 0 ? colors.red : colors.green, marginBottom: '4px' }}>Impacto</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: diferenciaUtilidad > 0 ? colors.red : colors.green }}>{diferenciaUtilidad > 0 ? '-' : '+'}{formatMXN(Math.abs(diferenciaUtilidad))}</div>
                    <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>{diferenciaUtilidad > 0 ? 'menos utilidad anual' : 'mÃ¡s utilidad anual'}</div>
                  </div>
                </div>

                {/* Ejemplos de escenarios */}
                <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '10px' }}>Escenarios comunes â haz clic para cargar</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Actual', fijos: gastosFijosReales, variable: gastosVarMesReal, desc: 'Sin cambios', icon: 'ð' },
                    { label: '+1 empleado', fijos: gastosFijosReales + 10000, variable: gastosVarMesReal, desc: '+$10K nÃ³mina', icon: 'ð¤' },
                    { label: 'Escalar ads', fijos: gastosFijosReales, variable: gastosVarMesReal + 8000, desc: '+$8K en ads', icon: 'ð' },
                    { label: 'Crecer todo', fijos: gastosFijosReales + 15000, variable: gastosVarMesReal + 10000, desc: '+equipo +ads', icon: 'ð' },
                  ].map((esc, idx) => (
                    <button key={idx} onClick={() => { setMetaGastosFijos(esc.fijos); setMetaGastosVar(esc.variable); }} style={{ padding: '12px', background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{esc.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: colors.t1, marginBottom: '2px' }}>{esc.label}</div>
                      <div style={{ fontSize: '10px', color: colors.t3 }}>{esc.desc}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: esAmb ? colors.gold : colors.cyan, marginTop: '4px' }}>{formatMXN(esc.fijos + esc.variable)}/mes</div>
                    </button>
                  ))}
                </div>

                {/* Tips de control de gastos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { icon: 'ð¯', titulo: 'Regla del tope', desc: `MantÃ©n los gastos totales por debajo del ${metaPctTope}% de tus ventas. Si vendes ${formatMXN(porMes)}/mes, tu tope es ${formatMXN(Math.round(porMes * metaPctTope / 100))}.`, color: colors.cyan },
                    { icon: 'ð', titulo: 'Variables: revisar cada mes', desc: 'Si el ROAS de ads baja de 2x, pausa y optimiza. Si Clip cobra mucho, evalÃºa Stripe o transferencia directa.', color: colors.orange },
                    { icon: 'ð', titulo: 'Fijos: negociar anualmente', desc: 'Renta, servicios y herramientas se negocian 1 vez al aÃ±o. Busca descuentos anuales y renegocia contratos.', color: colors.red },
                  ].map((t, idx) => (
                    <div key={idx} style={{ padding: '14px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{t.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{t.titulo}</div>
                      <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.6' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* âââ RECOMENDACIONES âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.green}` }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Â¿CÃ³mo lograrlo?</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>Acciones concretas para alcanzar el escenario {esAmb ? 'ambicioso' : 'conservador'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {(esAmb ? [
              { icon: 'ð', titulo: 'Escalar inversiÃ³n en ads', desc: `Necesitas vender ${formatMXN(porMesAmb)}/mes. Invierte al menos ${formatMXN(Math.round(porMesAmb / 3.5))} en Meta Ads (asumiendo ROAS 3.5x) para generar trÃ¡fico suficiente.`, prioridad: 'Alta' },
              { icon: 'ð¦', titulo: 'Ampliar catÃ¡logo y stock', desc: 'Aprovecha todas las temporadas de descuento (Farfetch, SSENSE, Cettire) para comprar inventario a mejor precio y tener variedad.', prioridad: 'Alta' },
              { icon: 'ð¯', titulo: 'Lanzar programa de referidos', desc: 'Ofrece un 5-10% de descuento por referido. Tus clientes satisfechos son tu mejor canal de adquisiciÃ³n gratuito.', prioridad: 'Media' },
              { icon: 'ð±', titulo: 'Contenido 5x por semana', desc: 'Sube a 5 publicaciones semanales combinando Reels de entretenimiento + producto. MÃ¡s contenido = mÃ¡s alcance = mÃ¡s ventas.', prioridad: 'Alta' },
              { icon: 'ð¤', titulo: 'Colaboraciones con influencers', desc: 'Invierte en 2-3 micro-influencers al mes (5K-20K seguidores). El ROI en streetwear suele ser alto por la comunidad.', prioridad: 'Media' },
              { icon: 'ð°', titulo: 'Subir ticket promedio', desc: 'Introduce bundles (par + accesorios), upselling en checkout, y piezas de mayor valor (Amiri, Golden Goose) para subir el AOV.', prioridad: 'Media' },
            ] : [
              { icon: 'ð', titulo: 'Mantener inversiÃ³n en ads', desc: `Con ${formatMXN(porMesCons)}/mes de meta, invierte al menos ${formatMXN(Math.round(porMesCons / 3.5))} en Meta Ads para mantener el flujo de trÃ¡fico actual.`, prioridad: 'Alta' },
              { icon: 'ð¦', titulo: 'ReposiciÃ³n constante', desc: 'No dejes que se agoten los productos estrella. Haz pedidos de reposiciÃ³n cada 2-3 semanas para no perder ventas.', prioridad: 'Alta' },
              { icon: 'ð±', titulo: 'Contenido consistente', desc: 'MantÃ©n 3-4 publicaciones por semana. La consistencia importa mÃ¡s que la cantidad. Sigue con lo que funciona: Reels + humor.', prioridad: 'Media' },
              { icon: 'â­', titulo: 'Fidelizar clientes actuales', desc: 'EnvÃ­a WhatsApp cuando llegue producto nuevo, ofrece acceso anticipado a clientes recurrentes. Retener es mÃ¡s barato que adquirir.', prioridad: 'Alta' },
              { icon: 'ð', titulo: 'Optimizar margen', desc: `Tu margen actual es ${(MARGEN * 100).toFixed(1)}%. Busca proveedores con mejores precios o sube precios en piezas exclusivas para mejorar 2-3 puntos.`, prioridad: 'Media' },
              { icon: 'ðª', titulo: 'Fortalecer tienda fÃ­sica', desc: 'La tienda fÃ­sica genera confianza. Mejora la experiencia en tienda y Ãºsala como contenido para redes.', prioridad: 'Media' },
            ]).map((r, idx) => (
              <div key={idx} style={{ padding: '16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{r.icon}</span>
                  <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: r.prioridad === 'Alta' ? 'rgba(239,68,68,0.12)' : 'rgba(240,180,41,0.12)', color: r.prioridad === 'Alta' ? colors.red : colors.gold, border: `1px solid ${r.prioridad === 'Alta' ? 'rgba(239,68,68,0.25)' : 'rgba(240,180,41,0.25)'}`, fontWeight: '600' }}>Prioridad {r.prioridad}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>{r.titulo}</div>
                <div style={{ fontSize: '11px', color: colors.t2, lineHeight: '1.6' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ForecastSection = () => {
    const now = new Date();
    const mes = now.getMonth();
    const MARGEN = 0.301;
    const totalGastosFijos = fixedExpenses.reduce((a, b) => a + b.monto, 0);
    const ventas2025Total = VENTAS_2025.reduce((a, b) => a + b, 0);
    const ytd26 = VENTAS_2026.reduce((a, b) => a + b, 0);

    // Slider de crecimiento
    const [pctCrecimiento, setPctCrecimiento] = React.useState(20);
    const factor = 1 + pctCrecimiento / 100;
    const proporciones = VENTAS_2025.map(v => v / ventas2025Total);

    // ProyecciÃ³n 2026
    const metaAnual26 = Math.round(ventas2025Total * factor);
    const proyeccion26 = proporciones.map(p => Math.round(p * metaAnual26));
    // Meses pasados: usar dato real; futuros: proyecciÃ³n
    const ventasProyectadas26 = MESES.map((m, idx) => ({
      mes: m,
      real: VENTAS_2026[idx],
      proyeccion: proyeccion26[idx],
      valor: VENTAS_2026[idx] > 0 ? VENTAS_2026[idx] : proyeccion26[idx],
      esPasado: idx <= mes && VENTAS_2026[idx] > 0,
    }));
    const totalProyectado26 = ventasProyectadas26.reduce((a, v) => a + v.valor, 0);
    const utilidadProy26 = Math.round(totalProyectado26 * MARGEN - totalGastosFijos * 12);
    const gastoVarMesProm = recurrentes.length > 0 ? Math.round(recurrentes.reduce((a, g) => a + g.monto, 0) / (mes + 1)) : 0;
    const flujoCajaProy = ventasProyectadas26.map((v, idx) => {
      const ingresos = Math.round(v.valor * MARGEN);
      const gastos = totalGastosFijos + (idx <= mes ? recurrentes.filter(g => g.mes === idx).reduce((a, g) => a + g.monto, 0) : gastoVarMesProm);
      return { mes: v.mes, ingresos, gastos, flujo: ingresos - gastos };
    });

    // ProyecciÃ³n 2027
    const meta27 = Math.round(metaAnual26 * factor);
    const proyeccion27 = proporciones.map(p => Math.round(p * meta27));
    const utilidadProy27 = Math.round(meta27 * MARGEN - totalGastosFijos * 12);

    // AnÃ¡lisis de costos por producto
    const topSellers = [...CATALOG].sort((a, b) => b.uds - a.uds);
    const byBrand = {};
    CATALOG.forEach(p => {
      if (!byBrand[p.marca]) byBrand[p.marca] = { uds: 0, ventas: 0, productos: 0, costoTotal: 0, margenTotal: 0 };
      byBrand[p.marca].uds += p.uds;
      byBrand[p.marca].ventas += p.ventas;
      byBrand[p.marca].productos += 1;
      byBrand[p.marca].costoTotal += p.costo * p.uds;
      byBrand[p.marca].margenTotal += (p.precio - p.costo) * p.uds;
    });
    const brandRanking = Object.entries(byBrand).sort((a, b) => b[1].ventas - a[1].ventas);

    // ReposiciÃ³n
    const needRestock = CATALOG.filter(p => p.stock <= 2).sort((a, b) => b.uds - a.uds);
    const totalInversion = needRestock.reduce((acc, p) => acc + p.costo * Math.max(10, Math.round(p.uds * 0.3)), 0);

    return (
      <div>
        <SectionTitle sub="ProyecciÃ³n financiera + inteligencia de producto">Forecast</SectionTitle>

        {/* âââ SLIDER DE CRECIMIENTO âââ */}
        <div style={{ ...cardStyle, marginBottom: '12px', borderLeft: `3px solid ${colors.cyan}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>ProyecciÃ³n de crecimiento</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Basada en la estacionalidad de 2025 ({formatMXN(ventas2025Total)}) â ajusta el % de crecimiento</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: colors.cyan }}>+{pctCrecimiento}%</div>
              <div style={{ fontSize: '10px', color: colors.t3 }}>vs 2025</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: colors.t3, minWidth: '30px' }}>0%</span>
            <input type="range" min="0" max="60" value={pctCrecimiento} onChange={e => setPctCrecimiento(Number(e.target.value))} style={{ flex: 1, accentColor: colors.cyan, height: '6px' }} />
            <span style={{ fontSize: '11px', color: colors.t3, minWidth: '35px' }}>+60%</span>
          </div>
          {/* KPIs de la proyecciÃ³n */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>Ventas 2026</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(totalProyectado26)}</div>
            </div>
            <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Utilidad 2026</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: utilidadProy26 >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadProy26)}</div>
            </div>
            <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Ventas 2027</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(meta27)}</div>
            </div>
            <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Utilidad 2027</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: utilidadProy27 >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadProy27)}</div>
            </div>
          </div>
        </div>

        {/* âââ PROYECCIÃN MENSUAL 2026 âââ */}
        <div style={cardStyle}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.cyan, marginRight: '8px' }}>â</span>ProyecciÃ³n mensual 2026 Â· {formatMXN(totalProyectado26)}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {ventasProyectadas26.slice(0, 6).map((v, idx) => {
              const esActual = idx === mes;
              const pct = v.proyeccion > 0 ? Math.round((v.real / v.proyeccion) * 100) : 0;
              return (
                <div key={idx} style={{ background: v.esPasado ? 'rgba(255,255,255,0.02)' : colors.bg3, border: `1px solid ${esActual ? 'rgba(0,200,224,0.3)' : colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center', opacity: v.esPasado ? 0.7 : 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: esActual ? colors.cyan : colors.t2, marginBottom: '4px' }}>{v.mes} {esActual && 'â'}</div>
                  {v.esPasado ? (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: pct >= 100 ? colors.green : colors.red }}>{formatMXN(v.real)}</div>
                      <div style={{ fontSize: '9px', color: colors.t3 }}>{pct}% de {formatMXN(v.proyeccion)}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: colors.cyan }}>{formatMXN(v.proyeccion)}</div>
                      <div style={{ fontSize: '9px', color: colors.t3 }}>proyectado</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '8px' }}>
            {ventasProyectadas26.slice(6, 12).map((v, idx) => (
              <div key={idx + 6} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '4px' }}>{v.mes}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: colors.cyan }}>{formatMXN(v.proyeccion)}</div>
                <div style={{ fontSize: '9px', color: colors.t3 }}>proyectado</div>
              </div>
            ))}
          </div>
        </div>

        {/* âââ FLUJO DE CAJA PROYECTADO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.green, marginRight: '8px' }}>â</span>Flujo de caja proyectado Â· Margen bruto â Gastos operativos
          </h4>
          <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '4px', padding: '0 4px' }}>
            {flujoCajaProy.map((f, idx) => {
              const maxFlujo = Math.max(...flujoCajaProy.map(x => Math.abs(x.flujo)), 1);
              const h = Math.round((Math.abs(f.flujo) / maxFlujo) * 160);
              const esActual = idx === mes;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: f.flujo >= 0 ? colors.green : colors.red, marginBottom: '4px' }}>{formatMXN(f.flujo)}</div>
                  <div style={{ width: '100%', height: h + 'px', borderRadius: '4px 4px 0 0', background: f.flujo >= 0 ? (esActual ? colors.cyan : colors.green + '80') : colors.red + '80', border: esActual ? `2px solid ${colors.cyan}` : 'none', transition: 'height 0.5s' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: esActual ? colors.cyan : colors.t3, marginTop: '4px' }}>{f.mes}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '10px', color: colors.t3 }}>
            <span>Flujo acumulado: <span style={{ fontWeight: '600', color: colors.green }}>{formatMXN(flujoCajaProy.reduce((a, f) => a + f.flujo, 0))}</span></span>
            <span>Promedio/mes: <span style={{ fontWeight: '600', color: colors.cyan }}>{formatMXN(Math.round(flujoCajaProy.reduce((a, f) => a + f.flujo, 0) / 12))}</span></span>
          </div>
        </div>

        {/* âââ ANÃLISIS DE COSTOS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.orange}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>AnÃ¡lisis de costos de adquisiciÃ³n</h3>
              <div style={{ fontSize: '12px', color: colors.t2 }}>Haz clic en una fila para ver los productos â identifica dÃ³nde ganas mÃ¡s</div>
            </div>
            {/* Toggle marca / categorÃ­a */}
            <div style={{ display: 'flex', background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, overflow: 'hidden' }}>
              {[{ id: 'marca', label: 'Por marca' }, { id: 'categoria', label: 'Por categorÃ­a' }].map(v => (
                <button key={v.id} onClick={() => { setCostView(v.id); setExpandedBrand(null); setExpandedCat(null); }} style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: costView === v.id ? (colors.orange + '20') : 'transparent', color: costView === v.id ? colors.orange : colors.t3, transition: 'all 0.2s' }}>{v.label}</button>
              ))}
            </div>
          </div>

          {/* ââ VISTA POR MARCA ââ */}
          {costView === 'marca' && (
            <div>
              {brandRanking.map(([marca, data], idx) => {
                const margenPct = data.ventas > 0 ? ((data.margenTotal / data.ventas) * 100).toFixed(1) : 0;
                const gananciaUd = data.uds > 0 ? Math.round(data.margenTotal / data.uds) : 0;
                const veredicto = parseFloat(margenPct) >= 45 ? 'Excelente' : parseFloat(margenPct) >= 35 ? 'Bueno' : 'Mejorar';
                const vColor = veredicto === 'Excelente' ? colors.green : veredicto === 'Bueno' ? colors.cyan : colors.orange;
                const isOpen = expandedBrand === marca;
                const productos = CATALOG.filter(p => p.marca === marca).sort((a, b) => (b.precio - b.costo) * b.uds - (a.precio - a.costo) * a.uds);
                return (
                  <div key={marca} style={{ marginBottom: '8px' }}>
                    {/* Fila principal clickeable */}
                    <div onClick={() => setExpandedBrand(isOpen ? null : marca)} style={{ display: 'grid', gridTemplateColumns: '24px 1fr repeat(5, auto)', gap: '12px', alignItems: 'center', padding: '12px 14px', background: isOpen ? colors.bg1 : 'rgba(255,255,255,0.02)', borderRadius: isOpen ? '10px 10px 0 0' : '10px', border: `1px solid ${isOpen ? colors.orange + '30' : colors.br}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '14px', color: colors.orange, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>â¶</span>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: colors.t1 }}>{marca}</span>
                        <span style={{ fontSize: '10px', color: colors.t3, marginLeft: '8px' }}>{data.productos} producto{data.productos > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: colors.t3 }}>Ventas</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>{formatMXN(data.ventas)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: colors.t3 }}>Ganancia</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.green }}>{formatMXN(data.margenTotal)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: colors.t3 }}>Margen</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: vColor }}>{margenPct}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: colors.t3 }}>Uds</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>{data.uds}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px', background: vColor + '15', color: vColor, border: `1px solid ${vColor}30` }}>{veredicto}</span>
                    </div>
                    {/* Detalle expandible de productos */}
                    {isOpen && (
                      <div style={{ background: colors.bg1, borderRadius: '0 0 10px 10px', border: `1px solid ${colors.orange}30`, borderTop: 'none', padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(6, 1fr)', gap: '8px', padding: '6px 0', marginBottom: '6px', borderBottom: `1px solid ${colors.br}` }}>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Producto</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Precio</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Costo</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Ganancia/ud</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Margen</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Uds</span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: colors.t3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Ganancia total</span>
                        </div>
                        {productos.map((p, pi) => {
                          const ganUd = p.precio - p.costo;
                          const mPct = ((ganUd / p.precio) * 100).toFixed(1);
                          return (
                            <div key={pi} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(6, 1fr)', gap: '8px', padding: '8px 0', borderBottom: pi < productos.length - 1 ? `1px solid ${colors.br}` : 'none', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: colors.t1 }}>{p.nombre}</span>
                              <span style={{ fontSize: '12px', color: colors.t1, textAlign: 'right' }}>{formatMXN(p.precio)}</span>
                              <span style={{ fontSize: '12px', color: colors.t3, textAlign: 'right' }}>{formatMXN(p.costo)}</span>
                              <span style={{ fontSize: '12px', color: colors.green, textAlign: 'right' }}>{formatMXN(ganUd)}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: parseFloat(mPct) >= 45 ? colors.green : colors.cyan, textAlign: 'right' }}>{mPct}%</span>
                              <span style={{ fontSize: '12px', color: colors.t1, textAlign: 'right' }}>{p.uds}</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: colors.gold, textAlign: 'right' }}>{formatMXN(ganUd * p.uds)}</span>
                            </div>
                          );
                        })}
                        {/* Resumen de marca */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(6, 1fr)', gap: '8px', padding: '10px 0 4px', borderTop: `1px solid ${colors.br}`, marginTop: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.orange, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total {marca}</span>
                          <span></span>
                          <span style={{ fontSize: '12px', color: colors.red, textAlign: 'right', fontWeight: '600' }}>{formatMXN(data.costoTotal)}</span>
                          <span></span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: vColor, textAlign: 'right' }}>{margenPct}%</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors.t1, textAlign: 'right' }}>{data.uds}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: colors.gold, textAlign: 'right' }}>{formatMXN(data.margenTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ââ VISTA POR CATEGORÃA ââ */}
          {costView === 'categoria' && (() => {
            const byCat = {};
            CATALOG.forEach(p => {
              if (!byCat[p.cat]) byCat[p.cat] = { uds: 0, ventas: 0, productos: 0, costoTotal: 0, margenTotal: 0 };
              byCat[p.cat].uds += p.uds;
              byCat[p.cat].ventas += p.ventas;
              byCat[p.cat].productos += 1;
              byCat[p.cat].costoTotal += p.costo * p.uds;
              byCat[p.cat].margenTotal += (p.precio - p.costo) * p.uds;
            });
            const catRanking = Object.entries(byCat).sort((a, b) => b[1].ventas - a[1].ventas);
            const catLabels = { tenis: 'Tenis / Sneakers', ropa: 'Ropa / Apparel', accesorios: 'Accesorios' };
            const catIcons = { tenis: 'ð', ropa: 'ð', accesorios: 'ð' };

            return (
              <div>
                {catRanking.map(([cat, data], idx) => {
                  const margenPct = data.ventas > 0 ? ((data.margenTotal / data.ventas) * 100).toFixed(1) : 0;
                  const vColor = parseFloat(margenPct) >= 45 ? colors.green : parseFloat(margenPct) >= 35 ? colors.cyan : colors.orange;
                  const isOpen = expandedCat === cat;
                  const productos = CATALOG.filter(p => p.cat === cat).sort((a, b) => (b.precio - b.costo) * b.uds - (a.precio - a.costo) * a.uds);
                  const pctTotal = CATALOG.reduce((a, p) => a + p.ventas, 0);
                  const pctCat = pctTotal > 0 ? ((data.ventas / pctTotal) * 100).toFixed(1) : 0;

                  return (
                    <div key={cat} style={{ marginBottom: '8px' }}>
                      <div onClick={() => setExpandedCat(isOpen ? null : cat)} style={{ display: 'grid', gridTemplateColumns: '36px 1fr repeat(4, auto)', gap: '12px', alignItems: 'center', padding: '14px 14px', background: isOpen ? colors.bg1 : 'rgba(255,255,255,0.02)', borderRadius: isOpen ? '10px 10px 0 0' : '10px', border: `1px solid ${isOpen ? colors.purple + '30' : colors.br}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '24px' }}>{catIcons[cat] || 'ð¦'}</span>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: colors.t1 }}>{catLabels[cat] || cat}</span>
                          <span style={{ fontSize: '10px', color: colors.t3, marginLeft: '8px' }}>{data.productos} productos Â· {pctCat}% del total</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: colors.t3 }}>Ventas</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: colors.t1 }}>{formatMXN(data.ventas)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: colors.t3 }}>Ganancia</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: colors.green }}>{formatMXN(data.margenTotal)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: colors.t3 }}>Margen</div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: vColor }}>{margenPct}%</div>
                        </div>
                        <span style={{ fontSize: '14px', color: colors.purple, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>â¶</span>
                      </div>
                      {isOpen && (
                        <div style={{ background: colors.bg1, borderRadius: '0 0 10px 10px', border: `1px solid ${colors.purple}30`, borderTop: 'none', padding: '12px 14px' }}>
                          {/* Barra visual de composiciÃ³n */}
                          <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
                            {productos.map((p, pi) => {
                              const w = data.ventas > 0 ? ((p.ventas / data.ventas) * 100) : 0;
                              const pColors = [colors.cyan, colors.gold, colors.pink, colors.green, colors.purple, colors.orange];
                              return <div key={pi} style={{ width: w + '%', background: pColors[pi % pColors.length], borderRadius: '3px' }} title={p.nombre + ' â ' + w.toFixed(1) + '%'} />;
                            })}
                          </div>
                          {productos.map((p, pi) => {
                            const ganUd = p.precio - p.costo;
                            const mPct = ((ganUd / p.precio) * 100).toFixed(1);
                            const pctProd = data.ventas > 0 ? ((p.ventas / data.ventas) * 100).toFixed(1) : 0;
                            const pColors = [colors.cyan, colors.gold, colors.pink, colors.green, colors.purple, colors.orange];
                            return (
                              <div key={pi} style={{ display: 'grid', gridTemplateColumns: '4px 2fr 1fr repeat(5, 1fr)', gap: '8px', padding: '8px 0', borderBottom: pi < productos.length - 1 ? `1px solid ${colors.br}` : 'none', alignItems: 'center' }}>
                                <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: pColors[pi % pColors.length] }} />
                                <div>
                                  <div style={{ fontSize: '12px', color: colors.t1 }}>{p.nombre}</div>
                                  <div style={{ fontSize: '10px', color: colors.t3 }}>{p.marca} Â· {pctProd}% de la categorÃ­a</div>
                                </div>
                                <span style={{ fontSize: '12px', color: colors.t1, textAlign: 'right' }}>{formatMXN(p.precio)}</span>
                                <span style={{ fontSize: '12px', color: colors.t3, textAlign: 'right' }}>{formatMXN(p.costo)}</span>
                                <span style={{ fontSize: '12px', color: colors.green, textAlign: 'right' }}>{formatMXN(ganUd)}</span>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: parseFloat(mPct) >= 45 ? colors.green : colors.cyan, textAlign: 'right' }}>{mPct}%</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: colors.gold, textAlign: 'right' }}>{formatMXN(ganUd * p.uds)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ââ PRODUCTOS DESTACABLES ââ */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.orange, marginBottom: '12px' }}>Productos destacables</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(() => {
                const sorted = [...CATALOG].sort((a, b) => (b.precio - b.costo) * b.uds - (a.precio - a.costo) * a.uds);
                const bestMargin = [...CATALOG].sort((a, b) => ((b.precio - b.costo) / b.precio) - ((a.precio - a.costo) / a.precio))[0];
                const bestVolume = [...CATALOG].sort((a, b) => b.uds - a.uds)[0];
                const bestRevenue = sorted[0];
                const worstMargin = [...CATALOG].sort((a, b) => ((a.precio - a.costo) / a.precio) - ((b.precio - b.costo) / b.precio))[0];
                const highlights = [
                  { label: 'MÃ¡s rentable', icon: 'ð°', product: bestRevenue, stat: formatMXN((bestRevenue.precio - bestRevenue.costo) * bestRevenue.uds) + ' ganancia total', color: colors.gold },
                  { label: 'Mayor margen', icon: 'ð', product: bestMargin, stat: (((bestMargin.precio - bestMargin.costo) / bestMargin.precio) * 100).toFixed(1) + '% margen unitario', color: colors.green },
                  { label: 'MÃ¡s vendido', icon: 'ð¥', product: bestVolume, stat: bestVolume.uds + ' unidades vendidas', color: colors.red },
                ];
                return highlights.map((h, hi) => (
                  <div key={hi} style={{ padding: '16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '0', right: '0', padding: '4px 10px', background: h.color + '15', borderRadius: '0 0 0 10px', border: `1px solid ${h.color}25`, borderTop: 'none', borderRight: 'none' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: h.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h.label}</span>
                    </div>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{h.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: colors.t1, marginBottom: '4px' }}>{h.product.nombre}</div>
                    <div style={{ fontSize: '11px', color: colors.t3, marginBottom: '8px' }}>{h.product.marca} Â· {h.product.cat}</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: h.color, marginBottom: '4px' }}>{h.stat}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: colors.t3, marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.br}` }}>
                      <span>Precio: <span style={{ color: colors.t1 }}>{formatMXN(h.product.precio)}</span></span>
                      <span>Costo: <span style={{ color: colors.t1 }}>{formatMXN(h.product.costo)}</span></span>
                      <span>Stock: <span style={{ color: h.product.stock <= 2 ? colors.red : colors.t1 }}>{h.product.stock}</span></span>
                    </div>
                  </div>
                ));
              })()}
            </div>
            {/* Productos a mejorar */}
            <div style={{ marginTop: '10px', padding: '14px', background: 'rgba(249,115,22,0.06)', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.15)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: colors.orange, marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Oportunidades de mejora</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {CATALOG.filter(p => ((p.precio - p.costo) / p.precio) < 0.40).map((p, pi) => {
                  const mPct = (((p.precio - p.costo) / p.precio) * 100).toFixed(1);
                  return (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: colors.bg2, borderRadius: '6px', border: `1px solid ${colors.br}` }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: colors.t1 }}>{p.nombre}</span>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: colors.orange + '15', color: colors.orange, fontWeight: '600' }}>{mPct}%</span>
                      <span style={{ fontSize: '10px', color: colors.t3 }}>â buscar mejor precio o subir venta</span>
                    </div>
                  );
                })}
                {CATALOG.filter(p => ((p.precio - p.costo) / p.precio) < 0.40).length === 0 && (
                  <span style={{ fontSize: '11px', color: colors.green }}>Todos los productos tienen margen superior al 40% â excelente</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* âââ INVENTARIO Y REPOSICIÃN âââ */}
        {needRestock.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.6', marginTop: '12px', background: 'rgba(239,68,68,0.08)', color: '#ff7b73', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span>â ï¸</span>
            <span>Hay <strong>{needRestock.length} productos</strong> con stock crÃ­tico (â¤2 uds). InversiÃ³n estimada para reposiciÃ³n: <strong>{formatMXN(totalInversion)}</strong>.</span>
          </div>
        )}

        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.red, marginRight: '8px' }}>â</span>ReposiciÃ³n urgente â {needRestock.length} productos
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Producto</th>
                  <th style={thStyle}>Marca</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Stock</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Vendidos</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo unit.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sugerido</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>InversiÃ³n</th>
                  <th style={thStyle}>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {needRestock.map((prod, idx) => {
                  const sugerido = Math.max(10, Math.round(prod.uds * 0.3));
                  const inversion = prod.costo * sugerido;
                  const prioridad = prod.stock === 0 ? 'URGENTE' : 'ALTA';
                  return (
                    <tr key={idx}>
                      <td style={tdStyle}>{prod.nombre}</td>
                      <td style={tdStyle}>{prod.marca}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: prod.stock === 0 ? colors.red : colors.orange, fontWeight: '600' }}>{prod.stock}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{prod.uds}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(prod.costo)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: colors.cyan, fontWeight: '600' }}>{sugerido} uds</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>{formatMXN(inversion)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: prioridad === 'URGENTE' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)', color: prioridad === 'URGENTE' ? colors.red : colors.orange, border: `1px solid ${prioridad === 'URGENTE' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`, letterSpacing: '0.04em' }}>{prioridad}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td colSpan="6" style={{ ...tdStyle, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Total inversiÃ³n reposiciÃ³n</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: colors.gold }}>{formatMXN(totalInversion)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* âââ RANKING DE MARCAS âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.gold, marginRight: '8px' }}>â</span>Ranking de marcas â DÃ³nde invertir
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {brandRanking.map(([marca, data], idx) => {
              const maxVentas = brandRanking[0][1].ventas;
              const pctBar = (data.ventas / maxVentas) * 100;
              const ticketProm = data.uds > 0 ? data.ventas / data.uds : 0;
              const margenPct = data.ventas > 0 ? ((data.margenTotal / data.ventas) * 100).toFixed(1) : 0;
              return (
                <div key={marca} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: colors.t1 }}>{marca}</span>
                      <span style={{ fontSize: '10px', color: colors.t3, marginLeft: '8px' }}>{data.productos} productos</span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: idx === 0 ? 'rgba(240,180,41,0.15)' : 'rgba(0,200,224,0.1)', color: idx === 0 ? colors.gold : colors.cyan, border: `1px solid ${idx === 0 ? 'rgba(240,180,41,0.25)' : 'rgba(0,200,224,0.2)'}` }}>#{idx + 1}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: idx === 0 ? colors.gold : colors.cyan, width: pctBar + '%' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', fontSize: '11px' }}>
                    <div><div style={{ color: colors.t3, marginBottom: '2px' }}>Ventas</div><div style={{ fontWeight: '600', color: colors.t1 }}>{formatMXN(data.ventas)}</div></div>
                    <div><div style={{ color: colors.t3, marginBottom: '2px' }}>Uds</div><div style={{ fontWeight: '600', color: colors.t1 }}>{data.uds}</div></div>
                    <div><div style={{ color: colors.t3, marginBottom: '2px' }}>Ticket</div><div style={{ fontWeight: '600', color: colors.t1 }}>{formatMXN(ticketProm)}</div></div>
                    <div><div style={{ color: colors.t3, marginBottom: '2px' }}>Margen</div><div style={{ fontWeight: '600', color: colors.green }}>{margenPct}%</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* âââ VISTA PRELIMINAR 2027 âââ */}
        <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.gold}` }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Vista preliminar 2027</h3>
            <div style={{ fontSize: '12px', color: colors.t2 }}>ProyecciÃ³n con el mismo +{pctCrecimiento}% de crecimiento sostenido â {formatMXN(meta27)} en ventas</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Ventas 2027</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(meta27)}</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Utilidad 2027</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: utilidadProy27 >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadProy27)}</div>
            </div>
            <div style={{ background: 'rgba(0,200,224,0.06)', border: '1px solid rgba(0,200,224,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>Venta/mes prom.</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>{formatMXN(Math.round(meta27 / 12))}</div>
            </div>
            <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.purple, marginBottom: '4px' }}>Crecimiento acumulado</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.t1 }}>+{Math.round((factor * factor - 1) * 100)}%</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '2px' }}>vs 2025</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {MESES.slice(0, 6).map((m, idx) => (
              <div key={idx} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '4px' }}>{m}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: colors.gold }}>{formatMXN(proyeccion27[idx])}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '8px' }}>
            {MESES.slice(6, 12).map((m, idx) => (
              <div key={idx + 6} style={{ background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.t2, marginBottom: '4px' }}>{m}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: colors.gold }}>{formatMXN(proyeccion27[idx + 6])}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${colors.br}`, fontSize: '11px', color: colors.t2, textAlign: 'center' }}>
            2025: {formatMXN(ventas2025Total)} â 2026: {formatMXN(totalProyectado26)} (+{pctCrecimiento}%) â 2027: {formatMXN(meta27)} (+{pctCrecimiento}%)
          </div>
        </div>

        {/* âââ PUNTO DE EQUILIBRIO (BREAK-EVEN) âââ */}
        {(() => {
          const gastoFijoMensual = totalGastosFijos;
          const gastoVarMensualProm = gastoVarMesProm;
          const costoOpMensual = gastoFijoMensual + gastoVarMensualProm;
          const breakEvenMensual = MARGEN > 0 ? Math.round(costoOpMensual / MARGEN) : 0;
          const breakEvenDiario = Math.round(breakEvenMensual / 30);
          const mesesData = ventasProyectadas26.map((v, idx) => {
            const gastoVar = idx <= mes ? recurrentes.filter(g => g.mes === idx).reduce((a, g) => a + g.monto, 0) : gastoVarMensualProm;
            const costoOp = gastoFijoMensual + gastoVar;
            const be = MARGEN > 0 ? Math.round(costoOp / MARGEN) : 0;
            const real = v.valor;
            const superaBE = real >= be;
            return { mes: v.mes, be, real, costoOp, superaBE, pctBE: be > 0 ? Math.round((real / be) * 100) : 0 };
          });
          const mesesSuperan = mesesData.filter(m => m.superaBE).length;

          return (
            <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.teal}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Punto de equilibrio</h3>
                  <div style={{ fontSize: '12px', color: colors.t2 }}>Ventas mÃ­nimas necesarias para cubrir todos los costos operativos</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: colors.teal }}>{formatMXN(breakEvenMensual)}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>break-even mensual promedio</div>
                </div>
              </div>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.teal, marginBottom: '4px' }}>Diario</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(breakEvenDiario)}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>por dÃ­a</div>
                </div>
                <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>Gastos fijos</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(gastoFijoMensual)}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>mensual</div>
                </div>
                <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.orange, marginBottom: '4px' }}>Gastos variables</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(gastoVarMensualProm)}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>promedio/mes</div>
                </div>
                <div style={{ background: colors.bg1, borderRadius: '8px', border: `1px solid ${colors.br}`, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Meses ok</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: mesesSuperan >= 8 ? colors.green : mesesSuperan >= 5 ? colors.gold : colors.red }}>{mesesSuperan}/12</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>superan break-even</div>
                </div>
              </div>
              {/* Barras mensuales BE vs Real */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                {mesesData.map((m, idx) => {
                  const maxVal = Math.max(...mesesData.map(x => Math.max(x.be, x.real)), 1);
                  const hBE = Math.round((m.be / maxVal) * 120);
                  const hReal = Math.round((m.real / maxVal) * 120);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '9px', fontWeight: '600', color: m.superaBE ? colors.green : colors.red, marginBottom: '2px' }}>{m.pctBE}%</div>
                      <div style={{ position: 'relative', width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px' }}>
                        <div style={{ width: '40%', height: hBE + 'px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px 2px 0 0', border: `1px dashed ${colors.teal}40` }} title={'BE: ' + formatMXN(m.be)} />
                        <div style={{ width: '40%', height: hReal + 'px', background: m.superaBE ? colors.green + '60' : colors.red + '60', borderRadius: '2px 2px 0 0' }} title={'Real: ' + formatMXN(m.real)} />
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: '600', color: idx === mes ? colors.cyan : colors.t3, marginTop: '4px' }}>{m.mes}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '10px', color: colors.t3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', border: `1px dashed ${colors.teal}40`, background: 'rgba(255,255,255,0.08)', display: 'inline-block' }} /> Break-even</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors.green + '60', display: 'inline-block' }} /> Venta (supera)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors.red + '60', display: 'inline-block' }} /> Venta (no alcanza)</span>
              </div>
              {/* FÃ³rmula visual */}
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(20,184,166,0.06)', borderRadius: '8px', border: '1px solid rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: colors.t3 }}>Break-even = </span>
                <span style={{ padding: '2px 8px', background: colors.bg1, borderRadius: '4px', border: `1px solid ${colors.br}`, fontWeight: '600', color: colors.t1 }}>Costos ({formatMXN(costoOpMensual)})</span>
                <span style={{ color: colors.t3 }}>Ã·</span>
                <span style={{ padding: '2px 8px', background: colors.bg1, borderRadius: '4px', border: `1px solid ${colors.br}`, fontWeight: '600', color: colors.t1 }}>Margen ({(MARGEN * 100).toFixed(1)}%)</span>
                <span style={{ color: colors.t3 }}>=</span>
                <span style={{ padding: '2px 8px', background: 'rgba(20,184,166,0.15)', borderRadius: '4px', border: `1px solid rgba(20,184,166,0.25)`, fontWeight: '700', color: colors.teal }}>{formatMXN(breakEvenMensual)}</span>
              </div>
            </div>
          );
        })()}

        {/* âââ ESCENARIOS DE RIESGO âââ */}
        {(() => {
          const escenarios = [
            { label: 'Base', pct: 0, color: colors.cyan, icon: 'ð' },
            { label: 'CaÃ­da -10%', pct: -10, color: colors.gold, icon: 'â¡' },
            { label: 'CaÃ­da -20%', pct: -20, color: colors.orange, icon: 'ð»' },
            { label: 'CaÃ­da -30%', pct: -30, color: colors.red, icon: 'ð¨' },
          ];
          return (
            <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.red}` }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Escenarios de riesgo</h3>
                <div style={{ fontSize: '12px', color: colors.t2 }}>Â¿QuÃ© pasa si las ventas bajan? Impacto en utilidad y flujo de caja</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {escenarios.map((esc, ei) => {
                  const ventasEsc = Math.round(totalProyectado26 * (1 + esc.pct / 100));
                  const utilidadEsc = Math.round(ventasEsc * MARGEN - totalGastosFijos * 12 - gastoVarMesProm * 12);
                  const margenNeto = ventasEsc > 0 ? ((utilidadEsc / ventasEsc) * 100).toFixed(1) : 0;
                  const flujoProm = Math.round(utilidadEsc / 12);
                  return (
                    <div key={ei} style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${esc.color}25`, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: esc.color }} />
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{esc.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: esc.color, marginBottom: '2px' }}>{esc.label}</div>
                      <div style={{ fontSize: '10px', color: colors.t3, marginBottom: '12px' }}>{esc.pct === 0 ? 'ProyecciÃ³n actual' : `${esc.pct}% en ventas`}</div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Ventas anuales</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(ventasEsc)}</div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Utilidad</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: utilidadEsc >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadEsc)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${colors.br}`, fontSize: '10px' }}>
                        <span style={{ color: colors.t3 }}>Margen neto</span>
                        <span style={{ fontWeight: '600', color: parseFloat(margenNeto) >= 0 ? colors.green : colors.red }}>{margenNeto}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px' }}>
                        <span style={{ color: colors.t3 }}>Flujo/mes</span>
                        <span style={{ fontWeight: '600', color: flujoProm >= 0 ? colors.green : colors.red }}>{formatMXN(flujoProm)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Barra de resistencia */}
              {(() => {
                const maxDrop = [10, 20, 30, 40, 50].find(d => {
                  const v = totalProyectado26 * (1 - d / 100);
                  return (v * MARGEN - totalGastosFijos * 12 - gastoVarMesProm * 12) < 0;
                }) || 50;
                const colchon = maxDrop > 30 ? colors.green : maxDrop > 15 ? colors.gold : colors.red;
                return (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: colors.t2 }}>Resistencia del negocio</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: colchon }}>Soporta hasta -{maxDrop}% de caÃ­da</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: Math.min(maxDrop * 2, 100) + '%', borderRadius: '4px', background: `linear-gradient(90deg, ${colors.green}, ${colors.gold}, ${colors.red})` }} />
                      <div style={{ position: 'absolute', left: maxDrop * 2 + '%', top: '-2px', width: '2px', height: '12px', background: colors.t1, borderRadius: '1px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: colors.t3 }}>
                      <span>0%</span><span>-25%</span><span>-50%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* âââ ESTACIONALIDAD â MAPA DE CALOR 2025 vs 2026 âââ */}
        {(() => {
          const maxVenta = Math.max(...VENTAS_2025, ...VENTAS_2026.filter(v => v > 0), ...proyeccion26);
          const getIntensity = (val) => Math.max(0.08, Math.min(1, val / maxVenta));
          const getColor = (val) => {
            const intensity = getIntensity(val);
            return `rgba(0, 200, 224, ${intensity})`;
          };
          const variacion = MESES.map((m, idx) => {
            const v25 = VENTAS_2025[idx];
            const v26 = VENTAS_2026[idx] > 0 ? VENTAS_2026[idx] : proyeccion26[idx];
            const pctVar = v25 > 0 ? Math.round(((v26 - v25) / v25) * 100) : 0;
            return { mes: m, v25, v26, pctVar, esReal: VENTAS_2026[idx] > 0 };
          });
          const mejorMes25 = MESES[VENTAS_2025.indexOf(Math.max(...VENTAS_2025))];
          const peorMes25 = MESES[VENTAS_2025.indexOf(Math.min(...VENTAS_2025))];

          return (
            <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.blue}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Estacionalidad</h3>
                  <div style={{ fontSize: '12px', color: colors.t2 }}>Mapa de calor comparativo â patrones de venta 2025 vs 2026</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.cyan }} /> 2025</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.gold }} /> 2026</span>
                </div>
              </div>
              {/* Heat map grid */}
              <div style={{ marginBottom: '16px' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '3px', marginBottom: '3px' }}>
                  <div />
                  {MESES.map((m, idx) => (
                    <div key={idx} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '700', color: colors.t3, textTransform: 'uppercase', padding: '4px 0' }}>{m}</div>
                  ))}
                </div>
                {/* 2025 row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '3px', marginBottom: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: colors.cyan }}>2025</div>
                  {VENTAS_2025.map((v, idx) => (
                    <div key={idx} style={{ background: getColor(v), borderRadius: '4px', padding: '8px 2px', textAlign: 'center', fontSize: '9px', fontWeight: '600', color: getIntensity(v) > 0.5 ? '#0b0b0d' : colors.t1, transition: 'all 0.3s', cursor: 'default' }} title={MESES[idx] + ' 2025: ' + formatMXN(v)}>
                      {v >= 100000 ? Math.round(v / 1000) + 'k' : formatMXN(v)}
                    </div>
                  ))}
                </div>
                {/* 2026 row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '3px', marginBottom: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: colors.gold }}>2026</div>
                  {variacion.map((v, idx) => (
                    <div key={idx} style={{ background: `rgba(240, 180, 41, ${getIntensity(v.v26)})`, borderRadius: '4px', padding: '8px 2px', textAlign: 'center', fontSize: '9px', fontWeight: '600', color: getIntensity(v.v26) > 0.5 ? '#0b0b0d' : colors.t1, border: v.esReal ? 'none' : '1px dashed rgba(240,180,41,0.3)', transition: 'all 0.3s', cursor: 'default' }} title={v.mes + ' 2026: ' + formatMXN(v.v26) + (v.esReal ? ' (real)' : ' (proyectado)')}>
                      {v.v26 >= 100000 ? Math.round(v.v26 / 1000) + 'k' : formatMXN(v.v26)}
                    </div>
                  ))}
                </div>
                {/* VariaciÃ³n row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', fontWeight: '600', color: colors.t3 }}>Var %</div>
                  {variacion.map((v, idx) => (
                    <div key={idx} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '700', padding: '4px 2px', color: v.pctVar >= 0 ? colors.green : colors.red, background: v.pctVar >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '4px' }}>
                      {v.pctVar >= 0 ? '+' : ''}{v.pctVar}%
                    </div>
                  ))}
                </div>
              </div>
              {/* Insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Temporada alta</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: colors.t1 }}>{mejorMes25}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>Mejor mes 2025: {formatMXN(Math.max(...VENTAS_2025))}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Temporada baja</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: colors.t1 }}>{peorMes25}</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>Peor mes 2025: {formatMXN(Math.min(...VENTAS_2025))}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0,200,224,0.06)', borderRadius: '8px', border: '1px solid rgba(0,200,224,0.15)' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.cyan, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Ratio max/min</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: colors.t1 }}>{(Math.max(...VENTAS_2025) / Math.min(...VENTAS_2025)).toFixed(1)}x</div>
                  <div style={{ fontSize: '10px', color: colors.t3 }}>Diferencia entre mejor y peor mes</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* âââ MÃTRICAS POR CANAL âââ */}
        {(() => {
          const [pctOnline, setPctOnline] = React.useState(35);
          const pctTienda = 100 - pctOnline;
          const ventasOnline = Math.round(totalProyectado26 * pctOnline / 100);
          const ventasTienda = Math.round(totalProyectado26 * pctTienda / 100);
          const comisionOnline = 0.036;
          const costoEnvio = 150;
          const ticketPromOnline = 2800;
          const ticketPromTienda = 3200;
          const ordenesOnline = Math.round(ventasOnline / ticketPromOnline);
          const ordenesTienda = Math.round(ventasTienda / ticketPromTienda);
          const costoOpOnline = Math.round(ventasOnline * comisionOnline + ordenesOnline * costoEnvio);
          const costoOpTienda = totalGastosFijos * 12;
          const utilidadOnline = Math.round(ventasOnline * MARGEN - costoOpOnline);
          const utilidadTienda = Math.round(ventasTienda * MARGEN - costoOpTienda);
          const margenNetoOnline = ventasOnline > 0 ? ((utilidadOnline / ventasOnline) * 100).toFixed(1) : 0;
          const margenNetoTienda = ventasTienda > 0 ? ((utilidadTienda / ventasTienda) * 100).toFixed(1) : 0;

          return (
            <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.purple}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>MÃ©tricas por canal</h3>
                  <div style={{ fontSize: '12px', color: colors.t2 }}>Shopify online vs Tienda fÃ­sica â ajusta el split para proyectar</div>
                </div>
              </div>
              {/* Slider de distribuciÃ³n */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: colors.purple }}>Online: {pctOnline}%</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: colors.cyan }}>Tienda: {pctTienda}%</span>
                </div>
                <input type="range" min="10" max="90" value={pctOnline} onChange={e => setPctOnline(Number(e.target.value))} style={{ width: '100%', accentColor: colors.purple, height: '6px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: colors.t3 }}>
                  <span>100% online</span><span>50/50</span><span>100% tienda</span>
                </div>
              </div>
              {/* Comparativa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Online */}
                <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.15)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>ð</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: colors.purple }}>Shopify Online</div>
                      <div style={{ fontSize: '10px', color: colors.t3 }}>{pctOnline}% del total</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ventas</div><div style={{ fontSize: '14px', fontWeight: '700', color: colors.t1 }}>{formatMXN(ventasOnline)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ãrdenes</div><div style={{ fontSize: '14px', fontWeight: '700', color: colors.t1 }}>{ordenesOnline.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Utilidad</div><div style={{ fontSize: '14px', fontWeight: '700', color: utilidadOnline >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadOnline)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Margen neto</div><div style={{ fontSize: '14px', fontWeight: '700', color: parseFloat(margenNetoOnline) >= 15 ? colors.green : colors.orange }}>{margenNetoOnline}%</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ticket prom.</div><div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>{formatMXN(ticketPromOnline)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Costo op.</div><div style={{ fontSize: '12px', fontWeight: '600', color: colors.red }}>{formatMXN(costoOpOnline)}</div></div>
                  </div>
                </div>
                {/* Tienda */}
                <div style={{ background: 'rgba(0,200,224,0.06)', borderRadius: '10px', border: '1px solid rgba(0,200,224,0.15)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>ðª</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: colors.cyan }}>Tienda fÃ­sica</div>
                      <div style={{ fontSize: '10px', color: colors.t3 }}>{pctTienda}% del total</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ventas</div><div style={{ fontSize: '14px', fontWeight: '700', color: colors.t1 }}>{formatMXN(ventasTienda)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ãrdenes</div><div style={{ fontSize: '14px', fontWeight: '700', color: colors.t1 }}>{ordenesTienda.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Utilidad</div><div style={{ fontSize: '14px', fontWeight: '700', color: utilidadTienda >= 0 ? colors.green : colors.red }}>{formatMXN(utilidadTienda)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Margen neto</div><div style={{ fontSize: '14px', fontWeight: '700', color: parseFloat(margenNetoTienda) >= 15 ? colors.green : colors.orange }}>{margenNetoTienda}%</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Ticket prom.</div><div style={{ fontSize: '12px', fontWeight: '600', color: colors.t1 }}>{formatMXN(ticketPromTienda)}</div></div>
                    <div><div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Costo op.</div><div style={{ fontSize: '12px', fontWeight: '600', color: colors.red }}>{formatMXN(costoOpTienda)}</div></div>
                  </div>
                </div>
              </div>
              {/* RecomendaciÃ³n */}
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(168,85,247,0.06)', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.15)', fontSize: '11px', color: colors.t2, textAlign: 'center' }}>
                {parseFloat(margenNetoOnline) > parseFloat(margenNetoTienda)
                  ? `Online tiene mejor margen neto (${margenNetoOnline}% vs ${margenNetoTienda}%) â considera escalar el canal digital`
                  : `Tienda fÃ­sica tiene mejor margen neto (${margenNetoTienda}% vs ${margenNetoOnline}%) â la presencia fÃ­sica sigue siendo tu fortaleza`
                }
              </div>
            </div>
          );
        })()}

        {/* âââ ROI POR INVERSIÃN âââ */}
        {(() => {
          const totalAdSpend = recurrentes.filter(g => g.concepto === 'InversiÃ³n Meta Ads').reduce((a, g) => a + g.monto, 0);
          const mesesConAds = new Set(recurrentes.filter(g => g.concepto === 'InversiÃ³n Meta Ads').map(g => g.mes)).size || 1;
          const adSpendAnual = Math.round(totalAdSpend / mesesConAds * 12);
          const roasEstimado = 3.5;
          const ventasPorAds = Math.round(adSpendAnual * roasEstimado);
          const roiAds = adSpendAnual > 0 ? (((ventasPorAds * MARGEN - adSpendAnual) / adSpendAnual) * 100).toFixed(0) : 0;

          const valorInventarioCosto = CATALOG.reduce((a, p) => a + p.costo * p.stock, 0);
          const valorInventarioVenta = CATALOG.reduce((a, p) => a + p.precio * p.stock, 0);
          const roiInventario = valorInventarioCosto > 0 ? (((valorInventarioVenta - valorInventarioCosto) / valorInventarioCosto) * 100).toFixed(0) : 0;
          const rotacion = valorInventarioCosto > 0 ? (ytd26 / ((valorInventarioCosto + valorInventarioCosto) / 2)).toFixed(1) : 0;

          const totalMobInv = mobiliario.reduce((a, m) => a + m.costoUnit * m.cantidad, 0);
          const vidaUtilAnios = 5;
          const depAnual = Math.round(totalMobInv / vidaUtilAnios);
          const beneficioEquipo = Math.round(totalProyectado26 * 0.02);
          const roiEquipo = totalMobInv > 0 ? (((beneficioEquipo - depAnual) / totalMobInv) * 100).toFixed(0) : 0;

          const inversiones = [
            { nombre: 'Meta Ads', icon: 'ð¢', inversion: adSpendAnual, retorno: ventasPorAds, roi: parseFloat(roiAds), color: colors.blue, detalle: `ROAS ${roasEstimado}x Â· ${mesesConAds} meses con datos` },
            { nombre: 'Inventario', icon: 'ð¦', inversion: valorInventarioCosto, retorno: valorInventarioVenta, roi: parseFloat(roiInventario), color: colors.gold, detalle: `${CATALOG.reduce((a, p) => a + p.stock, 0)} uds Â· RotaciÃ³n ${rotacion}x` },
            { nombre: 'Equipo y mob.', icon: 'ð¥ï¸', inversion: totalMobInv, retorno: beneficioEquipo, roi: parseFloat(roiEquipo), color: colors.purple, detalle: `DepreciaciÃ³n: ${formatMXN(depAnual)}/aÃ±o (5 aÃ±os)` },
          ];
          const totalInvertido = inversiones.reduce((a, i) => a + i.inversion, 0);
          const totalRetorno = inversiones.reduce((a, i) => a + i.retorno, 0);
          const roiGlobal = totalInvertido > 0 ? (((totalRetorno * MARGEN - totalInvertido) / totalInvertido) * 100).toFixed(0) : 0;

          return (
            <div style={{ ...cardStyle, marginTop: '12px', borderLeft: `3px solid ${colors.green}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>ROI por inversiÃ³n</h3>
                  <div style={{ fontSize: '12px', color: colors.t2 }}>Retorno estimado de cada Ã¡rea de inversiÃ³n del negocio</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '2px' }}>ROI global</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: parseFloat(roiGlobal) >= 0 ? colors.green : colors.red }}>{roiGlobal}%</div>
                </div>
              </div>
              {/* Tarjetas de inversiÃ³n */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {inversiones.map((inv, ii) => (
                  <div key={ii} style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${inv.color}25`, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: inv.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{inv.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: inv.color }}>{inv.nombre}</div>
                        <div style={{ fontSize: '10px', color: colors.t3 }}>{inv.detalle}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>InversiÃ³n</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.red }}>{formatMXN(inv.inversion)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: colors.t3, textTransform: 'uppercase', marginBottom: '2px' }}>Retorno</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.green }}>{formatMXN(inv.retorno)}</div>
                      </div>
                    </div>
                    {/* ROI bar */}
                    <div style={{ padding: '8px 0', borderTop: `1px solid ${colors.br}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: colors.t3 }}>ROI</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: inv.roi >= 50 ? colors.green : inv.roi >= 0 ? colors.gold : colors.red }}>{inv.roi}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(Math.max(inv.roi, 0), 200) / 2 + '%', borderRadius: '3px', background: inv.roi >= 50 ? colors.green : inv.roi >= 0 ? colors.gold : colors.red, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Resumen total */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '14px 16px', background: 'rgba(34,197,94,0.06)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total invertido</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.t1 }}>{formatMXN(totalInvertido)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Retorno total</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.green }}>{formatMXN(totalRetorno)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Multiplicador</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.gold }}>{totalInvertido > 0 ? (totalRetorno / totalInvertido).toFixed(1) : 0}x</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const ActivosSection = () => {
    // Valor del inventario (del CATALOG)
    const valorInventarioCosto = CATALOG.reduce((a, p) => a + p.costo * p.stock, 0);
    const valorInventarioVenta = CATALOG.reduce((a, p) => a + p.precio * p.stock, 0);
    const totalProductosEnStock = CATALOG.reduce((a, p) => a + p.stock, 0);

    // Valor del mobiliario
    const totalMobiliario = mobiliario.reduce((a, m) => a + m.costoUnit * m.cantidad, 0);

    // Totales activos
    const totalActivosFijos = totalMobiliario;
    const totalActivosCirculantes = valorInventarioCosto + efectivoCaja + saldoBanco + cuentasPorCobrar;
    const totalActivos = totalActivosFijos + totalActivosCirculantes;

    // Pasivos
    const totalPasivos = pasivos.reduce((a, p) => a + (p.monto - p.montoPagado), 0);

    // Capital = Activos - Pasivos
    const capital = totalActivos - totalPasivos;

    const CATEGORIAS_MOB = ['Mobiliario', 'Equipo', 'DecoraciÃ³n', 'Herramientas', 'VehÃ­culo', 'Otro'];
    const UBICACIONES = ['Tienda', 'Bodega', 'Oficina', 'Casa', 'Otro'];
    const TIPOS_PASIVO = ['PrÃ©stamo', 'Tarjeta de crÃ©dito', 'Cuenta por pagar', 'Deuda proveedor', 'Otro'];

    return (
      <div>
        <SectionTitle sub="Inventario, mobiliario y balance general">Activos</SectionTitle>

        {/* âââ BALANCE GENERAL âââ */}
        <div style={{ ...cardStyle, marginBottom: '12px', borderLeft: `3px solid ${colors.cyan}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Balance general</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
            {/* Activos */}
            <div style={{ padding: '20px', background: 'rgba(0,200,224,0.06)', borderRadius: '12px', border: '1px solid rgba(0,200,224,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '8px' }}>Total activos</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: colors.cyan }}>{formatMXN(totalActivos)}</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '6px' }}>Circulantes: {formatMXN(totalActivosCirculantes)} Â· Fijos: {formatMXN(totalActivosFijos)}</div>
            </div>
            <div style={{ fontSize: '24px', color: colors.t3 }}>â</div>
            {/* Pasivos */}
            <div style={{ padding: '20px', background: 'rgba(239,68,68,0.06)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.red, marginBottom: '8px' }}>Total pasivos</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: totalPasivos > 0 ? colors.red : colors.t3 }}>{totalPasivos > 0 ? formatMXN(totalPasivos) : '$0'}</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '6px' }}>{pasivos.length} deuda{pasivos.length !== 1 ? 's' : ''} registrada{pasivos.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ fontSize: '24px', color: colors.t3 }}>=</div>
            {/* Capital */}
            <div style={{ padding: '20px', background: capital >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: '12px', border: `1px solid ${capital >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: capital >= 0 ? colors.green : colors.red, marginBottom: '8px' }}>Capital</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: capital >= 0 ? colors.green : colors.red }}>{formatMXN(capital)}</div>
              <div style={{ fontSize: '10px', color: colors.t3, marginTop: '6px' }}>Patrimonio neto del negocio</div>
            </div>
          </div>
          {/* Barra visual de composiciÃ³n */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '2px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              {valorInventarioCosto > 0 && <div style={{ width: ((valorInventarioCosto / totalActivos) * 100) + '%', background: colors.gold, borderRadius: '4px' }} title="Inventario" />}
              {totalMobiliario > 0 && <div style={{ width: ((totalMobiliario / totalActivos) * 100) + '%', background: colors.purple, borderRadius: '4px' }} title="Mobiliario" />}
              {(efectivoCaja + saldoBanco) > 0 && <div style={{ width: (((efectivoCaja + saldoBanco) / totalActivos) * 100) + '%', background: colors.green, borderRadius: '4px' }} title="Efectivo + Banco" />}
              {cuentasPorCobrar > 0 && <div style={{ width: ((cuentasPorCobrar / totalActivos) * 100) + '%', background: colors.cyan, borderRadius: '4px' }} title="Cuentas por cobrar" />}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '10px', color: colors.t3, flexWrap: 'wrap' }}>
              <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.gold, marginRight: '4px' }} />Inventario: {formatMXN(valorInventarioCosto)}</span>
              <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.purple, marginRight: '4px' }} />Mobiliario: {formatMXN(totalMobiliario)}</span>
              <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.green, marginRight: '4px' }} />Efectivo: {formatMXN(efectivoCaja + saldoBanco)}</span>
              {cuentasPorCobrar > 0 && <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: colors.cyan, marginRight: '4px' }} />Por cobrar: {formatMXN(cuentasPorCobrar)}</span>}
            </div>
          </div>
        </div>

        {/* âââ DINERO DISPONIBLE âââ */}
        <div style={cardStyle}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.green, marginRight: '8px' }}>â</span>Dinero disponible
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Efectivo en caja', value: efectivoCaja, setter: setEfectivoCaja, color: colors.green, icon: 'ðµ' },
              { label: 'Saldo en banco', value: saldoBanco, setter: setSaldoBanco, color: colors.blue, icon: 'ð¦' },
              { label: 'Cuentas por cobrar', value: cuentasPorCobrar, setter: setCuentasPorCobrar, color: colors.cyan, icon: 'ð' },
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '16px', background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: item.color }}>{item.label}</span>
                </div>
                <input type="number" value={item.value} onChange={e => item.setter(Number(e.target.value) || 0)} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '8px', padding: '10px 12px', color: colors.t1, fontSize: '20px', fontWeight: '700', textAlign: 'right' }} />
              </div>
            ))}
          </div>
        </div>

        {/* âââ INVENTARIO FÃSICO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: colors.gold, marginRight: '8px' }}>â</span>Inventario fÃ­sico (producto para venta)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Productos en stock</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.t1 }}>{totalProductosEnStock}</div>
              <div style={{ fontSize: '10px', color: colors.t3 }}>unidades</div>
            </div>
            <div style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, marginBottom: '4px' }}>Valor a costo</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.t1 }}>{formatMXN(valorInventarioCosto)}</div>
              <div style={{ fontSize: '10px', color: colors.t3 }}>lo que pagaste</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.green, marginBottom: '4px' }}>Valor a precio venta</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.green }}>{formatMXN(valorInventarioVenta)}</div>
              <div style={{ fontSize: '10px', color: colors.t3 }}>si vendes todo</div>
            </div>
            <div style={{ background: 'rgba(0,200,224,0.06)', border: '1px solid rgba(0,200,224,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.cyan, marginBottom: '4px' }}>Ganancia potencial</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.cyan }}>{formatMXN(valorInventarioVenta - valorInventarioCosto)}</div>
              <div style={{ fontSize: '10px', color: colors.t3 }}>margen disponible</div>
            </div>
          </div>
          {/* Tabla del inventario */}
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Producto</th>
                  <th style={thStyle}>Marca</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Stock</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo unit.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Precio venta</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor a costo</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor a venta</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {CATALOG.filter(p => p.stock > 0).sort((a, b) => (b.costo * b.stock) - (a.costo * a.stock)).map((p, idx) => {
                  const estado = p.stock <= 2 ? 'Bajo' : 'OK';
                  return (
                    <tr key={idx}>
                      <td style={tdStyle}>{p.nombre}</td>
                      <td style={tdStyle}>{p.marca}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: p.stock <= 2 ? colors.orange : colors.t1 }}>{p.stock}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(p.costo)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(p.precio)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(p.costo * p.stock)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: colors.green }}>{formatMXN(p.precio * p.stock)}</td>
                      <td style={tdStyle}><span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px', background: estado === 'OK' ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)', color: estado === 'OK' ? colors.green : colors.orange, border: `1px solid ${estado === 'OK' ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}` }}>{estado}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* âââ MOBILIARIO Y EQUIPO âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.purple, marginRight: '8px' }}>â</span>Mobiliario y equipo Â· {formatMXN(totalMobiliario)}
            </h4>
            <button onClick={() => setShowFormMob(!showFormMob)} style={buttonStyle('purple')}>{showFormMob ? 'â Cerrar' : '+ Agregar activo'}</button>
          </div>
          {showFormMob && (
            <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Nombre del activo</label>
                  <input value={newMob.nombre} onChange={e => setNewMob({ ...newMob, nombre: e.target.value })} placeholder="Ej: Escritorio, CÃ¡mara..." style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>CategorÃ­a</label>
                  <select value={newMob.categoria} onChange={e => setNewMob({ ...newMob, categoria: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {CATEGORIAS_MOB.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Cantidad</label>
                  <input type="number" value={newMob.cantidad} onChange={e => setNewMob({ ...newMob, cantidad: Number(e.target.value) || 1 })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Costo unitario ($)</label>
                  <input type="number" value={newMob.costoUnit} onChange={e => setNewMob({ ...newMob, costoUnit: e.target.value })} placeholder="0" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>UbicaciÃ³n</label>
                  <select value={newMob.ubicacion} onChange={e => setNewMob({ ...newMob, ubicacion: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {UBICACIONES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { if (newMob.nombre.trim() && newMob.costoUnit) { setMobiliario(prev => [...prev, { ...newMob, costoUnit: Number(newMob.costoUnit), id: Date.now() }]); setNewMob({ nombre: '', categoria: 'Mobiliario', cantidad: 1, costoUnit: '', fechaCompra: '', ubicacion: 'Tienda' }); setShowFormMob(false); } }} style={{ ...buttonStyle('green'), width: '100%' }}>Registrar activo</button>
            </div>
          )}
          {mobiliario.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Activo</th>
                    <th style={thStyle}>CategorÃ­a</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Costo unit.</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Valor total</th>
                    <th style={thStyle}>UbicaciÃ³n</th>
                    <th style={{ ...thStyle, width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {mobiliario.map((m) => {
                    const catColors = { 'Mobiliario': colors.purple, 'Equipo': colors.cyan, 'DecoraciÃ³n': colors.pink, 'Herramientas': colors.orange, 'VehÃ­culo': colors.blue, 'Otro': colors.t2 };
                    return (
                      <tr key={m.id}>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>{m.nombre}</td>
                        <td style={tdStyle}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: (catColors[m.categoria] || colors.t2) + '15', color: catColors[m.categoria] || colors.t2, border: `1px solid ${(catColors[m.categoria] || colors.t2)}30` }}>{m.categoria}</span></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{m.cantidad}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(m.costoUnit)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: colors.purple }}>{formatMXN(m.costoUnit * m.cantidad)}</td>
                        <td style={tdStyle}>{m.ubicacion}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => setMobiliario(prev => prev.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: '13px' }}>â</button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <td colSpan="4" style={{ ...tdStyle, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Total mobiliario y equipo</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: colors.purple }}>{formatMXN(totalMobiliario)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ border: `2px dashed ${colors.br}`, borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>ðª</div>
              <div style={{ fontSize: '13px', color: colors.t2 }}>Sin activos registrados</div>
              <div style={{ fontSize: '11px', color: colors.t3, marginTop: '4px' }}>Haz clic en "Agregar activo" para empezar</div>
            </div>
          )}
        </div>

        {/* âââ PASIVOS (DEUDAS) âââ */}
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.t2, marginBottom: '0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: colors.red, marginRight: '8px' }}>â</span>Pasivos (deudas y obligaciones) Â· {formatMXN(totalPasivos)}
            </h4>
            <button onClick={() => setShowFormPasivo(!showFormPasivo)} style={buttonStyle('red')}>{showFormPasivo ? 'â Cerrar' : '+ Registrar deuda'}</button>
          </div>
          {showFormPasivo && (
            <div style={{ background: colors.bg1, borderRadius: '10px', border: `1px solid ${colors.br}`, padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Concepto</label>
                  <input value={newPasivo.concepto} onChange={e => setNewPasivo({ ...newPasivo, concepto: e.target.value })} placeholder="Ej: PrÃ©stamo bancario, TDC..." style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select value={newPasivo.tipo} onChange={e => setNewPasivo({ ...newPasivo, tipo: e.target.value })} style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }}>
                    {TIPOS_PASIVO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Monto total ($)</label>
                  <input type="number" value={newPasivo.monto} onChange={e => setNewPasivo({ ...newPasivo, monto: e.target.value })} placeholder="0" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Acreedor</label>
                  <input value={newPasivo.acreedor} onChange={e => setNewPasivo({ ...newPasivo, acreedor: e.target.value })} placeholder="Ej: Banco, Proveedor..." style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Ya pagado ($)</label>
                  <input type="number" value={newPasivo.montoPagado} onChange={e => setNewPasivo({ ...newPasivo, montoPagado: e.target.value })} placeholder="0" style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: colors.t2, display: 'block', marginBottom: '4px' }}>Notas</label>
                  <input value={newPasivo.notas} onChange={e => setNewPasivo({ ...newPasivo, notas: e.target.value })} placeholder="Detalles..." style={{ width: '100%', background: colors.bg3, border: `1px solid ${colors.br}`, borderRadius: '6px', padding: '8px', color: colors.t1, fontSize: '12px' }} />
                </div>
              </div>
              <button onClick={() => { if (newPasivo.concepto.trim() && newPasivo.monto) { setPasivos(prev => [...prev, { ...newPasivo, monto: Number(newPasivo.monto), montoPagado: Number(newPasivo.montoPagado) || 0, id: Date.now() }]); setNewPasivo({ concepto: '', tipo: 'PrÃ©stamo', monto: '', montoPagado: 0, acreedor: '', fechaInicio: '', fechaVence: '', notas: '' }); setShowFormPasivo(false); } }} style={{ ...buttonStyle('green'), width: '100%' }}>Registrar deuda</button>
            </div>
          )}
          {pasivos.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Concepto</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Acreedor</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto total</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Pagado</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Pendiente</th>
                    <th style={thStyle}>Progreso</th>
                    <th style={{ ...thStyle, width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pasivos.map((p) => {
                    const pendiente = p.monto - p.montoPagado;
                    const pctPagado = p.monto > 0 ? Math.round((p.montoPagado / p.monto) * 100) : 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>{p.concepto}</td>
                        <td style={tdStyle}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', color: colors.red, border: '1px solid rgba(239,68,68,0.2)' }}>{p.tipo}</span></td>
                        <td style={tdStyle}>{p.acreedor || 'â'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMXN(p.monto)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: colors.green }}>{formatMXN(p.montoPagado)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: colors.red }}>{formatMXN(pendiente)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: pctPagado + '%', height: '100%', background: colors.green, borderRadius: '2px' }} />
                            </div>
                            <span style={{ fontSize: '10px', color: colors.t3 }}>{pctPagado}%</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => setPasivos(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: '13px' }}>â</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ border: `2px dashed ${colors.br}`, borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>â</div>
              <div style={{ fontSize: '13px', color: colors.green }}>Sin deudas registradas</div>
              <div style={{ fontSize: '11px', color: colors.t3, marginTop: '4px' }}>Si tienes prÃ©stamos, tarjetas o deudas con proveedores, regÃ­stralas aquÃ­</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ââââ RENDER ââââ
  return (
    <div style={{ background: colors.bg, color: colors.t1, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <NavBar />
      {/* ââ Banner de estado de conexiÃ³n ââ */}
      {syncError && (
        <div style={{ position: 'fixed', top: '52px', left: 0, right: 0, zIndex: 99, padding: '8px 16px', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', color: '#ff8a80' }}>
          <AlertCircle size={14} />
          <span>{syncError}</span>
          <button onClick={() => setSyncError(null)} style={{ background: 'none', border: 'none', color: '#ff8a80', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>Ã</button>
        </div>
      )}
      {dataSource === 'live' && !syncError && lastSync && (
        <div style={{ position: 'fixed', top: '52px', left: 0, right: 0, zIndex: 99, padding: '6px 16px', background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: colors.green }}>
          <Wifi size={12} />
          <span>Conectado a Shopify ({STORE_DOMAIN}) Â· Ãltima sync: {lastSync.toLocaleTimeString('es-MX')} Â· Auto-refresh cada 5 min</span>
        </div>
      )}
      <main style={mainStyle}>
        {activeTab === 'inicio' && <InicioSection />}
        {activeTab === 'ventas' && <VentasSection />}
        {activeTab === 'gastos' && <GastosSection />}
        {activeTab === 'compras' && <ComprasSection />}
        {activeTab === 'marketing' && <MarketingSection />}
        {activeTab === 'objetivos' && <ObjetivosSection />}
        {activeTab === 'forecast' && <ForecastSection />}
        {activeTab === 'activos' && <ActivosSection />}
      </main>
    </div>
  );
};

export default LostProjectDashboard;
