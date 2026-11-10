import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const pillClass = { applied:'pill-applied', shortlisted:'pill-shortlisted', interview_scheduled:'pill-interview', selected:'pill-selected', rejected:'pill-rejected', open:'pill-open', closed:'pill-closed' };
const pillLabel = { applied:'Applied', shortlisted:'Shortlisted', interview_scheduled:'Interview Set', selected:'Selected', rejected:'Rejected', open:'Open', closed:'Closed' };
const Pill = ({ s }) => <span className={`pill ${pillClass[s]||'pill-applied'}`}>{pillLabel[s]||s}</span>;

// ── Status Update Modal ────────────────────────────────────
function StatusModal({ app, onClose, onSave }) {
  const [form, setForm] = useState({
    status:        app.status,
    interviewDate: app.interviewDate || '',
    interviewTime: app.interviewTime || '',
    interviewMode: app.interviewMode || 'online',
    interviewLink: app.interviewLink || '',
    hrNote:        app.hrNote || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/applications/${app._id}/status`, form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>Update Application Status</h3>
        <div className="modal-sub">
          <strong>{app.applicant?.name}</strong> applied for <strong>{app.job?.title || 'this job'}</strong>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            {['applied','shortlisted','interview_scheduled','selected','rejected'].map(s=>(
              <option key={s} value={s}>{pillLabel[s]}</option>
            ))}
          </select>
        </div>
        {form.status === 'interview_scheduled' && (
          <>
            <div className="form-row">
              <div className="form-group"><label>Interview Date</label><input type="date" value={form.interviewDate} onChange={e=>setForm({...form,interviewDate:e.target.value})} /></div>
              <div className="form-group"><label>Time</label><input type="time" value={form.interviewTime} onChange={e=>setForm({...form,interviewTime:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mode</label>
                <select value={form.interviewMode} onChange={e=>setForm({...form,interviewMode:e.target.value})}>
                  <option value="online">Online (Video Call)</option>
                  <option value="offline">Offline (In-person)</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
              <div className="form-group"><label>Link / Venue</label><input placeholder="Zoom link or address" value={form.interviewLink} onChange={e=>setForm({...form,interviewLink:e.target.value})} /></div>
            </div>
          </>
        )}
        <div className="form-group"><label>Note to Candidate</label><input placeholder="Optional feedback..." value={form.hrNote} onChange={e=>setForm({...form,hrNote:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn btn-primary" style={{flex:1}} onClick={handleSave} disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
          <button className="btn btn-outline" style={{flex:1}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function HRDashboard() {
  const { user } = useAuth();
  const [tab, setTab]             = useState('home');
  const [myJobs, setMyJobs]       = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [applicants, setApplicants]   = useState([]);
  const [editApp, setEditApp]         = useState(null);
  const [postSuccess, setPostSuccess] = useState('');
  const [postError, setPostError]     = useState('');
  const [jobForm, setJobForm] = useState({ title:'', location:'', description:'', jobType:'Full-time', salary:'', experience:'', vacancies:1, skills:'', education:'' });

  const stats = {
    jobs:      myJobs.length,
    apps:      myJobs.reduce((s,j) => s + (j.appCount||0), 0),
    interview: applicants.filter(a=>a.status==='interview_scheduled').length,
    selected:  applicants.filter(a=>a.status==='selected').length,
  };

  const fetchMyJobs = useCallback(async () => {
    try {
      const r = await axios.get('/api/jobs/my');
      setMyJobs(r.data.jobs);
      if (r.data.jobs.length > 0 && !selectedJob) setSelectedJob(r.data.jobs[0]._id);
    } catch {}
  }, [selectedJob]);

  const fetchApplicants = useCallback(async () => {
    if (!selectedJob) return;
    try { const r = await axios.get(`/api/applications/job/${selectedJob}`); setApplicants(r.data.applications); }
    catch {}
  }, [selectedJob]);

  useEffect(() => { fetchMyJobs(); }, [fetchMyJobs]);
  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handlePostJob = async () => {
    setPostError(''); setPostSuccess('');
    if (!jobForm.title || !jobForm.location || !jobForm.description) { setPostError('Title, location and description are required'); return; }
    try {
      await axios.post('/api/jobs', {
        ...jobForm,
        skills: jobForm.skills ? jobForm.skills.split(',').map(s=>s.trim()).filter(Boolean) : [],
        vacancies: parseInt(jobForm.vacancies) || 1,
      });
      setPostSuccess('Job posted successfully! Candidates can now apply.');
      setJobForm({ title:'', location:'', description:'', jobType:'Full-time', salary:'', experience:'', vacancies:1, skills:'', education:'' });
      fetchMyJobs();
      setTimeout(() => setTab('home'), 1500);
    } catch (err) { setPostError(err.response?.data?.message || 'Failed to post job'); }
  };

  const initials = n => n ? n.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'U';

  return (
    <>
      <Navbar />
      <div className="page">
        {/* ── TAB NAV ── */}
        <div style={{display:'flex',gap:'6px',marginBottom:'24px',borderBottom:'1px solid #e2e8f0'}}>
          {[['home','🏠 Dashboard'],['postjob','➕ Post Job'],['applicants','👥 Applicants'],['profile','👤 Profile']].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',padding:'10px 16px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'14px',fontWeight:tab===t?'600':'400',color:tab===t?'#2563eb':'#475569',borderBottom:tab===t?'2px solid #2563eb':'2px solid transparent',marginBottom:'-1px',transition:'all .15s'}}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && (
          <>
            <div className="page-header">
              <h2 className="page-title">HR Dashboard</h2>
              <p className="page-sub">Manage your job postings and candidates</p>
            </div>
            <div className="stat-grid">
              <div className="stat-card sc-blue"><p className="stat-label">Jobs Posted</p><p className="stat-val">{stats.jobs}</p></div>
              <div className="stat-card sc-indigo"><p className="stat-label">Total Applicants</p><p className="stat-val">{stats.apps}</p></div>
              <div className="stat-card sc-amber"><p className="stat-label">Interviews</p><p className="stat-val">{stats.interview}</p></div>
              <div className="stat-card sc-green"><p className="stat-label">Selected</p><p className="stat-val">{stats.selected}</p></div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">My Job Postings</span>
                <button className="btn btn-sm btn-blue" onClick={()=>setTab('postjob')}>+ Post New Job</button>
              </div>
              {myJobs.length === 0
                ? <div className="empty"><div className="empty-icon">📝</div>No jobs posted yet. Post your first job opening!</div>
                : <div className="table-wrap"><table>
                    <thead><tr><th>Job Title</th><th>Location</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {myJobs.map(j => (
                        <tr key={j._id}>
                          <td style={{fontWeight:'500'}}>{j.title}</td>
                          <td style={{color:'#475569'}}>{j.location}</td>
                          <td>{j.jobType}</td>
                          <td><Pill s={j.status} /></td>
                          <td><button className="btn btn-sm btn-amber" onClick={()=>{ setSelectedJob(j._id); fetchApplicants(); setTab('applicants'); }}>View Applicants</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
              }
            </div>
          </>
        )}

        {/* ══ POST JOB TAB ══ */}
        {tab === 'postjob' && (
          <>
            <div className="page-header"><h2 className="page-title">Post a New Job</h2><p className="page-sub">Create a job opening for candidates to apply</p></div>
            <div className="card" style={{maxWidth:'640px'}}>
              {postError   && <div className="alert alert-error">{postError}</div>}
              {postSuccess  && <div className="alert alert-success">{postSuccess}</div>}
              <div className="form-row">
                <div className="form-group"><label>Job Title *</label><input placeholder="e.g. React Developer" value={jobForm.title} onChange={e=>setJobForm({...jobForm,title:e.target.value})} /></div>
                <div className="form-group"><label>Location *</label><input placeholder="e.g. Chennai, Remote" value={jobForm.location} onChange={e=>setJobForm({...jobForm,location:e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Job Description *</label><textarea rows="4" placeholder="Describe responsibilities and requirements..." value={jobForm.description} onChange={e=>setJobForm({...jobForm,description:e.target.value})} style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:'8px',fontFamily:'DM Sans,sans-serif',fontSize:'14px',outline:'none',resize:'vertical'}} /></div>
              <div className="form-row">
                <div className="form-group"><label>Job Type</label>
                  <select value={jobForm.jobType} onChange={e=>setJobForm({...jobForm,jobType:e.target.value})}>
                    {['Full-time','Part-time','Internship','Remote','Contract'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Salary / Stipend</label><input placeholder="e.g. 5–8 LPA" value={jobForm.salary} onChange={e=>setJobForm({...jobForm,salary:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Experience Required</label><input placeholder="e.g. 0–2 years, Fresher" value={jobForm.experience} onChange={e=>setJobForm({...jobForm,experience:e.target.value})} /></div>
                <div className="form-group"><label>Vacancies</label><input type="number" min="1" value={jobForm.vacancies} onChange={e=>setJobForm({...jobForm,vacancies:e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Required Skills <span style={{fontWeight:400,color:'#64748b'}}>(comma separated)</span></label><input placeholder="React, Node.js, MongoDB, SQL" value={jobForm.skills} onChange={e=>setJobForm({...jobForm,skills:e.target.value})} /></div>
              <div className="form-group"><label>Education Qualification</label><input placeholder="e.g. B.E / B.Tech, Any Graduate" value={jobForm.education} onChange={e=>setJobForm({...jobForm,education:e.target.value})} /></div>
              <button className="btn btn-primary btn-block" onClick={handlePostJob}>Publish Job Posting</button>
            </div>
          </>
        )}

        {/* ══ APPLICANTS TAB ══ */}
        {tab === 'applicants' && (
          <>
            <div className="page-header"><h2 className="page-title">Manage Applicants</h2><p className="page-sub">Review and update candidate status</p></div>
            <div className="card">
              <div className="form-group" style={{marginBottom:'16px'}}>
                <label>Select Job Posting</label>
                <select value={selectedJob} onChange={e=>{ setSelectedJob(e.target.value); }}>
                  {myJobs.map(j=><option key={j._id} value={j._id}>{j.title} — {j.location}</option>)}
                </select>
              </div>
              <button className="btn btn-sm btn-blue" style={{marginBottom:'16px'}} onClick={fetchApplicants}>Refresh</button>
              {applicants.length === 0
                ? <div className="empty"><div className="empty-icon">👥</div>No applicants for this job yet.</div>
                : <div className="table-wrap"><table>
                    <thead><tr><th>Candidate</th><th>Email</th><th>Skills</th><th>Applied On</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {applicants.map(a => (
                        <tr key={a._id}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                              <div className="avatar avatar-blue">{initials(a.applicant?.name)}</div>
                              <div><p style={{fontWeight:'500'}}>{a.applicant?.name}</p><p style={{fontSize:'12px',color:'#64748b'}}>{a.applicant?.experience||'N/A'}</p></div>
                            </div>
                          </td>
                          <td style={{color:'#475569'}}>{a.applicant?.email}</td>
                          <td>{a.applicant?.skills?.slice(0,3).map(s=><span key={s} className="skill-tag">{s}</span>)}</td>
                          <td style={{color:'#475569'}}>{new Date(a.appliedAt).toLocaleDateString()}</td>
                          <td><Pill s={a.status} /></td>
                          <td><button className="btn btn-sm btn-amber" onClick={()=>setEditApp(a)}>Update</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
              }
            </div>
          </>
        )}

        {/* ══ PROFILE TAB ══ */}
        {tab === 'profile' && (
          <>
            <div className="page-header"><h2 className="page-title">HR Profile</h2></div>
            <div className="card" style={{maxWidth:'520px'}}>
              <div className="profile-header">
                <div className="profile-avatar" style={{width:'64px',height:'64px',fontSize:'22px',background:'#fef3c7',color:'#b45309'}}>{initials(user.name)}</div>
                <div><h3 style={{fontSize:'18px'}}>{user.name}</h3><p style={{fontSize:'13px',color:'#475569',marginTop:'3px'}}>{user.email} · HR Manager · {user.department||'No Department'}</p></div>
              </div>
              <div className="profile-grid">
                {[['Phone',user.phone||'—'],['Department',user.department||'—'],['Jobs Posted',myJobs.length],['Company',user.company||'—']].map(([l,v])=>(
                  <div key={l} className="profile-field"><label>{l}</label><p>{v}</p></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {editApp && <StatusModal app={editApp} onClose={()=>setEditApp(null)} onSave={()=>{ setEditApp(null); fetchApplicants(); }} />}
    </>
  );
}
