import { useEffect, useState } from 'react';
import { getAdminExhibitors, saveAdminExhibitor } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../AuthContext.jsx';

const empty = { id: null, username: '', full_name: '', email: '', password: '', is_active: true };
export default function AdminExhibitorsPage() {
  const { csrfToken } = useAuth();
  const [items,setItems]=useState([]); const [form,setForm]=useState(empty); const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [saving,setSaving]=useState(false);
  async function load(){try{const data=await getAdminExhibitors();setItems(data.exhibitors);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  function change(e){const {name,value,type,checked}=e.target;setForm(x=>({...x,[name]:type==='checkbox'?checked:value}));}
  async function submit(e){e.preventDefault();setSaving(true);setError('');setMessage('');try{await saveAdminExhibitor(form,csrfToken);setMessage(form.id?'Exhibitor updated.':'Exhibitor created.');setForm(empty);await load();}catch(x){setError(x.message);}finally{setSaving(false);}}
  function edit(x){setForm({...empty,...x,is_active:Boolean(x.is_active)});window.scrollTo({top:0,behavior:'smooth'});}
  async function toggle(x){setError('');try{await saveAdminExhibitor({id:x.id,username:x.username,full_name:x.full_name,email:x.email,password:'',is_active:!x.is_active},csrfToken);await load();}catch(e){setError(e.message);}}
  return <div className="admin-page"><AdminHeader/><main className="admin-content"><div className="page-heading"><div><span className="eyebrow">Organizer</span><h1>Exhibitors</h1></div></div>
    <form className="company-form panel management-form" onSubmit={submit}><h2 className="form-wide">{form.id?'Edit exhibitor':'Create exhibitor'}</h2>{error&&<div className="error-message form-wide">{error}</div>}{message&&<div className="success-message form-wide">{message}</div>}
      <div className="form-field"><label htmlFor="username">Username *</label><input id="username" name="username" value={form.username} onChange={change} required/></div>
      <div className="form-field"><label htmlFor="full_name">Full Name *</label><input id="full_name" name="full_name" value={form.full_name} onChange={change} required/></div>
      <div className="form-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" value={form.email||''} onChange={change}/></div>
      <div className="form-field"><label htmlFor="password">{form.id?'Set New Password':'Password *'}</label><input id="password" name="password" type="password" value={form.password} onChange={change} required={!form.id} minLength="8" autoComplete="new-password"/></div>
      {form.id&&<label className="checkbox form-wide"><input name="is_active" type="checkbox" checked={form.is_active} onChange={change}/> Exhibitor is active</label>}
      <div className="form-actions form-wide">{form.id&&<button className="secondary-button" type="button" onClick={()=>setForm(empty)}>Cancel edit</button>}<button className="primary-button compact" disabled={saving}>{saving?'Saving…':'Save exhibitor'}</button></div>
    </form>
    <div className="table-panel management-table"><table><thead><tr><th>Username</th><th>Full Name</th><th>Status</th><th>Connections</th><th>Actions</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.username}</td><td>{x.full_name}</td><td><span className={`badge ${x.is_active?'active':'inactive'}`}>{x.is_active?'Active':'Inactive'}</span></td><td>{x.confirmations}</td><td><div className="action-row"><button className="link-button" onClick={()=>edit(x)}>Edit</button><button className={`link-button ${x.is_active?'danger':''}`} onClick={()=>toggle(x)}>{x.is_active?'Deactivate':'Activate'}</button></div></td></tr>)}</tbody></table></div>
  </main></div>;
}
