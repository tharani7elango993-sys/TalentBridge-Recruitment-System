import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// ── helpers ────────────────────────────────────────────────
const pillClass = { applied:'pill-applied', shortlisted:'pill-shortlisted', interview_scheduled:'pill-interview', selected:'pill-selected', rejected:'pill-rejected', open:'pill-open', closed:'pill-closed' };
const pillLabel = { applied:'Applied', shortlisted:'Shortlisted', interview_scheduled:'Interview Set', selected:'Selected', rejected:'Rejected', open:'Open', closed:'Closed' };
const Pill = ({ s }) => <span className={`pill ${pillClass[s]||'pill-applied'}`}>{pillLabel[s]||s}</span>;

// ── Apply Modal ────────────────────────────────────────────
function ApplyModal({ job, onClose, onSuccess }) {
  const [cover, setCover]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`/api/applications/${job._id}`, { coverLetter: cover });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>{job.title}</h3>
        <div className="modal-sub">{job.company} · {job.location} · {job.salary}</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Cover Letter <span style={{fontWeight:400,color:'#64748b'}}>(optional)</span></label>
          <textarea rows="4" placeholder="Why are you a great fit for this role?" value={cover} onChange={e => setCover(e.target.value)} style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:'8px',fontFamily:'DM Sans,sans-serif',fontSize:'14px',outline:'none',resize:'vertical'}} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" style={{flex:1}} onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</button>
          <button className="btn btn-outline" style={{flex:1}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function SeekerDashboard() {
  const { user } = useAuth();
  const [tab, setTab]               = useState('home');
  const [apps, setApps]             = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [search, setSearch]         = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [applyJob, setApplyJob]     = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const initials = n => n ? n.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'U';

  const fetchApps = useCallback(async () => {
    setLoadingApps(true);
    try { const r = await axios.get('/api/applications/my'); setApps(r.data.applications); }
    catch {} finally { setLoadingApps(false); }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (jobTypeFilter) params.jobType = jobTypeFilter;
      const r = await axios.get('/api/jobs', { params });
      setJobs(r.data.jobs);
    } catch {} finally { setLoadingJobs(false); }
  }, [search, jobTypeFilter]);

  useEffect(() => { fetchApps(); }, [fetchApps]);
  useEffect(() => { if (tab === 'browse') fetchJobs(); }, [tab, fetchJobs]);

  const hasApplied = (jobId) => apps.some(a => a.job?._id === jobId || a.job === jobId);

  const stats = {
    total:       apps.length,
    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
    interview:   apps.filter(a => a.status === 'interview_scheduled').length,
    selected:    apps.filter(a => a.status === 'selected').length,
  };

  return (
    <>
      <Navbar />
      <div className="page">
        {/* ── TAB NAV ── */}
        <div style={{display:'flex',gap:'6px',marginBottom:'24px',borderBottom:'1px solid #e2e8f0',paddingBottom:'0'}}>
          {[['home','🏠 Dashboard'],['browse','🔍 Browse Jobs'],['myapps','📋 My Applications'],['profile','👤 Profile']].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',padding:'10px 16px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'14px',fontWeight:tab===t?'600':'400',color:tab===t?'#2563eb':'#475569',borderBottom:tab===t?'2px solid #2563eb':'2px solid transparent',marginBottom:'-1px',transition:'all .15s'}}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && (
          <>
            <div className="page-header">
              <h2 className="page-title">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
              <p className="page-sub">Here's your job search overview</p>
            </div>
            <div className="stat-grid">
              <div className="stat-card sc-blue"><p className="stat-label">Applied</p><p className="stat-val">{stats.total}</p></div>
              <div className="stat-card sc-indigo"><p className="stat-label">Shortlisted</p><p className="stat-val">{stats.shortlisted}</p></div>
              <div className="stat-card sc-amber"><p className="stat-label">Interviews</p><p className="stat-val">{stats.interview}</p></div>
              <div className="stat-card sc-green"><p className="stat-label">Selected</p><p className="stat-val">{stats.selected}</p></div>
            </div>
            <div className="two-col">
              {/* Recent Applications */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Recent Applications</span>
                  <button className="btn btn-sm btn-outline" onClick={()=>setTab('myapps')}>View all</button>
                </div>
                {loadingApps ? <p style={{color:'#64748b',fontSize:'13px'}}>Loading...</p> :
                  apps.length === 0 ? <div className="empty"><div className="empty-icon">📋</div>No applications yet. Browse jobs to get started!</div> :
                  apps.slice(0,4).map(a => (
                    <div key={a._id} className="app-row" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div><h4>{a.job?.title || 'Job'}</h4><p>{a.job?.company} · {a.job?.location}</p></div>
                      <Pill s={a.status} />
                    </div>
                  ))
                }
              </div>
              {/* Latest Jobs */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Latest Openings</span>
                  <button className="btn btn-sm btn-outline" onClick={()=>setTab('browse')}>Browse all</button>
                </div>
                {jobs.slice(0,3).map(j => (
                  <div key={j._id} style={{padding:'12px',border:'1px solid #e2e8f0',borderRadius:'8px',marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                      <div><p style={{fontSize:'14px',fontWeight:'600'}}>{j.title}</p><p style={{fontSize:'12px',color:'#475569'}}>{j.company} · {j.location}</p></div>
                      {hasApplied(j._id) ? <span style={{fontSize:'12px',color:'#16a34a',fontWeight:'500'}}>✓ Applied</span> : <button className="btn btn-sm btn-blue" onClick={()=>setApplyJob(j)}>Apply</button>}
                    </div>
                    <div>{j.skills?.slice(0,3).map(s=><span key={s} className="skill-tag">{s}</span>)}</div>
                  </div>
                ))}
                {jobs.length === 0 && <button className="btn btn-primary btn-block" onClick={()=>{ setTab('browse'); fetchJobs(); }}>Load Jobs</button>}
              </div>
            </div>
          </>
        )}

        {/* ══ BROWSE TAB ══ */}
        {tab === 'browse' && (
          <>
            <div className="page-header"><h2 className="page-title">Browse Jobs</h2><p className="page-sub">Find your next opportunity</p></div>
            <div className="search-bar">
              <input placeholder="Search by title, skill, company..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchJobs()} />
              <select value={jobTypeFilter} onChange={e=>setJobTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {['Full-time','Part-time','Internship','Remote','Contract'].map(t=><option key={t}>{t}</option>)}
              </select>
              <button className="btn btn-primary" onClick={fetchJobs}>Search</button>
            </div>
            {loadingJobs ? <p style={{color:'#64748b'}}>Loading jobs...</p> :
              jobs.length === 0 ? <div className="empty"><div className="empty-icon">🔍</div>No jobs found. Try different search terms.</div> :
              jobs.map(j => (
                <div key={j._id} className="job-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                    <div><p className="job-card-title">{j.title}</p><p className="job-card-meta">{j.company} · {j.location} · {j.jobType} · {j.salary}</p></div>
                    <Pill s={j.status} />
                  </div>
                  <p className="job-card-desc">{j.description?.substring(0,120)}...</p>
                  <div style={{marginBottom:'10px'}}>{j.skills?.map(s=><span key={s} className="skill-tag">{s}</span>)}</div>
                  <div className="job-card-footer">
                    <p className="job-card-info">Exp: {j.experience} · Edu: {j.education} · Vacancies: {j.vacancies}</p>
                    {hasApplied(j._id)
                      ? <span style={{fontSize:'13px',color:'#16a34a',fontWeight:'500'}}>✓ Already Applied</span>
                      : <button className="btn btn-sm btn-blue" onClick={()=>setApplyJob(j)}>Apply Now</button>}
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* ══ MY APPLICATIONS TAB ══ */}
        {tab === 'myapps' && (
          <>
            <div className="page-header"><h2 className="page-title">My Applications</h2><p className="page-sub">Track all your job applications</p></div>
            {loadingApps ? <p style={{color:'#64748b'}}>Loading...</p> :
              apps.length === 0 ? <div className="empty"><div className="empty-icon">📂</div>No applications yet. <button className="btn btn-sm btn-blue" style={{marginLeft:'8px'}} onClick={()=>setTab('browse')}>Browse Jobs</button></div> :
              apps.map(a => (
                <div key={a._id} className="app-row">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                    <div>
                      <h4>{a.job?.title}</h4>
                      <p>{a.job?.company} · {a.job?.location} · {a.job?.jobType} · Applied {new Date(a.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <Pill s={a.status} />
                  </div>
                  {a.status === 'interview_scheduled' && a.interviewDate && (
                    <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'6px',padding:'8px 12px',marginTop:'8px',fontSize:'13px',color:'#b45309'}}>
                      📅 Interview: {a.interviewDate} at {a.interviewTime || 'TBD'} — {a.interviewMode}
                      {a.interviewLink && <> · <a href={a.interviewLink} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>Join Link</a></>}
                    </div>
                  )}
                  {a.hrNote && <p style={{fontSize:'12px',color:'#64748b',marginTop:'6px'}}>💬 HR Note: {a.hrNote}</p>}
                </div>
              ))
            }
          </>
        )}

        {/* ══ PROFILE TAB ══ */}
        {tab === 'profile' && (
          <>
            <div className="page-header"><h2 className="page-title">My Profile</h2><p className="page-sub">Your professional information</p></div>
            <div className="card" style={{maxWidth:'600px'}}>
              <div className="profile-header">
                <div className="profile-avatar avatar-blue" style={{width:'64px',height:'64px',fontSize:'22px'}}>{initials(user.name)}</div>
                <div>
                  <h3 style={{fontSize:'18px'}}>{user.name}</h3>
                  <p style={{fontSize:'13px',color:'#475569',marginTop:'3px'}}>{user.email} · Job Seeker</p>
                </div>
              </div>
              <div className="profile-grid">
                {[['Phone',user.phone||'—'],['Experience',user.experience||'—'],['Education',user.education||'—'],['Applications',apps.length+' total']].map(([l,v])=>(
                  <div key={l} className="profile-field"><label>{l}</label><p>{v}</p></div>
                ))}
              </div>
              {user.skills?.length > 0 && (
                <div style={{marginTop:'16px'}}>
                  <p style={{fontSize:'12px',color:'#475569',marginBottom:'6px'}}>Skills</p>
                  <div>{user.skills.map(s=><span key={s} className="skill-tag">{s}</span>)}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Apply Modal */}
      {applyJob && (
        <ApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onSuccess={() => { setApplyJob(null); fetchApps(); setTab('myapps'); }}
        />
      )}
    </>
  );
}
