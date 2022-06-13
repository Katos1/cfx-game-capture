const CHUNK_SIZE = 10 * 1024; // 10kb
const API_ENDPOINT = 'http://localhost:5560/';

// Game View taken from here
// https://github.com/citizenfx/fivem/blob/ecd3ef7a3c16a66d77d772e495e084b4598da6b0/ext/cfx-ui/src/app/app.component.ts#L18-L170

const vertexShaderSrc = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 textureCoordinate;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    textureCoordinate = a_texcoord;
  }
`;

const fragmentShaderSrc = `
  varying mediump vec2 textureCoordinate;
  uniform sampler2D external_texture;
  void main()
  {
    gl_FragColor = texture2D(external_texture, textureCoordinate);
  }
`;

function makeShader(gl, type, src) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  const infoLog = gl.getShaderInfoLog(shader);
  if (infoLog) {
    console.error(infoLog);
  }

  return shader;
}

function createTexture(gl) {
  const tex = gl.createTexture();

  const texPixels = new Uint8Array([0, 0, 255, 255]);

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texPixels);

  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

  // Magic hook sequence
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  // Reset
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return tex;
}

function createBuffers(gl) {
  const vertexBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const texBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuff);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

  return { vertexBuff, texBuff };
}

function createProgram(gl) {
  const vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const vloc = gl.getAttribLocation(program, 'a_position');
  const tloc = gl.getAttribLocation(program, 'a_texcoord');

  return { program, vloc, tloc };
}

function createGameView(canvas) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false,
  });

  let render = () => {};

  function createStuff() {
    const tex = createTexture(gl);
    const { program, vloc, tloc } = createProgram(gl);
    const { vertexBuff, texBuff } = createBuffers(gl);

    gl.useProgram(program);

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.uniform1i(gl.getUniformLocation(program, 'external_texture'), 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
    gl.vertexAttribPointer(vloc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vloc);

    gl.bindBuffer(gl.ARRAY_BUFFER, texBuff);
    gl.vertexAttribPointer(tloc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tloc);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    render();
  }

  const gameView = {
    canvas,
    gl,
    animationFrame: void 0,
    resize: (width, height) => {
      gl.viewport(0, 0, width, height);
      gl.canvas.width = width;
      gl.canvas.height = height;
    },
  };

  render = () => {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gameView.animationFrame = setTimeout(render, 33.3);
  };

  createStuff();

  return gameView;
}

const canvasElement = document.querySelector('canvas');
const gameView = createGameView(canvasElement);

window.addEventListener('message', (event) => {
  const data = event.data;

  if (data.START_RECORD && data.RECORD_TIME) {
    const stream = canvasElement.captureStream(25);
    const mediaRecorder = new MediaRecorder(stream);
    const videoChunks = [];

    mediaRecorder.ondataavailable = (e) => e.data.size > 0 && videoChunks.push(e.data);

    mediaRecorder.onstop = (e) => {
      if (!videoChunks[0]) return;

      const videoBlob = new Blob(videoChunks, { type: videoChunks[0].type });
      uploadBlob(videoBlob);
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, data.RECORD_TIME || 0);
  }
});

function uploadBlob(videoBlob) {
  const reader = new FileReader();

  reader.onload = (event) => {
    const videoChunks = event.target.result;

    fetch(API_ENDPOINT, {
      headers: {
        'Content-Type': 'application/pdf+base64',
      },
      method: 'POST',
      body: videoChunks,
    });
  };

  reader.readAsDataURL(videoBlob);
}
