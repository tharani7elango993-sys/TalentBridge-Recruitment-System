import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Pill = ({ s, label }) => {
  const map = { open:'pill-open', closed:'pill-closed', active:'pill-open', inactive:'pill-rejected', hr:'pill-hr', jobseeker:'pill-seeker' };
  return <span className={`pill ${map[s]||'pill-applied'}`}>{label||s}</span>;
};

// ── Add HR Modal ───────────────────────────────────────────
function AddHRModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', department:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required'); return; }
    setLoading(true);
    try { await axios.post('/api/admin/create-hr', form); onSuccess(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to create HR'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>Add HR Manager</h3>
        <div className="modal-sub">Create a new HR account with login access</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-row">
          <div className="form-group"><label>Full Name *</label><input placeholder="HR Manager name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
          <div className="form-group"><label>Department</label><input placeholder="e.g. Engineering" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} /></div>
        </div>
        <div className="form-group"><label>Email *</label><input type="email" placeholder="hr@company.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
        <div className="form-group"><label>Password *</label><input type="password" placeholder="Set password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn btn-primary" style={{flex:1}} onClick={handleAdd} disabled={loading}>{loading?'Creating...':'Create HR Account'}</button>
          <button className="btn btn-outline" style={{flex:1}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab]         = useState('home');
  const [stats, setStats]     = useState({});
  const [users, setUsers]     = useState([]);
  const [jobs, setJobs]       = useState([]);
  const [apps, setApps]       = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [showAddHR, setShowAddHR]   = useState(false);

  const fetchStats = useCallback(async () => {
    try { const r = await axios.get('/api/admin/stats'); setStats(r.data.stats); } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = userFilter !== 'all' ? { role: userFilter } : {};
      const r = await axios.get('/api/admin/users', { params });
      setUsers(r.data.users);
    } catch {}
  }, [userFilter]);

  const fetchJobs = useCallback(async () => {
    try { const r = await axios.get('/api/jobs/my'); setJobs(r.data.jobs); } catch {}
  }, []);

  const fetchApps = useCallback(async () => {
    try { const r = await axios.get('/api/applications/all'); setApps(r.data.applications); } catch {}
  }, []);

  useEffect(() => { fetchStats(); fetchUsers(); }, [fetchStats, fetchUsers]);
  useEffect(() => { if (tab === 'jobs') fetchJobs(); }, [tab, fetchJobs]);
  useEffect(() => { if (tab === 'reports') fetchApps(); }, [tab, fetchApps]);

  const toggleUser = async (id) => {
    try { await axios.put(`/api/admin/users/${id}/toggle`); fetchUsers(); fetchStats(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await axios.delete(`/api/admin/users/${id}`); fetchUsers(); fetchStats(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const initials = n => n ? n.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'U';

  // Pipeline chart data
  const pipeline = [
    ['Applied',   apps.filter(a=>a.status==='applied').length,   '#3b82f6'],
    ['Shortlisted',apps.filter(a=>a.status==='shortlisted').length,'#6366f1'],
    ['Interview', apps.filter(a=>a.status==='interview_scheduled').length,'#f59e0b'],
    ['Selected',  apps.filter(a=>a.status==='selected').length,  '#22c55e'],
    ['Rejected',  apps.filter(a=>a.status==='rejected').length,  '#ef4444'],
  ];
  const maxPipe = Math.max(...pipeline.map(p=>p[1]), 1);

  return (
    <>
      <Navbar />
      <div className="page">
        {/* ── TAB NAV ── */}
        <div style={{display:'flex',gap:'6px',marginBottom:'24px',borderBottom:'1px solid #e2e8f0'}}>
          {[['home','⚙️ Dashboard'],['users','👥 Users'],['jobs','💼 All Jobs'],['reports','📊 Reports']].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',padding:'10px 16px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'14px',fontWeight:tab===t?'600':'400',color:tab===t?'#2563eb':'#475569',borderBottom:tab===t?'2px solid #2563eb':'2px solid transparent',marginBottom:'-1px',transition:'all .15s'}}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && (
          <>
            <div className="page-header"><h2 className="page-title">Admin Dashboard</h2><p className="page-sub">System-wide overview and controls</p></div>
            <div className="stat-grid">
              <div className="stat-card sc-blue"><p className="stat-label">Total Users</p><p className="stat-val">{stats.totalUsers||0}</p></div>
              <div className="stat-card sc-indigo"><p className="stat-label">Job Seekers</p><p className="stat-val">{stats.totalJobSeekers||0}</p></div>
              <div className="stat-card sc-purple"><p className="stat-label">HR Managers</p><p className="stat-val">{stats.totalHR||0}</p></div>
              <div className="stat-card sc-green"><p className="stat-label">Open Jobs</p><p className="stat-val">{stats.openJobs||0}</p></div>
            </div>
            <div className="two-col">
              <div className="card">
                <div className="card-header"><span className="card-title">Quick Stats</span></div>
                {[['Total Jobs',stats.totalJobs||0],['Total Applications',stats.totalApplications||0],['Selected Candidates',stats.selectedCandidates||0],['Hire Rate',stats.totalApplications ? Math.round((stats.selectedCandidates||0)/stats.totalApplications*100)+'%' : '0%']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f1f5f9',fontSize:'14px'}}>
                    <span style={{color:'#475569'}}>{l}</span><span style={{fontWeight:'600'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Admin Actions</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <button className="btn btn-blue btn-block" onClick={()=>setTab('users')}>👥 Manage Users</button>
                  <button className="btn btn-blue btn-block" onClick={()=>{ setShowAddHR(true); }}>➕ Add HR Manager</button>
                  <button className="btn btn-blue btn-block" onClick={()=>setTab('jobs')}>💼 View All Jobs</button>
                  <button className="btn btn-blue btn-block" onClick={()=>setTab('reports')}>📊 View Reports</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ USERS TAB ══ */}
        {tab === 'users' && (
          <>
            <div className="page-header"><h2 className="page-title">User Management</h2><p className="page-sub">Manage all registered users</p></div>
            <div className="card">
              <div className="card-header">
                <div className="filter-tabs">
                  {[['all','All'],['jobseeker','Job Seekers'],['hr','HR Managers']].map(([f,label])=>(
                    <button key={f} className={`filter-tab ${userFilter===f?'active':''}`} onClick={()=>setUserFilter(f)}>{label}</button>
                  ))}
                </div>
                <button className="btn btn-sm btn-blue" onClick={()=>setShowAddHR(true)}>+ Add HR</button>
              </div>
              {users.length === 0
                ? <div className="empty"><div className="empty-icon">👤</div>No users found.</div>
                : <div className="table-wrap"><table>
                    <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                              <div className={`avatar ${u.role==='hr'?'avatar-amber':'avatar-blue'}`}>{initials(u.name)}</div>
                              <span style={{fontWeight:'500'}}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{color:'#475569'}}>{u.email}</td>
                          <td><Pill s={u.role} label={u.role==='hr'?'HR Manager':'Job Seeker'} /></td>
                          <td style={{color:'#475569'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td><Pill s={u.isActive?'active':'inactive'} label={u.isActive?'Active':'Inactive'} /></td>
                          <td>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button className={`btn btn-sm ${u.isActive?'btn-red':'btn-green'}`} onClick={()=>toggleUser(u._id)}>{u.isActive?'Deactivate':'Activate'}</button>
                              <button className="btn btn-sm btn-outline" onClick={()=>deleteUser(u._id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
              }
            </div>
          </>
        )}

        {/* ══ JOBS TAB ══ */}
        {tab === 'jobs' && (
          <>
            <div className="page-header"><h2 className="page-title">All Job Postings</h2><p className="page-sub">View all jobs across HR managers</p></div>
            <div className="card">
              {jobs.length === 0
                ? <div className="empty"><div className="empty-icon">💼</div>No jobs found. <button className="btn btn-sm btn-blue" style={{marginLeft:'8px'}} onClick={fetchJobs}>Load Jobs</button></div>
                : <div className="table-wrap"><table>
                    <thead><tr><th>Job Title</th><th>Company</th><th>Location</th><th>Type</th><th>Vacancies</th><th>Status</th></tr></thead>
                    <tbody>
                      {jobs.map(j => (
                        <tr key={j._id}>
                          <td style={{fontWeight:'500'}}>{j.title}</td>
                          <td>{j.company}</td>
                          <td style={{color:'#475569'}}>{j.location}</td>
                          <td>{j.jobType}</td>
                          <td style={{textAlign:'center'}}>{j.vacancies}</td>
                          <td><Pill s={j.status} label={j.status==='open'?'Open':'Closed'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
              }
            </div>
          </>
        )}

        {/* ══ REPORTS TAB ══ */}
        {tab === 'reports' && (
          <>
            <div className="page-header"><h2 className="page-title">Recruitment Reports</h2><p className="page-sub">System-wide analytics and insights</p></div>
            <div className="stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              <div className="stat-card sc-blue"><p className="stat-label">Total Applications</p><p className="stat-val">{apps.length}</p></div>
              <div className="stat-card sc-green"><p className="stat-label">Selected</p><p className="stat-val">{apps.filter(a=>a.status==='selected').length}</p></div>
              <div className="stat-card sc-red"><p className="stat-label">Rejected</p><p className="stat-val">{apps.filter(a=>a.status==='rejected').length}</p></div>
            </div>
            <div className="two-col">
              {/* Pipeline Chart */}
              <div className="card">
                <div className="card-header"><span className="card-title">Application Pipeline</span></div>
                {pipeline.map(([label, count, color]) => (
                  <div key={label} style={{marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'5px'}}>
                      <span style={{color:'#475569',fontWeight:'500'}}>{label}</span>
                      <span style={{fontWeight:'600'}}>{count}</span>
                    </div>
                    <div style={{background:'#f1f5f9',borderRadius:'4px',height:'8px'}}>
                      <div style={{background:color,height:'8px',borderRadius:'4px',width:`${Math.round(count/maxPipe*100)}%`,transition:'width .5s ease'}}></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Metrics Table */}
              <div className="card">
                <div className="card-header"><span className="card-title">Key Metrics</span></div>
                {[
                  ['Total Jobs',          stats.totalJobs||0],
                  ['Open Jobs',           stats.openJobs||0],
                  ['Closed Jobs',         (stats.totalJobs||0)-(stats.openJobs||0)],
                  ['Total Users',         stats.totalUsers||0],
                  ['Job Seekers',         stats.totalJobSeekers||0],
                  ['HR Managers',         stats.totalHR||0],
                  ['Total Applications',  stats.totalApplications||0],
                  ['Selected Candidates', stats.selectedCandidates||0],
                  ['Hire Rate',           stats.totalApplications ? Math.round((stats.selectedCandidates||0)/stats.totalApplications*100)+'%' : '0%'],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}}>
                    <span style={{color:'#475569'}}>{l}</span>
                    <span style={{fontWeight:'600',color:'#0f172a'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {showAddHR && <AddHRModal onClose={()=>setShowAddHR(false)} onSuccess={()=>{ setShowAddHR(false); fetchUsers(); fetchStats(); }} />}
    </>
  );
}
