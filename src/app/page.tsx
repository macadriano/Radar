"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Calculator,
  ShieldCheck,
  Bell,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  Activity,
  ShieldAlert,
  FileText,
  DollarSign,
  AlertTriangle,
  Zap
} from 'lucide-react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { useTheme } from '@/components/ThemeProvider';
import { useProjects } from '@/components/ProjectContext';
import { Project, ProjectStatus } from '@/types/contractual';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

type IndicatorType = 'plazo' | 'avance' | 'seguridad' | 'rentabilidad' | 'criticas' | 'imprevistos' | 'ncs' | 'hitos';

export default function GlobalDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | null>(null);

  const { projects, activeProjects, isLoading } = useProjects();
  const { profile: currentUserProfile } = (require('@/components/AuthContext')).useAuth();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  const isAdmin = currentUserProfile?.role === 'SUPERADMIN' || currentUserProfile?.role === 'ADMIN';

  useMemo(() => {
    if (!isAdmin) return;
    const { userService } = require('@/lib/userService');
    return userService.subscribeToUsers((users: any[]) => {
      const pending = users.filter(u => u.status === 'PENDING').length;
      setPendingUsersCount(pending);
    });
  }, [isAdmin]);

  const [users, setUsers] = useState<any[]>([]);

  useMemo(() => {
    const { userService } = require('@/lib/userService');
    userService.getAllUsers().then(setUsers);
  }, []);

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return 'Sin asignar';
    const user = users.find(u => u.uid === leaderId);
    return user ? user.displayName : 'Sin asignar';
  };

  const globalKPIs = useMemo(() => {
    const totalProjects = activeProjects.length;
    const criticalProjects = activeProjects.filter(p => p.config?.weightTimeline > 0.8).length; // Dummy logic for now
    const totalExposure = activeProjects.reduce((acc, p) => acc + (p.amount || 0), 0);
    const globalHealth = activeProjects.length > 0
      ? Math.round(activeProjects.reduce((acc, p) => acc + 80, 0) / activeProjects.length) // Dummy 80 health for now
      : 0;

    return { totalProjects, criticalProjects, totalExposure, globalHealth };
  }, [activeProjects]);

  const projectList = activeProjects;

  const radarData = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      labels: ['PLAZO', 'AVANCE', 'SEGURIDAD', 'RENTABILIDAD', 'CRÍTICAS', 'IMPREVISTOS'],
      datasets: [
        {
          label: 'MEDIA PORTAFOLIO',
          data: [65, 80, 95, 70, 45, 60],
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.2)',
          borderColor: isDark ? '#60a5fa' : '#2563eb',
          borderWidth: 3,
          pointBackgroundColor: isDark ? '#60a5fa' : '#2563eb',
        }
      ],
    };
  }, [theme]);

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        pointLabels: {
          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
          font: { size: 10, weight: '700' } as any
        },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };

  const renderIndicatorDetail = () => {
    if (!selectedIndicator) return null;

    return (
      <div className="animate-fade" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Detalle Global: {selectedIndicator.replace('ncs', 'No Conformidades').replace('criticas', 'Actividades Críticas')}
          </h2>
          <button onClick={() => setSelectedIndicator(null)} className="btn btn-secondary">Cerrar Detalle</button>
        </div>
        <div className="card" style={{ padding: '0' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Responsable</th>
                  <th>Status Indicador</th>
                  <th>Valor</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map(p => (
                  <tr key={p.id} className="table-row-hover" onClick={() => router.push(`/proyectos/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
                    </td>
                    <td>{getLeaderName(p.leaderUid)}</td>
                    <td>
                      <span className={`badge ${p.status === 'EN_EJECUCION' ? 'badge-success' : 'badge-low'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800 }}>
                      {selectedIndicator === 'plazo' && `0 días`}
                      {selectedIndicator === 'avance' && `0%`}
                      {selectedIndicator === 'rentabilidad' && `$${(p.amount / 1000000).toFixed(1)}M`}
                      {selectedIndicator === 'criticas' && '0 Alertas'}
                      {!['plazo', 'avance', 'rentabilidad', 'criticas'].includes(selectedIndicator) && 'Sin Riesgos'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }}><ArrowUpRight size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      {/* Search and Profile Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar en portafolio..."
            className="form-control"
            style={{ paddingLeft: '2.5rem', width: '300px', borderRadius: '20px', backgroundColor: 'var(--card-bg)' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {isAdmin && pendingUsersCount > 0 && (
            <div
              onClick={() => router.push('/configuracion')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', cursor: 'pointer',
                border: '1px solid rgba(239, 68, 68, 0.2)', animation: 'pulse 2s infinite'
              }}
            >
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--danger)' }}>{pendingUsersCount} PENDIENTES</span>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Mando Corporativo</p>
            <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>Vocalía de Proyectos</p>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <User size={22} />
          </div>
        </div>
      </div>

      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Estado consolidado del portafolio estratégico de TGI.</p>
      </header>

      {!selectedIndicator ? (
        <div className="dashboard-grid">
          {/* consolidated KPIs Row */}
          <div className="card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', color: '#fff' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase' }}>Proyectos Activos</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{globalKPIs.totalProjects}</h2>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 800 }}>3 Críticos</span> requieren acción inmediata.
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 3', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Salud Portafolio</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>{globalKPIs.globalHealth}%</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={14} /> +1.2% este mes
            </p>
          </div>
          <div className="card" style={{ gridColumn: 'span 3', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exposición Riesgo</p>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900 }}>$2.45M <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>USD</span></h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700, marginTop: '1rem' }}>4 Alertas de alto impacto</p>
          </div>
          <div className="card" style={{ gridColumn: 'span 3', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hitos Próximos</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>08</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.5rem' }}>Vencimientos en 15 días</p>
          </div>

          {/* MAIN INDICATOR TILES (Based on User Image) */}
          <div style={{ gridColumn: 'span 12', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indicadores de Control Operativo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>

              {/* Plazo */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('plazo')} style={{ borderLeft: '4px solid var(--danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: 'var(--danger)' }}>
                    <Clock size={20} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--danger)' }}>ALERTA</span>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>PLAZO</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>-15 <span style={{ fontSize: '0.8rem' }}>Días</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Desviación media en hitos contractuales.</p>
              </div>

              {/* Avance */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('avance')} style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning)' }}>
                    <Activity size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>AVANCE OBRA</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>79.6%</p>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', marginTop: '0.75rem' }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--warning)', borderRadius: '2px' }}></div>
                </div>
              </div>

              {/* Seguridad */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('seguridad')} style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning)' }}>
                    <ShieldAlert size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>SEGURIDAD</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>02 <span style={{ fontSize: '0.8rem' }}>Alertas</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sin incidentes incapacitantes reportados.</p>
              </div>

              {/* Rentabilidad */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('rentabilidad')} style={{ borderLeft: '4px solid var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>RENTABILIDAD TGI</h4>
                <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-muted)' }}>FALTA INFORMACIÓN</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Actualización pendiente de Finanzas.</p>
              </div>

              {/* Actividades Críticas */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('criticas')} style={{ borderLeft: '4px solid var(--danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: 'var(--danger)' }}>
                    <Zap size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>ACTIVIDADES CRÍTICAS</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>06 <span style={{ fontSize: '0.8rem' }}>En Alerta</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Impacto potencial en fecha fin contractual.</p>
              </div>

              {/* Imprevistos */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('imprevistos')} style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning)' }}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>IMPREVISTOS</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>03 <span style={{ fontSize: '0.8rem' }}>Reclamos</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Potenciales adicionales en negociación.</p>
              </div>

              {/* No Conformidades */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('ncs')} style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning)' }}>
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>NO CONFORMIDADES</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>02 <span style={{ fontSize: '0.8rem' }}>Abiertas</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Regularización documental en curso.</p>
              </div>

              {/* Días al Hito Clave */}
              <div className="card selectable-card" onClick={() => setSelectedIndicator('hitos')} style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                    <Calendar size={20} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>DÍAS AL HITO CLAVE</h4>
                <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>23 <span style={{ fontSize: '0.8rem' }}>Días</span></p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Puesta en marcha sistema de presurización.</p>
              </div>

            </div>
          </div>

          {/* Bottom Visualizations */}
          <div className="card" style={{ gridColumn: 'span 7', padding: '2rem', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Exposición por Categoría de Riesgo</h3>
            <div style={{ height: '350px' }}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 5', padding: '2rem', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Proyectos con Mayor Desviación</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {projectList.slice(0, 3).map(p => (
                <div key={p.id} style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--success)' }}>80% Salud</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Plazo: 0d</span>
                    <span>Montante: ${(p.amount / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/proyectos')} className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>VER INVENTARIO COMPLETO</button>
          </div>
        </div>
      ) : (
        renderIndicatorDetail()
      )}

      <style jsx>{`
        .selectable-card {
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .selectable-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            background-color: var(--background);
        }
      `}</style>
    </div>
  )
}
