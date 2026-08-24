import bcrypt from 'bcrypt';
import pool from '../config/database.js';

function parseId(value) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function fields(body, creating = false) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() || null : null;
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = {};
  if (!username) errors.username = 'Username is required';
  if (!fullName) errors.full_name = 'Full name is required';
  if (creating && password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!creating && password && password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  return { username, fullName, email, password, errors };
}
export async function listExhibitors(req, res, next) { try { const [exhibitors] = await pool.query("SELECT u.id, u.username, u.full_name, u.email, u.is_active, u.created_at, COUNT(cs.id) AS confirmations FROM users u LEFT JOIN company_saves cs ON cs.user_id=u.id WHERE u.role='exhibitor' GROUP BY u.id,u.username,u.full_name,u.email,u.is_active,u.created_at ORDER BY u.username"); res.json({ exhibitors }); } catch (e) { next(e); } }
export async function getExhibitor(req, res, next) { const id=parseId(req.params.id); if(!id)return res.status(400).json({message:'Invalid exhibitor ID'}); try { const [[exhibitor]]=await pool.execute("SELECT id, username, full_name, email, is_active FROM users WHERE id=? AND role='exhibitor'",[id]); if(!exhibitor)return res.status(404).json({message:'Exhibitor not found'}); res.json({exhibitor}); } catch(e){next(e);} }
export async function createExhibitor(req,res,next) { const data=fields(req.body,true); if(Object.keys(data.errors).length)return res.status(400).json({message:'Please correct the highlighted fields',errors:data.errors}); try { const hash=await bcrypt.hash(data.password,12); const [result]=await pool.execute("INSERT INTO users (username,password_hash,full_name,email,role,is_active) VALUES (?,?,?,?,'exhibitor',TRUE)",[data.username,hash,data.fullName,data.email]); res.status(201).json({id:result.insertId,message:'Exhibitor created successfully'}); } catch(e){ if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Username or email already exists'}); next(e); } }
export async function updateExhibitor(req,res,next) { const id=parseId(req.params.id); if(!id)return res.status(400).json({message:'Invalid exhibitor ID'}); const data=fields(req.body,false); if(Object.keys(data.errors).length)return res.status(400).json({message:'Please correct the highlighted fields',errors:data.errors}); try { const values=[data.username,data.fullName,data.email,req.body.is_active===false||req.body.is_active===0?0:1]; let sql="UPDATE users SET username=?, full_name=?, email=?, is_active=?"; if(data.password){sql+=', password_hash=?';values.push(await bcrypt.hash(data.password,12));} sql+=" WHERE id=? AND role='exhibitor'";values.push(id); const [result]=await pool.execute(sql,values); if(!result.affectedRows)return res.status(404).json({message:'Exhibitor not found'}); res.json({message:'Exhibitor updated successfully'}); } catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Username or email already exists'});next(e);} }
