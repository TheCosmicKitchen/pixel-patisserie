// Reads LibreSprite / Aseprite files (.ase, .aseprite) in the browser and flattens
// each frame into a PNG, so the menu can show them like any exported image.
//
// Follows the Aseprite file format spec:
// https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
// Handles RGBA, grayscale and indexed sprites; raw, linked and zlib-compressed cels;
// hidden layers and groups; layer and cel opacity; blend modes; and frame tags.

const CHUNK = { OLD_PALETTE_4: 0x0004, OLD_PALETTE_11: 0x0011, LAYER: 0x2004, CEL: 0x2005, TAGS: 0x2018, PALETTE: 0x2019 };
const LAYER_VISIBLE = 1, LAYER_REFERENCE = 64;
const LAYER_GROUP = 1;
const CEL_RAW = 0, CEL_LINKED = 1, CEL_COMPRESSED = 2;
const HEADER_LAYER_OPACITY_VALID = 1;

// Aseprite blend mode ids -> canvas composite operations ("source-over" where canvas has no match).
const BLEND = ["source-over", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
               "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity",
               "lighter", "source-over", "source-over"];

class Reader {
  constructor(buf, pos = 0) { this.v = new DataView(buf); this.buf = buf; this.p = pos; }
  byte()  { return this.v.getUint8(this.p++); }
  word()  { const x = this.v.getUint16(this.p, true); this.p += 2; return x; }
  short() { const x = this.v.getInt16(this.p, true); this.p += 2; return x; }
  dword() { const x = this.v.getUint32(this.p, true); this.p += 4; return x; }
  skip(n) { this.p += n; }
  bytes(n) { const b = new Uint8Array(this.buf, this.p, n); this.p += n; return b; }
  string() { return new TextDecoder().decode(this.bytes(this.word())); }
}

