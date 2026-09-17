"""DAYRIVO promo score v2: original 120 BPM electronic groove.

No samples, voice, licensed recordings or network dependencies.
Deterministic synthesis with NumPy. Scene changes: 3 / 7 / 11 / 15 / 18 s.
The completion sound lands on the actual click at 12.25 s.
"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
DURATION = 22
N = SR * DURATION
rng = np.random.default_rng(91726)
drums = np.zeros((N, 2))
music = np.zeros((N, 2))
effects = np.zeros((N, 2))
kick_times = []

def clock(seconds):
    return np.arange(round(seconds * SR)) / SR

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def put(track, at, sound, gain=1, pan=0):
    start = round(at * SR)
    if start < 0:
        sound = sound[-start:]
        start = 0
    count = min(len(sound), N - start)
    if count <= 0:
        return
    sound = sound[:count]
    if sound.ndim == 1:
        sound = np.column_stack((sound * np.sqrt((1-pan)/2), sound * np.sqrt((1+pan)/2)))
    track[start:start+count] += sound * gain

def noise(length, low=0, high=22000):
    t = clock(length)
    x = rng.normal(size=len(t))
    spectrum = np.fft.rfft(x)
    freq = np.fft.rfftfreq(len(x), 1/SR)
    band = (1 / (1 + (np.maximum(freq, 1) / high)**6))
    if low:
        band *= 1 / (1 + (low / np.maximum(freq, 1))**6)
    x = np.fft.irfft(spectrum * band, n=len(t))
    return x / (np.sqrt(np.mean(x*x)) + 1e-9)

def kick(at, gain=1):
    t = clock(.46)
    phase = 2*np.pi*(48*t + 1.75*(1-np.exp(-t*52)))
    body = np.sin(phase)*np.exp(-t*11)
    attack = noise(.46, 1500, 6000)*np.exp(-t*650)*.17
    sound = np.tanh((body+attack)*1.5)*np.minimum(t/.001,1)
    put(drums, at, sound, .70*gain)
    kick_times.append(at)

def clap(at, gain=1):
    t = clock(.22)
    envelope = sum(np.exp(-np.maximum(t-d,0)*190)*(t>=d) for d in [0,.012,.027])
    envelope += .5*np.exp(-t*25)
    x = noise(.22, 900, 8200)*envelope*.12
    x += np.sin(2*np.pi*185*t)*np.exp(-t*40)*.12
    put(drums, at, x, gain)
    put(drums, at+.057, x, .11*gain, -.5)
    put(drums, at+.103, x, .08*gain, .6)

def hat(at, opened=False, gain=1, pan=0):
    length=.23 if opened else .08
    t=clock(length)
    x=noise(length, 6500, 17000)*np.exp(-t*(21 if opened else 110))
    x*=np.minimum(t/.0008,1)
    put(drums,at,x,.052*gain,pan)

def bass(at, midi, length, gain=1):
    t=clock(length+.09)
    f=hz(midi)
    x=np.sin(2*np.pi*f*t)*.8
    for k in range(2,9):
        x+=np.sin(2*np.pi*f*k*t+.08*k)*(.34/k)*np.exp(-t*k*2.5)
    env=np.minimum(t/.008,1)*np.exp(-t*2)*np.clip((length+.08-t)/.08,0,1)
    put(music,at,np.tanh(x*1.7)*env,.27*gain)

def chord(at, notes, length, gain=1):
    t=clock(length+.4)
    sides=[]
    for side in [-1,1]:
        x=np.zeros(len(t))
        for j,midi in enumerate(notes):
            f=hz(midi)*(1+side*.0018)
            for harmonic in range(1,9):
                x+=np.sin(2*np.pi*f*harmonic*t+j*.37)*np.exp(-harmonic*(.27+t*.22))/harmonic
        env=np.minimum(t/.025,1)*np.exp(-t*.6)*np.clip((length+.4-t)/.4,0,1)
        sides.append(x*env/len(notes))
    sound=np.column_stack(sides)
    put(music,at,sound,.48*gain)
    put(music,at+.375,sound,.17*gain)
    put(music,at+.75,sound[:,::-1],.08*gain)

def pluck(at,midi,gain=.12,pan=0):
    t=clock(.9)
    f=hz(midi)
    x=(np.sin(2*np.pi*f*t+.9*np.sin(2*np.pi*f*2*t)*np.exp(-t*14))+.18*np.sin(2*np.pi*f*3*t)*np.exp(-t*12))
    env=np.minimum(t/.007,1)*np.exp(-t*5)
    put(music,at,x*env,gain,pan)
    put(music,at+.375,x*env,gain*.25,-pan)

voicings=[[62,65,69,72,76],[58,62,65,69,72],[60,64,65,69,72],[60,64,67,70,74]]
roots=[38,34,41,36]

# Warm opening, with rhythm arriving before the first UI reveal.
chord(0,voicings[0],2.55,.65)
bass(.5,38,.6,.6)
pluck(.5,74,.10,-.4)
pluck(1.25,76,.08,.45)
for at in [1.5,2,2.5]:
    kick(at,.38)
    hat(at+.25,gain=.55,pan=.35)

# Main groove: a two-bar bass figure, syncopated chord stabs and real rests.
for bar in range(8):
    at=3+bar*2
    if at>=18:
        break
    harmony=(bar//2)%4
    if at==11:
        chord(at,voicings[harmony],1.5,.8)
        bass(at,roots[harmony],.7,.6)
        continue
    for beat in range(4):
        pos=at+beat*.5
        if pos>=18:
            continue
        kick(pos,.95 if beat==0 else .85)
        if beat%2:
            clap(pos,.85)
        hat(pos,gain=.6,pan=-.32)
        hat(pos+.25,opened=beat%2==0,gain=.9,pan=.38)
        if beat==3:
            hat(pos+.385,gain=.35,pan=-.55)
    for off,shift,length,level in [(0,0,.3,.85),(.375,0,.2,.85),(.75,12,.16,.55),(1,0,.3,1),(1.375,7,.18,.7),(1.75,0,.2,.9)]:
        if at+off<18:
            bass(at+off,roots[harmony]+shift,length,level)
    for off in [.25,1.25,1.75]:
        if at+off<18:
            chord(at+off,voicings[harmony],.24,.66 if off<1.7 else .42)

# Sparse motif; no continuous ringtone arpeggio.
for at,midi,pan in [(4.25,77,-.3),(5,76,.4),(6.25,72,-.2),(8.25,74,.4),(9.25,72,-.4),(10.25,69,.2),(14.25,77,-.4),(15.25,76,.4),(16.5,74,-.3),(17.25,72,.3)]:
    pluck(at,midi,.11,pan)

# Build into the completion, then a precise dry click + soft confirmation chord.
for i in range(6):
    hat(11.5+i*.125,gain=.25+i*.065,pan=(-1)**i*.5)
t=clock(.035)
put(effects,12.25,noise(.035,1800,11000)*np.exp(-t*210),.15)
for delay,midi in [(0,74),(.04,77),(.08,81)]:
    t=clock(.65)
    bell=np.sin(2*np.pi*hz(midi)*t)*np.exp(-t*8)*np.minimum(t/.003,1)
    put(effects,12.25+delay,bell,.105,(delay/.08-.5)*.6)
kick(12.5,.9)
clap(12.5,.7)
bass(12.5,41,.36)

# Soft stereo lifts lead into the visual cuts, not across the click.
for at in [3,7,15,18]:
    length=.55
    t=clock(length)
    lift=noise(length,1400,8500)*(t/length)**2*.055
    put(effects,at-length,lift,1,-.3)
    put(effects,at-length+.016,lift,.7,.4)
    t=clock(.42)
    put(effects,at,noise(.42,5500,15000)*np.exp(-t*10),.065,.2)

# Logo lands on a low impact with a resolved D minor 9 chord and a clean tail.
kick(18,1.15)
bass(18,38,1.7,.85)
chord(18,[50,57,62,65,69,76],2.8,1.2)
pluck(18.25,81,.09,.3)
for at in [18.5,19,19.5]:
    hat(at+.25,gain=.4,pan=.2)
kick(19,.5)
clap(19.5,.38)

# Musical sidechain recovery makes space for the kick, preserving transients.
duck=np.ones(N)
for at in kick_times:
    i=round(at*SR)
    t=clock(.32)
    count=min(len(t),N-i)
    duck[i:i+count]*=1-.60*np.exp(-t[:count]*13)
music*=duck[:,None]
mix=drums+music+effects
mix-=mix.mean(axis=0)
mix=np.tanh(mix*1.15)
t=np.arange(N)/SR
mix*=np.minimum(t/.025,1)[:,None]
mix*=np.clip((22-t)/1.15,0,1)[:,None]
mix*=.92/max(np.max(np.abs(mix)),.92)
out=Path(__file__).parent/'soundtrack.wav'
with wave.open(str(out),'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix*32767).astype('<i2').tobytes())
print(f'Wrote {out.name}: 22 s, 120 BPM, stereo. Peak {20*np.log10(np.max(np.abs(mix))):.2f} dBFS.')
