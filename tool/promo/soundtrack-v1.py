"""Original synthesized promo bed. No samples, third-party music or voice."""
import numpy as np, wave
from pathlib import Path
sr=48000; duration=22; rng=np.random.default_rng(314); a=np.zeros((sr*duration,2),dtype=np.float64)
def put(start,sound,gain=1,pan=0):
 i=int(start*sr); sound=sound[:len(a)-i];a[i:i+len(sound),0]+=sound*gain*(1-pan*.4);a[i:i+len(sound),1]+=sound*gain*(1+pan*.4)
def note(freq,length):
 t=np.arange(int(length*sr))/sr
 return (np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2*t))*np.minimum(t/.015,1)*np.exp(-t*4)
beat=60/110
chords=[[146.83,220,293.66,349.23],[130.81,196,261.63,329.63],[174.61,261.63,349.23,440],[164.81,246.94,329.63,392]]
for b in range(40):
 at=b*beat
 if at>=21:break
 t=np.arange(int(.32*sr))/sr;put(at,np.sin(2*np.pi*(49*t+6*(1-np.exp(-t*35))))*np.exp(-t*15),.19)
 if b%2==1:
  t=np.arange(int(.14*sr))/sr;noise=rng.normal(0,1,len(t));put(at,noise*np.exp(-t*42),.026)
 for off in [0,.5]:
  t=np.arange(int(.05*sr))/sr;n=rng.normal(0,1,len(t));n=np.diff(n,prepend=0);put(at+off*beat,n*np.exp(-t*100),.008,(-1)**b*.5)
 chord=chords[(b//8)%4];put(at,note(chord[0]/2,.5),.11)
 for j in range(2):put(at+j*beat/2,note(chord[(b+j)%4]*2,.8),.034,(-1)**j*.65)
for at in [3,7,11,15,18]:
 t=np.arange(int(.3*sr))/sr;n=rng.normal(0,1,len(t));n=np.cumsum(n);n=n/(np.max(np.abs(n))+1e-6);put(at-.15,n*np.sin(np.pi*t/.3)**2,.07)
for i,f in enumerate([880,1108.73,1318.51]):put(12.3+i*.055,note(f,.6),.045,i/2-.5)
t=np.arange(len(a))/sr;fade=np.minimum(t/.5,1)*np.minimum((duration-t)/1.8,1);a*=fade[:,None]
a=np.tanh(a*1.6)*.72
with wave.open(str(Path(__file__).parent/'soundtrack.wav'),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((a*32767).astype('<i2').tobytes())
print('Original 22-second stereo synth bed generated.')
