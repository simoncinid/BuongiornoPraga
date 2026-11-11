"""Daily encrypted PostgreSQL backup -> private DigitalOcean Spaces bucket.
Requires: pg_dump (same/newer major than server), age, AWS CLI.
No password in arguments, output or files; age private key stays offline.
"""
import datetime, os, pathlib, subprocess, tempfile, urllib.parse
required=['DATABASE_URL','AGE_RECIPIENT','BACKUP_BUCKET','SPACES_ENDPOINT','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY']
for key in required:
    if not os.getenv(key): raise SystemExit(f'Missing configuration: {key}')
u=urllib.parse.urlsplit(os.environ['DATABASE_URL'])
env=os.environ.copy()
env.update(PGHOST=u.hostname or '',PGPORT=str(u.port or 5432),PGDATABASE=u.path.lstrip('/'),PGUSER=urllib.parse.unquote(u.username or ''),PGPASSWORD=urllib.parse.unquote(u.password or ''),PGSSLMODE='require')
if u.hostname in ('localhost','127.0.0.1'): env['PGSSLMODE']='prefer'
with tempfile.TemporaryDirectory(prefix='ftp-backup-') as temp:
    os.chmod(temp,0o700)
    dump=pathlib.Path(temp)/'database.dump'; encrypted=pathlib.Path(temp)/'database.dump.age'
    subprocess.run(['pg_dump','--format=custom','--no-owner','--no-acl','--file',str(dump)],env=env,check=True)
    if dump.stat().st_size<100: raise SystemExit('Empty backup')
    subprocess.run(['age','-r',os.environ['AGE_RECIPIENT'],'-o',str(encrypted),str(dump)],check=True)
    stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y/%m/%d/%H%M%S')
    key=f'freetourpraga/{stamp}.dump.age'
    subprocess.run(['aws','s3','cp',str(encrypted),f's3://{os.environ["BACKUP_BUCKET"]}/{key}','--endpoint-url',os.environ['SPACES_ENDPOINT'],'--only-show-errors','--acl','private'],check=True)
    print(f'Encrypted backup uploaded: {key}')
