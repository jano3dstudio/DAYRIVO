"""Package standalone DAYRIVO, its optional host manifest, and build sources."""
from pathlib import Path
import argparse, hashlib, json, zipfile

root=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--output',default=str(root/'tool/release/desktop/DAYRIVO-Windows-x64.zip'))
args=parser.parse_args()
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
exe=root/'DAYRIVO.exe';sidecar=root/'DAYRIVO.exe.workspace.json'
assert json.loads(sidecar.read_text(encoding='utf-8-sig'))['sha256']==digest(exe)
files={}
def add(p):
 if p.is_file():files['DAYRIVO/'+p.relative_to(root).as_posix()]=p
for name in ['DAYRIVO.exe','DAYRIVO.exe.workspace.json','index.html','README.md','AGENTS.md','PROJECT_MAP.json','DEVELOPMENT.md']:
 add(root/name)
for folder in ['tool/js','tool/css','tool/locales','tool/assets','tool/desktop']:
 for p in (root/folder).rglob('*'):
  if not any(x in {'.build','output','__pycache__','node_modules'} for x in p.relative_to(root/folder).parts):add(p)
for name in ['bridge.cjs','client.cjs','billing.cjs']:add(root/'tool/clockodo'/name)
for name in ['AGENTS.md','README.md','app-kit.plan.json']:add(root/'tool'/name)
manifest={name:digest(path) for name,path in files.items()}
out=Path(args.output).resolve();out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,path in files.items():z.write(path,name)
 z.writestr('manifest.json',json.dumps(manifest,indent=2))
 z.writestr('START.txt','Start DAYRIVO/DAYRIVO.exe. Second Brain is optional. Keep the workspace JSON next to the EXE to use integration. Build from DAYRIVO: powershell -File tool/desktop/build.ps1 -OutputPath DAYRIVO.exe. Windows x64 and WebView2 Runtime required. No personal profile or Clockodo local-settings included.\n')
with zipfile.ZipFile(out) as z:
 for name,h in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==h,name
 assert not any('local-settings' in n or '/profile/' in n for n in z.namelist())
print('Verified',len(files),'files:',out)