async function inflate(bytes) {
  // Cel data is zlib-wrapped deflate, which DecompressionStream calls "deflate".
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Parses an .ase/.aseprite file.
 * @param {ArrayBuffer} buf
 * @returns {Promise<{width:number, height:number, frames:{duration:number, canvas:HTMLCanvasElement}[],
 *                    tags:{name:string, from:number, to:number, direction:number}[]}>}
 */
export async function readAse(buf) {
  const r = new Reader(buf);
  r.skip(4);                                   // file size
  if (r.word() !== 0xA5E0) throw new Error("Not an Aseprite/LibreSprite file");
  const frameCount = r.word(), width = r.word(), height = r.word(), depth = r.word();
  const flags = r.dword();
  r.skip(2 + 4 + 4);                           // speed (deprecated), two reserved dwords
  const transparentIndex = r.byte();
  r.p = 128;

  const bpp = depth / 8;                       // 4 = RGBA, 2 = grayscale, 1 = indexed
  const palette = [];                          // index -> [r, g, b, a]
  const layers = [];
  const tags = [];
  const frames = [];                           // { duration, cels: Map(layerIndex -> cel) }

  for (let f = 0; f < frameCount; f++) {
    const start = r.p;
    const frameBytes = r.dword();
    if (r.word() !== 0xF1FA) throw new Error(`Frame ${f} is corrupt`);
    const oldChunks = r.word();
    const duration = r.word();
    r.skip(2);
    const newChunks = r.dword();
    const chunkCount = newChunks || oldChunks;
    const frame = { duration: duration || 100, cels: new Map() };

    for (let c = 0; c < chunkCount; c++) {
      const chunkStart = r.p;
      const size = r.dword();
      const type = r.word();
      const end = chunkStart + size;

      if (type === CHUNK.LAYER) {
        const lflags = r.word(), ltype = r.word(), level = r.word();
        r.skip(4);                             // default width/height
        const blend = r.word(), opacity = r.byte();
        r.skip(3);
        layers.push({ flags: lflags, type: ltype, level, blend, opacity, name: r.string() });
      } else if (type === CHUNK.CEL) {
        const layer = r.word(), x = r.short(), y = r.short(), opacity = r.byte(), celType = r.word();
        r.skip(7);                             // z-index + reserved
        if (celType === CEL_LINKED) {
          frame.cels.set(layer, { link: r.word() });
        } else if (celType === CEL_RAW || celType === CEL_COMPRESSED) {
          const w = r.word(), h = r.word();
          const data = r.bytes(end - r.p);
          frame.cels.set(layer, { x, y, opacity, w, h, data, compressed: celType === CEL_COMPRESSED });
        }                                      // tilemap cels are not supported and are skipped
      } else if (type === CHUNK.PALETTE) {
        r.skip(4);                             // new palette size
        const first = r.dword(), last = r.dword();
        r.skip(8);
        for (let i = first; i <= last; i++) {
          const eflags = r.word();
          palette[i] = [r.byte(), r.byte(), r.byte(), r.byte()];
          if (eflags & 1) r.string();
        }
      } else if ((type === CHUNK.OLD_PALETTE_4 || type === CHUNK.OLD_PALETTE_11) && !palette.length) {
        // Old palettes only fill in when the file has no new-style palette chunk.
        const scale = type === CHUNK.OLD_PALETTE_11 ? 255 / 63 : 1;
        let idx = 0;
        for (let packets = r.word(); packets > 0; packets--) {
          idx += r.byte();
          let n = r.byte() || 256;
          while (n--) palette[idx++] = [Math.round(r.byte() * scale), Math.round(r.byte() * scale), Math.round(r.byte() * scale), 255];
        }
      } else if (type === CHUNK.TAGS) {
        let n = r.word();
        r.skip(8);
        while (n--) {
          const from = r.word(), to = r.word(), direction = r.byte();
          r.skip(2 + 6 + 3 + 1);               // repeat, reserved, deprecated colour, extra byte
          tags.push({ from, to, direction, name: r.string() });
        }
      }
      r.p = end;
    }
    frames.push(frame);
    r.p = start + frameBytes;
  }

  // A layer is drawn only when it and every group above it are visible.
  const drawable = [];
  const stack = [];                            // visibility of the open group at each level
  layers.forEach((l, i) => {
    stack.length = l.level;
    const parentsVisible = stack.every(Boolean);
    const visible = parentsVisible && (l.flags & LAYER_VISIBLE) && !(l.flags & LAYER_REFERENCE);
    if (l.type === LAYER_GROUP) stack[l.level] = visible;
    else drawable[i] = !!visible;
  });
  const layerOpacity = (l) => (flags & HEADER_LAYER_OPACITY_VALID) ? l.opacity / 255 : 1;

  const toRGBA = (src, w, h) => {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      if (bpp === 4) { out[j] = src[i * 4]; out[j + 1] = src[i * 4 + 1]; out[j + 2] = src[i * 4 + 2]; out[j + 3] = src[i * 4 + 3]; }
      else if (bpp === 2) { out[j] = out[j + 1] = out[j + 2] = src[i * 2]; out[j + 3] = src[i * 2 + 1]; }
      else {
        const k = src[i];
        if (k === transparentIndex) continue;  // stays fully transparent
        const c = palette[k] || [0, 0, 0, 255];
        out[j] = c[0]; out[j + 1] = c[1]; out[j + 2] = c[2]; out[j + 3] = c[3];
      }
    }
    return out;
  };

  // Each cel's pixels become a small canvas, decoded once even when other frames link to it.
  const celCanvas = async (cel) => {
    if (!cel.canvas) {
      const raw = cel.compressed ? await inflate(cel.data) : cel.data;
      const c = document.createElement("canvas");
      c.width = cel.w; c.height = cel.h;
      c.getContext("2d").putImageData(new ImageData(toRGBA(raw, cel.w, cel.h), cel.w, cel.h), 0, 0);
      cel.canvas = c;
    }
    return cel.canvas;
  };

  const out = [];
  for (const frame of frames) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < layers.length; i++) {
      if (!drawable[i]) continue;
      let cel = frame.cels.get(i);
      if (cel && "link" in cel) cel = frames[cel.link]?.cels.get(i);
      if (!cel || !cel.data) continue;
      ctx.globalAlpha = layerOpacity(layers[i]) * (cel.opacity / 255);
      ctx.globalCompositeOperation = BLEND[layers[i].blend] || "source-over";
      ctx.drawImage(await celCanvas(cel), cel.x, cel.y);
    }
    out.push({ duration: frame.duration, canvas });
  }
  return { width, height, frames: out, tags };
}
