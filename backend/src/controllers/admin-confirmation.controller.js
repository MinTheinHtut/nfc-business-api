import pool from '../config/database.js';
import { savedConnectionsToCsv } from '../utils/saved-connection-export.js';

const CONNECTION_SELECT = `SELECT
  cs.id AS connection_id,
  u.id AS exhibitor_id,
  u.username AS exhibitor_username,
  u.full_name AS exhibitor_name,
  u.email AS exhibitor_email,
  c.id AS company_id,
  c.company_code,
  c.company_name,
  c.industry,
  c.country,
  c.contact_name AS contact_person,
  c.email AS company_email,
  c.phone AS company_phone,
  c.website AS company_website,
  cs.saved_at AS connected_at,
  DATE_FORMAT(cs.saved_at, '%Y-%m-%d %H:%i:%s') AS connected_at_export
FROM company_saves cs
JOIN users u ON u.id = cs.user_id
JOIN companies c ON c.id = cs.company_id`;

function connectionQuery(search=''){const term=typeof search==='string'?search.trim():'';const where=term?` WHERE CONCAT_WS(' ',u.full_name,u.username,u.email,c.company_name,c.company_code,c.industry,c.country) LIKE ?`:'';return{sql:`${CONNECTION_SELECT}${where} ORDER BY cs.saved_at DESC, cs.id DESC`,values:term?[`%${term}%`]:[]}}
export async function listConfirmations(request,response,next){try{const query=connectionQuery();const[connections]=await pool.execute(query.sql,query.values);response.json({connections,confirmations:connections})}catch(error){next(error)}}
export async function exportConfirmationsCsv(request,response,next){try{const query=connectionQuery(request.query.search);const[connections]=await pool.execute(query.sql,query.values);response.setHeader('Content-Type','text/csv; charset=utf-8');response.setHeader('Content-Disposition','attachment; filename="nfc-event-connections.csv"');response.send(savedConnectionsToCsv(connections))}catch(error){next(error)}}
