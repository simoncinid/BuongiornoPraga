// Configuration-only checks. Never sends messages, payments or requests to providers.
import {scryptSync,timingSafeEqual} from 'node:crypto';
try{process.loadEnvFile('.env.production.local');}catch(e){if(e.code!=='ENOENT')throw e;}
const env=process.env, checks=[];
const add=(name,pass)=>checks.push({name,pass:!!pass});
const present=(name)=>typeof env[name]==='string'&&env[name].trim().length>0;
const min=(name,n=32)=>present(name)&&env[name].length>=n&&!/change.me|placeholder|your.secret/i.test(env[name]);
const parse=(name)=>{try{return new URL(env[name]);}catch{return null;}};
const origin=parse('NEXT_PUBLIC_SITE_URL');add('Dominio HTTPS definitivo',origin?.protocol==='https:'&&!/localhost|\.example$|YOUR.DOMAIN/i.test(origin.hostname));
const db=parse('DATABASE_URL');add('PostgreSQL con TLS configurato',db&&['postgresql:','postgres:'].includes(db.protocol)&&!!db.username&&!!db.hostname&&['require','verify-ca','verify-full'].includes(db.searchParams.get('sslmode'))&&!/^(HOST|localhost|127\.0\.0\.1)$/i.test(db.hostname));
add('Storage produzione PostgreSQL',env.PLATFORM_STORAGE==='postgres');add('SESSION_SECRET robusto',min('SESSION_SECRET'));add('CRON_SECRET robusto',min('CRON_SECRET'));add('Chiave link prenotazioni',!present('BOOKING_LINK_SECRET')||min('BOOKING_LINK_SECRET'));
let users=[];try{users=JSON.parse(env.STAFF_USERS||'[]');}catch{}
const validUsers=Array.isArray(users)&&users.some(u=>u.role==='admin')&&users.every(u=>{
 if(!['admin','operator'].includes(u.role)||!/^.+@.+\..+$/.test(u.email)||/\.local$|@example\./.test(u.email)||!/^([a-f0-9]{32}):([a-f0-9]{128})$/.test(u.passwordHash||''))return false;
 const [salt,key]=u.passwordHash.split(':');return !timingSafeEqual(scryptSync('PragaLocale!2026',salt,64),Buffer.from(key,'hex'));
});add('Utenti reali e password diverse dallo sviluppo',validUsers);
add('Stripe secret key',/^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY||''));add('Stripe webhook signing secret',/^whsec_.{10,}$/.test(env.STRIPE_WEBHOOK_SECRET||''));
add('SMTP e mittente configurati',present('SMTP_HOST')&&present('SMTP_FROM')&&present('ADMIN_EMAIL'));
add('Twilio Account SID',/^AC[a-f0-9]{32}$/i.test(env.TWILIO_ACCOUNT_SID||''));add('Twilio auth token',min('TWILIO_AUTH_TOKEN'));add('Template WhatsApp',/^HX[a-f0-9]{32}$/i.test(env.TWILIO_CONTENT_SID||''));add('Mittente WhatsApp',/^\+[1-9]\d{6,14}$/.test(env.TWILIO_WHATSAPP_FROM||''));
add('Casella OTA e mittenti autorizzati',['IMAP_HOST','IMAP_USER','IMAP_PASSWORD','OTA_ALLOWED_SENDERS'].every(present));
add('Worker collegato al dominio',parse('PLATFORM_URL')?.origin===origin?.origin&&!!origin);add('Bucket immagini e credenziali dedicate',['MEDIA_BUCKET','MEDIA_PUBLIC_BASE','MEDIA_ACCESS_KEY_ID','MEDIA_SECRET_ACCESS_KEY','SPACES_ENDPOINT'].every(present));
add('Backup cifrato e bucket privato',['AGE_RECIPIENT','BACKUP_BUCKET','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','SPACES_ENDPOINT'].every(present));
for(const c of checks)console.log(`${c.pass?'OK':'DA CONFIGURARE'}: ${c.name}`);
console.log('Google Ads ID e conversion label vanno impostati nel gestionale; non sono verificati da questo controllo.');
console.log('Questo controllo non certifica funzionamento dei provider, backup/restore, QA visiva o conformità completa al contratto.');
if(checks.some(c=>!c.pass))process.exitCode=1;
