class AudioVisualShader {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.gl = this.canvas.getContext("webgl2");
    this.audio = document.getElementById("audio");
    this.playButton = document.getElementById("playButton");
    this.loading = document.getElementById("loading");
    this.container = document.getElementById("container");

    this.isPlaying = false;
    this.startTime = 0;
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    this.audioData = new Uint8Array(256);
    this.audioTexture = null;
    this.overallAudioEnergy = 0;

    this.program = null;
    this.vertexBuffer = null;
    this.uniforms = {};

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupShader();
    this.addAudioLoadListeners();
    this.setupEvents();
    this.render();
  }

  setupCanvas() {
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  setupShader() {
    const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

    const fragmentShaderSource = `#version 300 es
            precision highp float;
            
            uniform vec2 iResolution;
            uniform float iTime;
            uniform sampler2D iChannel1;
            uniform float iOverallAudioEnergy;
            
            out vec4 fragColor;
            
            const float PI         = 3.14159265;
            const float TWO_PI     = 6.2831853;
            const float beatPeriod = 0.25;
            
            vec3 H(float a) {
                return cos(radians(vec3(180.0, 90.0, 0.0)) + a * TWO_PI) * 0.5 + 0.5;
            }
            
            mat2 rot2d(float a) {
                float s = sin(a), c = cos(a);
                return mat2(c, -s, s, c);
            }
            
            float map(vec3 pos, float scale, float amplitude, float t) {
                float layers = 5.0;
                float dist   = 1e10;
                float y, z;
                
                pos.xy = vec2(atan(pos.x, pos.y), length(pos.xy));
                pos.x += t * scale * PI * 0.7;
                
                for (float i = 0.0; i < layers; i++) {
                    vec3 p = pos;
                    y = round((p.y - i) / layers) * layers + i;
                    p.x *= y;
                    p.x -= y * y * t * PI;
                    p.x -= round(p.x / TWO_PI) * TWO_PI;
                    p.y -= y;
                    z = cos(y * t * TWO_PI) * 0.5 + 0.5;
                    float dTemp = max(length(p.xy), -p.z - z * amplitude)
                                  - 0.1 - z * 0.2 - p.z * 0.01;
                    dist = min(dist, dTemp);
                }
                return dist;
            }
            
            vec2 getPresetParams(int preset, float iTime, float effectiveAudioAmp, float tParam) {
                float amplitude;
                float hue;
                if (preset == 0) {
                    amplitude = mix(8.0, 20.0, effectiveAudioAmp);
                } else if (preset == 1) {
                    amplitude = 18.0 + step(0.6, effectiveAudioAmp) * 6.0;
                } else if (preset == 2) {
                    amplitude = 9.0 + effectiveAudioAmp * 4.0;
                } else if (preset == 3) {
                    amplitude = 15.0 + step(0.6, effectiveAudioAmp) * 10.0;
                } else {
                    amplitude = 11.0 + sin(iTime * 2.0) * 2.0;
                }

                if (preset == 0) {
                    hue = sin(iTime * 0.1) * 0.1 + effectiveAudioAmp * 0.1;
                } else if (preset == 1) {
                    hue = mod(iTime * 3.0, 1.0) + effectiveAudioAmp * 0.2;
                } else if (preset == 2) {
                    hue = 0.3 + sin(iTime * 0.15) * 0.1 + effectiveAudioAmp * 0.15;
                } else if (preset == 3) {
                    hue = effectiveAudioAmp * 0.5 + tParam * 2.0;
                } else {
                    hue = tParam + effectiveAudioAmp * 2.5;
                }
                return vec2(amplitude, hue);
            }
            
            void main() {
                vec2 fragCoord = gl_FragCoord.xy;
                vec2 resolution = iResolution.xy;
                vec3 color = vec3(0.0);
                
                float audioAmp = iOverallAudioEnergy; 
                
                float beat = step(0.5, audioAmp);
                
                float currentBeatPhase = mod(iTime, beatPeriod);
                float trans = (audioAmp < 0.5) ? 1.0 : smoothstep(0.0, 0.1, currentBeatPhase);
                
                float syncAmp = clamp(audioAmp * 2.0, 0.0, 1.0);
                
                int currPreset = int(mod(floor(iTime / beatPeriod), 5.0));
                int nextPreset = (currPreset + 1) % 5;
                float tParam = iTime / 300.0;
                vec2 currParams = getPresetParams(currPreset, iTime, audioAmp, tParam);
                vec2 nextParams = getPresetParams(nextPreset, iTime, audioAmp, tParam);
                float amplitude = mix(currParams.x, nextParams.x, trans);
                float hueShift  = mix(currParams.y, nextParams.y, trans);
                
                vec3 camShake = vec3(sin(iTime * 3.0), cos(iTime * 3.0), 0.0) * syncAmp * 10.0;

                float rotationAngle = iTime * 0.2 + syncAmp * PI * 0.3; 
                vec3 camPos = vec3(0.0, 0.0, -130.0) + camShake;
                camPos.xy = rot2d(rotationAngle) * camPos.xy;
                
                float scaleFactor = 130.0 / 3.0;
                vec3 rayDir = normalize(vec3(fragCoord - resolution * 0.5, resolution.y));
                rayDir.xy = rot2d(rotationAngle) * rayDir.xy;
                
                float d = 0.0, s, distVal;
                for (int i = 0; i < 70; i++) {
                    vec3 pos = rayDir * d + camPos;
                    pos.xy /= scaleFactor;
                    float radial = length(pos.xy);
                    distVal = abs(1.0 - radial * radial);
                    if (radial < 1.0)
                        distVal = sqrt(distVal);
                    pos.xy /= (distVal + 1.0);
                    pos.xy *= scaleFactor;

                    pos.xy += sin(pos.xy * 0.1 + iTime * 10.0) * syncAmp * 1.2;
                    
                    s = map(pos, scaleFactor, amplitude, tParam);
                    float f = cos(round(length(pos.xy)) * tParam * TWO_PI) * 0.5 + 0.5;
                    vec3 colContribution = H(hueShift + tParam + pos.z / 200.0 + f);
                    
                    color += min(exp(s / -0.05), s) * (f + 0.01)
                             * min(distVal, 1.0) * sqrt(cos(length(pos.xy) * TWO_PI) * 0.5 + 0.5)
                             * colContribution * colContribution;
                             
                    if (s < 1e-3 || d > 1e3)
                        break;
                    d += s * clamp(distVal, 0.3, 0.9);
                }
                
                vec2 uv = (fragCoord - resolution * 0.5) / resolution.y;
                float radialUV = length(uv);
                
                float flash = smoothstep(0.3, 0.0, radialUV) * beat * step(0.0, currentBeatPhase)
                              * syncAmp * 0.7;
                color += vec3(flash);
                
                float godRay = smoothstep(0.5, 0.0, radialUV) * syncAmp;
                color += vec3(0.1, 0.1, 0.15) * godRay;
                
                float shockWave = smoothstep(0.45, 0.40, radialUV - sin(iTime * 0.15) * 0.02);
                color += vec3(0.2, 0.1, 0.3) * shockWave * pow(syncAmp, 2.0);
                
                float explosionTime = currentBeatPhase;
                float strongBeatThreshold = 0.6;
                if (audioAmp > strongBeatThreshold && explosionTime < 0.1) {
                    float particleEffect = 0.0;
                    for (int i = 0; i < 8; i++) {
                        float fi = float(i);
                        vec2 rnd = vec2(
                            fract(sin(fi * 12.9898 + 78.233) * 43758.5453),
                            fract(sin(fi * 93.9898 + 67.345) * 12345.6789)
                        );
                        vec2 posParticle = (rnd * 2.0 - 1.0) * (explosionTime * 5.0);
                        float dParticle = length(uv - posParticle);
                        float intensity = smoothstep(0.5, 0.0, dParticle)
                                          * smoothstep(0.0, 0.1, explosionTime)
                                          * syncAmp;
                        particleEffect += intensity;
                    }
                    color += vec3(1.0, 0.8, 0.5) * particleEffect;
                }
                
                vec3 colorAberration = vec3(
                    color.r * (1.0 + syncAmp * 0.2),
                    color.g,
                    color.b * (1.0 - syncAmp * 0.2)
                );
                color = mix(color, colorAberration, 0.5);
                
                float brightness = dot(color, vec3(0.33));
                vec3 grey = vec3(brightness);
                float saturationFactor = mix(1.0, 1.3, syncAmp);
                color = mix(grey, color, saturationFactor);
                
                float vignette = smoothstep(1.0, 0.3, radialUV);
                color *= mix(vignette, vignette * 0.8, syncAmp);
                
                fragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
            }
        `;

    const vertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(
        "Erreur de liaison du programme:",
        this.gl.getProgramInfoLog(this.program)
      );
      return;
    }

    const positionAttribute = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    this.uniforms.iResolution = this.gl.getUniformLocation(
      this.program,
      "iResolution"
    );
    this.uniforms.iTime = this.gl.getUniformLocation(this.program, "iTime");
    this.uniforms.iChannel1 = this.gl.getUniformLocation(
      this.program,
      "iChannel1"
    );
    this.uniforms.iOverallAudioEnergy = this.gl.getUniformLocation(
      this.program,
      "iOverallAudioEnergy"
    );

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(positionAttribute);
    this.gl.vertexAttribPointer(
      positionAttribute,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.audioTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        "Erreur de compilation du shader:",
        this.gl.getShaderInfoLog(shader)
      );
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  addAudioLoadListeners() {
    this.audio.addEventListener("canplaythrough", () => {
      this.loading.classList.add("hidden");
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Erreur de chargement audio:", e);
      this.loading.textContent = "Erreur de chargement audio";
    });
  }

  setupEvents() {
    this.playButton.addEventListener("click", async () => {
      if (!this.isPlaying) {
        this.startExperience();
      } else {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (e) {
            console.warn("Failed to exit fullscreen on button click:", e);
          }
        }
        this.stopAudioAndShaderState();
      }
    });

    this.audio.addEventListener("ended", () => {
      this.stopAudioAndShaderState();
    });

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        if (this.isPlaying) {
          this.stopAudioAndShaderState();
        }
      }
    });

    this.audio.addEventListener("pause", () => {
      if (this.isPlaying) {
        this.stopAudioAndShaderState();
      }
    });
  }

  async startExperience() {
    try {
      this.loading.classList.remove("hidden");
      this.loading.textContent = "Initializing audio...";

      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;

        this.audioSource = this.audioContext.createMediaElementSource(
          this.audio
        );
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      await this.audio.play();

      this.isPlaying = true;
      this.startTime = Date.now() - this.audio.currentTime * 1000;
      this.playButton.textContent = "⏸ STOP";
      this.playButton.classList.add("playing");
      this.loading.classList.add("hidden");

      if (this.container.requestFullscreen) {
        await this.container.requestFullscreen();
      } else if (this.container.webkitRequestFullscreen) {
        await this.container.webkitRequestFullscreen();
      } else if (this.container.msRequestFullscreen) {
        await this.container.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Erreur lors du démarrage:", error);
      this.loading.textContent = "Error: " + error.message;
    }
  }

  stopAudioAndShaderState() {
    this.audio.pause();
    this.audio.currentTime = 0;

    this.isPlaying = false;
    this.playButton.textContent = "▶ START EXPERIENCE";
    this.playButton.classList.remove("playing");
  }

  updateAudioData() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.audioData);

      let sum = 0;
      for (let i = 0; i < this.audioData.length; i++) {
        sum += this.audioData[i];
      }

      this.overallAudioEnergy = sum / this.audioData.length / 255.0;

      const normalizedData = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        normalizedData[i] = this.audioData[i] / 255.0;
      }

      this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.R32F,
        256,
        1,
        0,
        this.gl.RED,
        this.gl.FLOAT,
        normalizedData
      );
    }
  }

  render() {
    const currentTime = this.isPlaying ? this.audio.currentTime : 0;

    this.updateAudioData();

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.program);

    this.gl.uniform2f(
      this.uniforms.iResolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1f(this.uniforms.iTime, currentTime);
    this.gl.uniform1f(
      this.uniforms.iOverallAudioEnergy,
      this.overallAudioEnergy
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
    this.gl.uniform1i(this.uniforms.iChannel1, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(() => this.render());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AudioVisualShader();
});
