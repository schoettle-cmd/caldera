"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});

// ../../node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = __commonJS({
  "../../node_modules/tweetnacl/nacl-fast.js"(exports, module2) {
    (function(nacl2) {
      "use strict";
      var gf = function(init) {
        var i, r = new Float64Array(16);
        if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
        return r;
      };
      var randombytes = function() {
        throw new Error("no PRNG");
      };
      var _0 = new Uint8Array(16);
      var _9 = new Uint8Array(32);
      _9[0] = 9;
      var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]), D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]), X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]), Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]), I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
      function ts64(x, i, h, l) {
        x[i] = h >> 24 & 255;
        x[i + 1] = h >> 16 & 255;
        x[i + 2] = h >> 8 & 255;
        x[i + 3] = h & 255;
        x[i + 4] = l >> 24 & 255;
        x[i + 5] = l >> 16 & 255;
        x[i + 6] = l >> 8 & 255;
        x[i + 7] = l & 255;
      }
      function vn(x, xi, y, yi, n) {
        var i, d = 0;
        for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
        return (1 & d - 1 >>> 8) - 1;
      }
      function crypto_verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
      }
      function crypto_verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
      }
      function core_salsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x1 >>> 0 & 255;
        o[5] = x1 >>> 8 & 255;
        o[6] = x1 >>> 16 & 255;
        o[7] = x1 >>> 24 & 255;
        o[8] = x2 >>> 0 & 255;
        o[9] = x2 >>> 8 & 255;
        o[10] = x2 >>> 16 & 255;
        o[11] = x2 >>> 24 & 255;
        o[12] = x3 >>> 0 & 255;
        o[13] = x3 >>> 8 & 255;
        o[14] = x3 >>> 16 & 255;
        o[15] = x3 >>> 24 & 255;
        o[16] = x4 >>> 0 & 255;
        o[17] = x4 >>> 8 & 255;
        o[18] = x4 >>> 16 & 255;
        o[19] = x4 >>> 24 & 255;
        o[20] = x5 >>> 0 & 255;
        o[21] = x5 >>> 8 & 255;
        o[22] = x5 >>> 16 & 255;
        o[23] = x5 >>> 24 & 255;
        o[24] = x6 >>> 0 & 255;
        o[25] = x6 >>> 8 & 255;
        o[26] = x6 >>> 16 & 255;
        o[27] = x6 >>> 24 & 255;
        o[28] = x7 >>> 0 & 255;
        o[29] = x7 >>> 8 & 255;
        o[30] = x7 >>> 16 & 255;
        o[31] = x7 >>> 24 & 255;
        o[32] = x8 >>> 0 & 255;
        o[33] = x8 >>> 8 & 255;
        o[34] = x8 >>> 16 & 255;
        o[35] = x8 >>> 24 & 255;
        o[36] = x9 >>> 0 & 255;
        o[37] = x9 >>> 8 & 255;
        o[38] = x9 >>> 16 & 255;
        o[39] = x9 >>> 24 & 255;
        o[40] = x10 >>> 0 & 255;
        o[41] = x10 >>> 8 & 255;
        o[42] = x10 >>> 16 & 255;
        o[43] = x10 >>> 24 & 255;
        o[44] = x11 >>> 0 & 255;
        o[45] = x11 >>> 8 & 255;
        o[46] = x11 >>> 16 & 255;
        o[47] = x11 >>> 24 & 255;
        o[48] = x12 >>> 0 & 255;
        o[49] = x12 >>> 8 & 255;
        o[50] = x12 >>> 16 & 255;
        o[51] = x12 >>> 24 & 255;
        o[52] = x13 >>> 0 & 255;
        o[53] = x13 >>> 8 & 255;
        o[54] = x13 >>> 16 & 255;
        o[55] = x13 >>> 24 & 255;
        o[56] = x14 >>> 0 & 255;
        o[57] = x14 >>> 8 & 255;
        o[58] = x14 >>> 16 & 255;
        o[59] = x14 >>> 24 & 255;
        o[60] = x15 >>> 0 & 255;
        o[61] = x15 >>> 8 & 255;
        o[62] = x15 >>> 16 & 255;
        o[63] = x15 >>> 24 & 255;
      }
      function core_hsalsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x5 >>> 0 & 255;
        o[5] = x5 >>> 8 & 255;
        o[6] = x5 >>> 16 & 255;
        o[7] = x5 >>> 24 & 255;
        o[8] = x10 >>> 0 & 255;
        o[9] = x10 >>> 8 & 255;
        o[10] = x10 >>> 16 & 255;
        o[11] = x10 >>> 24 & 255;
        o[12] = x15 >>> 0 & 255;
        o[13] = x15 >>> 8 & 255;
        o[14] = x15 >>> 16 & 255;
        o[15] = x15 >>> 24 & 255;
        o[16] = x6 >>> 0 & 255;
        o[17] = x6 >>> 8 & 255;
        o[18] = x6 >>> 16 & 255;
        o[19] = x6 >>> 24 & 255;
        o[20] = x7 >>> 0 & 255;
        o[21] = x7 >>> 8 & 255;
        o[22] = x7 >>> 16 & 255;
        o[23] = x7 >>> 24 & 255;
        o[24] = x8 >>> 0 & 255;
        o[25] = x8 >>> 8 & 255;
        o[26] = x8 >>> 16 & 255;
        o[27] = x8 >>> 24 & 255;
        o[28] = x9 >>> 0 & 255;
        o[29] = x9 >>> 8 & 255;
        o[30] = x9 >>> 16 & 255;
        o[31] = x9 >>> 24 & 255;
      }
      function crypto_core_salsa20(out, inp, k, c) {
        core_salsa20(out, inp, k, c);
      }
      function crypto_core_hsalsa20(out, inp, k, c) {
        core_hsalsa20(out, inp, k, c);
      }
      var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
      function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
          mpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
        }
        return 0;
      }
      function crypto_stream_salsa20(c, cpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = x[i];
        }
        return 0;
      }
      function crypto_stream(c, cpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20(c, cpos, d, sn, s);
      }
      function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
      }
      var poly1305 = function(key) {
        this.buffer = new Uint8Array(16);
        this.r = new Uint16Array(10);
        this.h = new Uint16Array(10);
        this.pad = new Uint16Array(8);
        this.leftover = 0;
        this.fin = 0;
        var t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 255 | (key[1] & 255) << 8;
        this.r[0] = t0 & 8191;
        t1 = key[2] & 255 | (key[3] & 255) << 8;
        this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
        t2 = key[4] & 255 | (key[5] & 255) << 8;
        this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
        t3 = key[6] & 255 | (key[7] & 255) << 8;
        this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
        t4 = key[8] & 255 | (key[9] & 255) << 8;
        this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
        this.r[5] = t4 >>> 1 & 8190;
        t5 = key[10] & 255 | (key[11] & 255) << 8;
        this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
        t6 = key[12] & 255 | (key[13] & 255) << 8;
        this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
        t7 = key[14] & 255 | (key[15] & 255) << 8;
        this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
        this.r[9] = t7 >>> 5 & 127;
        this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
        this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
        this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
        this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
        this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
        this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
        this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
        this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
      };
      poly1305.prototype.blocks = function(m, mpos, bytes) {
        var hibit = this.fin ? 0 : 1 << 11;
        var t0, t1, t2, t3, t4, t5, t6, t7, c;
        var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
        var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
        while (bytes >= 16) {
          t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
          h0 += t0 & 8191;
          t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
          h1 += (t0 >>> 13 | t1 << 3) & 8191;
          t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
          h2 += (t1 >>> 10 | t2 << 6) & 8191;
          t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
          h3 += (t2 >>> 7 | t3 << 9) & 8191;
          t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
          h4 += (t3 >>> 4 | t4 << 12) & 8191;
          h5 += t4 >>> 1 & 8191;
          t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
          h6 += (t4 >>> 14 | t5 << 2) & 8191;
          t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
          h7 += (t5 >>> 11 | t6 << 5) & 8191;
          t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
          h8 += (t6 >>> 8 | t7 << 8) & 8191;
          h9 += t7 >>> 5 | hibit;
          c = 0;
          d0 = c;
          d0 += h0 * r0;
          d0 += h1 * (5 * r9);
          d0 += h2 * (5 * r8);
          d0 += h3 * (5 * r7);
          d0 += h4 * (5 * r6);
          c = d0 >>> 13;
          d0 &= 8191;
          d0 += h5 * (5 * r5);
          d0 += h6 * (5 * r4);
          d0 += h7 * (5 * r3);
          d0 += h8 * (5 * r2);
          d0 += h9 * (5 * r1);
          c += d0 >>> 13;
          d0 &= 8191;
          d1 = c;
          d1 += h0 * r1;
          d1 += h1 * r0;
          d1 += h2 * (5 * r9);
          d1 += h3 * (5 * r8);
          d1 += h4 * (5 * r7);
          c = d1 >>> 13;
          d1 &= 8191;
          d1 += h5 * (5 * r6);
          d1 += h6 * (5 * r5);
          d1 += h7 * (5 * r4);
          d1 += h8 * (5 * r3);
          d1 += h9 * (5 * r2);
          c += d1 >>> 13;
          d1 &= 8191;
          d2 = c;
          d2 += h0 * r2;
          d2 += h1 * r1;
          d2 += h2 * r0;
          d2 += h3 * (5 * r9);
          d2 += h4 * (5 * r8);
          c = d2 >>> 13;
          d2 &= 8191;
          d2 += h5 * (5 * r7);
          d2 += h6 * (5 * r6);
          d2 += h7 * (5 * r5);
          d2 += h8 * (5 * r4);
          d2 += h9 * (5 * r3);
          c += d2 >>> 13;
          d2 &= 8191;
          d3 = c;
          d3 += h0 * r3;
          d3 += h1 * r2;
          d3 += h2 * r1;
          d3 += h3 * r0;
          d3 += h4 * (5 * r9);
          c = d3 >>> 13;
          d3 &= 8191;
          d3 += h5 * (5 * r8);
          d3 += h6 * (5 * r7);
          d3 += h7 * (5 * r6);
          d3 += h8 * (5 * r5);
          d3 += h9 * (5 * r4);
          c += d3 >>> 13;
          d3 &= 8191;
          d4 = c;
          d4 += h0 * r4;
          d4 += h1 * r3;
          d4 += h2 * r2;
          d4 += h3 * r1;
          d4 += h4 * r0;
          c = d4 >>> 13;
          d4 &= 8191;
          d4 += h5 * (5 * r9);
          d4 += h6 * (5 * r8);
          d4 += h7 * (5 * r7);
          d4 += h8 * (5 * r6);
          d4 += h9 * (5 * r5);
          c += d4 >>> 13;
          d4 &= 8191;
          d5 = c;
          d5 += h0 * r5;
          d5 += h1 * r4;
          d5 += h2 * r3;
          d5 += h3 * r2;
          d5 += h4 * r1;
          c = d5 >>> 13;
          d5 &= 8191;
          d5 += h5 * r0;
          d5 += h6 * (5 * r9);
          d5 += h7 * (5 * r8);
          d5 += h8 * (5 * r7);
          d5 += h9 * (5 * r6);
          c += d5 >>> 13;
          d5 &= 8191;
          d6 = c;
          d6 += h0 * r6;
          d6 += h1 * r5;
          d6 += h2 * r4;
          d6 += h3 * r3;
          d6 += h4 * r2;
          c = d6 >>> 13;
          d6 &= 8191;
          d6 += h5 * r1;
          d6 += h6 * r0;
          d6 += h7 * (5 * r9);
          d6 += h8 * (5 * r8);
          d6 += h9 * (5 * r7);
          c += d6 >>> 13;
          d6 &= 8191;
          d7 = c;
          d7 += h0 * r7;
          d7 += h1 * r6;
          d7 += h2 * r5;
          d7 += h3 * r4;
          d7 += h4 * r3;
          c = d7 >>> 13;
          d7 &= 8191;
          d7 += h5 * r2;
          d7 += h6 * r1;
          d7 += h7 * r0;
          d7 += h8 * (5 * r9);
          d7 += h9 * (5 * r8);
          c += d7 >>> 13;
          d7 &= 8191;
          d8 = c;
          d8 += h0 * r8;
          d8 += h1 * r7;
          d8 += h2 * r6;
          d8 += h3 * r5;
          d8 += h4 * r4;
          c = d8 >>> 13;
          d8 &= 8191;
          d8 += h5 * r3;
          d8 += h6 * r2;
          d8 += h7 * r1;
          d8 += h8 * r0;
          d8 += h9 * (5 * r9);
          c += d8 >>> 13;
          d8 &= 8191;
          d9 = c;
          d9 += h0 * r9;
          d9 += h1 * r8;
          d9 += h2 * r7;
          d9 += h3 * r6;
          d9 += h4 * r5;
          c = d9 >>> 13;
          d9 &= 8191;
          d9 += h5 * r4;
          d9 += h6 * r3;
          d9 += h7 * r2;
          d9 += h8 * r1;
          d9 += h9 * r0;
          c += d9 >>> 13;
          d9 &= 8191;
          c = (c << 2) + c | 0;
          c = c + d0 | 0;
          d0 = c & 8191;
          c = c >>> 13;
          d1 += c;
          h0 = d0;
          h1 = d1;
          h2 = d2;
          h3 = d3;
          h4 = d4;
          h5 = d5;
          h6 = d6;
          h7 = d7;
          h8 = d8;
          h9 = d9;
          mpos += 16;
          bytes -= 16;
        }
        this.h[0] = h0;
        this.h[1] = h1;
        this.h[2] = h2;
        this.h[3] = h3;
        this.h[4] = h4;
        this.h[5] = h5;
        this.h[6] = h6;
        this.h[7] = h7;
        this.h[8] = h8;
        this.h[9] = h9;
      };
      poly1305.prototype.finish = function(mac, macpos) {
        var g = new Uint16Array(10);
        var c, mask, f, i;
        if (this.leftover) {
          i = this.leftover;
          this.buffer[i++] = 1;
          for (; i < 16; i++) this.buffer[i] = 0;
          this.fin = 1;
          this.blocks(this.buffer, 0, 16);
        }
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        for (i = 2; i < 10; i++) {
          this.h[i] += c;
          c = this.h[i] >>> 13;
          this.h[i] &= 8191;
        }
        this.h[0] += c * 5;
        c = this.h[0] >>> 13;
        this.h[0] &= 8191;
        this.h[1] += c;
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        this.h[2] += c;
        g[0] = this.h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 8191;
        for (i = 1; i < 10; i++) {
          g[i] = this.h[i] + c;
          c = g[i] >>> 13;
          g[i] &= 8191;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for (i = 0; i < 10; i++) g[i] &= mask;
        mask = ~mask;
        for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
        this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
        this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
        this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
        this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
        this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
        this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
        this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
        this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
        f = this.h[0] + this.pad[0];
        this.h[0] = f & 65535;
        for (i = 1; i < 8; i++) {
          f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
          this.h[i] = f & 65535;
        }
        mac[macpos + 0] = this.h[0] >>> 0 & 255;
        mac[macpos + 1] = this.h[0] >>> 8 & 255;
        mac[macpos + 2] = this.h[1] >>> 0 & 255;
        mac[macpos + 3] = this.h[1] >>> 8 & 255;
        mac[macpos + 4] = this.h[2] >>> 0 & 255;
        mac[macpos + 5] = this.h[2] >>> 8 & 255;
        mac[macpos + 6] = this.h[3] >>> 0 & 255;
        mac[macpos + 7] = this.h[3] >>> 8 & 255;
        mac[macpos + 8] = this.h[4] >>> 0 & 255;
        mac[macpos + 9] = this.h[4] >>> 8 & 255;
        mac[macpos + 10] = this.h[5] >>> 0 & 255;
        mac[macpos + 11] = this.h[5] >>> 8 & 255;
        mac[macpos + 12] = this.h[6] >>> 0 & 255;
        mac[macpos + 13] = this.h[6] >>> 8 & 255;
        mac[macpos + 14] = this.h[7] >>> 0 & 255;
        mac[macpos + 15] = this.h[7] >>> 8 & 255;
      };
      poly1305.prototype.update = function(m, mpos, bytes) {
        var i, want;
        if (this.leftover) {
          want = 16 - this.leftover;
          if (want > bytes)
            want = bytes;
          for (i = 0; i < want; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          bytes -= want;
          mpos += want;
          this.leftover += want;
          if (this.leftover < 16)
            return;
          this.blocks(this.buffer, 0, 16);
          this.leftover = 0;
        }
        if (bytes >= 16) {
          want = bytes - bytes % 16;
          this.blocks(m, mpos, want);
          mpos += want;
          bytes -= want;
        }
        if (bytes) {
          for (i = 0; i < bytes; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          this.leftover += bytes;
        }
      };
      function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
        var s = new poly1305(k);
        s.update(m, mpos, n);
        s.finish(out, outpos);
        return 0;
      }
      function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
        var x = new Uint8Array(16);
        crypto_onetimeauth(x, 0, m, mpos, n, k);
        return crypto_verify_16(h, hpos, x, 0);
      }
      function crypto_secretbox(c, m, d, n, k) {
        var i;
        if (d < 32) return -1;
        crypto_stream_xor(c, 0, m, 0, d, n, k);
        crypto_onetimeauth(c, 16, c, 32, d - 32, c);
        for (i = 0; i < 16; i++) c[i] = 0;
        return 0;
      }
      function crypto_secretbox_open(m, c, d, n, k) {
        var i;
        var x = new Uint8Array(32);
        if (d < 32) return -1;
        crypto_stream(x, 0, 32, n, k);
        if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
        crypto_stream_xor(m, 0, c, 0, d, n, k);
        for (i = 0; i < 32; i++) m[i] = 0;
        return 0;
      }
      function set25519(r, a) {
        var i;
        for (i = 0; i < 16; i++) r[i] = a[i] | 0;
      }
      function car25519(o) {
        var i, v, c = 1;
        for (i = 0; i < 16; i++) {
          v = o[i] + c + 65535;
          c = Math.floor(v / 65536);
          o[i] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
      }
      function sel25519(p, q2, b) {
        var t, c = ~(b - 1);
        for (var i = 0; i < 16; i++) {
          t = c & (p[i] ^ q2[i]);
          p[i] ^= t;
          q2[i] ^= t;
        }
      }
      function pack25519(o, n) {
        var i, j, b;
        var m = gf(), t = gf();
        for (i = 0; i < 16; i++) t[i] = n[i];
        car25519(t);
        car25519(t);
        car25519(t);
        for (j = 0; j < 2; j++) {
          m[0] = t[0] - 65517;
          for (i = 1; i < 15; i++) {
            m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
            m[i - 1] &= 65535;
          }
          m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
          b = m[15] >> 16 & 1;
          m[14] &= 65535;
          sel25519(t, m, 1 - b);
        }
        for (i = 0; i < 16; i++) {
          o[2 * i] = t[i] & 255;
          o[2 * i + 1] = t[i] >> 8;
        }
      }
      function neq25519(a, b) {
        var c = new Uint8Array(32), d = new Uint8Array(32);
        pack25519(c, a);
        pack25519(d, b);
        return crypto_verify_32(c, 0, d, 0);
      }
      function par25519(a) {
        var d = new Uint8Array(32);
        pack25519(d, a);
        return d[0] & 1;
      }
      function unpack25519(o, n) {
        var i;
        for (i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
        o[15] &= 32767;
      }
      function A(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
      }
      function Z(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
      }
      function M(o, a, b) {
        var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        v = a[0];
        t0 += v * b0;
        t1 += v * b1;
        t2 += v * b2;
        t3 += v * b3;
        t4 += v * b4;
        t5 += v * b5;
        t6 += v * b6;
        t7 += v * b7;
        t8 += v * b8;
        t9 += v * b9;
        t10 += v * b10;
        t11 += v * b11;
        t12 += v * b12;
        t13 += v * b13;
        t14 += v * b14;
        t15 += v * b15;
        v = a[1];
        t1 += v * b0;
        t2 += v * b1;
        t3 += v * b2;
        t4 += v * b3;
        t5 += v * b4;
        t6 += v * b5;
        t7 += v * b6;
        t8 += v * b7;
        t9 += v * b8;
        t10 += v * b9;
        t11 += v * b10;
        t12 += v * b11;
        t13 += v * b12;
        t14 += v * b13;
        t15 += v * b14;
        t16 += v * b15;
        v = a[2];
        t2 += v * b0;
        t3 += v * b1;
        t4 += v * b2;
        t5 += v * b3;
        t6 += v * b4;
        t7 += v * b5;
        t8 += v * b6;
        t9 += v * b7;
        t10 += v * b8;
        t11 += v * b9;
        t12 += v * b10;
        t13 += v * b11;
        t14 += v * b12;
        t15 += v * b13;
        t16 += v * b14;
        t17 += v * b15;
        v = a[3];
        t3 += v * b0;
        t4 += v * b1;
        t5 += v * b2;
        t6 += v * b3;
        t7 += v * b4;
        t8 += v * b5;
        t9 += v * b6;
        t10 += v * b7;
        t11 += v * b8;
        t12 += v * b9;
        t13 += v * b10;
        t14 += v * b11;
        t15 += v * b12;
        t16 += v * b13;
        t17 += v * b14;
        t18 += v * b15;
        v = a[4];
        t4 += v * b0;
        t5 += v * b1;
        t6 += v * b2;
        t7 += v * b3;
        t8 += v * b4;
        t9 += v * b5;
        t10 += v * b6;
        t11 += v * b7;
        t12 += v * b8;
        t13 += v * b9;
        t14 += v * b10;
        t15 += v * b11;
        t16 += v * b12;
        t17 += v * b13;
        t18 += v * b14;
        t19 += v * b15;
        v = a[5];
        t5 += v * b0;
        t6 += v * b1;
        t7 += v * b2;
        t8 += v * b3;
        t9 += v * b4;
        t10 += v * b5;
        t11 += v * b6;
        t12 += v * b7;
        t13 += v * b8;
        t14 += v * b9;
        t15 += v * b10;
        t16 += v * b11;
        t17 += v * b12;
        t18 += v * b13;
        t19 += v * b14;
        t20 += v * b15;
        v = a[6];
        t6 += v * b0;
        t7 += v * b1;
        t8 += v * b2;
        t9 += v * b3;
        t10 += v * b4;
        t11 += v * b5;
        t12 += v * b6;
        t13 += v * b7;
        t14 += v * b8;
        t15 += v * b9;
        t16 += v * b10;
        t17 += v * b11;
        t18 += v * b12;
        t19 += v * b13;
        t20 += v * b14;
        t21 += v * b15;
        v = a[7];
        t7 += v * b0;
        t8 += v * b1;
        t9 += v * b2;
        t10 += v * b3;
        t11 += v * b4;
        t12 += v * b5;
        t13 += v * b6;
        t14 += v * b7;
        t15 += v * b8;
        t16 += v * b9;
        t17 += v * b10;
        t18 += v * b11;
        t19 += v * b12;
        t20 += v * b13;
        t21 += v * b14;
        t22 += v * b15;
        v = a[8];
        t8 += v * b0;
        t9 += v * b1;
        t10 += v * b2;
        t11 += v * b3;
        t12 += v * b4;
        t13 += v * b5;
        t14 += v * b6;
        t15 += v * b7;
        t16 += v * b8;
        t17 += v * b9;
        t18 += v * b10;
        t19 += v * b11;
        t20 += v * b12;
        t21 += v * b13;
        t22 += v * b14;
        t23 += v * b15;
        v = a[9];
        t9 += v * b0;
        t10 += v * b1;
        t11 += v * b2;
        t12 += v * b3;
        t13 += v * b4;
        t14 += v * b5;
        t15 += v * b6;
        t16 += v * b7;
        t17 += v * b8;
        t18 += v * b9;
        t19 += v * b10;
        t20 += v * b11;
        t21 += v * b12;
        t22 += v * b13;
        t23 += v * b14;
        t24 += v * b15;
        v = a[10];
        t10 += v * b0;
        t11 += v * b1;
        t12 += v * b2;
        t13 += v * b3;
        t14 += v * b4;
        t15 += v * b5;
        t16 += v * b6;
        t17 += v * b7;
        t18 += v * b8;
        t19 += v * b9;
        t20 += v * b10;
        t21 += v * b11;
        t22 += v * b12;
        t23 += v * b13;
        t24 += v * b14;
        t25 += v * b15;
        v = a[11];
        t11 += v * b0;
        t12 += v * b1;
        t13 += v * b2;
        t14 += v * b3;
        t15 += v * b4;
        t16 += v * b5;
        t17 += v * b6;
        t18 += v * b7;
        t19 += v * b8;
        t20 += v * b9;
        t21 += v * b10;
        t22 += v * b11;
        t23 += v * b12;
        t24 += v * b13;
        t25 += v * b14;
        t26 += v * b15;
        v = a[12];
        t12 += v * b0;
        t13 += v * b1;
        t14 += v * b2;
        t15 += v * b3;
        t16 += v * b4;
        t17 += v * b5;
        t18 += v * b6;
        t19 += v * b7;
        t20 += v * b8;
        t21 += v * b9;
        t22 += v * b10;
        t23 += v * b11;
        t24 += v * b12;
        t25 += v * b13;
        t26 += v * b14;
        t27 += v * b15;
        v = a[13];
        t13 += v * b0;
        t14 += v * b1;
        t15 += v * b2;
        t16 += v * b3;
        t17 += v * b4;
        t18 += v * b5;
        t19 += v * b6;
        t20 += v * b7;
        t21 += v * b8;
        t22 += v * b9;
        t23 += v * b10;
        t24 += v * b11;
        t25 += v * b12;
        t26 += v * b13;
        t27 += v * b14;
        t28 += v * b15;
        v = a[14];
        t14 += v * b0;
        t15 += v * b1;
        t16 += v * b2;
        t17 += v * b3;
        t18 += v * b4;
        t19 += v * b5;
        t20 += v * b6;
        t21 += v * b7;
        t22 += v * b8;
        t23 += v * b9;
        t24 += v * b10;
        t25 += v * b11;
        t26 += v * b12;
        t27 += v * b13;
        t28 += v * b14;
        t29 += v * b15;
        v = a[15];
        t15 += v * b0;
        t16 += v * b1;
        t17 += v * b2;
        t18 += v * b3;
        t19 += v * b4;
        t20 += v * b5;
        t21 += v * b6;
        t22 += v * b7;
        t23 += v * b8;
        t24 += v * b9;
        t25 += v * b10;
        t26 += v * b11;
        t27 += v * b12;
        t28 += v * b13;
        t29 += v * b14;
        t30 += v * b15;
        t0 += 38 * t16;
        t1 += 38 * t17;
        t2 += 38 * t18;
        t3 += 38 * t19;
        t4 += 38 * t20;
        t5 += 38 * t21;
        t6 += 38 * t22;
        t7 += 38 * t23;
        t8 += 38 * t24;
        t9 += 38 * t25;
        t10 += 38 * t26;
        t11 += 38 * t27;
        t12 += 38 * t28;
        t13 += 38 * t29;
        t14 += 38 * t30;
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        o[0] = t0;
        o[1] = t1;
        o[2] = t2;
        o[3] = t3;
        o[4] = t4;
        o[5] = t5;
        o[6] = t6;
        o[7] = t7;
        o[8] = t8;
        o[9] = t9;
        o[10] = t10;
        o[11] = t11;
        o[12] = t12;
        o[13] = t13;
        o[14] = t14;
        o[15] = t15;
      }
      function S(o, a) {
        M(o, a, a);
      }
      function inv25519(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 253; a >= 0; a--) {
          S(c, c);
          if (a !== 2 && a !== 4) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function pow2523(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 250; a >= 0; a--) {
          S(c, c);
          if (a !== 1) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function crypto_scalarmult(q2, n, p) {
        var z = new Uint8Array(32);
        var x = new Float64Array(80), r, i;
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
        for (i = 0; i < 31; i++) z[i] = n[i];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for (i = 0; i < 16; i++) {
          b[i] = x[i];
          d[i] = a[i] = c[i] = 0;
        }
        a[0] = d[0] = 1;
        for (i = 254; i >= 0; --i) {
          r = z[i >>> 3] >>> (i & 7) & 1;
          sel25519(a, b, r);
          sel25519(c, d, r);
          A(e, a, c);
          Z(a, a, c);
          A(c, b, d);
          Z(b, b, d);
          S(d, e);
          S(f, a);
          M(a, c, a);
          M(c, b, e);
          A(e, a, c);
          Z(a, a, c);
          S(b, a);
          Z(c, d, f);
          M(a, c, _121665);
          A(a, a, d);
          M(c, c, a);
          M(a, d, f);
          M(d, b, x);
          S(b, e);
          sel25519(a, b, r);
          sel25519(c, d, r);
        }
        for (i = 0; i < 16; i++) {
          x[i + 16] = a[i];
          x[i + 32] = c[i];
          x[i + 48] = b[i];
          x[i + 64] = d[i];
        }
        var x32 = x.subarray(32);
        var x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q2, x16);
        return 0;
      }
      function crypto_scalarmult_base(q2, n) {
        return crypto_scalarmult(q2, n, _9);
      }
      function crypto_box_keypair(y, x) {
        randombytes(x, 32);
        return crypto_scalarmult_base(y, x);
      }
      function crypto_box_beforenm(k, y, x) {
        var s = new Uint8Array(32);
        crypto_scalarmult(s, x, y);
        return crypto_core_hsalsa20(k, _0, s, sigma);
      }
      var crypto_box_afternm = crypto_secretbox;
      var crypto_box_open_afternm = crypto_secretbox_open;
      function crypto_box(c, m, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_afternm(c, m, d, n, k);
      }
      function crypto_box_open(m, c, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_open_afternm(m, c, d, n, k);
      }
      var K = [
        1116352408,
        3609767458,
        1899447441,
        602891725,
        3049323471,
        3964484399,
        3921009573,
        2173295548,
        961987163,
        4081628472,
        1508970993,
        3053834265,
        2453635748,
        2937671579,
        2870763221,
        3664609560,
        3624381080,
        2734883394,
        310598401,
        1164996542,
        607225278,
        1323610764,
        1426881987,
        3590304994,
        1925078388,
        4068182383,
        2162078206,
        991336113,
        2614888103,
        633803317,
        3248222580,
        3479774868,
        3835390401,
        2666613458,
        4022224774,
        944711139,
        264347078,
        2341262773,
        604807628,
        2007800933,
        770255983,
        1495990901,
        1249150122,
        1856431235,
        1555081692,
        3175218132,
        1996064986,
        2198950837,
        2554220882,
        3999719339,
        2821834349,
        766784016,
        2952996808,
        2566594879,
        3210313671,
        3203337956,
        3336571891,
        1034457026,
        3584528711,
        2466948901,
        113926993,
        3758326383,
        338241895,
        168717936,
        666307205,
        1188179964,
        773529912,
        1546045734,
        1294757372,
        1522805485,
        1396182291,
        2643833823,
        1695183700,
        2343527390,
        1986661051,
        1014477480,
        2177026350,
        1206759142,
        2456956037,
        344077627,
        2730485921,
        1290863460,
        2820302411,
        3158454273,
        3259730800,
        3505952657,
        3345764771,
        106217008,
        3516065817,
        3606008344,
        3600352804,
        1432725776,
        4094571909,
        1467031594,
        275423344,
        851169720,
        430227734,
        3100823752,
        506948616,
        1363258195,
        659060556,
        3750685593,
        883997877,
        3785050280,
        958139571,
        3318307427,
        1322822218,
        3812723403,
        1537002063,
        2003034995,
        1747873779,
        3602036899,
        1955562222,
        1575990012,
        2024104815,
        1125592928,
        2227730452,
        2716904306,
        2361852424,
        442776044,
        2428436474,
        593698344,
        2756734187,
        3733110249,
        3204031479,
        2999351573,
        3329325298,
        3815920427,
        3391569614,
        3928383900,
        3515267271,
        566280711,
        3940187606,
        3454069534,
        4118630271,
        4000239992,
        116418474,
        1914138554,
        174292421,
        2731055270,
        289380356,
        3203993006,
        460393269,
        320620315,
        685471733,
        587496836,
        852142971,
        1086792851,
        1017036298,
        365543100,
        1126000580,
        2618297676,
        1288033470,
        3409855158,
        1501505948,
        4234509866,
        1607167915,
        987167468,
        1816402316,
        1246189591
      ];
      function crypto_hashblocks_hl(hh, hl, m, n) {
        var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
        var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        var pos = 0;
        while (n >= 128) {
          for (i = 0; i < 16; i++) {
            j = 8 * i + pos;
            wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
            wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
          }
          for (i = 0; i < 80; i++) {
            bh0 = ah0;
            bh1 = ah1;
            bh2 = ah2;
            bh3 = ah3;
            bh4 = ah4;
            bh5 = ah5;
            bh6 = ah6;
            bh7 = ah7;
            bl0 = al0;
            bl1 = al1;
            bl2 = al2;
            bl3 = al3;
            bl4 = al4;
            bl5 = al5;
            bl6 = al6;
            bl7 = al7;
            h = ah7;
            l = al7;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
            l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah4 & ah5 ^ ~ah4 & ah6;
            l = al4 & al5 ^ ~al4 & al6;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = K[i * 2];
            l = K[i * 2 + 1];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = wh[i % 16];
            l = wl[i % 16];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            th = c & 65535 | d << 16;
            tl = a & 65535 | b << 16;
            h = th;
            l = tl;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
            l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
            l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh7 = c & 65535 | d << 16;
            bl7 = a & 65535 | b << 16;
            h = bh3;
            l = bl3;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = th;
            l = tl;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh3 = c & 65535 | d << 16;
            bl3 = a & 65535 | b << 16;
            ah1 = bh0;
            ah2 = bh1;
            ah3 = bh2;
            ah4 = bh3;
            ah5 = bh4;
            ah6 = bh5;
            ah7 = bh6;
            ah0 = bh7;
            al1 = bl0;
            al2 = bl1;
            al3 = bl2;
            al4 = bl3;
            al5 = bl4;
            al6 = bl5;
            al7 = bl6;
            al0 = bl7;
            if (i % 16 === 15) {
              for (j = 0; j < 16; j++) {
                h = wh[j];
                l = wl[j];
                a = l & 65535;
                b = l >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = wh[(j + 9) % 16];
                l = wl[(j + 9) % 16];
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 1) % 16];
                tl = wl[(j + 1) % 16];
                h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 14) % 16];
                tl = wl[(j + 14) % 16];
                h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                wh[j] = c & 65535 | d << 16;
                wl[j] = a & 65535 | b << 16;
              }
            }
          }
          h = ah0;
          l = al0;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[0];
          l = hl[0];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[0] = ah0 = c & 65535 | d << 16;
          hl[0] = al0 = a & 65535 | b << 16;
          h = ah1;
          l = al1;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[1];
          l = hl[1];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[1] = ah1 = c & 65535 | d << 16;
          hl[1] = al1 = a & 65535 | b << 16;
          h = ah2;
          l = al2;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[2];
          l = hl[2];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[2] = ah2 = c & 65535 | d << 16;
          hl[2] = al2 = a & 65535 | b << 16;
          h = ah3;
          l = al3;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[3];
          l = hl[3];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[3] = ah3 = c & 65535 | d << 16;
          hl[3] = al3 = a & 65535 | b << 16;
          h = ah4;
          l = al4;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[4];
          l = hl[4];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[4] = ah4 = c & 65535 | d << 16;
          hl[4] = al4 = a & 65535 | b << 16;
          h = ah5;
          l = al5;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[5];
          l = hl[5];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[5] = ah5 = c & 65535 | d << 16;
          hl[5] = al5 = a & 65535 | b << 16;
          h = ah6;
          l = al6;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[6];
          l = hl[6];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[6] = ah6 = c & 65535 | d << 16;
          hl[6] = al6 = a & 65535 | b << 16;
          h = ah7;
          l = al7;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[7];
          l = hl[7];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[7] = ah7 = c & 65535 | d << 16;
          hl[7] = al7 = a & 65535 | b << 16;
          pos += 128;
          n -= 128;
        }
        return n;
      }
      function crypto_hash(out, m, n) {
        var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
        hh[0] = 1779033703;
        hh[1] = 3144134277;
        hh[2] = 1013904242;
        hh[3] = 2773480762;
        hh[4] = 1359893119;
        hh[5] = 2600822924;
        hh[6] = 528734635;
        hh[7] = 1541459225;
        hl[0] = 4089235720;
        hl[1] = 2227873595;
        hl[2] = 4271175723;
        hl[3] = 1595750129;
        hl[4] = 2917565137;
        hl[5] = 725511199;
        hl[6] = 4215389547;
        hl[7] = 327033209;
        crypto_hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for (i = 0; i < n; i++) x[i] = m[b - n + i];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        ts64(x, n - 8, b / 536870912 | 0, b << 3);
        crypto_hashblocks_hl(hh, hl, x, n);
        for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
        return 0;
      }
      function add(p, q2) {
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q2[1], q2[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q2[0], q2[1]);
        M(b, b, t);
        M(c, p[3], q2[3]);
        M(c, c, D2);
        M(d, p[2], q2[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
      }
      function cswap(p, q2, b) {
        var i;
        for (i = 0; i < 4; i++) {
          sel25519(p[i], q2[i], b);
        }
      }
      function pack(r, p) {
        var tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
      }
      function scalarmult(p, q2, s) {
        var b, i;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for (i = 255; i >= 0; --i) {
          b = s[i / 8 | 0] >> (i & 7) & 1;
          cswap(p, q2, b);
          add(q2, p);
          add(p, p);
          cswap(p, q2, b);
        }
      }
      function scalarbase(p, s) {
        var q2 = [gf(), gf(), gf(), gf()];
        set25519(q2[0], X);
        set25519(q2[1], Y);
        set25519(q2[2], gf1);
        M(q2[3], X, Y);
        scalarmult(p, q2, s);
      }
      function crypto_sign_keypair(pk, sk, seeded) {
        var d = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()];
        var i;
        if (!seeded) randombytes(sk, 32);
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
        return 0;
      }
      var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
      function modL(r, x) {
        var carry, i, j, k;
        for (i = 63; i >= 32; --i) {
          carry = 0;
          for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = Math.floor((x[j] + 128) / 256);
            x[j] -= carry * 256;
          }
          x[j] += carry;
          x[i] = 0;
        }
        carry = 0;
        for (j = 0; j < 32; j++) {
          x[j] += carry - (x[31] >> 4) * L[j];
          carry = x[j] >> 8;
          x[j] &= 255;
        }
        for (j = 0; j < 32; j++) x[j] -= carry * L[j];
        for (i = 0; i < 32; i++) {
          x[i + 1] += x[i] >> 8;
          r[i] = x[i] & 255;
        }
      }
      function reduce(r) {
        var x = new Float64Array(64), i;
        for (i = 0; i < 64; i++) x[i] = r[i];
        for (i = 0; i < 64; i++) r[i] = 0;
        modL(r, x);
      }
      function crypto_sign(sm, m, n, sk) {
        var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
        var i, j, x = new Float64Array(64);
        var p = [gf(), gf(), gf(), gf()];
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        var smlen = n + 64;
        for (i = 0; i < n; i++) sm[64 + i] = m[i];
        for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
        crypto_hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for (i = 32; i < 64; i++) sm[i] = sk[i];
        crypto_hash(h, sm, n + 64);
        reduce(h);
        for (i = 0; i < 64; i++) x[i] = 0;
        for (i = 0; i < 32; i++) x[i] = r[i];
        for (i = 0; i < 32; i++) {
          for (j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
          }
        }
        modL(sm.subarray(32), x);
        return smlen;
      }
      function unpackneg(r, p) {
        var t = gf(), chk = gf(), num2 = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num2, r[1]);
        M(den, num2, D);
        Z(num2, num2, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num2);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num2);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num2)) M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num2)) return -1;
        if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
      }
      function crypto_sign_open(m, sm, n, pk) {
        var i;
        var t = new Uint8Array(32), h = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()], q2 = [gf(), gf(), gf(), gf()];
        if (n < 64) return -1;
        if (unpackneg(q2, pk)) return -1;
        for (i = 0; i < n; i++) m[i] = sm[i];
        for (i = 0; i < 32; i++) m[i + 32] = pk[i];
        crypto_hash(h, m, n);
        reduce(h);
        scalarmult(p, q2, h);
        scalarbase(q2, sm.subarray(32));
        add(p, q2);
        pack(t, p);
        n -= 64;
        if (crypto_verify_32(sm, 0, t, 0)) {
          for (i = 0; i < n; i++) m[i] = 0;
          return -1;
        }
        for (i = 0; i < n; i++) m[i] = sm[i + 64];
        return n;
      }
      var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
      nacl2.lowlevel = {
        crypto_core_hsalsa20,
        crypto_stream_xor,
        crypto_stream,
        crypto_stream_salsa20_xor,
        crypto_stream_salsa20,
        crypto_onetimeauth,
        crypto_onetimeauth_verify,
        crypto_verify_16,
        crypto_verify_32,
        crypto_secretbox,
        crypto_secretbox_open,
        crypto_scalarmult,
        crypto_scalarmult_base,
        crypto_box_beforenm,
        crypto_box_afternm,
        crypto_box,
        crypto_box_open,
        crypto_box_keypair,
        crypto_hash,
        crypto_sign,
        crypto_sign_keypair,
        crypto_sign_open,
        crypto_secretbox_KEYBYTES,
        crypto_secretbox_NONCEBYTES,
        crypto_secretbox_ZEROBYTES,
        crypto_secretbox_BOXZEROBYTES,
        crypto_scalarmult_BYTES,
        crypto_scalarmult_SCALARBYTES,
        crypto_box_PUBLICKEYBYTES,
        crypto_box_SECRETKEYBYTES,
        crypto_box_BEFORENMBYTES,
        crypto_box_NONCEBYTES,
        crypto_box_ZEROBYTES,
        crypto_box_BOXZEROBYTES,
        crypto_sign_BYTES,
        crypto_sign_PUBLICKEYBYTES,
        crypto_sign_SECRETKEYBYTES,
        crypto_sign_SEEDBYTES,
        crypto_hash_BYTES,
        gf,
        D,
        L,
        pack25519,
        unpack25519,
        M,
        A,
        S,
        Z,
        pow2523,
        add,
        set25519,
        modL,
        scalarmult,
        scalarbase
      };
      function checkLengths(k, n) {
        if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
        if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
      }
      function checkBoxLengths(pk, sk) {
        if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
        if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
      }
      function checkArrayTypes() {
        for (var i = 0; i < arguments.length; i++) {
          if (!(arguments[i] instanceof Uint8Array))
            throw new TypeError("unexpected type, use Uint8Array");
        }
      }
      function cleanup(arr) {
        for (var i = 0; i < arr.length; i++) arr[i] = 0;
      }
      nacl2.randomBytes = function(n) {
        var b = new Uint8Array(n);
        randombytes(b, n);
        return b;
      };
      nacl2.secretbox = function(msg, nonce, key) {
        checkArrayTypes(msg, nonce, key);
        checkLengths(key, nonce);
        var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
        var c = new Uint8Array(m.length);
        for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
        crypto_secretbox(c, m, m.length, nonce, key);
        return c.subarray(crypto_secretbox_BOXZEROBYTES);
      };
      nacl2.secretbox.open = function(box, nonce, key) {
        checkArrayTypes(box, nonce, key);
        checkLengths(key, nonce);
        var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
        var m = new Uint8Array(c.length);
        for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
        if (c.length < 32) return null;
        if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
        return m.subarray(crypto_secretbox_ZEROBYTES);
      };
      nacl2.secretbox.keyLength = crypto_secretbox_KEYBYTES;
      nacl2.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
      nacl2.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
      nacl2.scalarMult = function(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
        var q2 = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult(q2, n, p);
        return q2;
      };
      nacl2.scalarMult.base = function(n) {
        checkArrayTypes(n);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        var q2 = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult_base(q2, n);
        return q2;
      };
      nacl2.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
      nacl2.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
      nacl2.box = function(msg, nonce, publicKey, secretKey) {
        var k = nacl2.box.before(publicKey, secretKey);
        return nacl2.secretbox(msg, nonce, k);
      };
      nacl2.box.before = function(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        var k = new Uint8Array(crypto_box_BEFORENMBYTES);
        crypto_box_beforenm(k, publicKey, secretKey);
        return k;
      };
      nacl2.box.after = nacl2.secretbox;
      nacl2.box.open = function(msg, nonce, publicKey, secretKey) {
        var k = nacl2.box.before(publicKey, secretKey);
        return nacl2.secretbox.open(msg, nonce, k);
      };
      nacl2.box.open.after = nacl2.secretbox.open;
      nacl2.box.keyPair = function() {
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
        crypto_box_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.box.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_box_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        crypto_scalarmult_base(pk, secretKey);
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl2.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
      nacl2.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
      nacl2.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
      nacl2.box.nonceLength = crypto_box_NONCEBYTES;
      nacl2.box.overheadLength = nacl2.secretbox.overheadLength;
      nacl2.sign = function(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
        crypto_sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
      };
      nacl2.sign.open = function(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var tmp = new Uint8Array(signedMsg.length);
        var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0) return null;
        var m = new Uint8Array(mlen);
        for (var i = 0; i < m.length; i++) m[i] = tmp[i];
        return m;
      };
      nacl2.sign.detached = function(msg, secretKey) {
        var signedMsg = nacl2.sign(msg, secretKey);
        var sig = new Uint8Array(crypto_sign_BYTES);
        for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
        return sig;
      };
      nacl2.sign.detached.verify = function(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== crypto_sign_BYTES)
          throw new Error("bad signature size");
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
        var m = new Uint8Array(crypto_sign_BYTES + msg.length);
        var i;
        for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
        for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
        return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
      };
      nacl2.sign.keyPair = function() {
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        crypto_sign_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.sign.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl2.sign.keyPair.fromSeed = function(seed) {
        checkArrayTypes(seed);
        if (seed.length !== crypto_sign_SEEDBYTES)
          throw new Error("bad seed size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        for (var i = 0; i < 32; i++) sk[i] = seed[i];
        crypto_sign_keypair(pk, sk, true);
        return { publicKey: pk, secretKey: sk };
      };
      nacl2.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
      nacl2.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
      nacl2.sign.seedLength = crypto_sign_SEEDBYTES;
      nacl2.sign.signatureLength = crypto_sign_BYTES;
      nacl2.hash = function(msg) {
        checkArrayTypes(msg);
        var h = new Uint8Array(crypto_hash_BYTES);
        crypto_hash(h, msg, msg.length);
        return h;
      };
      nacl2.hash.hashLength = crypto_hash_BYTES;
      nacl2.verify = function(x, y) {
        checkArrayTypes(x, y);
        if (x.length === 0 || y.length === 0) return false;
        if (x.length !== y.length) return false;
        return vn(x, 0, y, 0, x.length) === 0 ? true : false;
      };
      nacl2.setPRNG = function(fn) {
        randombytes = fn;
      };
      (function() {
        var crypto2 = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
        if (crypto2 && crypto2.getRandomValues) {
          var QUOTA = 65536;
          nacl2.setPRNG(function(x, n) {
            var i, v = new Uint8Array(n);
            for (i = 0; i < n; i += QUOTA) {
              crypto2.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
          });
        } else if (typeof require !== "undefined") {
          crypto2 = require_crypto();
          if (crypto2 && crypto2.randomBytes) {
            nacl2.setPRNG(function(x, n) {
              var i, v = crypto2.randomBytes(n);
              for (i = 0; i < n; i++) x[i] = v[i];
              cleanup(v);
            });
          }
        }
      })();
    })(typeof module2 !== "undefined" && module2.exports ? module2.exports : self.nacl = self.nacl || {});
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CalderaPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// ../core/src/index.ts
var import_tweetnacl = __toESM(require_nacl_fast(), 1);

// ../core/src/agent-prompt.ts
var PROMPT_VERSION = 2;
var PRIVACY_RULES = `Everything public is on the open internet, can be copied forever, and can affect other people. Be very cautious. Never write any of these into anything public:
- Other people: no names, initials, handles, photos or descriptions that identify anyone I meet, work with, hire, date, advise or invest with. Say "a founder", "the team", "a friend" only when it adds nothing identifying - usually leave it out.
- Meetings: no meetings, calls, lunches, dinners, interviews or events - not their titles, times, dates, attendees, or that they happened with someone specific.
- Times and places: no times of day, schedules, travel, cities, venues, addresses, offices, home or "where I am".
- Secret or sensitive work: no unannounced, stealth, confidential or NDA projects, codenames, deals, fundraising, investors, acquisitions, valuations, hiring, firing or anything said in confidence.
- Things that can get someone in trouble: legal, medical, health, HR, money, salaries, debts, relationships, family, children, politics, religion.
- Proprietary methods: no trading strategies, signals, indicators, thresholds, regime or risk rules, entry/exit logic, win rates, model weights, prompts, data sources or other trade secrets - in the journal, the garden or anywhere public. Name the theme only ("worked on the trading system").
- Contact details and links: no emails, phone numbers or links to private documents. No money amounts at all.
Describe work only by its public theme ("shipped a release", "wrote about design") and only name things I have already made public on my page (my own public projects, topics and links). If you are unsure, leave it out - an empty field is fine. Caldera also drops any journal line that looks sensitive before publishing.`;
function agentPrompt(o = {}) {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const activity = o.activityFile || "Caldera/activity.json";
  const zip = o.zipUrl || hub + "/download/caldera-latest.zip";
  const topics = o.publicTopics?.length ? o.publicTopics.map((t) => "#" + t).join(", ") : "the tags I allow-listed in Settings -> Caldera -> Public topics";
  const page2 = o.handle ? `${hub}/@${o.handle}/` : `${hub}/@<my handle>/`;
  const plugin = `1. Download ${zip} and unzip it into "<vault>/.obsidian/plugins/caldera/" so that folder contains main.js, manifest.json and styles.css (create the folders if needed).
2. Add "caldera" to the JSON array in "<vault>/.obsidian/community-plugins.json" (create the file as ["caldera"] if it does not exist). Do not remove other entries.`;
  const welcome = `Caldera opens a Welcome window where I type my name and pick a handle; it creates my identity on this device, publishes my profile and opens it in my browser. Do NOT create the identity, read the plugin's data.json, or handle my keys yourself - that file holds my private key. Wait until I tell you my profile is live, then continue with step 2.`;
  const install = o.installed ? `## 1. Install
Caldera is already installed and enabled in this vault. Skip to step 2.
` : `## 0. Obsidian itself (if I'm new - many people are - this step sets everything up; skip it only if I already use Obsidian)
1. Check whether Obsidian is installed (macOS: /Applications/Obsidian.app or ~/Applications/Obsidian.app; Windows: %LOCALAPPDATA%\\Programs\\Obsidian\\Obsidian.exe; Linux: the obsidian command, Flatpak md.obsidian.Obsidian, or an Obsidian AppImage).
2. If it is not installed, tell me you are about to install Obsidian (the free official app from https://obsidian.md), then install it:
   - macOS: brew install --cask obsidian  (no Homebrew? download https://obsidian.md/download , open the .dmg and copy Obsidian.app into /Applications)
   - Windows: winget install --id Obsidian.Obsidian -e  (or run the installer from https://obsidian.md/download)
   - Linux: flatpak install -y flathub md.obsidian.Obsidian  (or the AppImage / .deb from https://obsidian.md/download)
   If you cannot install software here, give me the download link and wait until I tell you it's installed. Do not open Obsidian yet.
3. If I don't have a vault yet, make one for me, completely, BEFORE Obsidian opens it:
   a. Ask where I'd like my notes; if I don't care, use ~/Documents/Notes (Windows: %USERPROFILE%\\Documents\\Notes). Create the folder, a "Welcome.md" note in it ("# Welcome" and one line saying this is my vault), and an empty ".obsidian" folder inside it. That folder is now my vault; use its absolute path below.
   b. Install the plugin into it now (exactly as in step 1 below), so it is ready on first launch.
   c. Make Obsidian quit if it is running (it rewrites its vault list on exit). Then register the vault in Obsidian's vault list, a JSON file at:
      macOS ~/Library/Application Support/obsidian/obsidian.json - Windows %APPDATA%\\obsidian\\obsidian.json - Linux ~/.config/obsidian/obsidian.json (Flatpak: ~/.var/app/md.obsidian.Obsidian/config/obsidian/obsidian.json).
      Create the folder and file if missing. The file looks like {"vaults":{"<id>":{"path":"<absolute vault path>","ts":<now in ms>,"open":true}}}. Add my vault under a new random 16-character lowercase hex id, keep every other key and vault already in the file, and write valid JSON.
   d. Open it: macOS  open "obsidian://open?path=<url-encoded absolute vault path>"  - Windows  start "" "obsidian://open?path=..."  - Linux  xdg-open "obsidian://open?path=..." . If Obsidian instead shows its vault picker, tell me to click "Open folder as vault" and choose that folder.
   e. Tell me, in plain words: in Obsidian, open Settings (the gear, bottom left) -> Community plugins -> click "Turn on community plugins". (If Obsidian shows a "Trust author and enable plugins" prompt instead, click that.) Caldera is already switched on, so its Welcome window appears right away. ${welcome}
   Steps a-e replace step 1 - after e, go straight to step 2.

## 1. Install the plugin (when I already have a vault)
${plugin.replace(/<vault>/g, vault)}
3. Tell me to restart Obsidian (quit fully, then open it). If Obsidian asks, I turn off Restricted mode (Settings -> Community plugins -> Turn on community plugins) and make sure Caldera is switched on. ${welcome}
`;
  const extras = o.extras ? `
${o.extras.trim()}
` : "";
  return `You are helping me run Caldera, the social layer for my Obsidian vault (${hub}). Caldera builds a public profile page from my vault; the more of my real activity it can count, the richer that page is. Follow these instructions exactly. (Caldera setup prompt v${PROMPT_VERSION})

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which. If there is none, I probably don't have Obsidian yet - many people don't - so start with step 0.)"}
My public page: ${page2}

THIS PROMPT IS SAFE TO PASTE AGAIN. Every time I paste it (for example after a Caldera update), first take stock of what is already set up - scheduled jobs, "${activity}", "Caldera/city.json", "Caldera/profile.md", journal fields in my daily notes - then repair anything broken, upgrade it to these instructions, and only add what is missing. Never create a second scheduled job that does the same thing; update the existing one in place.

${install}
## 2. Connect every source of activity I have (this is what makes the page rich)
Check each source below on this computer and tell me which you can reach. Use the ones that work; for the ones that don't, say what it would take (for example "connect your calendar to me") and move on.
- Calendar: events I attended (a calendar connector, or a calendar app's local data).
- Email: emails I sent (a mail connector, or the mail app's local data).
- AI usage: Claude Code (~/.claude/projects/**/*.jsonl: assistant messages have message.model and message.usage; count each message.id once; tokens = input + output + cache read + cache write) and Codex (~/.codex/sessions/**/*.jsonl: event_msg token_count -> last_token_usage.total_tokens, model from turn_context). Prompts = user messages I typed in those sessions. Add other tools only if they keep local usage logs.
- Code: git commits I authored, in repositories on this computer, plus my code host if I use one: GitHub (the gh CLI or the GitHub API), or Forgejo / Gitea / Codeberg (the tea CLI or the /api/v1 REST API on that server, with my access token if I have one).
- Documents: files I produced or filed (for example new files in Documents/Downloads I saved, or attachments filed into the vault).
Then write a small script for the routine below that computes these counts with code (no AI call per run).

## 3. Routine (4 times per workday: 9am, 12pm, 3pm and 6pm my local time, Monday to Friday)
Schedule ONE job on my computer (cron, launchd, Task Scheduler, or your own scheduler) at those four times. Nothing overnight and nothing on weekends; Monday's first run catches up the weekend. Keep it light on AI tokens: compute counts with code that reads logs, not with an AI call; read a calendar connector at most once a day and cache the result; and never rewrite a journal entry that already exists.
A. Journal entry (first run of each workday only, for YESTERDAY; on Monday also Saturday and Sunday if they had activity; skip any day that already has caldera_headline). Open (or create) that day's daily note, named YYYY-MM-DD.md, wherever my daily notes live. Add these frontmatter properties, keeping everything already in the note:
   caldera_headline: one sentence, the shape of the day
   caldera_focus: 2-4 short items, what I worked on
   caldera_wins: 1-3 short items, what got done
   caldera_themes: 1-3 single words
   Write them from my notes, calendar, sent email, commits and AI sessions for that day - whatever you can access.
   Name my projects the way they appear in Caldera/profile.md "projects" when they come up: Caldera grows a garden page for each project (and each distinctive theme) from these journal lines, adding a dated entry whenever it comes up.

B. Activity counts (every run, for today and yesterday). Update "${vault}/${activity}" (create it if missing). Format:
   { "prompt_version": ${PROMPT_VERSION},
     "days": [ { "date": "YYYY-MM-DD", "meetings": 0, "emails": 0, "prompts": 0, "commits": 0, "docs": 0, "tokens": 0 } ],
     "ai": { "total": 0, "window_days": 45, "models": [["Claude Opus 5.5", 0]], "providers": [["Anthropic", 0]] },
     "code": { "commits": 0, "repos": 0, "languages": ["Python"], "weekly": [0], "url": "https://github.com/<me>", "start": "Mon YYYY" } }
   One object per date: replace that date's object if it exists, keep the last 60 days, and only include counts you can actually measure (omit the rest - never guess). meetings = calendar events attended, emails = emails I sent, prompts = AI prompts I sent, commits = git commits I authored, docs = documents/attachments I produced or filed, tokens = AI tokens processed for me that day. Notes are counted by the plugin itself. Always write "prompt_version": ${PROMPT_VERSION} - Caldera uses it to tell me when this routine is out of date.
   AI usage ("tokens" per day and the "ai" block, last 45 days): group by model (readable names) and by provider. Never include prompts, file names or costs.
   Code ("code" block): count my commits in the last 52 weeks per week across my repositories, number of repos, and top 4 languages. Counts only - never names of private repositories.

C. City (every run, only if I use GitHub, Forgejo, Gitea or Codeberg). Keep "${vault}/Caldera/city.json" fresh: {"generated": "<ISO time>", "source": "github <my login>" (or "forgejo <https://server/my login>"), "repos": [{"name", "project", "public", "language", "commits", "weeks", "week", "today", "pushed", "url", "description"}]} with one row per repo I own (private ones too, if the gh CLI is signed in): project = which of my projects it belongs to (group repos into districts; ask me once how to group them), public = true only for public repos, commits = commits in the last 52 weeks, weeks = the last 12 weekly commit counts, week = commits in the last 7 days, today = commits today, pushed = last push time, url and description only for public repos. On GitHub use gh api user/repos and repos/<owner>/<repo>/stats/commit_activity. On Forgejo / Gitea / Codeberg use GET /api/v1/user/repos (or /api/v1/users/<me>/repos) and page through /api/v1/repos/<owner>/<repo>/commits?limit=50, counting by commit.author.date yourself (that endpoint ignores "since"). Caldera turns it into a little city on my page: districts are projects, buildings are repos. Visitors see public repos, and private ones only as locked glass buildings (no names); full details only in my own Private view. If you cannot reach the API, instead make sure my profile is a line in "links" in Caldera/profile.md ("GitHub | https://github.com/<me>", or "Forgejo | https://<server>/<me>" for Forgejo, Gitea or Codeberg) - Caldera then builds the city from my public repos itself. With no code host at all, Caldera builds the city from my vault folders.

D. Publish. If Caldera auto-publish is on (Settings -> Caldera -> Auto-publish every N hours), you are done. Otherwise ask me to run "Caldera: Publish my profile" from the command palette.

After setting up the job, run it once now, then backfill: for each of the last 14 days that has activity, add the journal fields from A to that day's daily note. Show me the 14 entries before writing them.

## 4. Make the page rich (once; on a re-paste, only fill what is still empty)
Anything that would become PUBLIC needs my explicit yes first: show me exactly what you propose, wait for my answer, then make only the approved changes.
1. Page text, in "${vault}/Caldera/profile.md": "headline" (one line), "summary" (2 sentences, links as [[Label|https://...]]), "now" (3 lines on what I'm doing now), "timeline" (only things already public: "Year | milestone | one-line detail", grouped into chapters with "era | Name | 2015-2020" lines), "projects" (Name | status | https://link, only public projects) and "links" (Label | https://url - include my GitHub profile if I have one: that turns on the Code section and the city). Offer to set a profile photo: save an image I choose into "Caldera/img/" and set "photo" to that path. Optional: offer a masthead (the wide cover image across the top of the page, about 3:1 such as 1800x600, under 2 MB): an image I choose or a free-to-use one I approve, saved into "Caldera/img/" with "banner" set to its path. Also suggest "sidebar" groups (Group | item, item), up to 14 "graph" note names (people/companies/projects I'm comfortable showing - the page shows how many notes link to each), and 6 "backlinks" (Title | short context).
2. My garden (public notes). Find 3-8 notes that would be good to grow in public: evergreen essays, how-tos, reading notes, overviews of work that is already public. Skip anything about people, clients, deals, money, health, family or unannounced work. List them with one line each on why, and a suggested stage (seedling = rough, budding = taking shape, evergreen = worked through). After I approve, add to the frontmatter of the approved notes only: "caldera: garden", "stage: <stage>" and "license: all-rights" (ask me if I want "cc-by" instead). The WHOLE note becomes a public page, so read every line and point out anything private first.
3. Notes friends can receive. Suggest notes I might want to share with friends as encrypted cards (frameworks, checklists, templates). After I approve, add "caldera: friends" to their frontmatter.
4. Public topics. List my 10 most-used tags that are safe to show publicly (no client, company or people tags), with a short label for each. I add them myself in Settings -> Caldera -> Public topics. Do not edit plugin settings.
5. Asks and offers. Draft 2 asks ("I could use help with...") and 2 offers ("I can help with...") that fit what I work on. I post the ones I like with "Caldera: Post an ask" / "Caldera: Post an offer".
6. Goals. If "${vault}/Caldera/Goals.md" doesn't exist, offer to create it with my current goals (checkboxes under ## headings). It stays private: it powers the goals section only I see.

## 5. Live city extras (ask me first for each)
- Websites: if I run websites for my projects, offer to add each project's live-traffic snippet (Caldera settings > "Live traffic on your city") to that site's pages, so visits ride through my city in real time.
- AI agents: offer to install the Caldera agent hook (Caldera settings > "AI agents on your city"), so my coding agents appear in the city as drones over the repo they're working in.${extras}

## 6. Privacy rules (these override everything above)
${PRIVACY_RULES}
Themes and topics: only use topics among ${topics}.
Also: never write to any other part of the vault, never change notes' privacy markings (caldera: public / garden / friends / private) without asking, never move notes into or out of the Garden folder, never touch .obsidian/plugins/caldera/data.json - it holds my private key.

## 7. Report
When you finish, show me a short checklist of every source and feature - calendar, email, AI usage, code, documents, journal, city, page text, garden, live traffic, agents - marked connected, skipped (and why) or needs me. After each scheduled run, the job only needs to log what it wrote. Then tell me to run "Caldera: Preview my public profile", check it, and publish.

## 8. Later
- Changing my page: name, headline, photo, banner, links, properties, topics, which sections show and whether I'm listed live in the frontmatter of "${vault}/Caldera/profile.md". Edit it (same privacy rules) and the page republishes within about a minute. Guide: ${hub}/guide.html
- My garden home: ${hub}/@<my handle>/garden.html shows live my notes, links from other gardens, gravity (goodwill friends give), help credits (100 to start; ask bounties are held until awarded, returned after 30 days, no cash value), my open asks and offers, friends and weekly rank.
- My profile inside Obsidian: the ribbon icon "My Caldera profile" opens my page as a tab. "Private view" adds private sections only I see (visits, today, on this day, patterns, goals, and a checklist of which sources are connected); "Public view" shows the page as visitors see it.
- When Caldera tells me my setup prompt is out of date, I copy it again ("Caldera: Copy the AI setup prompt") and paste it here; you upgrade the routine in place.`;
}
function editPrompt(o = {}) {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  return `Help me change my Caldera profile (${hub}/@${o.handle || "<my handle>"}/). Caldera builds that public page from my Obsidian vault.

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which.)"}

Where things live:
- Name, headline, photo, banner, links, properties, topics, which sections show, and directory listing: the frontmatter of "Caldera/profile.md". Keep its format. Photo and banner are paths to images inside the vault.
- A note on my page: add "caldera: public" to that note's frontmatter (title and first paragraph are shown). Remove it to take the note down.
- My daily journal: caldera_headline / caldera_focus / caldera_wins / caldera_themes in daily notes named YYYY-MM-DD.md.
- Activity counts: "Caldera/activity.json".
The page republishes automatically about a minute after Caldera/profile.md changes. For anything else, tell me to run "Caldera: Publish my profile".

Rules:
- Show me the exact change before you make it, and only make what I approve.
${PRIVACY_RULES}
- Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key. My handle can only be changed in Settings -> Caldera.

What I want to change: <DESCRIBE THE CHANGE>`;
}

// ../core/src/privacy.ts
var RULES = [
  ["time", /\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b|\b\d{1,2}:\d{2}\b|\b(noon|midnight|o'clock|this morning|this afternoon|tonight|tomorrow|tmrw)\b/i],
  ["meeting", /\b(meeting|meetings|met with|meet with|meets with|call with|calls with|called|zoom|lunch|dinner|breakfast|coffee|drinks|catch[- ]?up|1[:-]1|one[- ]on[- ]one|interview(ed)?|pitched|pitch meeting|sync with|session with|appointment|attendee|agenda|board meeting|offsite|hosted|visited|visit to|trip|flight|flew|travel(l?ed|ing)?)\b/i],
  ["location", /\b(?:in|at|from|to|near|around)\s+(?:the\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/],
  // case-sensitive: "in Santa Monica", not "in the category"
  ["place", /\b(street|st\.|avenue|ave\.|boulevard|blvd|road|rd\.|lane|suite|ste\.|hotel|restaurant|airport|hq|headquarters|downtown|neighborhood|zip code|address|office in|offices in)\b/i],
  ["secret", /\b(secret|confidential|stealth|unannounced|under wraps|nda|non[- ]disclosure|private beta|embargo(ed)?|off the record|internal only|not public|leak(ed)?|rumou?r|codename|code name)\b/i],
  ["trouble", /\b(lawsuit|sue[ds]?|legal|lawyer|attorney|court|settlement|investigation|fired|firing|layoffs?|laid off|resign(ed|ation)?|hr\b|complaint|harass\w*|divorce|custody|diagnos\w*|therapy|therapist|doctor|hospital|surgery|medical|health|pregnan\w*|arrest\w*|police|debt|bankrupt\w*|salary|raise|bonus|equity|valuation|term sheet|acquisition|acquire[ds]?|merger|investor|investors|fundrais\w*|round|due diligence|diligence|cap table)\b/i],
  ["money", /[$€£¥]\s?\d|\b\d[\d,.]*\s?(k|m|mm|bn|million|billion|thousand|usd|dollars?|euros?)\b/i],
  ["contact", /[\w.+-]+@[\w-]+\.[\w.]+|(?<!\d)(\+?\d[\d .()-]{7,}\d)(?!\d)|https?:\/\/|www\./i],
  ["family", /\b(wife|husband|partner|girlfriend|boyfriend|ex-wife|ex-husband|son|daughter|kids?|children|mom|dad|mother|father|brother|sister|family)\b/i]
];
var BASE_ALLOW = [
  "Obsidian",
  "Caldera",
  "Claude",
  "Claude Code",
  "ChatGPT",
  "OpenAI",
  "Codex",
  "Cursor",
  "GitHub",
  "Git",
  "Google",
  "Gmail",
  "Apple",
  "iOS",
  "Android",
  "Mac",
  "macOS",
  "Windows",
  "Linux",
  "Notion",
  "Slack",
  "Discord",
  "Figma",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node",
  "AI",
  "API",
  "LLM",
  "MCP",
  "SQL",
  "CSS",
  "HTML",
  "PDF",
  "CRM",
  "SEO",
  "UX",
  "UI",
  "Markdown",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "Building",
  "Operations",
  "Research",
  "Writing",
  "Design",
  "Shipping",
  "Learning"
];
function publicTextFilter(allowed = []) {
  const allow = new Set([...BASE_ALLOW, ...allowed].flatMap((a) => [a.toLowerCase(), ...a.toLowerCase().split(/\s+/)]).filter(Boolean));
  const why = (line) => {
    const t = String(line ?? "").trim();
    if (!t) return null;
    for (const [name, rx] of RULES) {
      const m = t.match(rx);
      if (!m) continue;
      if (name === "location") {
        const words2 = m[0].match(/[A-Z][a-z]+/g) || [];
        if (words2.length && words2.every((w) => allow.has(w.toLowerCase()))) continue;
      }
      return name;
    }
    const words = t.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^A-Za-z'-]/g, "");
      if (!/^[A-Z][a-z]{1,}/.test(w)) continue;
      if (/[.!?:]$/.test(words[i - 1])) continue;
      if (allow.has(w.toLowerCase()) || allow.has(w.toLowerCase().replace(/'s$/, ""))) continue;
      return "name";
    }
    return null;
  };
  const f = (line) => why(line) === null;
  f.why = why;
  return f;
}

// ../core/src/checklist.ts
var ITEMS = [
  { id: "photo", label: "Profile photo", why: "A face (or a logo) makes people trust the page and accept your friend requests." },
  { id: "banner", label: "Masthead", why: "A wide cover image across the top makes the page feel like yours and shows in link previews." },
  { id: "headline", label: "Headline", why: "One line under your name that says what you do." },
  { id: "summary", label: "About you", why: "Two sentences so a visitor knows why to follow you." },
  { id: "links", label: "Links", why: "Where else to find you: your site, GitHub, socials." },
  { id: "garden", label: "First garden note", why: "One note grown in public gives visitors something to read and link to." },
  { id: "friend", label: "First friend", why: "Friends see your updates, link your notes and give you gravity." },
  { id: "group", label: "Join a group", why: "Groups are towns of everyone's cities, and people in them are suggested to you." },
  { id: "email", label: "Daily summary email", why: "Hear when people visit, link your notes or ask to be friends." }
];
function pageChecklist(s) {
  return ITEMS.filter((i) => !(i.id === "garden" && s.garden === void 0)).map((i) => ({ ...i, done: i.id === "summary" ? s.summary !== false : i.id === "garden" ? !!s.garden : !!s[i.id] }));
}
function imagePrompt(kind, o = {}) {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, ""), vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const what = kind === "banner" ? `a masthead: the wide cover image across the top of my page. It should be about 3:1 (for example 1800x600), landscape, calm enough that my name and photo read on top of it, and under 2 MB (JPG or WebP).` : `a profile photo: square, at least 400x400, my face or my logo, under 1 MB (JPG, PNG or WebP).`;
  const key = kind === "banner" ? "banner" : "photo", file = kind === "banner" ? "banner" : "photo";
  return `Help me add ${what}

My Caldera page: ${hub}/@${o.handle || "<my handle>"}/ . Caldera builds it from my Obsidian vault.
Vault: ${vault}

1. Ask me which image to use. Offer three routes: (a) I point you at a photo I already have, (b) you find a free-to-use image I approve (say where it's from and its license), ${kind === "banner" ? "or (c) you make one (a simple abstract or landscape image, or an image generator I already use)" : "or (c) I'll take one now"}.
2. Crop or resize it to the size above if you can, and save it as "${vault}/Caldera/${file}.jpg" (or .png / .webp to match).
3. In the frontmatter of "${vault}/Caldera/profile.md", set ${key}: "Caldera/${file}.jpg" (the path inside the vault). Change nothing else.
4. Caldera republishes the page about a minute after profile.md changes. Tell me to look at ${hub}/@${o.handle || "<my handle>"}/ .

Rules:
${PRIVACY_RULES}
- The image is public: no other people's faces without their OK, no screens, documents, addresses or anything readable that's private.
- Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key.`;
}

// ../core/src/links.ts
var A_TAG = /<a\b([^>]*)>/gi;
var attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  return m ? m[2] ?? m[3] ?? m[4] ?? "" : null;
};
var setAttr = (attrs, name, value) => {
  const re = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s"'>]+)`, "i");
  return re.test(attrs) ? attrs.replace(re, ` ${name}="${value}"`) : `${attrs.replace(/\s*\/?$/, "")} ${name}="${value}"`;
};
function isExternalHref(href, ownHosts) {
  const h = href.trim();
  if (!/^https?:\/\//i.test(h) && !h.startsWith("//")) return false;
  try {
    const host = new URL(h.startsWith("//") ? "https:" + h : h).host.toLowerCase();
    return !ownHosts.some((o) => o && host === o.toLowerCase());
  } catch {
    return false;
  }
}
function externalLinksNewWindow(html, ownHosts) {
  return html.replace(A_TAG, (whole, attrs) => {
    const href = attr(attrs, "href");
    if (href == null || !isExternalHref(href, ownHosts)) return whole;
    const rel = new Set(String(attr(attrs, "rel") || "").split(/\s+/).filter(Boolean).map((x) => x.toLowerCase()));
    rel.add("noopener");
    rel.add("noreferrer");
    let a = setAttr(attrs, "target", "_blank");
    a = setAttr(a, "rel", [...rel].join(" "));
    return `<a${a}>`;
  });
}

// ../core/src/index.ts
var PROTOCOL_VERSION = 1;
var B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = "1" + out;
    else break;
  }
  return out;
}
function b58decode(s) {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("bad base58");
    n = n * 58n + BigInt(i);
  }
  const bytes = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 255n));
    n >>= 8n;
  }
  for (const c of s) {
    if (c === "1") bytes.unshift(0);
    else break;
  }
  return new Uint8Array(bytes);
}
var b64 = {
  enc(u) {
    let s = "";
    for (const b of u) s += String.fromCharCode(b);
    return btoa(s);
  },
  dec(s) {
    const bin = atob(s);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
};
var utf8 = (s) => new TextEncoder().encode(s);
var fromUtf8 = (u) => new TextDecoder().decode(u);
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value;
  return "{" + Object.keys(obj).filter((k) => obj[k] !== void 0).sort().map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}
function newIdentity() {
  const sign2 = import_tweetnacl.default.sign.keyPair();
  const box = import_tweetnacl.default.box.keyPair();
  return {
    id: idFromPublicKey(sign2.publicKey),
    signPublic: b64.enc(sign2.publicKey),
    signSecret: b64.enc(sign2.secretKey),
    boxPublic: b64.enc(box.publicKey),
    boxSecret: b64.enc(box.secretKey)
  };
}
function idFromPublicKey(pk) {
  return "cal:" + b58encode(pk);
}
function publicKeyFromId(id) {
  if (!id.startsWith("cal:")) throw new Error("not a caldera id");
  const pk = b58decode(id.slice(4));
  if (pk.length !== 32) throw new Error("bad id length");
  return pk;
}
function signingBytes(e) {
  return utf8(canonical({ v: e.v, type: e.type, from: e.from, ts: e.ts, body: e.body }));
}
function sign(identity, type, body, ts = (/* @__PURE__ */ new Date()).toISOString()) {
  const unsigned = { v: PROTOCOL_VERSION, type, from: identity.id, ts, body };
  const sig = import_tweetnacl.default.sign.detached(signingBytes(unsigned), b64.dec(identity.signSecret));
  return { ...unsigned, sig: b64.enc(sig) };
}
function verify(e) {
  try {
    if (!e || e.v !== PROTOCOL_VERSION || typeof e.sig !== "string") return false;
    return import_tweetnacl.default.sign.detached.verify(signingBytes(e), b64.dec(e.sig), publicKeyFromId(e.from));
  } catch {
    return false;
  }
}
function envelopeHash(e) {
  return b64.enc(import_tweetnacl.default.hash(utf8(canonical(e)))).slice(0, 43);
}
function seal(plaintext, recipientBoxPublic, sender) {
  const nonce = import_tweetnacl.default.randomBytes(import_tweetnacl.default.box.nonceLength);
  const box = import_tweetnacl.default.box(utf8(plaintext), nonce, b64.dec(recipientBoxPublic), b64.dec(sender.boxSecret));
  return { nonce: b64.enc(nonce), box: b64.enc(box) };
}
function open(sealed, senderBoxPublic, recipient) {
  const out = import_tweetnacl.default.box.open(b64.dec(sealed.box), b64.dec(sealed.nonce), b64.dec(senderBoxPublic), b64.dec(recipient.boxSecret));
  return out ? fromUtf8(out) : null;
}
var ACTIVITY_WEIGHTS = { meetings: 6, emails: 2, prompts: 1, commits: 0.5, notes: 0.25, docs: 1 };
var ACTIVITY_CAPS = { notes: 60, docs: 40, commits: 200 };
function activityScore(c) {
  let s = 0;
  for (const [k, w] of Object.entries(ACTIVITY_WEIGHTS)) {
    s += w * Math.min(c[k] ?? 0, ACTIVITY_CAPS[k] ?? Infinity);
  }
  return Math.round(s);
}
function newId(prefix) {
  return prefix + "_" + b58encode(import_tweetnacl.default.randomBytes(12));
}

// src/auto.ts
var import_obsidian = require("obsidian");
var isoLocal = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function prettyModel(model) {
  const m = model.trim().replace(/-\d{8}$/, "").split("/").pop().replace(/\./g, "-");
  const c = m.match(/^claude-([a-z]+)-(\d+)(?:-(\d+))?/);
  if (c) return `Claude ${c[1][0].toUpperCase()}${c[1].slice(1)} ${c[2]}${c[3] ? "." + c[3] : ""}`;
  const g = m.match(/^gpt-(\d+)(?:-(\d+))?(.*)$/);
  if (g) return `GPT-${g[1]}${g[2] ? "." + g[2] : ""}${g[3] ? " " + g[3].replace(/^-/, "").replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()) : ""}`;
  return m;
}
function providerOf(name) {
  const m = name.toLowerCase();
  if (m.includes("claude")) return "Anthropic";
  if (/^(gpt|o\d|codex)/.test(m)) return "OpenAI";
  if (m.includes("gemini")) return "Google";
  if (m.includes("deepseek")) return "DeepSeek";
  if (m.includes("grok")) return "xAI";
  if (m.includes("llama")) return "Meta";
  if (m.includes("mistral")) return "Mistral";
  return "Other";
}
async function aiUsage(cachePath, windowDays = 45) {
  if (!import_obsidian.Platform.isDesktopApp) return void 0;
  let fs, path, os;
  try {
    fs = window.require("fs");
    path = window.require("path");
    os = window.require("os");
  } catch {
    return void 0;
  }
  const home = os.homedir(), since = Date.now() - (windowDays + 2) * 864e5;
  let cache = {};
  try {
    cache = JSON.parse(await fs.promises.readFile(cachePath, "utf8"));
  } catch {
  }
  const files = [];
  const walk = async (dir, kind, depth) => {
    let ents = [];
    try {
      ents = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && depth > 0) await walk(p, kind, depth - 1);
      else if (e.isFile() && e.name.endsWith(".jsonl")) files.push([p, kind]);
    }
  };
  await walk(path.join(home, ".claude", "projects"), "claude", 2);
  await walk(path.join(home, ".codex", "sessions"), "codex", 4);
  if (!files.length) return void 0;
  const next = {};
  for (const [p, kind] of files) {
    let st;
    try {
      st = await fs.promises.stat(p);
    } catch {
      continue;
    }
    if (st.mtimeMs < since) continue;
    const c = cache[p];
    if (c && c.m === st.mtimeMs && c.s === st.size) {
      next[p] = c;
      continue;
    }
    const t = {}, seen = /* @__PURE__ */ new Set();
    let text = "";
    try {
      text = await fs.promises.readFile(p, "utf8");
    } catch {
      continue;
    }
    let model = "gpt-5";
    for (const line of text.split("\n")) {
      if (kind === "claude") {
        if (!line.includes('"usage"') || !line.includes('"assistant"')) continue;
        try {
          const o = JSON.parse(line), msg = o.message || {}, u = msg.usage;
          if (!u || !msg.model || String(msg.model).startsWith("<") || !o.timestamp || seen.has(msg.id)) continue;
          seen.add(msg.id);
          const n = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
          const d = isoLocal(Date.parse(o.timestamp));
          (t[d] || (t[d] = {}))[msg.model] = (t[d][msg.model] || 0) + n;
        } catch {
        }
      } else {
        if (!line.includes('"turn_context"') && !line.includes('"token_count"')) continue;
        try {
          const o = JSON.parse(line), pl = o.payload || {};
          if (o.type === "turn_context" && pl.model) model = pl.model;
          else if (pl.type === "token_count" && o.timestamp) {
            const n = pl.info?.last_token_usage?.total_tokens || 0;
            if (n) {
              const d = isoLocal(Date.parse(o.timestamp));
              (t[d] || (t[d] = {}))[model] = (t[d][model] || 0) + n;
            }
          }
        } catch {
        }
      }
    }
    next[p] = { m: st.mtimeMs, s: st.size, t };
    await new Promise((r) => window.setTimeout(r, 0));
  }
  try {
    await fs.promises.writeFile(cachePath, JSON.stringify(next));
  } catch {
  }
  const first = isoLocal(Date.now() - (windowDays - 1) * 864e5);
  const days = {}, models = /* @__PURE__ */ new Map();
  for (const f of Object.values(next)) for (const [d, ms] of Object.entries(f.t)) {
    if (d < first) continue;
    for (const [m, n] of Object.entries(ms)) {
      days[d] = (days[d] || 0) + n;
      const k = prettyModel(m);
      models.set(k, (models.get(k) || 0) + n);
    }
  }
  const total = Object.values(days).reduce((a, b) => a + b, 0);
  if (!total) return void 0;
  const prov = /* @__PURE__ */ new Map();
  for (const [m, n] of models) prov.set(providerOf(m), (prov.get(providerOf(m)) || 0) + n);
  return {
    total,
    window_days: windowDays,
    days,
    models: [...models].sort((a, b) => b[1] - a[1]).slice(0, 8),
    providers: [...prov].sort((a, b) => b[1] - a[1]),
    note: "Tokens processed by my AI coding agents (Claude Code, Codex) on this computer, including cached context. Counts only."
  };
}
async function githubCode(links) {
  const gh = links.map((l) => l[1]).map((u) => u.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/)).find(Boolean);
  if (!gh) return void 0;
  const user = gh[1];
  try {
    const r = await (0, import_obsidian.requestUrl)({ url: `https://github.com/users/${user}/contributions`, throw: false });
    if (r.status !== 200) return void 0;
    const html = r.text, byId = /* @__PURE__ */ new Map(), counts = /* @__PURE__ */ new Map();
    for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g)) byId.set(m[2] || m[3], m[1] || m[4]);
    for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*(No|\d[\d,]*) contributions?/g)) {
      const d = byId.get(m[1]);
      if (d) counts.set(d, m[2] === "No" ? 0 : Number(m[2].replace(/,/g, "")));
    }
    if (!counts.size) return void 0;
    const dates = [...counts.keys()].sort(), weekly = [];
    for (let i = 0; i < dates.length; i += 7) weekly.push(dates.slice(i, i + 7).reduce((a, d) => a + (counts.get(d) || 0), 0));
    const commits = [...counts.values()].reduce((a, b) => a + b, 0);
    let repos = 0;
    try {
      const u = await (0, import_obsidian.requestUrl)({ url: `https://api.github.com/users/${user}`, throw: false });
      repos = u.json?.public_repos || 0;
    } catch {
    }
    const start = (/* @__PURE__ */ new Date(dates[0] + "T12:00:00")).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return commits ? { commits, repos, weekly, url: `https://github.com/${user}`, start } : void 0;
  } catch {
    return void 0;
  }
}
function githubUser(links) {
  return links.map((l) => l[1]).map((u) => u.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/)).find(Boolean)?.[1];
}
async function githubCity(user, prev) {
  const own = [];
  for (let pg = 1; pg <= 2; pg++) {
    const r = await (0, import_obsidian.requestUrl)({ url: `https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=100&page=${pg}`, throw: false });
    if (r.status !== 200 || !Array.isArray(r.json)) return void 0;
    own.push(...r.json);
    if (r.json.length < 100) break;
  }
  const old = new Map((Array.isArray(prev?.repos) ? prev.repos : []).map((r) => [r.name, r]));
  const repos = own.filter((r) => !r.fork && !r.private && !r.archived).slice(0, 120).map((r) => {
    const o = old.get(r.name);
    return {
      name: r.name,
      project: r.language || "Other",
      public: true,
      language: r.language || "Other",
      size: r.size,
      pushed: r.pushed_at,
      created: r.created_at,
      url: r.html_url,
      description: (r.description || "").slice(0, 200),
      commits: o?.commits || (r.size ? 1 : 0),
      weeks: o?.weeks || [],
      week: o?.week || 0,
      today: 0
    };
  });
  for (const r of repos.slice(0, 20)) {
    try {
      const w = await (0, import_obsidian.requestUrl)({ url: `https://api.github.com/repos/${user}/${r.name}/stats/commit_activity`, throw: false });
      if (w.status === 200 && Array.isArray(w.json) && w.json.length) {
        const t = w.json.slice(-52).map((x) => x.total || 0);
        r.weeks = t.slice(-12);
        r.commits = Math.max(1, t.reduce((a, b) => a + b, 0));
        r.week = t[t.length - 1];
      }
    } catch {
    }
  }
  return repos.length ? { generated: (/* @__PURE__ */ new Date()).toISOString(), source: `caldera github ${user}`, repos } : void 0;
}
function forgeOf(links) {
  const gh = githubUser(links);
  if (gh) return { kind: "github", host: "github.com", user: gh, url: `https://github.com/${gh}` };
  for (const [label, url] of links) {
    const m = url.match(/^(https?:\/\/[^/\s]+)\/([A-Za-z0-9._-]{1,40})\/?$/);
    if (m && (/forgejo|gitea|codeberg/i.test(label) || /^https?:\/\/(www\.)?codeberg\.org$/i.test(m[1]))) return { kind: "forgejo", host: m[1].replace(/^http:/, "https:"), user: m[2], url: `${m[1]}/${m[2]}` };
  }
  return void 0;
}
var forgeSource = (f) => f.kind === "github" ? `caldera github ${f.user}` : `caldera forgejo ${f.url}`;
var fj = async (f, path) => {
  const r = await (0, import_obsidian.requestUrl)({ url: `${f.host}/api/v1${path}`, headers: { Accept: "application/json" }, throw: false });
  return r.status === 200 ? r : void 0;
};
async function forgejoCode(f) {
  try {
    const h = await fj(f, `/users/${encodeURIComponent(f.user)}/heatmap`);
    if (!h || !Array.isArray(h.json)) return void 0;
    const now = Date.now(), WEEK = 7 * 864e5, weekly = Array(53).fill(0);
    for (const x of h.json) {
      const age = now - Number(x.timestamp) * 1e3;
      if (age >= 0 && age < 53 * WEEK) weekly[52 - Math.floor(age / WEEK)] += Number(x.contributions) || 0;
    }
    const commits = weekly.reduce((a, b) => a + b, 0);
    if (!commits) return void 0;
    const u = await fj(f, `/users/${encodeURIComponent(f.user)}/repos?limit=50`);
    const repos = Array.isArray(u?.json) ? u.json.filter((r) => !r.fork && !r.private).length : 0;
    const start = new Date(now - 52 * WEEK).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { commits, repos, weekly, url: f.url, start };
  } catch {
    return void 0;
  }
}
async function forgejoCity(f, prev) {
  const own = [];
  for (let pg = 1; pg <= 4; pg++) {
    const r = await fj(f, `/users/${encodeURIComponent(f.user)}/repos?limit=50&page=${pg}`);
    if (!r || !Array.isArray(r.json)) {
      if (pg === 1) return void 0;
      break;
    }
    own.push(...r.json);
    if (r.json.length < 50) break;
  }
  const old = new Map((Array.isArray(prev?.repos) ? prev.repos : []).map((r) => [r.name, r]));
  const live = own.filter((r) => !r.fork && !r.private && !r.archived && !r.mirror).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const repos = live.slice(0, 120).map((r) => {
    const o = old.get(r.name);
    return {
      name: r.name,
      owner: r.owner?.login || f.user,
      project: r.language || "Other",
      public: true,
      language: r.language || "Other",
      size: r.size,
      pushed: r.updated_at,
      created: r.created_at,
      url: r.html_url,
      description: (r.description || "").slice(0, 200),
      commits: o?.commits || (r.size ? 1 : 0),
      weeks: o?.weeks || [],
      week: o?.week || 0,
      today: 0
    };
  });
  const now = Date.now(), WEEK = 7 * 864e5, YEAR = 365 * 864e5, q2 = "&stat=false&verification=false&files=false";
  for (const r of repos.slice(0, 20)) {
    try {
      const base = `/repos/${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}/commits?limit=50${q2}`;
      const weeks = Array(12).fill(0);
      let year = 0, ok = false;
      for (let pg = 1; pg <= 10; pg++) {
        const w = await fj(f, `${base}&page=${pg}`);
        if (!w || !Array.isArray(w.json)) break;
        ok = true;
        let older = false;
        for (const c of w.json) {
          const age = now - Date.parse(c.commit?.author?.date || c.created);
          if (!(age >= 0)) continue;
          if (age >= YEAR) {
            older = true;
            continue;
          }
          year++;
          if (age < 12 * WEEK) weeks[11 - Math.floor(age / WEEK)]++;
        }
        if (older || w.json.length < 50) break;
      }
      if (!ok) continue;
      r.weeks = weeks;
      r.week = weeks[11];
      r.commits = Math.max(1, year);
    } catch {
    }
  }
  for (const r of repos) delete r.owner;
  return repos.length ? { generated: (/* @__PURE__ */ new Date()).toISOString(), source: forgeSource(f), repos } : void 0;
}
var KINDS = [
  [/^(person|people|contact|contacts)$/, "People"],
  [/^(company|companies|organization|organisation|org|orgs|organizations)$/, "Companies"],
  [/^(project|projects)$/, "Projects"],
  [/^(source|sources|article|articles|clipping|clippings|paper|papers|reference|references)$/, "Sources"],
  [/^(concept|concepts|idea|ideas|zettel|zettelkasten|permanent)$/, "Ideas & concepts"],
  [/^(book|books|reading)$/, "Books"],
  [/^(meeting|meetings)$/, "Meetings"],
  [/^(daily|dailies|journal|journals|daily-notes|daily notes|daily-digest|diary)$/, "Daily notes"],
  [/^(recipe|recipes)$/, "Recipes"],
  [/^(research)$/, "Research"],
  [/^(course|courses|class|classes|lecture|lectures)$/, "Learning"],
  [/^(podcast|podcasts|video|videos)$/, "Media notes"],
  [/^(tool|tools|software)$/, "Tools"],
  [/^(place|places|travel)$/, "Places"]
];
var kindOf = (v) => {
  const k = String(v ?? "").trim().toLowerCase();
  return (KINDS.find(([rx]) => rx.test(k)) || [])[1];
};
function vaultKinds(app, md) {
  const n = /* @__PURE__ */ new Map();
  for (const f of md) {
    if (f.path.startsWith("Caldera/")) continue;
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    const label = kindOf(fm.type) || kindOf(fm.category) || (/^\d{4}-\d{2}-\d{2}$/.test(f.basename) ? "Daily notes" : void 0) || f.path.split("/").slice(0, -1).map(kindOf).find(Boolean);
    if (label) n.set(label, (n.get(label) || 0) + 1);
  }
  return [...n].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 7);
}

// src/settings.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  hubUrl: "https://caldera.social",
  identity: null,
  handle: "",
  name: "",
  headline: "",
  theme: "dark",
  avatarPath: "",
  bannerPath: "",
  links: [],
  properties: [],
  sections: { journal: true, scoreboard: true, properties: true, numbers: true, topics: true, notes: true, asks: true, social: true, links: true, sidebar: true, rail: true },
  publicTopics: [["ai", "AI"], ["design", "Design"], ["startups", "Startups"], ["investing", "Investing"], ["writing", "Writing"]],
  activityFile: "Caldera/activity.json",
  historyDays: 45,
  inboxFolder: "Caldera/Inbox",
  lastInboxSync: "1970-01-01T00:00:00.000Z",
  asks: [],
  offers: [],
  autoPublishHours: 6,
  welcomed: false,
  listed: true,
  lastSeenRelease: "",
  lastPublished: 0,
  tree: [],
  graph: [],
  backlinks: [],
  summary: "",
  now: [],
  timeline: [],
  projects: [],
  knows: [],
  tabs: [],
  gardenFolder: "Garden",
  gardenUrl: "",
  gardenJournal: true,
  groups: []
};
var WELCOME_NOTE = "Welcome to Caldera - I built it. Glad you're here. If anything breaks or feels confusing, tell me and I'll fix it.";
var groupsFrom = (v) => [...new Set(String(v || "").toLowerCase().split(/[\s,]+/).map((g) => g.replace(/^#/, "")).filter((g) => /^[a-z0-9][a-z0-9-]{1,29}$/.test(g)))].slice(0, 8);
var SECTION_LABELS = {
  journal: "Daily journal (flip through days)",
  scoreboard: "Scoreboard (streak, rank, 30-day bars)",
  properties: "Properties",
  numbers: "Vault numbers (notes, words, links, active days)",
  topics: "Topics (allow-listed tags only)",
  notes: "Notes marked caldera: public",
  asks: "Help exchange (asks and offers)",
  social: "Friends, gravity and credits",
  links: "Links elsewhere",
  garden: "Garden (full pages for notes you plant: Garden folder or caldera: garden)",
  city: "City (your GitHub as a little city: add GitHub | https://github.com/you to Links, or write Caldera/city.json yourself)"
};
var CalderaSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();
    containerEl.createEl("p", { text: "Your vault stays private. Only the sections you switch on below, notes you mark caldera: public, and counts are published. Use 'Preview profile' before publishing.", cls: "setting-item-description" });
    new import_obsidian2.Setting(containerEl).setName("Identity").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Your Caldera ID").setDesc(s.identity ? s.identity.id : "Not created yet").addButton((b) => b.setButtonText(s.identity ? "Copy ID" : "Create identity").onClick(async () => {
      if (!s.identity) {
        await this.plugin.ensureIdentity();
        this.display();
      } else {
        await navigator.clipboard.writeText(s.identity.id);
        new import_obsidian2.Notice("ID copied");
      }
    })).addButton((b) => b.setButtonText("Export recovery key").setDisabled(!s.identity).onClick(async () => {
      await navigator.clipboard.writeText(btoa(JSON.stringify(s.identity)));
      new import_obsidian2.Notice("Recovery key copied. Store it somewhere safe; anyone with it can act as you.");
    }));
    this.text("Handle", "Your address on the hub: hub/@handle", "handle", (v) => v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    let claim = "";
    new import_obsidian2.Setting(containerEl).setName("Import a GitHub sign-up").setDesc("Started your Caldera profile with GitHub on the website? Get a code on your account page (caldera.social/me) and paste it here: your vault takes over that profile (same handle and page) and the hub deletes its copy of the key.").addText((t) => t.setPlaceholder("CAL-...").onChange((v) => {
      claim = v.trim();
    })).addButton((b) => b.setButtonText("Import").onClick(() => this.plugin.importGithub(claim).then((ok) => {
      if (ok) this.display();
    })));
    this.text("Hub", "Where your profile is hosted and friends connect. Self-hosters can point this at their own hub.", "hubUrl");
    new import_obsidian2.Setting(containerEl).setName("List me in the directory").setDesc("Show your profile card on the public People page. Off: your page still works for anyone with the link, but isn't browsable.").addToggle((t) => t.setValue(s.listed !== false).onChange(async (v) => {
      s.listed = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Show my view count").setDesc("Your page shows how many people have viewed it (one per visitor per day). Off: only you see the count, in the bar when you're signed in and in your private view.").addToggle((t) => t.setValue(s.showViews !== false).onChange(async (v) => {
      s.showViews = v;
      await this.plugin.saveSettings();
      this.plugin.queuePublish("profile");
    }));
    new import_obsidian2.Setting(containerEl).setName("Friends and sharing").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Share my page").setDesc("Your link, the picture people see when you post it, and your invite link (you get 25 help credits for each person who joins from it).").addButton((b) => b.setButtonText("Share my page").setCta().setDisabled(!s.handle).onClick(() => this.plugin.openShare()));
    new import_obsidian2.Setting(containerEl).setName("Groups").setDesc(`Comma separated, like producthunt. Each group is a town of everyone's cities at ${s.hubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/g/name, and people in your groups are suggested to you as friends.`).addText((t) => t.setPlaceholder("producthunt, obsidian-pkm").setValue((s.groups || []).join(", ")).onChange(async (v) => {
      s.groups = groupsFrom(v);
      await this.plugin.saveSettings();
      this.plugin.queuePublish("profile");
    }));
    let email = s.summaryEmail || "";
    new import_obsidian2.Setting(containerEl).setName("Email me a daily summary").setDesc("One short email on days something happens: who visited, friend requests, links into your garden. We send a confirmation link first; every email has a one-click unsubscribe. Leave empty and save to turn it off.").addText((t) => t.setPlaceholder("you@example.com").setValue(email).onChange((v) => email = v.trim())).addButton((b) => b.setButtonText("Save").onClick(() => this.plugin.setSummaryEmail(email)));
    new import_obsidian2.Setting(containerEl).setName("Welcome new members").setDesc("For community hosts: send each person who joins Caldera from now on a friend request with the note below (up to 10 a day). Off by default.").addToggle((t) => t.setValue(!!s.welcomeNew).onChange(async (v) => {
      s.welcomeNew = v;
      if (v && !s.welcomeSince) s.welcomeSince = (/* @__PURE__ */ new Date()).toISOString();
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Welcome note").addTextArea((t) => {
      t.setValue(s.welcomeNote || WELCOME_NOTE);
      t.inputEl.rows = 2;
      t.onChange(async (v) => {
        s.welcomeNote = v.trim().slice(0, 200);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Profile").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Edit your page as a note").setDesc("Name, headline, photo, links, topics and sections also live in Caldera/profile.md. Edit it (or ask your AI agent to) and the page republishes itself. Values there win over the fields below.").addButton((b) => b.setButtonText("Open profile file").onClick(() => this.plugin.openProfileFile()));
    this.text("Name", "", "name");
    this.text("Headline", "One line under your name", "headline");
    this.text("Avatar image", "Path in your vault, e.g. Attachments/me.jpg", "avatarPath");
    this.text("Banner image", "Path in your vault", "bannerPath");
    new import_obsidian2.Setting(containerEl).setName("Theme").addDropdown((d) => d.addOptions({ dark: "Dark", light: "Light" }).setValue(s.theme).onChange(async (v) => {
      s.theme = v;
      await this.plugin.saveSettings();
    }));
    this.pairs("Links", "One per line: Label | https://url", "links");
    new import_obsidian2.Setting(containerEl).setName("GitHub username").setDesc("Your public repos become your city, and your contributions your code chart. Refreshed every 6 hours. Same as a GitHub line in Links.").addText((t) => t.setPlaceholder("octocat").setValue(githubUser(s.links || []) || "").onChange(async (v) => {
      const u = v.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/.*$/, "");
      s.links = (s.links || []).filter((l) => !/^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9-]{1,39}\/?$/.test(l[1]));
      if (/^[A-Za-z0-9-]{1,39}$/.test(u)) s.links.push(["GitHub", `https://github.com/${u}`]);
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Forgejo or Codeberg profile").setDesc("Code on Codeberg or your own Forgejo / Gitea server instead? Paste your profile address. Your public repos become your city, and your contributions your code chart. Used when no GitHub username is set.").addText((t) => t.setPlaceholder("https://codeberg.org/you").setValue((s.links || []).find((l) => l[0] === "Forgejo")?.[1] || "").onChange(async (v) => {
      const m = v.trim().replace(/^http:/, "https:").replace(/\/+$/, "").match(/^(https:\/\/[^/\s]+)\/([A-Za-z0-9._-]{1,40})$/);
      s.links = (s.links || []).filter((l) => l[0] !== "Forgejo");
      if (m) s.links.push(["Forgejo", `${m[1]}/${m[2]}`]);
      await this.plugin.saveSettings();
    }));
    this.pairs("Properties", "One per line: key | value (shown as a properties block)", "properties");
    new import_obsidian2.Setting(containerEl).setName("What is public").setHeading();
    for (const [k, label] of Object.entries(SECTION_LABELS)) {
      new import_obsidian2.Setting(containerEl).setName(label).addToggle((t) => t.setValue(s.sections[k] !== void 0 ? !!s.sections[k] : k === "garden" || k === "city").onChange(async (v) => {
        s.sections[k] = v;
        await this.plugin.saveSettings();
      }));
    }
    this.text("Garden folder", "Notes in this folder are published as full pages, with stage and license from their properties. Empty = only notes marked caldera: garden.", "gardenFolder", (v) => v.replace(/^\/+|\/+$/g, ""));
    new import_obsidian2.Setting(containerEl).setName("Grow my garden from my journal").setDesc("Each public project and recurring theme in your daily journal gets a garden page that adds a dated entry whenever it comes up. Uses only journal text that is already public.").addToggle((t) => t.setValue(s.gardenJournal !== false).onChange(async (v) => {
      s.gardenJournal = v;
      await this.plugin.saveSettings();
    }));
    this.text("Existing garden URL", "Optional: a garden you already publish elsewhere (Quartz, Obsidian Publish...). Linked from your page.", "gardenUrl", (v) => /^https:\/\//.test(v) ? v : "");
    this.pairs("Public topics", "Only these tags are counted. One per line: tag | Label", "publicTopics");
    this.text("Activity file", "Optional JSON of daily counts from outside tools (calendar, email, git)", "activityFile");
    new import_obsidian2.Setting(containerEl).setName("My profile tab").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Open my profile when Obsidian starts").setDesc("The My profile tab shows your page built from your vault, plus private sections only you can see (visits, today, on this day, patterns, goals). Switch to Public view to see the live page.").addToggle((t) => t.setValue(!!s.openProfileOnStartup).onChange(async (v) => {
      s.openProfileOnStartup = v;
      await this.plugin.saveSettings();
    })).addButton((b) => b.setButtonText("Open now").onClick(() => this.plugin.openProfileTab()));
    new import_obsidian2.Setting(containerEl).setName("Private web address (Tailscale)").setDesc(createFragment((f) => {
      f.appendText("See your private sections in a browser, on any of your Tailscale devices. Every 10 minutes Obsidian pushes them to your hub, which stores them encrypted and shows them only to your own Tailscale account, never on your public page. Needs a hub with a private address set up for you (self-hosted, or the operator's own profile).");
      if (s.privateUrl) {
        f.createEl("br");
        f.appendText("Your private address: ");
        f.createEl("a", { text: s.privateUrl, href: s.privateUrl });
      }
    })).addToggle((t) => t.setValue(!!s.privateWeb).onChange(async (v) => {
      s.privateWeb = v;
      await this.plugin.saveSettings();
      this.plugin.schedulePrivatePush();
      if (v && !await this.plugin.pushPrivate(true)) {
        s.privateWeb = false;
        await this.plugin.saveSettings();
        this.plugin.schedulePrivatePush();
      }
      this.display();
    }));
    new import_obsidian2.Setting(containerEl).setName("Live traffic on your city").setHeading();
    const sites = s.traffic || [], hub = s.hubUrl.replace(/\/$/, "");
    new import_obsidian2.Setting(containerEl).setName("Show visitors to your own sites in your city").setDesc(sites.length ? "Paste a project's snippet into that site's pages (before </body>). Each visit then rides out of its district as a light, live. Call caldera('signup') or caldera('buy') on the page to mark conversions. Your public city shows only how busy each district is; the numbers stay in your private view and private address." : "Each city district gets a tracking snippet after your next publish (you need a city: add GitHub | https://github.com/you to Links above).");
    for (const site of sites) {
      const snippet = `<script async src="${hub}/t.js" data-site="${site.key}"><\/script>`;
      new import_obsidian2.Setting(containerEl).setName(site.project).setDesc(snippet + (site.public ? "" : "  (unlisted project: shown as Private on your public city)")).addButton((b) => b.setButtonText("Copy snippet").onClick(async () => {
        await navigator.clipboard.writeText(snippet);
        new import_obsidian2.Notice(`Snippet for ${site.project} copied`);
      })).addExtraButton((b) => b.setIcon("key-round").setTooltip("Copy server key (for sending events from your own server: POST " + hub + "/v1/t/" + site.key + "/events)").onClick(async () => {
        if (!site.secret) return void new import_obsidian2.Notice("Publish once to get the server key");
        await navigator.clipboard.writeText(site.secret);
        new import_obsidian2.Notice("Server key copied. Keep it secret: it lets a server send events for this site.");
      }));
    }
    new import_obsidian2.Setting(containerEl).setName("AI agents on your city").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Show your AI agents working in your city").setDesc(s.agentKey ? "Each Claude Code agent you run becomes a drone over the repo it's working in: a beam while it edits, circling while it thinks, parked at Agent HQ blinking amber when it's waiting on you. Copy the setup prompt and paste it into Claude Code on each computer you use. What an agent is working on stays private (your private view and private address); your public city only shows anonymous drones." : "Publish once (with a city) to get your agent key.").addButton((b) => b.setButtonText("Copy setup prompt").setDisabled(!s.agentKey).onClick(async () => {
      await navigator.clipboard.writeText(agentSetupPrompt(hub, s.agentKey));
      new import_obsidian2.Notice("Setup prompt copied. Paste it into Claude Code on each computer you use.");
    }));
    new import_obsidian2.Setting(containerEl).setName("Publishing").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Auto-publish interval (hours)").setDesc("0 = only when you publish manually").addText((t) => t.setValue(String(s.autoPublishHours)).onChange(async (v) => {
      s.autoPublishHours = Math.max(0, Number(v) || 0);
      await this.plugin.saveSettings();
      this.plugin.scheduleAutoPublish();
    }));
  }
  text(name, desc, key, clean = (v) => v) {
    new import_obsidian2.Setting(this.containerEl).setName(name).setDesc(desc).addText((t) => t.setValue(String(this.plugin.settings[key] ?? "")).onChange(async (v) => {
      this.plugin.settings[key] = clean(v.trim());
      await this.plugin.saveSettings();
    }));
  }
  pairs(name, desc, key) {
    new import_obsidian2.Setting(this.containerEl).setName(name).setDesc(desc).addTextArea((t) => {
      t.setValue(this.plugin.settings[key].map((p) => p.join(" | ")).join("\n"));
      t.inputEl.rows = 4;
      t.onChange(async (v) => {
        this.plugin.settings[key] = v.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1]).map((p) => [p[0], p.slice(1).join("|")]);
        await this.plugin.saveSettings();
      });
    });
  }
};
function agentSetupPrompt(hub, k) {
  return `Set up the Caldera agent hook on this computer, so my Caldera city shows what my AI agents are working on.

1. Download ${hub}/agent-hook.mjs to ~/.caldera/agent-hook.mjs (create the folder). Read it first: it reads the hook event from stdin, works out the repo (git remote name) and a short task title, and posts only that to my Caldera hub, with a 1.5 second timeout. It never blocks or changes anything.
2. Write ~/.caldera/agent.json (chmod 600): {"hub": "${hub}", "key": "${k.key}", "secret": "${k.secret}", "machine": "<a short name for this computer>"}
3. In ~/.claude/settings.json, add hooks (keep any existing ones) that run \`node ~/.caldera/agent-hook.mjs\` for UserPromptSubmit, PostToolUse, Stop, Notification and SessionEnd.
4. Test it: echo '{"hook_event_name":"UserPromptSubmit","session_id":"caldera-test-1","cwd":"'$PWD'","prompt":"Testing the Caldera agent hook"}' | node ~/.caldera/agent-hook.mjs and confirm it exits quietly, then send SessionEnd for the same session to clear the test drone.

Keep the key and secret out of any repo.`;
}

// src/collect.ts
var import_obsidian3 = require("obsidian");

// src/assets/theme.css
var theme_default = `/* ============================================================================
   LIVING PROFILE - DESIGN TOKENS
   This is the ONLY file you need to edit to restyle the whole page.
   Every color, font, size, radius and spacing used anywhere comes from here.
   profile.css uses these variables only; it never hard-codes a color.

   Quick recipes:
   - Switch to the light theme:  <html data-theme="light"> in index template,
     or set "theme": "light" in config/profile.json.
   - New accent color:           change --accent (and --accent-soft).
   - Different fonts:            change --font-body / --font-display / --font-mono
                                 (and the Google Fonts link in the template).
   - Tighter / looser layout:    change --space-unit.
   ========================================================================== */

:root {
  /* --- Typography ------------------------------------------------------- */
  --font-body: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-display: 'Source Serif 4', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;

  --text-xs: 11.5px;
  --text-sm: 13.5px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-h2: 26px;
  --text-h1: clamp(34px, 5vw, 46px);
  --leading: 1.65;

  /* --- Spacing & shape -------------------------------------------------- */
  --space-unit: 8px;                       /* everything scales off this */
  --space-1: calc(var(--space-unit) * 0.5);
  --space-2: var(--space-unit);
  --space-3: calc(var(--space-unit) * 1.5);
  --space-4: calc(var(--space-unit) * 2);
  --space-6: calc(var(--space-unit) * 3);
  --space-8: calc(var(--space-unit) * 4);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-round: 999px;

  /* --- Layout ----------------------------------------------------------- */
  --sidebar-width: 250px;
  --rail-width: 300px;
  --content-width: 760px;
  --banner-height: 260px;
  --avatar-size: 112px;
  --banner-focus: 62% 14%;   /* which part of the banner photo stays in view (x y) */

  /* --- Color: dark theme (default) -------------------------------------- */
  --bg: #1C1C1F;           /* page */
  --bg-sunken: #17171A;    /* sidebars */
  --bg-raised: #232327;    /* cards, buttons */
  --bg-tab: #141416;       /* top tab bar */
  --line: #2A2A2E;         /* hairlines */
  --line-strong: #3A3A40;
  --text: #DADADF;
  --text-strong: #F2F2F5;
  --text-muted: #8A8A93;
  --accent: #8B6CF6;       /* links, highlights, graph center */
  --accent-text: #B39DFA;  /* link text on dark */
  --accent-soft: rgba(139, 108, 246, .10);
  --accent-2: #4FB89A;     /* secondary accent (help exchange, gravity) */
  --on-accent: #FFFFFF;
  --chart-bar: var(--accent);
  --chart-bar-quiet: rgba(139, 108, 246, .55);
  --graph-node: #6E6E78;
  --graph-node-hot: var(--accent-text);
  --graph-edge: var(--line-strong);
  /* activity heatmap, empty -> busiest */
  --heat-0: #232327;
  --heat-1: #3A2F66;
  --heat-2: #5B47B0;
  --heat-3: #8B6CF6;
  --heat-4: #C7B8FF;
  --chart-alt: var(--accent-2);  /* second chart color */
}

/* --- Color: light theme ------------------------------------------------- */
:root[data-theme="light"] {
  --bg: #FFFFFF;
  --bg-sunken: #F6F6F7;
  --bg-raised: #F0F0F2;
  --bg-tab: #EDEDF0;
  --line: #E4E4E7;
  --line-strong: #D0D0D6;
  --text: #2B2B30;
  --text-strong: #0D0D10;
  --text-muted: #6E6E78;
  --accent: #6D4AE8;
  --accent-text: #5A38D6;
  --accent-soft: rgba(109, 74, 232, .08);
  --accent-2: #138A6A;
  --graph-node: #A8A8B3;
  --heat-0: #EDEDF0;
  --heat-1: #D9D0FB;
  --heat-2: #B3A1F6;
  --heat-3: #8B6CF6;
  --heat-4: #5A38D6;
}
`;

// src/profile.css.ts
var PROFILE_CSS = '/* ============================================================================\n   LIVING PROFILE - COMPONENTS\n   Layout and components only. No raw colors, fonts or sizes here:\n   everything comes from theme.css. To restyle, edit theme.css.\n   ========================================================================== */\n\n* { box-sizing: border-box; }\nhtml, body { margin: 0; }\nbody {\n  background: var(--bg);\n  color: var(--text);\n  font-family: var(--font-body);\n  font-size: var(--text-md);\n  line-height: var(--leading);\n  -webkit-font-smoothing: antialiased;\n}\na { color: var(--accent-text); text-decoration: none; }\na:hover { text-decoration: underline; }\n.mono { font-family: var(--font-mono); }\n.muted { color: var(--text-muted); }\n\n/* --- Top tab bar ------------------------------------------------------- */\n.tabs {\n  display: flex; align-items: center; gap: var(--space-1);\n  background: var(--bg-tab); border-bottom: 1px solid var(--line);\n  padding: 0 var(--space-3); overflow-x: auto;\n}\n.tab { padding: 10px 14px; font-size: var(--text-sm); color: var(--text-muted); white-space: nowrap; }\n.tab.is-active {\n  color: var(--text); background: var(--bg);\n  border: 1px solid var(--line); border-bottom: 0;\n  border-radius: var(--radius-md) var(--radius-md) 0 0;\n}\n.tabs .spacer { flex: 1; }\n.sync { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); white-space: nowrap; padding-right: var(--space-2); }\n.sync .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--accent-2); margin-right: 6px; animation: pulse 2.4s ease-in-out infinite; }\n\n/* --- Three-column shell ------------------------------------------------ */\n.shell { display: flex; flex-wrap: wrap; align-items: stretch; }\n.sidebar {\n  flex: 0 1 var(--sidebar-width); min-width: 200px;\n  background: var(--bg-sunken); border-right: 1px solid var(--line);\n  padding: var(--space-3) var(--space-2); font-size: var(--text-sm);\n}\n.note { flex: 999 1 560px; min-width: 0; padding-bottom: var(--space-8); }\n.rail {\n  flex: 0 1 var(--rail-width); min-width: 240px;\n  background: var(--bg-sunken); border-left: 1px solid var(--line);\n  padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-4);\n}\n@media (max-width: 900px) {\n  .sidebar { display: none; }\n  .rail { border-left: 0; border-top: 1px solid var(--line); flex-basis: 100%; }\n}\n\n/* --- File tree --------------------------------------------------------- */\n.label { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: .04em; text-transform: uppercase; }\n.tree .label { padding: 0 var(--space-2) var(--space-2); display: block; }\n.side-inner { position: sticky; top: 0; max-height: 100vh; overflow-y: auto; padding-bottom: var(--space-4); scrollbar-width: thin; }\n.tree .label + .toc, .tree .label + .tree-group, .tree .label + .tree-row { margin-top: 0; }\n.toc { margin-bottom: var(--space-4); border-left: 1px solid var(--line); margin-left: var(--space-2); }\n.tree-row { display: flex; align-items: center; gap: 6px; padding: 4px var(--space-2); border-radius: var(--radius-sm); color: var(--text); line-height: 1.35; }\na.tree-row { text-decoration: none; }\na.tree-row:hover, summary.tree-row:hover { background: var(--bg-raised); color: var(--text-strong); text-decoration: none; }\n.tree-row.child { padding-left: calc(var(--space-2) + 18px); color: var(--text-muted); }\n.tree-row.child.is-link { color: var(--text); }\n.tree-row.is-current { background: var(--bg-raised); color: var(--text-strong); box-shadow: inset 2px 0 0 var(--accent); }\n.tree-row > span:first-child { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.tree-row .ext { flex: 0 0 auto; font-size: 11px; color: var(--text-muted); opacity: 0; transition: opacity .15s; }\n.tree-row:hover .ext, .tree-row:focus-visible .ext { opacity: 1; }\n.tree-row .count { flex: 0 0 auto; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }\n.tree-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }\n.toc-row { margin-left: -1px; border-left: 2px solid transparent; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; color: var(--text-muted); padding-left: var(--space-3); }\n.toc-row.is-active { color: var(--text-strong); border-left-color: var(--accent); background: var(--accent-soft); }\n.tree-group > summary { list-style: none; cursor: pointer; user-select: none; }\n.tree-group > summary::-webkit-details-marker { display: none; }\n.tree-row.group .g-name { flex: 1; font-weight: 500; }\n.tree-row.group .caret { flex: 0 0 12px; width: 12px; height: 12px; display: inline-block; }\n.tree-group > summary .caret::before { content: ""; display: block; width: 0; height: 0; margin: 2px 0 0 2px; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid var(--text-muted); transform: rotate(-90deg); transition: transform .15s; }\n.tree-group[open] > summary .caret::before { transform: none; }\n.tree-row.group.leaf .caret::before { content: ""; display: block; width: 5px; height: 5px; margin: 3px 0 0 3px; border-radius: 50%; background: var(--line-strong); }\nhtml { scroll-behavior: smooth; } h2[id], section[id], .pnote[id] { scroll-margin-top: var(--space-4); }\n@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }\n@media (max-width: 900px) {\n  .sidebar.tree { display: block; flex-basis: 100%; min-width: 0; position: sticky; top: 0; z-index: 5; padding: 0; border-right: 0; border-bottom: 1px solid var(--line); }\n  .side-inner { position: static; max-height: none; overflow: visible; padding: 0; }\n  .side-inner > .label, .side-inner > .tree-group, .side-inner > .tree-row { display: none; }\n  .toc { display: flex; overflow-x: auto; gap: 2px; margin: 0; border: 0; padding: 6px var(--space-3); scrollbar-width: none; }\n  .toc-row { white-space: nowrap; border: 0; border-radius: var(--radius-round); padding: 4px 12px; margin: 0; }\n  .side-inner:not(:has(.toc)) { display: none; }\n}\n\n/* --- Banner & title ---------------------------------------------------- */\n.banner { position: relative; height: var(--banner-height); }   /* no overflow:hidden, so the avatar can hang below */\n.banner::after { z-index: 1; }\n.banner img.cover { width: 100%; height: 100%; object-fit: cover; object-position: var(--banner-focus); opacity: .92; display: block; }\n.banner::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, var(--bg) 100%); }\n.banner img.avatar {\n  position: absolute; left: 48px; bottom: calc(var(--avatar-size) * -0.32); z-index: 2;\n  width: var(--avatar-size); height: var(--avatar-size); border-radius: 50%;\n  object-fit: cover; object-position: center 25%; border: 4px solid var(--bg);\n}\n/* No cover photo: the avatar sits above the name instead of hanging off an empty banner */\n.page img.avatar.solo { display: block; width: calc(var(--avatar-size) * .8); height: calc(var(--avatar-size) * .8); border-radius: 50%; object-fit: cover; object-position: center 25%; margin-bottom: var(--space-4);}\n.page { max-width: var(--content-width); margin: 0 auto; padding: calc(var(--space-8) + var(--space-4)) var(--space-8) 0; }\n.crumb { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }\nh1.title { margin: 6px 0 var(--space-4); font-family: var(--font-display); font-weight: 600; font-size: var(--text-h1); color: var(--text-strong); line-height: 1.1; }\nh1.title .caret { color: var(--accent); animation: blink 1s step-end infinite; }\nh2 { font-family: var(--font-display); font-weight: 600; font-size: var(--text-h2); color: var(--text-strong); margin: var(--space-8) 0 var(--space-2); }\n\n/* --- Properties -------------------------------------------------------- */\n.props {\n  display: grid; grid-template-columns: 150px 1fr; gap: 6px 14px;\n  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);\n  padding: 10px 0; margin-bottom: var(--space-6); font-size: var(--text-sm);\n}\n.props dt { font-family: var(--font-mono); font-size: 12.5px; color: var(--text-muted); margin: 0; }\n.props dd { margin: 0; }\n@media (max-width: 560px) { .props { grid-template-columns: 1fr; } .props dd { margin-bottom: 6px; } }\n\n/* --- Callout ----------------------------------------------------------- */\n.callout { border-left: 3px solid var(--accent); background: var(--accent-soft); border-radius: 0 var(--radius-md) var(--radius-md) 0; padding: 12px 16px; margin-bottom: var(--space-6); }\n.callout-title { font-weight: 600; color: var(--accent-text); font-size: var(--text-sm); }\n\n/* --- Lists, tables ----------------------------------------------------- */\nul.bullets { margin: 0; padding-left: 20px; }\nul.bullets li { margin: 4px 0; }\n.query { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); margin-bottom: 6px; }\n.table-wrap { overflow-x: auto; }\ntable.data { width: 100%; border-collapse: collapse; font-size: 14px; }\ntable.data th { text-align: left; padding: 8px; border-bottom: 1px solid var(--line-strong); color: var(--text-muted); font-weight: 500; }\ntable.data td { padding: 8px; border-bottom: 1px solid var(--line); }\ntable.data .num { text-align: right; font-family: var(--font-mono); }\n\n/* --- Commit chart ------------------------------------------------------ */\n.bars { height: 110px; display: flex; gap: 3px; align-items: flex-end; border-bottom: 1px solid var(--line-strong); }\n.bars span { flex: 1; max-width: 28px; background: var(--chart-bar); border-radius: 2px 2px 0 0; transform-origin: bottom; animation: rise 1.1s cubic-bezier(.2,.8,.2,1) both; }\n.bars span.quiet { background: var(--chart-bar-quiet); }\n.bars-legend { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px; }\n\n/* --- Timeline ---------------------------------------------------------- */\n.timeline { position: relative; }\n.timeline .row { display: grid; grid-template-columns: 64px 14px 1fr; gap: 0 12px; padding: 7px 0; position: relative; }\n.timeline .row::before { content: ""; position: absolute; left: calc(64px + 12px + 6px); top: 0; bottom: 0; width: 2px; background: var(--line); }\n.timeline .year { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-muted); padding-top: 2px; font-variant-numeric: tabular-nums; }\n.timeline .dot { position: relative; z-index: 1; width: 10px; height: 10px; margin: 7px 0 0 2px; border-radius: 50%; background: var(--bg); border: 2px solid var(--accent); }\n.timeline .row.same .dot { width: 6px; height: 6px; margin: 9px 0 0 4px; border: 0; background: var(--line-strong); }\n.timeline .what { min-width: 0; }\n.timeline .detail { color: var(--text-muted); font-size: var(--text-sm); margin-top: 2px; }\n.timeline .era { display: flex; align-items: baseline; gap: 10px; margin: var(--space-4) 0 2px; padding-left: calc(64px + 12px + 14px + 12px); }\n.timeline .era:first-child { margin-top: 0; }\n.timeline .era-name { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .06em; text-transform: uppercase; color: var(--accent-text); }\n.timeline .era-range { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }\n@media (max-width: 560px) { .timeline .row { grid-template-columns: 44px 14px 1fr; gap: 0 8px; } .timeline .row::before { left: calc(44px + 8px + 6px); } .timeline .era { padding-left: calc(44px + 8px + 14px + 8px); } }\n\n/* --- Right rail -------------------------------------------------------- */\n.graph svg { width: 100%; height: 240px; display: block; }\n.graph .edge { stroke: var(--graph-edge); stroke-width: 1; }\n.graph .node { fill: var(--graph-node); }\n.graph .node.hot { fill: var(--graph-node-hot); }\n.graph .center { fill: var(--accent); }\n.graph text { fill: var(--text-muted); font-family: var(--font-body); font-size: 8.5px; }\n.graph .float { animation: float 4s ease-in-out infinite; }\n.backlink { padding: 6px 0; border-bottom: 1px solid var(--line); font-size: var(--text-sm); }\n.backlink .ctx { color: var(--text-muted); font-size: 12px; }\n.pulse-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }\n.pulse-cell { background: var(--bg-raised); border-radius: var(--radius-sm); padding: var(--space-2); }\n.pulse-cell .v { font-size: 20px; color: var(--text-strong); }\n.pulse-cell .l { font-size: var(--text-xs); color: var(--text-muted); }\n\n/* --- Help exchange (off by default in config) -------------------------- */\n.hx-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-3); }\n.hx-card { background: var(--bg-raised); border: 1px solid var(--line); border-radius: var(--radius-md); padding: var(--space-4); }\n.hx-row { display: flex; justify-content: space-between; gap: var(--space-2); padding: 6px 0; border-bottom: 1px solid var(--line); font-size: var(--text-sm); }\n.hx-row .bounty { color: var(--accent-2); font-family: var(--font-mono); }\n\n\n/* --- Stat strip -------------------------------------------------------- */\n.stat-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-6); }\n.stat { background: var(--bg); padding: var(--space-3) var(--space-2); }\n.stat .v { font-size: 22px; color: var(--text-strong); font-variant-numeric: tabular-nums; }\n.stat .l { font-size: var(--text-xs); color: var(--text-muted); }\n.small { font-size: var(--text-sm); margin: 0 0 var(--space-2); }\n\n/* --- Activity heatmap -------------------------------------------------- */\n.heat-box { position: relative; }\n.heat-frame { display: flex; gap: 6px; }\n.heat-days { display: grid; grid-template-rows: repeat(7, 12px); gap: 3px; padding-top: 18px; font-family: var(--font-mono); font-size: 10px; line-height: 12px; color: var(--text-muted); }\n.heat-wrap { overflow-x: auto; min-width: 0; }\n.heat-months { position: relative; height: 18px; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }\n.heat-months span { position: absolute; top: 0; white-space: nowrap; }\n.heat { outline: none; border-radius: 3px; width: max-content; }\n.heat:focus-visible { box-shadow: 0 0 0 2px var(--accent); }\n.heat i[data-d] { cursor: pointer; transition: transform .12s ease; }\n.heat i[data-d]:hover, .heat i.is-sel { transform: scale(1.25); box-shadow: 0 0 0 1.5px var(--text-strong); position: relative; z-index: 1; }\n.heat i.is-today { box-shadow: inset 0 0 0 1.5px var(--accent-2); }\n.heat i.is-pin { box-shadow: 0 0 0 1.5px var(--accent); }\n.heat-tip { position: absolute; z-index: 5; transform: translate(-50%, calc(-100% - 8px)); pointer-events: none; white-space: nowrap; background: var(--text-strong); color: var(--bg); font-size: var(--text-xs); font-family: var(--font-mono); padding: 4px 8px; border-radius: var(--radius-sm); box-shadow: 0 4px 14px rgba(0,0,0,.25); }\n.heat-tip::after { content: ""; position: absolute; left: calc(50% + var(--ax, 0px)); bottom: -4px; margin-left: -4px; border: 4px solid transparent; border-bottom: 0; border-top-color: var(--text-strong); }\n.heat-foot { display: flex; flex-wrap: wrap; gap: 6px 16px; justify-content: space-between; align-items: center; margin-top: 8px; }\n.heat-read { font-size: var(--text-sm); color: var(--text-muted); min-height: 1.4em; font-variant-numeric: tabular-nums; }\n.heat-read b { color: var(--text-strong); font-weight: 500; }\n.heat-foot .heat-legend { margin-top: 0; }\n@media (prefers-reduced-motion: reduce) { .heat i[data-d] { transition: none; } }\n.heat { display: grid; grid-template-rows: repeat(7, 12px); grid-auto-flow: column; grid-auto-columns: 12px; gap: 3px; }\n.heat i, .heat-legend i { width: 12px; height: 12px; border-radius: 2px; display: block; background: var(--heat-0); }\n.heat i.l1, .heat-legend i.l1 { background: var(--heat-1); }\n.heat i.l2, .heat-legend i.l2 { background: var(--heat-2); }\n.heat i.l3, .heat-legend i.l3 { background: var(--heat-3); }\n.heat i.l4, .heat-legend i.l4 { background: var(--heat-4); }\n.heat-legend { display: flex; gap: 4px; align-items: center; justify-content: flex-end; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); margin-top: 6px; }\n\n/* --- Two columns, growth line, horizontal bars ------------------------- */\n.two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-6); }\n.growth { width: 100%; height: auto; display: block; }\n.growth .axis { stroke: var(--line-strong); }\n.growth .area { fill: var(--accent-soft); }\n.growth .line { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linejoin: round; stroke-dasharray: 2000; animation: draw 2.6s ease-out both; }\n.growth .now { fill: var(--accent); animation: pulse 2s ease-in-out infinite; }\n.growth text { fill: var(--text-muted); font-family: var(--font-mono); font-size: 11px; }\n.hbar { display: grid; grid-template-columns: 130px 1fr 52px; gap: 10px; align-items: center; font-size: var(--text-sm); padding: 4px 0; }\n.hbar .track { height: 8px; background: var(--bg-raised); border-radius: 4px; overflow: hidden; }\n.hbar .fill { display: block; height: 100%; background: var(--accent); border-radius: 4px; transform-origin: left; animation: grow 1.2s cubic-bezier(.2,.8,.2,1) both; }\n.hbar .fill.alt { background: var(--chart-alt); }\n.hbar .num { text-align: right; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }\n.cols { height: 120px; display: flex; gap: 4px; align-items: flex-end; border-bottom: 1px solid var(--line-strong); margin-top: var(--space-2); }\n.cols span { flex: 1; height: 100%; display: flex; flex-direction: column-reverse; align-items: center; }\n.cols b { display: block; width: 100%; background: var(--chart-alt); border-radius: 2px 2px 0 0; transform-origin: bottom; animation: rise 1s cubic-bezier(.2,.8,.2,1) both; }\n.cols em { font-style: normal; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }\n\n/* --- Topic cloud ------------------------------------------------------- */\n.cloud { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: baseline; }\n.cloud span { color: var(--text-strong); line-height: 1.3; }\n.cloud sup { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-left: 2px; }\n\n@keyframes draw { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }\n@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }\n\n\n/* --- Daily journal ----------------------------------------------------- */\n.journal { background: var(--bg-raised); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-6); overflow: hidden; }\n.j-head { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }\n.j-title { flex: 1; text-align: center; }\n.j-date { font-family: var(--font-display); font-size: 22px; color: var(--text-strong); }\n.j-nav { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line-strong); background: var(--bg); color: var(--text); font-size: 22px; cursor: pointer; }\n.j-nav:disabled { opacity: .3; cursor: default; }\n.j-top { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; }\n.ring-wrap { position: relative; width: 96px; height: 96px; flex: 0 0 96px; }\n.ring { width: 96px; height: 96px; transform: rotate(-90deg); display: block; }\n.ring .trk { fill: none; stroke: var(--line); stroke-width: 9; }\n.ring .val { fill: none; stroke: var(--accent); stroke-width: 9; stroke-linecap: round; transition: stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1); }\n.j-score { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }\n.j-score .v { font-size: 26px; color: var(--text-strong); line-height: 1; }\n.j-score .l { font-size: 10px; color: var(--text-muted); }\n.j-delta { font-family: var(--font-mono); font-size: var(--text-xs); margin-bottom: 4px; }\n.j-headline { flex: 1 1 260px; font-family: var(--font-display); font-size: 21px; color: var(--text-strong); line-height: 1.3; }\n.j-themes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; font-family: var(--font-body); }\n.j-themes span { font-size: var(--text-xs); color: var(--accent-text); background: var(--accent-soft); border-radius: var(--radius-round); padding: 2px 10px; }\n.j-chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; margin: var(--space-4) 0; }\n.chip { background: var(--bg); padding: var(--space-2); }\n.chip .v { font-size: 20px; color: var(--text-strong); font-variant-numeric: tabular-nums; }\n.chip .l { font-size: var(--text-xs); color: var(--text-muted); }\n.chip .dd { font-family: var(--font-mono); font-size: var(--text-xs); min-height: 1em; }\n.up { color: var(--accent-2); } .down { color: var(--text-muted); } .flat { color: var(--text-muted); }\n.j-lists ul { margin-top: 4px; }\n.flip-l { animation: flipL .45s ease both; } .flip-r { animation: flipR .45s ease both; }\n@keyframes flipL { from { opacity: 0; transform: translateX(-24px) rotateY(8deg); } to { opacity: 1; transform: none; } }\n@keyframes flipR { from { opacity: 0; transform: translateX(24px) rotateY(-8deg); } to { opacity: 1; transform: none; } }\n\n/* --- Scoreboard -------------------------------------------------------- */\n.scoreboard { margin-bottom: var(--space-6); }\n.sb-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-3); }\n.sb-stat .v { font-size: 30px; color: var(--text-strong); line-height: 1.1; }\n.sb-stat .v small { font-size: 14px; color: var(--text-muted); }\n.sb-stat .l { font-size: var(--text-xs); color: var(--text-muted); }\n.sb-bars { height: 90px; display: flex; gap: 3px; align-items: flex-end; border-bottom: 1px solid var(--line-strong); }\n.sb-bars span { flex: 1; background: var(--chart-bar-quiet); border-radius: 2px 2px 0 0; transform-origin: bottom; animation: rise 1s cubic-bezier(.2,.8,.2,1) both; }\n.sb-bars span.yday { background: var(--accent); }\n.sb-bars span.today { background: repeating-linear-gradient(45deg, var(--chart-bar-quiet), var(--chart-bar-quiet) 3px, transparent 3px, transparent 6px); }\n.sb-lower { margin-top: var(--space-4); }\n.lb-row { display: grid; grid-template-columns: 26px 1fr auto; gap: 10px; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--line); font-size: var(--text-sm); }\n.lb-row .rank { font-family: var(--font-mono); color: var(--text-muted); }\n.lb-row .num { font-family: var(--font-mono); }\n.lb-row.me .who { color: var(--text-strong); font-weight: 600; }\n.lb-row.empty .who { color: var(--text-muted); border: 1px dashed var(--line-strong); border-radius: var(--radius-sm); padding: 2px 8px; justify-self: start; }\n.sb-how { margin-top: var(--space-3); font-size: var(--text-sm); color: var(--text-muted); }\n.sb-how summary { cursor: pointer; color: var(--accent-text); }\n\n/* --- Footer ------------------------------------------------------------ */\n.foot { margin-top: var(--space-8); padding-top: var(--space-3); border-top: 1px solid var(--line); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }\n\n/* --- Motion (respects reduced-motion) ---------------------------------- */\n@keyframes pulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } }\n@keyframes blink { 50% { opacity: 0; } }\n@keyframes rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }\n@keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(3px,-4px); } }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }\n\n.note { max-width: 100%; }\n.lede { font-size: var(--text-lg); color: var(--text-muted); margin: -8px 0 var(--space-6); }\n.pnote { padding: var(--space-3) 0; border-bottom: 1px solid var(--line); }\n.pn-title { font-family: var(--font-display); font-size: 19px; color: var(--text-strong); }\n.pn-ex { color: var(--text); font-size: var(--text-sm); }\n.pn-date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }\n\n.lb-wrap { position: relative; }\n.lb-row.empty .invite-btn { font: inherit; font-size: var(--text-sm); cursor: pointer; background: transparent; color: var(--accent-text); border: 1px dashed var(--accent); border-radius: var(--radius-sm); padding: 2px 10px; justify-self: start; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }\n.lb-row.empty .invite-btn::before { content: "+"; font-family: var(--font-mono); }\n.lb-row.empty .invite-btn:hover, .lb-row.empty .invite-btn[aria-expanded="true"] { background: var(--accent-soft); border-style: solid; text-decoration: none; }\n.lb-row.empty .invite-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }\n.invite-pop { position: absolute; z-index: 20; width: min(340px, 100%); background: var(--bg-raised); border: 1px solid var(--line-strong); border-radius: var(--radius-md); padding: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.35); }\n.invite-pop .inv-head { display: flex; justify-content: space-between; align-items: start; gap: 8px; }\n.invite-pop .inv-title { font-weight: 600; color: var(--text-strong); font-size: var(--text-sm); }\n.invite-pop .inv-sub { color: var(--text-muted); font-size: var(--text-xs); margin: 2px 0 10px; line-height: 1.45; }\n.invite-pop .inv-close { background: none; border: 0; color: var(--text-muted); font-size: 18px; line-height: 1; cursor: pointer; padding: 0 2px; }\n.invite-pop .inv-link { display: flex; gap: 6px; }\n.invite-pop .inv-url { flex: 1; min-width: 0; font-family: var(--font-mono); font-size: 12px; color: var(--text); background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 6px 8px; }\n.invite-pop button.inv-copy { background: var(--accent); color: var(--bg); border: 0; border-radius: var(--radius-sm); padding: 6px 12px; font: inherit; font-size: var(--text-sm); font-weight: 600; cursor: pointer; }\n.invite-pop .inv-ways { display: flex; gap: 6px; margin-top: 8px; }\n.invite-pop .inv-ways a, .invite-pop .inv-ways button { flex: 1; text-align: center; font: inherit; font-size: var(--text-sm); color: var(--text); background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 6px 0; cursor: pointer; text-decoration: none; }\n.invite-pop .inv-ways a:hover, .invite-pop .inv-ways button:hover { border-color: var(--accent); color: var(--text-strong); text-decoration: none; }\n.invite-pop .inv-status { min-height: 1.2em; margin-top: 6px; font-size: var(--text-xs); color: var(--accent-2); }\n.invite-pop button:focus-visible, .invite-pop a:focus-visible, .invite-pop input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }\n\n/* Heatmap sizing (2026-10-12): cells grow with the column (11-18px), room for the hover zoom, no stray scrollbar */\n.heat-box { container-type: inline-size; }\n.heat-frame { --gap: 3px; --cell: clamp(8px, calc((100cqw - 46px - 25 * var(--gap)) / 26), 18px); }\n@container (max-width: 460px) { .heat-frame { --gap: 2px; } }\n.heat, .heat-days { gap: var(--gap, 3px); }\n.heat-days { grid-template-rows: repeat(7, var(--cell, 12px)); line-height: var(--cell, 12px); }\n.heat-wrap { overflow-x: auto; overflow-y: hidden; padding: 4px; margin: -4px; scrollbar-width: none; }\n.heat-wrap::-webkit-scrollbar { display: none; }\n.heat { grid-template-rows: repeat(7, var(--cell, 12px)); grid-auto-columns: var(--cell, 12px); }\n.heat i { width: var(--cell, 12px); height: var(--cell, 12px); border-radius: 3px; }\n.heat i[data-d]:hover, .heat i.is-sel { transform: scale(1.18); }\n\n/* --- Standard nav: pages block + add-friend --------------------------- */\n.toc.pages .friend-row { color: var(--accent); }\n.toc.pages .friend-row:hover { color: var(--accent); background: var(--accent-soft); }\n.tree-row.group .g-link { color: inherit; text-decoration: none; }\n.tree-row.group .g-link:hover { color: var(--accent); text-decoration: underline; }\n';

// src/garden.ts
var STAGES = ["seedling", "budding", "evergreen"];
var LICENSES = {
  "all-rights": { label: "All rights reserved. Not licensed for AI training.", short: "All rights reserved", ai: false },
  "cc-by": { label: "Creative Commons Attribution 4.0. Reuse with credit.", short: "CC BY 4.0", ai: true, url: "https://creativecommons.org/licenses/by/4.0/" },
  "cc-by-nc": { label: "Creative Commons Attribution-NonCommercial 4.0. Reuse with credit, not commercially.", short: "CC BY-NC 4.0", ai: false, url: "https://creativecommons.org/licenses/by-nc/4.0/" },
  "cc0": { label: "Public domain (CC0). No rights reserved.", short: "CC0", ai: true, url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "ai-licensable": { label: "Available to license for AI training, with the author's permission and payment. Not free to use.", short: "AI-licensable", ai: false }
};
var STAGE_ICON = { seedling: "&#127793;", budding: "&#127807;", evergreen: "&#127795;" };
var STAGE_TIP = { seedling: "Seedling: a rough, early idea", budding: "Budding: taking shape", evergreen: "Evergreen: worked through and stable" };
var normStage = (v) => {
  const s = String(v ?? "").toLowerCase().trim();
  return STAGES.includes(s) ? s : "seedling";
};
var normLicense = (v) => {
  const s = String(v ?? "").toLowerCase().trim();
  return LICENSES[s] ? s : "all-rights";
};
function redact(md) {
  let removed = 0;
  const text = md.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, () => {
    removed++;
    return "[email removed]";
  }).replace(/(?<![\w/.=-])(\+?\d[\d .()-]{8,}\d)(?![\w/])/g, (m) => {
    if ((m.match(/\d/g) || []).length < 10) return m;
    removed++;
    return "[phone removed]";
  });
  return { text, removed };
}
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function parseXLink(target) {
  const m = target.match(/^@([a-z0-9][a-z0-9-]{1,30})\/(.+)$/i);
  return m ? { handle: m[1].toLowerCase(), title: m[2].trim(), slug: slug(m[2]) } : null;
}
function mdToHtml(md, link, image = () => null) {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let para = [];
  let list = null;
  let quote = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inl(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${list.tag}>`);
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote>${mdToHtml(quote.join("\n"), link, image)}</blockquote>`);
      quote = [];
    }
  };
  const flush = () => {
    flushPara();
    flushList();
    flushQuote();
  };
  function inl(t) {
    const tokens = [];
    const keep = (html) => {
      tokens.push(html);
      return `\uE000${tokens.length - 1}\uE000`;
    };
    t = t.replace(/`([^`]+)`/g, (_m, c) => keep(`<code>${esc(c)}</code>`));
    t = t.replace(/!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, (_m, tgt) => {
      const src = image(tgt.trim());
      return src ? keep(`<img src="${esc(src)}" alt="${esc(tgt.trim())}" loading="lazy">`) : "";
    });
    t = t.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(\|([^\]]+))?\]\]/g, (_m, tgt, _h, _p, label) => {
      const text = (label || tgt).trim(), x = parseXLink(tgt.trim());
      const href = link(tgt.trim());
      if (href) return keep(`<a class="${x ? "xlink" : "internal"}" href="${esc(href)}">${esc(text.replace(/^@[^/]+\//, ""))}${x ? `<span class="xl-who">@${esc(x.handle)}</span>` : ""}</a>`);
      return keep(`<span class="unlinked">${esc(text)}</span>`);
    });
    t = t.replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, (_m, alt, u) => keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(alt || "image")}</a>`));
    t = t.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, (_m, label, u) => keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(label)}</a>`));
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, (_m, pre, u) => pre + keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(u)}</a>`));
    let h = esc(t);
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\s][^_]*)_/g, "$1<em>$2</em>").replace(/~~([^~]+)~~/g, "<del>$1</del>").replace(/==([^=]+)==/g, "<mark>$1</mark>");
    return h.replace(/\uE000(\d+)\uE000/g, (_m, i) => tokens[Number(i)]);
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*(```|~~~)(.*)$/);
    if (fence) {
      flush();
      const body = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) body.push(lines[i]);
      out.push(`<pre><code>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^\s*%%/.test(line)) {
      flush();
      if (!/%%.*%%/.test(line)) for (i++; i < lines.length && !lines[i].includes("%%"); i++) ;
      continue;
    }
    const q2 = line.match(/^\s*>\s?(.*)$/);
    if (q2) {
      flushPara();
      flushList();
      quote.push(q2[1].replace(/^\[!(\w+)\][+-]?\s*/, (_m, k) => `**${k.charAt(0).toUpperCase() + k.slice(1)}:** `));
      continue;
    } else flushQuote();
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const lvl = Math.min(6, h[1].length + 1);
      out.push(`<h${lvl}>${inl(h[2])}</h${lvl}>`);
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      out.push("<hr>");
      continue;
    }
    const li = line.match(/^\s*([-*+]|\d+[.)])\s+(\[( |x|X)\]\s+)?(.*)$/);
    if (li) {
      flushPara();
      const tag = /\d/.test(li[1]) ? "ol" : "ul";
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      const box = li[2] ? `<input type="checkbox" disabled${/x/i.test(li[3]) ? " checked" : ""}> ` : "";
      list.items.push(box + inl(li[4]));
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join("\n");
}
function excerptOf(md, n = 200) {
  const para = md.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n/).map((x) => x.replace(/^#+\s.*$/gm, "").replace(/^\s*>\s?/gm, "").trim()).find((x) => x.length > 20) || "";
  return clip(para.replace(/!\[\[[^\]]*\]\]/g, "").replace(/\[\[(?:@[^/\]]+\/)?([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, t, _p, l) => l || t).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`=~]/g, "").replace(/\s+/g, " ").trim(), n);
}
function page(site, title, body, depth, extraHead = "") {
  const up = depth ? "../".repeat(depth) : "";
  const icon = site.icon ? `<link rel="icon" href="${up}${esc(site.icon)}" type="image/png">` : `<link rel="icon" href="${up}assets/favicon.svg" type="image/svg+xml">`;
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">${extraHead}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="${up}assets/theme.css"><link rel="stylesheet" href="${up}assets/profile.css"><link rel="stylesheet" href="${up}assets/garden.css"></head><body>
${body}</body></html>`;
}
var clip = (t, n) => t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "").replace(/[,;:.\s]+$/, "") + "\u2026";
var fmtDate = (iso2) => new Date(iso2).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
var stageBadge = (s) => `<span class="g-stage g-${s}" title="${STAGE_TIP[s]}">${STAGE_ICON[s]} ${s}</span>`;
var licenseLine = (key) => {
  const L = LICENSES[key] || LICENSES["all-rights"];
  return L.url ? `<a href="${L.url}" rel="license noopener" target="_blank">${esc(L.short)}</a>` : esc(L.short);
};
function renderGarden(site, notes, images = {}) {
  if (!notes.length) return {};
  const hub = (site.hub || "https://caldera.social").replace(/\/$/, "");
  const bySlug = new Map(notes.map((n) => [n.slug, n]));
  const byTitle = new Map(notes.map((n) => [n.title.toLowerCase(), n]));
  const back = /* @__PURE__ */ new Map();
  for (const n of notes) for (const o of n.out) if (o !== n.slug && bySlug.has(o)) back.set(o, [...back.get(o) || [], n]);
  const who = site.handle ? `@${site.handle}` : site.name;
  const files = {};
  const tabs = (active) => `<div class="tabs"><a class="tab" href="${active === "index" ? "" : "../"}index.html">${esc(site.name)}.md</a><a class="tab${active === "garden" ? " is-active" : ""}" href="${active === "note" ? "../" : ""}garden.html">Garden</a>${active === "note" ? `<span class="tab is-active">%%TITLE%%</span>` : ""}<span class="spacer"></span></div>`;
  for (const n of notes) {
    const link = (target) => {
      const x = parseXLink(target);
      if (x) return `${hub}/@${x.handle}/n/${x.slug}.html`;
      const hit = byTitle.get(target.split("/").pop().replace(/\.md$/i, "").toLowerCase());
      return hit ? `${hit.slug}.html` : null;
    };
    const img = (target) => images[target] ? `../${images[target]}` : null;
    const body = mdToHtml(n.markdown, link, img);
    const bl = back.get(n.slug) || [];
    const L = LICENSES[n.license] || LICENSES["all-rights"];
    const html = `${tabs("note").replace("%%TITLE%%", esc(n.title))}
<div class="shell">${site.nav ? site.nav(1, `n/${n.slug}.html`) : ""}<main class="note"><div class="g-main"><article class="g-note">
<div class="g-crumbs"><a href="../index.html">${esc(who)}</a> / <a href="../garden.html">Garden</a></div>
<h1 class="g-title">${esc(n.title)}</h1>
<div class="g-meta">${stageBadge(n.stage)}<span>Planted ${fmtDate(n.created)}</span><span>Tended ${fmtDate(n.updated)}</span><span>${n.words.toLocaleString("en-US")} words</span></div>
<div class="g-body">${body}</div>
${bl.length ? `<section class="g-links"><h2>Links to this note</h2>${bl.map((b) => `<a class="g-card" href="${b.slug}.html"><span class="g-card-t">${esc(b.title)}</span><span class="g-card-x">${esc(clip(b.excerpt, 120))}</span></a>`).join("")}</section>` : ""}
<!--caldera:xlinks-->
<footer class="g-foot"><div><b>License:</b> ${licenseLine(n.license)}. ${esc(L.label)}</div>
<div class="g-prov"><b>Provenance:</b> sha256 <code title="${n.sha256}">${n.sha256.slice(0, 16)}</code> of <a href="${n.slug}.md">the published text</a>, listed in <a href="../caldera.json">${esc(who)}'s signed manifest</a>${site.id ? ` (key <code>${esc(site.id.slice(0, 14))}&hellip;</code>)` : ""}. Anyone can check the author and date.</div></footer>
</article></div></main></div>`;
    files[`n/${n.slug}.html`] = page(
      site,
      `${n.title} - ${site.name}`,
      html,
      1,
      `
<meta name="description" content="${esc(n.excerpt)}">${L.ai ? "" : `
<meta name="robots" content="noai, noimageai">`}${L.url ? `
<link rel="license" href="${L.url}">` : ""}`
    );
    files[`n/${n.slug}.md`] = n.markdown;
  }
  const counts = STAGES.map((s) => [s, notes.filter((n) => n.stage === s).length]);
  const sorted = [...notes].sort((a, b) => b.updated.localeCompare(a.updated));
  const idx = `${tabs("garden")}
<div class="shell">${site.nav ? site.nav(0, "garden.html") : ""}<main class="note"><div class="g-main"><div class="g-index">
<div class="g-crumbs"><a href="index.html">${esc(who)}</a> / Garden</div>
<h1 class="g-title">${esc(site.name)}'s garden</h1>
<p class="g-lede">Notes grown in public from an Obsidian vault. Some are seedlings, some are evergreen; all of them keep changing.${site.external ? ` More at <a href="${esc(site.external)}" rel="noopener" target="_blank">${esc(site.external.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>.` : ""}</p>
<!--caldera:gardenhome--><div class="g-filter" role="toolbar" aria-label="Filter by stage"><button class="is-on" data-stage="all">All <span>${notes.length}</span></button>${counts.filter(([, c]) => c).map(([s, c]) => `<button data-stage="${s}">${STAGE_ICON[s]} ${s} <span>${c}</span></button>`).join("")}</div>
<div class="g-list">${sorted.map((n) => `<a class="g-card" data-stage="${n.stage}" href="n/${n.slug}.html"><span class="g-card-t">${esc(n.title)}</span><span class="g-card-x">${esc(n.excerpt)}</span><span class="g-card-m">${stageBadge(n.stage)}<span>Tended ${fmtDate(n.updated)}</span>${n.xlinks.length ? `<span>${n.xlinks.length} link${n.xlinks.length === 1 ? "" : "s"} to other gardens</span>` : ""}</span></a>`).join("")}</div>
</div></div></main></div>
<script>(function(){var b=[].slice.call(document.querySelectorAll('.g-filter button')),c=[].slice.call(document.querySelectorAll('.g-list .g-card'));b.forEach(function(x){x.onclick=function(){b.forEach(function(y){y.classList.toggle('is-on',y===x)});var s=x.getAttribute('data-stage');c.forEach(function(k){k.hidden=s!=='all'&&k.getAttribute('data-stage')!==s})}})})();<\/script>`;
  files["garden.html"] = page(site, `${site.name}'s garden`, idx, 0);
  files["garden.json"] = JSON.stringify({
    name: site.name,
    handle: site.handle,
    external: site.external,
    notes: sorted.map((n) => ({ slug: n.slug, title: n.title, stage: n.stage, license: n.license, created: n.created, updated: n.updated, sha256: n.sha256, words: n.words, xlinks: n.xlinks }))
  }, null, 1);
  files["assets/garden.css"] = GARDEN_CSS;
  return files;
}
function gardenManifest(notes) {
  return notes.map((n) => ({
    slug: n.slug,
    title: n.title,
    stage: n.stage,
    license: n.license,
    created: n.created,
    updated: n.updated,
    sha256: n.sha256,
    words: n.words,
    excerpt: n.excerpt.slice(0, 200),
    xlinks: n.xlinks.map((x) => `${x.handle}/${x.slug}`)
  }));
}
function gardenSection(notes, external) {
  if (!notes.length && !external) return "";
  const sorted = [...notes].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6);
  const counts = STAGES.map((s) => [s, notes.filter((n) => n.stage === s).length]).filter(([, c]) => c);
  return `<h2>Garden</h2><p class="small">${notes.length ? `${notes.length} note${notes.length === 1 ? "" : "s"} grown in public: ${counts.map(([s, c]) => `${STAGE_ICON[s]} ${c} ${s}`).join(" &middot; ")}. ` : ""}${notes.length ? `<a href="garden.html">Garden home: notes, gravity, help credits, asks and offers &rarr;</a>` : ""}${external ? ` ${notes.length ? "Also at" : "My garden:"} <a href="${esc(external)}" rel="noopener" target="_blank">${esc(external.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</p>${sorted.length ? `<div class="g-list g-list-profile">${sorted.map((n) => `<a class="g-card" href="n/${n.slug}.html"><span class="g-card-t">${esc(n.title)}</span><span class="g-card-x">${esc(clip(n.excerpt, 140))}</span><span class="g-card-m">${stageBadge(n.stage)}<span>Tended ${fmtDate(n.updated)}</span></span></a>`).join("")}</div>` : ""}`;
}
var GARDEN_CSS = `/* Caldera garden: note pages + index. Tokens come from theme.css. */
.tabs a.tab { color: var(--text-muted); text-decoration: none; }
.tabs a.tab:hover { color: var(--text); }
.tree-row.group .g-link { color: inherit; text-decoration: none; }
.tree-row.group .g-link:hover { color: var(--accent); text-decoration: underline; }
.shell > .note > .g-main { width: 100%; }
.g-main { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
.g-crumbs { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 10px; }
.g-crumbs a { color: var(--text-muted); }
.g-title { font-family: var(--font-display); font-size: 2.1rem; line-height: 1.15; font-weight: 600; margin: 0 0 12px; color: var(--text-strong); }
.g-lede { color: var(--text-muted); margin: 0 0 18px; }
.g-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; font-size: var(--text-sm); color: var(--text-muted); padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 22px; }
.g-stage { display: inline-flex; align-items: center; gap: 5px; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--line-strong); font-size: var(--text-xs); text-transform: capitalize; color: var(--text); background: var(--bg-raised); white-space: nowrap; }
.g-evergreen { border-color: var(--accent); }
.g-body { font-family: var(--font-display); font-size: 1.12rem; line-height: 1.7; color: var(--text); overflow-wrap: anywhere; }
.g-body h2, .g-body h3, .g-body h4 { font-family: var(--font-display); color: var(--text-strong); margin: 1.6em 0 .5em; line-height: 1.25; }
.g-body p, .g-body ul, .g-body ol, .g-body blockquote, .g-body pre { margin: 0 0 1em; }
.g-body ul, .g-body ol { padding-left: 1.3em; }
.g-body blockquote { border-left: 3px solid var(--accent); padding: 2px 0 2px 16px; color: var(--text-muted); }
.g-body code { font-family: var(--font-mono); font-size: .85em; background: var(--bg-sunken); padding: 1px 5px; border-radius: 4px; }
.g-body pre { background: var(--bg-sunken); padding: 14px; border-radius: var(--radius-md); overflow-x: auto; }
.g-body pre code { background: none; padding: 0; }
.g-body img { max-width: 100%; height: auto; border-radius: var(--radius-md); }
.g-body a.internal { border-bottom: 1px dashed var(--accent-text); text-decoration: none; }
.g-body a.xlink { border-bottom: 1px dashed var(--accent-text); text-decoration: none; }
.g-body .xl-who { font-family: var(--font-body); font-size: .7em; margin-left: 4px; padding: 0 6px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-text); vertical-align: 2px; }
.g-body .unlinked { color: var(--text); }
.g-body mark { background: var(--accent-soft); color: inherit; }
.g-body hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }
.g-links, .g-xlinks { margin-top: 36px; }
.g-links h2, .g-xlinks h2 { font-size: var(--text-sm); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-weight: 600; margin: 0 0 10px; }
.g-list { display: grid; gap: 10px; }
.g-list-profile { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); margin-bottom: 8px; }
.g-card { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--bg-raised); color: var(--text); text-decoration: none; }
.g-card:hover { border-color: var(--accent); text-decoration: none; }
.g-card-t { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--text-strong); }
.g-card-x { font-size: var(--text-sm); color: var(--text-muted); line-height: 1.5; }
.g-card-m { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; font-size: var(--text-xs); color: var(--text-muted); }
.g-card .g-who { color: var(--accent-text); }
.g-filter { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; }
.g-filter button { font: inherit; font-size: var(--text-sm); color: var(--text-muted); background: var(--bg-raised); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; cursor: pointer; text-transform: capitalize; }
.g-filter button span { opacity: .7; margin-left: 2px; }
.g-filter button.is-on { color: var(--text); border-color: var(--accent); }
.g-foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--line); font-size: var(--text-xs); color: var(--text-muted); display: grid; gap: 6px; line-height: 1.5; }
.g-foot code { font-family: var(--font-mono); }
@media (max-width: 600px) { .g-main { padding: 22px 16px 48px; } .g-title { font-size: 1.7rem; } .g-body { font-size: 1.04rem; } }
`;
function journalGarden(days, projects, o = {}) {
  const minP = o.minProjectDays ?? 2, minT = o.minThemeDays ?? 5;
  const sorted = [...days].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)).sort((a, b) => b.date.localeCompare(a.date));
  const names = projects.map((p) => p.trim()).filter((p) => p.length >= 3);
  const rx = (n) => new RegExp(`(^|[^\\w])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`, "i");
  const linkify = (line, self2) => {
    let out2 = line;
    for (const n of names) {
      if (n.toLowerCase() === self2.toLowerCase()) continue;
      const m = out2.match(rx(n));
      if (!m || out2.includes("[[")) continue;
      const i = (m.index || 0) + m[1].length;
      out2 = out2.slice(0, i) + `[[${n}]]` + out2.slice(i + n.length);
    }
    return out2;
  };
  const label = (d) => (/* @__PURE__ */ new Date(d + "T12:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const page2 = (title, hits) => {
    const body = hits.map((h) => `## ${label(h.date)}
${h.lines.map(([k, t]) => `- ${k ? `**${k}:** ` : ""}${linkify(t, title)}`).join("\n")}`).join("\n\n");
    const n = hits.length, stage = n >= 20 ? "evergreen" : n >= 5 ? "budding" : "seedling";
    return {
      title,
      days: n,
      stage,
      created: hits[n - 1].date + "T12:00:00.000Z",
      updated: hits[0].date + "T12:00:00.000Z",
      markdown: `*Grown automatically from my daily journal: each day ${title} comes up, it gets a new entry. Newest first.*

${body}
`
    };
  };
  const out = [];
  for (const p of names) {
    const r = rx(p), hits = [];
    for (const d of sorted) {
      const lines = [];
      if (d.headline && r.test(d.headline)) lines.push(["", d.headline]);
      for (const f of d.focus || []) if (r.test(f)) lines.push(["Focus", f]);
      for (const w of d.wins || []) if (r.test(w)) lines.push(["Win", w]);
      if (lines.length) hits.push({ date: d.date, lines });
    }
    if (hits.length >= minP) out.push(page2(p, hits));
  }
  const themes = /* @__PURE__ */ new Map();
  for (const d of sorted) for (const t of d.themes || []) {
    const k = String(t).trim();
    if (k) themes.set(k, [...themes.get(k) || [], d]);
  }
  const total = sorted.filter((d) => d.headline || d.focus?.length || d.wins?.length).length;
  const picked = [];
  for (const [t, ds] of [...themes].sort((a, b) => b[1].length - a[1].length)) {
    if (names.some((n) => n.toLowerCase() === t.toLowerCase())) continue;
    if (total >= 10 && ds.length > total * 0.7) continue;
    const set = new Set(ds.map((d) => d.date));
    if (picked.some((p) => {
      let both = 0;
      for (const x of set) if (p.has(x)) both++;
      return both / (set.size + p.size - both) >= 0.8;
    })) continue;
    const hits = ds.map((d) => ({ date: d.date, lines: [["", d.headline || ""], ...(d.wins || []).slice(0, 2).map((w) => ["Win", w])].filter(([, x]) => x) })).filter((h) => h.lines.length);
    if (hits.length >= minT) {
      out.push(page2(t, hits));
      picked.push(set);
    }
  }
  return out;
}

// src/city.ts
function noteKind(path, garden) {
  if (garden) return "garden";
  const p = path.toLowerCase();
  if (/(^|\/)(daily|digest|journal|daily-digest)|(^|\/)\d{4}-\d{2}-\d{2}/.test(p)) return "day";
  if (/(^|\/)concepts?\//.test(p)) return "concept";
  if (/(^|\/)(entities|people|companies|orgs?|contacts)\//.test(p)) return "entity";
  if (/(^|\/)(sources?|raw|clippings?|emails?|inbox|transcripts?|meetings?)\//.test(p)) return "source";
  return "note";
}
var PLUMBING = /^(_?index|hot|log|logs?|readme|home|start here|moc|maps? of content|toc|table of contents|inbox|dashboard|overview)$/i;
function underground(all, hubs, gardenSlug, now = Date.now(), max = 320) {
  const notes = all.filter((n) => !PLUMBING.test(n.title.trim()));
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const inb = /* @__PURE__ */ new Map(), DAY3 = 864e5;
  let links = 0;
  for (const n of notes) for (const t of new Set(n.out)) if (byPath.has(t) && t !== n.path) {
    inb.set(t, (inb.get(t) || 0) + 1);
    links++;
  }
  const anchor = /* @__PURE__ */ new Map(), hubOf = new Map(Object.entries(hubs).map(([proj, path]) => [path, proj]));
  for (const [proj, hp] of Object.entries(hubs)) anchor.set(hp, proj);
  for (const n of notes) if (!anchor.has(n.path)) {
    const hs = [...new Set(n.out.filter((t) => hubOf.has(t)))];
    if (hs.length === 1 && (inb.get(n.path) || 0) <= 40) anchor.set(n.path, hubOf.get(hs[0]));
  }
  for (const [proj, hp] of Object.entries(hubs)) for (const t of byPath.get(hp)?.out || []) if (byPath.has(t) && !anchor.has(t) && (inb.get(t) || 0) <= 3) anchor.set(t, proj);
  const outN = (n) => new Set(n.out.filter((t) => byPath.has(t) && t !== n.path)).size;
  const score = (n) => (inb.get(n.path) || 0) * 2 + outN(n) * 0.5 + (anchor.has(n.path) ? 3 : 0) + (hubOf.has(n.path) ? 1e3 : 0) + (now - n.mtime < 2 * DAY3 ? 4 : 0);
  const picked = [...notes].sort((a, b) => score(b) - score(a)).slice(0, max);
  const idx = new Map(picked.map((n, i) => [n.path, i]));
  const nodes = picked.map((n) => {
    const g = gardenSlug(n.title);
    return { t: n.title, p: n.path, k: noteKind(n.path, !!g), n: inb.get(n.path) || 0, o: outN(n), a: Math.max(0, Math.round((now - n.ctime) / DAY3)), m: Math.max(0, Math.round((now - n.mtime) / DAY3)), d: anchor.get(n.path), g };
  });
  const seen = /* @__PURE__ */ new Set(), edges = [];
  const deg = (i) => nodes[i].n + nodes[i].o;
  const cand = [];
  for (const n of picked) for (const t of n.out) {
    const a = idx.get(n.path), b = idx.get(t);
    if (b === void 0 || a === b) continue;
    const k = a < b ? a + ":" + b : b + ":" + a;
    if (!seen.has(k)) {
      seen.add(k);
      cand.push([a, b]);
    }
  }
  cand.sort((x, y) => deg(y[0]) + deg(y[1]) - deg(x[0]) - deg(x[1]));
  edges.push(...cand.slice(0, 1600));
  const sediment = {};
  for (const n of notes) if (!idx.has(n.path)) {
    const k = noteKind(n.path, false);
    sediment[k] = (sediment[k] || 0) + 1;
  }
  const orphans = notes.filter((n) => !inb.get(n.path) && !outN(n)).length;
  return { nodes, edges, total: notes.length, links, orphans, sediment, editedToday: notes.filter((n) => now - n.mtime < DAY3).length };
}
function publicUnderground(u, publicDistricts) {
  const pub = new Set(publicDistricts);
  return { ...u, nodes: u.nodes.map((n) => ({ k: n.g ? "garden" : n.k, n: n.n, o: n.o, a: n.a, m: n.m, d: n.d ? pub.has(n.d) ? n.d : pub.has("Private") ? "Private" : void 0 : void 0, ...n.g ? { t: n.t, g: n.g } : {} })) };
}
var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var num = (v) => Math.max(0, Math.floor(Number(v) || 0));
function parseCityRepos(raw) {
  const rows = Array.isArray(raw?.repos) ? raw.repos : [];
  return rows.filter((r) => r && typeof r.name === "string" && r.name.trim()).slice(0, 300).map((r) => ({
    name: String(r.name).slice(0, 80),
    project: String(r.project || "Other").slice(0, 60),
    public: r.public === true,
    language: String(r.language || "Other").slice(0, 30),
    commits: num(r.commits),
    week: num(r.week),
    today: num(r.today),
    weeks: (Array.isArray(r.weeks) ? r.weeks : []).slice(-12).map(num),
    pushed: typeof r.pushed === "string" ? r.pushed.slice(0, 40) : void 0,
    created: typeof r.created === "string" ? r.created.slice(0, 40) : void 0,
    size: num(r.size),
    url: r.public === true && /^https:\/\//.test(String(r.url || "")) ? String(r.url) : void 0,
    description: r.public === true && r.description ? String(r.description).slice(0, 200) : void 0
  }));
}
function vaultRepos(notes, now = Date.now()) {
  const by = /* @__PURE__ */ new Map(), DAY3 = 864e5;
  for (const n of notes) {
    const parts = n.path.split("/");
    if (parts.length < 2) parts.unshift("Notes");
    const key = parts.slice(0, Math.min(2, parts.length - 1)).join("/");
    const r = by.get(key) || { name: key, project: parts[0], public: false, language: "Notes", commits: 0, weeks: Array(12).fill(0), week: 0, today: 0 };
    const age = (now - n.mtime) / DAY3;
    if (age < 365) r.commits++;
    if (age < 84) r.weeks[11 - Math.floor(age / 7)]++;
    if (age < 7) r.week++;
    if (age < 1) r.today++;
    r.size = (r.size || 0) + 1;
    by.set(key, r);
  }
  return [...by.values()].map((r) => ({ ...r, commits: Math.max(1, r.commits) })).sort((a, b) => b.commits - a.commits).slice(0, 120);
}
function cityData(repos, notes, generated) {
  const by = /* @__PURE__ */ new Map();
  for (const r of repos) by.set(r.project, [...by.get(r.project) || [], r]);
  const districts = [...by.entries()].map(([name, rs]) => {
    const nn = notes(name);
    return { name, notes: nn.n, notePaths: nn.paths.slice(0, 6), repos: rs.sort((a, b) => b.commits - a.commits) };
  }).sort((a, b) => b.repos.reduce((s, r) => s + r.commits, 0) - a.repos.reduce((s, r) => s + r.commits, 0));
  return { generated, districts, private: true };
}
var LOCKED_STEPS = [1, 10, 25, 50, 100, 250, 500, 1e3, 2500, 5e3];
var coarse = (n) => n <= 0 ? 0 : LOCKED_STEPS.reduce((b, s) => n >= s ? s : b, 1);
var locked = (r, project) => ({ name: "", project, public: false, locked: true, language: "Private", commits: coarse(r.commits), weeks: [], week: r.week > 0 ? 1 : 0, today: 0 });
function publicCity(c, publicProjects) {
  const pub = new Set(publicProjects.map((p) => p.toLowerCase()));
  const districts = [], hidden = [];
  for (const d of c.districts) {
    const listed = pub.has(d.name.toLowerCase()) || d.repos.some((r) => r.public);
    if (!listed) {
      hidden.push(...d.repos.map((r) => locked(r, c.kind === "vault" ? "Vault" : "Private")));
      continue;
    }
    districts.push({ name: d.name, notes: pub.has(d.name.toLowerCase()) ? d.notes : 0, repos: d.repos.map((r) => r.public ? r : locked(r, d.name)) });
  }
  if (hidden.length) districts.push({ name: c.kind === "vault" ? "Vault" : "Private", notes: 0, repos: hidden.sort((a, b) => b.commits - a.commits) });
  const all = c.districts.flatMap((d) => d.repos);
  return {
    generated: c.generated,
    kind: c.kind,
    districts,
    private: false,
    totals: { commits: all.reduce((s, r) => s + r.commits, 0), active: all.filter((r) => r.week > 0).length },
    under: c.under ? publicUnderground(c.under, districts.map((d) => d.name)) : void 0
  };
}
function renderCity(site, city) {
  const repos = city.districts.flatMap((d) => d.repos);
  const total = city.totals?.commits ?? repos.reduce((s, r) => s + r.commits, 0), active = city.totals?.active ?? repos.filter((r) => r.week > 0).length, notes = city.districts.reduce((s, d) => s + d.notes, 0);
  const json = JSON.stringify({ ...city, openBase: site.openBase || "" }).replace(/</g, "\\u003c");
  const icon = site.icon ? `<link rel="icon" href="${esc2(site.icon)}" type="image/png">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`;
  const rows = city.districts.map((d) => `<tr><td>${esc2(d.name)}</td><td>${d.repos.length}</td><td>${d.repos.reduce((s, r) => s + r.commits, 0).toLocaleString("en-US")}</td><td>${d.repos.reduce((s, r) => s + r.week, 0)}</td><td>${d.notes}</td></tr>`).join("");
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc2(site.name)}'s city</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css"><style>${CITY_CSS}</style></head><body>
<div class="tabs"><a class="tab" href="index.html">${esc2(site.name)}.md</a><span class="tab is-active">City</span><span class="spacer"></span></div>
<div class="shell">${site.nav ? site.nav(0, "city.html") : ""}<main class="note"><div class="c-main">
<div class="g-crumbs c-crumbs"><a href="index.html">${esc2(site.handle ? "@" + site.handle : site.name)}</a> / City${site.github && /^https:\/\/github\.com\/[\w.-]+\/?$/.test(site.github) ? ` &middot; <a class="c-gh" href="${esc2(site.github)}" target="_blank" rel="noopener">GitHub &#8599;</a>` : ""}</div>
<h1 class="c-title">${esc2(site.name)}'s city</h1>
<p class="c-lede">${city.kind === "vault" ? `Built from ${esc2(site.name)}'s Obsidian vault: every folder is a building, taller means more notes written this year, lit windows mean notes written this week. Folder names stay private.${city.under ? " Go underground to see the notes and the links between them." : ""}` : `Every project is a district and every repo a building: taller means more commits this year, lit windows mean commits this week, a crane means it's being built right now. The houses around each district are the Obsidian notes about that project.${city.private ? " <b>Private view:</b> every repo, including private ones." : repos.some((r) => r.locked) ? " Glass buildings with a padlock are private repos: you can see the city grow, not what's inside." : ""}`}</p>
<div class="c-stats"><div><b>${repos.length}</b><span>buildings</span></div><div><b>${total.toLocaleString("en-US")}</b><span>${city.kind === "vault" ? "notes edited this year" : "commits this year"}</span></div><div><b>${active}</b><span>busy this week</span></div><div><b>${(city.kind === "vault" ? city.under?.total ?? notes : notes).toLocaleString("en-US")}</b><span>${city.kind === "vault" ? "notes in the vault" : "notes in town"}</span></div></div>
<div class="c-stage" id="stage"><canvas id="city" aria-label="Isometric city of ${repos.length} projects"></canvas>
<div class="c-tools"><button id="t-labels" aria-pressed="true">Labels</button><button id="t-sky">Auto</button><button id="t-wx" title="Weather">Weather</button>${city.under ? '<button id="t-under" aria-pressed="false">&#x2B07;<span class="t-txt"> Underground</span></button>' : ""}<button id="t-snd" aria-pressed="false" title="Sound for arrivals, signups and sales (off)">&#x1F507;</button><button id="t-reset">Reset</button><button id="t-pop" aria-label="Pop out a small window" title="Pop out a small window">&#x29C9;<span class="t-txt"> Pop out</span></button><button id="t-full" aria-label="Full screen" title="Full screen">&#x26F6;<span class="t-txt"> Full screen</span></button></div>
<div class="c-toasts" aria-live="polite"></div><div class="c-mininame" aria-hidden="true"><i></i>${esc2(site.name)}</div>
<div class="c-card" id="card" hidden></div><div class="c-hint">Drag to move &middot; scroll or pinch to zoom &middot; tap a building</div></div>
<div class="c-legend"><span><i style="background:#3178C6"></i>TypeScript</span><span><i style="background:#E8C547"></i>JavaScript</span><span><i style="background:#4FB89A"></i>Python</span><span><i style="background:#E07A4F"></i>HTML</span><span><i style="background:#F05138"></i>Swift</span><span><i style="background:#8A8A93"></i>Other</span>${repos.some((r) => r.locked) ? '<span><i style="background:#5C6B86"></i>&#128274; Private</span>' : ""}<span>&#127959; built this week</span><span>&#127968; notes about the project</span></div>
<div class="c-table-wrap"><table class="c-table"><thead><tr><th>District</th><th>Buildings</th><th>Commits this year</th><th>This week</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
${city.generated ? `<p class="c-foot">GitHub counts from ${esc2(new Date(city.generated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}.</p>` : ""}
</div></main></div>
<script type="application/json" id="city-data">${json}<\/script>
<script>${CITY_JS}<\/script></body></html>`;
}
function citySnapshot(city, o) {
  const LANG = { TypeScript: "#3178C6", JavaScript: "#E8C547", Python: "#4FB89A", HTML: "#E07A4F", Swift: "#F05138", CSS: "#6E5BD0", Shell: "#7FB24A", Go: "#2FB5D6", Rust: "#C9744A" };
  const shade = (hex, f2) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, n >> 8 & 255, n & 255].map((v) => Math.round(Math.min(255, v * f2)));
    return `rgb(${c.join(",")})`;
  };
  const TW = 64, TH = 32, ds = city.districts.slice(0, 14);
  const area = ds.reduce((a, d) => {
    const k = Math.max(2, Math.ceil(Math.sqrt(Math.min(d.repos.length, 36))));
    return a + (k + 1) * (k + 1);
  }, 0);
  const maxW = Math.max(8, Math.ceil(Math.sqrt(area) * 1.25));
  const ts = [], blocks = [];
  let x = 1, y = 1, rowH = 0;
  for (const d of ds) {
    const rs = d.repos.slice(0, 36), k = Math.max(2, Math.ceil(Math.sqrt(rs.length)));
    if (x + k > maxW && x > 1) {
      x = 1;
      y += rowH + 1;
      rowH = 0;
    }
    blocks.push({ x, y, k });
    const cells = [];
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) cells.push([x + i, y + j]);
    cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    rs.forEach((r, i) => ts.push({ x: cells[i][0], y: cells[i][1], r }));
    x += k + 1;
    rowH = Math.max(rowH, k);
  }
  const iso2 = (gx, gy) => [(gx - gy) * TW / 2, (gx + gy) * TH / 2];
  const ht = (r) => Math.min(150, 10 + 14 * Math.log2(1 + Math.max(0, r.commits)));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grow = (px, py) => {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  };
  const f = (n) => n.toFixed(1), out = [];
  for (const b of blocks) {
    const p = [iso2(b.x - 0.15, b.y - 0.15), iso2(b.x + b.k - 0.85, b.y - 0.15), iso2(b.x + b.k - 0.85, b.y + b.k - 0.85), iso2(b.x - 0.15, b.y + b.k - 0.85)].map(([px, py]) => [px, py + TH / 2]);
    p.forEach(([px, py]) => grow(px, py));
    out.push(`<polygon class="cp-pad" points="${p.map((q2) => q2.map(f).join(",")).join(" ")}"/>`);
  }
  ts.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  let win = 0;
  for (const t of ts) {
    const [cx, c0] = iso2(t.x, t.y), cy = c0 + TH / 2, a = TW / 2 * 0.62, b = TH / 2 * 0.62, h = ht(t.r);
    const col = t.r.locked ? "#5C6B86" : LANG[t.r.language] || "#8A8A93";
    const P = (pts) => pts.map((q2) => q2.map(f).join(",")).join(" ");
    grow(cx - a, cy - h - b);
    grow(cx + a, cy + b);
    out.push(`<polygon fill="${shade(col, 0.62)}" points="${P([[cx - a, cy - h], [cx, cy + b - h], [cx, cy + b], [cx - a, cy]])}"/><polygon fill="${shade(col, 0.82)}" points="${P([[cx + a, cy - h], [cx, cy + b - h], [cx, cy + b], [cx + a, cy]])}"/><polygon fill="${shade(col, 1.08)}" points="${P([[cx, cy - b - h], [cx + a, cy - h], [cx, cy + b - h], [cx - a, cy - h]])}"/>`);
    const busy2 = t.r.week > 0, rows = Math.min(8, Math.floor((h - 6) / 9));
    for (let k = 0; k < rows; k++) for (const u of [0.3, 0.7]) {
      const wx = cx + a * u, wy = cy + b * (1 - u) - 6 - k * 9;
      const lit = busy2 && (t.x * 7 + t.y * 3 + k + (u > 0.5 ? 1 : 0)) % 3 !== 0;
      out.push(`<polygon class="${lit ? `cp-w cp-on${win++ % 5}${t.r.locked ? " cp-cool" : ""}` : "cp-w"}" points="${P([[wx - 2.5, wy + 1.2], [wx + 2.5, wy - 1.2], [wx + 2.5, wy - 4.8], [wx - 2.5, wy - 2.4]])}"/>`);
    }
  }
  const pad = 18, vb = `${f(minX - pad)} ${f(minY - pad)} ${f(maxX - minX + pad * 2)} ${f(maxY - minY + pad * 2)}`;
  const repos = city.districts.flatMap((d) => d.repos), total = city.totals?.commits ?? repos.reduce((a, r) => a + r.commits, 0), busy = city.totals?.active ?? repos.filter((r) => r.week > 0).length;
  const e = (v) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  return `<style>.city-peek{display:block;position:relative;margin:18px 0 26px;border-radius:12px;overflow:hidden;text-decoration:none;color:#E8EEF8;background:radial-gradient(ellipse at 50% 120%,#1d2b4a 0%,#0c1222 60%,#080b14 100%);border:1px solid rgba(140,170,220,.18);transition:border-color .2s,transform .2s}
.city-peek:hover{border-color:rgba(140,190,255,.5);transform:translateY(-1px)}.city-peek svg{display:block;width:100%;height:auto;max-height:300px}
.cp-pad{fill:rgba(120,150,210,.10);stroke:rgba(140,170,230,.22);stroke-width:1}.cp-w{fill:rgba(10,16,30,.55)}[class*=cp-on]{fill:#FFD98A;animation:cpw 4s ease-in-out infinite}
.cp-on1{animation-delay:-.8s}.cp-on2{animation-delay:-1.6s}.cp-on3{animation-delay:-2.4s}.cp-on4{animation-delay:-3.2s}@keyframes cpw{0%,100%{opacity:1}50%{opacity:.35}}
.cp-cool{fill:#BFD8FF}@media (prefers-reduced-motion:reduce){[class*=cp-on]{animation:none}}
.cp-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;padding:28px 16px 12px;background:linear-gradient(transparent,rgba(6,9,18,.88));font:500 13px/1.3 "IBM Plex Sans",system-ui,sans-serif}
.cp-bar b{font-size:15px}.cp-bar .cp-go{color:#9CC4FF;white-space:nowrap}.cp-bar .cp-n{opacity:.75}
.city-peek.sky-dawn{background:linear-gradient(#3A4A7E,#E0899A 62%,#FFCB8E)}.city-peek.sky-day{background:linear-gradient(#7FB8EA,#CFE6F7 66%,#EAF4FB)}
.city-peek.sky-dusk{background:linear-gradient(#3E3A6E,#C8607A 60%,#F4B26B)}.city-peek.sky-evening{background:linear-gradient(#0B0E2A,#23285A 60%,#4A3F7A)}
.city-peek.sky-day .cp-pad,.city-peek.sky-dawn .cp-pad{fill:rgba(70,110,70,.22);stroke:rgba(50,90,60,.35)}
.city-peek.sky-day [class*=cp-on]{fill:rgba(205,228,250,.95);animation:none}.city-peek.sky-day .cp-w{fill:rgba(40,60,90,.45)}.city-peek.sky-dawn [class*=cp-on]{fill:#FFE2A8}</style>
<a class="city-peek" href="${e(o.href || "city.html")}" aria-label="Open ${e(o.name)}'s city"><svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">${out.join("")}</svg>
<span class="cp-bar"><span><b>${e(o.name)}'s city</b> <span class="cp-n">&middot; ${repos.length} building${repos.length === 1 ? "" : "s"} &middot; ${total.toLocaleString("en-US")} ${city.kind === "vault" ? `note${total === 1 ? "" : "s"} edited` : `commit${total === 1 ? "" : "s"}`} this year${busy ? ` &middot; ${busy} busy this week` : ""}</span></span><span class="cp-go">Explore the city &rarr;</span></span></a><script>(function(a){var d=new Date(),m=d.getHours()*60+d.getMinutes(),k=m<345?'':m<450?'dawn':m<1042?'day':m<1140?'dusk':m<1237?'evening':'';if(a&&k)a.classList.add('sky-'+k)})(document.currentScript&&document.currentScript.previousElementSibling)<\/script>`;
}
var CITY_CSS = `
.c-main{max-width:1100px;margin:0 auto;padding:28px 20px 64px}
.c-crumbs{font-size:var(--text-sm);color:var(--text-muted);margin-bottom:6px}.c-crumbs a{color:var(--text-muted)}.c-crumbs a.c-gh{color:var(--accent-text,#B9A6FF)}
.c-title{font-family:var(--font-serif,'Source Serif 4',Georgia,serif);font-size:2.1rem;margin:0 0 8px;color:var(--text-strong)}
.c-lede{color:var(--text-muted);max-width:70ch;margin:0 0 16px}
.c-stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.c-stats div{flex:1 1 120px;background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:10px 14px;display:flex;flex-direction:column}
.c-stats b{font-size:1.5rem;font-variant-numeric:tabular-nums;color:var(--text-strong)}.c-stats span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.c-stage{position:relative;height:min(72vh,720px);min-height:420px;border-radius:var(--radius-md,10px);overflow:hidden;border:1px solid rgba(61,242,255,.35);box-shadow:0 0 24px rgba(61,242,255,.12);background:#010207;touch-action:none}
.c-stage canvas{width:100%;height:100%;display:block;cursor:grab}.c-stage canvas.c-link{cursor:pointer}.c-stage canvas.drag{cursor:grabbing}
.c-tools{position:absolute;top:10px;right:10px;display:flex;gap:6px}
.c-tools button{font:500 12px var(--font-mono,'IBM Plex Mono',monospace);padding:5px 10px;border-radius:999px;border:1px solid rgba(61,242,255,.45);background:rgba(2,6,12,.8);color:#BFF8FF;cursor:pointer}
.c-tools button[aria-pressed="false"]{opacity:.6}
.c-under{position:absolute;left:10px;bottom:10px;width:min(300px,calc(100% - 20px));background:rgba(2,6,12,.86);border:1px solid rgba(181,140,255,.45);border-radius:10px;padding:8px 10px;color:#E3DAFF;font:12px/1.45 var(--font-mono,'IBM Plex Mono',monospace)}
.c-under b{color:#fff}.c-under{cursor:pointer}.c-under.c-min>:not(.uh){display:none}.c-under.c-min,.c-live.c-min{width:auto}.c-under .chev,.c-live .chev{float:right;opacity:.7;margin-left:8px}.c-under .lg{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:4px;color:#A99BD0}.c-under .lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:0}
.c-stage.c-dig .c-hint{display:none}
.c-stage.c-full{position:fixed;inset:0;z-index:9999;height:100%;min-height:0;border-radius:0;border:0}
.c-stage:fullscreen{height:100%;border-radius:0;border:0}
/* arrivals: toasts for signups and sales */
.c-toasts{position:absolute;left:10px;top:48px;z-index:3;display:flex;flex-direction:column;gap:6px;pointer-events:none;max-width:calc(100% - 20px)}
.c-toast{font:600 12px/1.3 var(--font-mono,'IBM Plex Mono',monospace);padding:6px 11px;border-radius:9px;background:rgba(2,6,12,.9);color:#fff;border:1px solid #FF4FD8;box-shadow:0 0 14px rgba(255,79,216,.45);animation:ctin .35s ease-out,ctout .6s ease-in 4.6s forwards;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c-toast.buy{border-color:#FFD23F;box-shadow:0 0 14px rgba(255,210,63,.5)}
@keyframes ctin{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:none}}@keyframes ctout{to{opacity:0;transform:translateY(-6px)}}
html.c-mini .c-toasts{left:6px;top:6px}html.c-mini .c-toast{font-size:10.5px;padding:4px 8px}
/* mini: the pop-out window (city.html#mini, the watch page, or a picture-in-picture window): just the city, filling the window */
.c-mininame{display:none}
html.c-mini,html.c-mini body{height:100%;overflow:hidden;background:#010207}
html.c-mini .c-stage{position:fixed;inset:0;z-index:2147483000;height:100%;min-height:0;border:0;border-radius:0;box-shadow:none}
html.c-mini .c-hint,html.c-mini #t-pop,html.c-mini #t-full{display:none}
html.c-mini .c-tools{top:6px;right:6px;opacity:0;transition:opacity .2s}html.c-mini .c-stage:hover .c-tools{opacity:1}html.c-mini .c-tools .t-txt{display:none}
html.c-mini .c-tools button{padding:3px 8px;font-size:11px}
.c-today{position:absolute;left:10px;bottom:10px;z-index:2;padding:4px 10px;border-radius:999px;background:rgba(8,12,22,.72);color:#E6F6FF;font:500 12px/1.3 'IBM Plex Mono',ui-monospace,monospace;pointer-events:none;backdrop-filter:blur(4px)}
html.c-mini .c-today{display:none}
.c-stage:not(.c-dig) .c-hint~.c-today{bottom:42px}@media (max-width:600px){.c-stage:not(.c-dig) .c-hint~.c-today{bottom:10px}}
.c-setup{position:relative;margin:10px 0 4px;padding:10px 40px 10px 14px;border:1px solid var(--line,#2A2A2F);border-radius:var(--radius-md,10px);background:var(--bg-raised,#18181B);font-size:var(--text-sm,14px);color:var(--text,#E6E6EA)}
.c-su-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:3px 0}.c-su-row span{flex:1 1 260px;color:var(--text-muted,#9A9AA6)}
.c-setup button{cursor:pointer;font:inherit;font-size:13px;border-radius:999px;border:1px solid var(--line,#2A2A2F);background:transparent;color:var(--accent-text,#B9A6FF);padding:3px 12px}
.c-setup .c-su-go{border-color:var(--accent,#8B6CF6)}.c-setup .c-su-x{position:absolute;top:6px;right:8px;border:0;color:var(--text-muted,#9A9AA6);font-size:18px;padding:0 6px}
.c-su-panel{margin-top:8px;padding-top:8px;border-top:1px solid var(--line,#2A2A2F)}.c-su-panel p{margin:0 0 8px;color:var(--text-muted,#9A9AA6)}
.c-su-site{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:6px 0}.c-su-site b{min-width:120px}.c-su-site code{flex:1 1 280px;font:12px/1.4 'IBM Plex Mono',ui-monospace,monospace;background:var(--bg-sunken,#0E0E11);border-radius:6px;padding:5px 8px;overflow-x:auto;white-space:nowrap}
.c-setup .c-su-ai{margin-top:4px;background:var(--accent,#8B6CF6);color:#fff;border-color:transparent}
html.c-mini .c-live{right:6px;bottom:6px;font-size:10.5px;padding:5px 8px}
html.c-mini .c-mininame{display:flex;align-items:center;gap:6px;position:absolute;left:8px;bottom:7px;font:500 11px var(--font-mono,'IBM Plex Mono',monospace);color:rgba(191,248,255,.78);letter-spacing:.04em;pointer-events:none;text-shadow:0 1px 3px #000}
html.c-mini .c-mininame i{width:6px;height:6px;border-radius:50%;background:#3DF2FF;box-shadow:0 0 6px #3DF2FF}
.c-hint{position:absolute;left:10px;bottom:10px;font:12px var(--font-sans,sans-serif);color:rgba(232,232,238,.75);background:rgba(14,19,32,.6);padding:4px 8px;border-radius:6px;pointer-events:none}
.c-card{position:absolute;left:10px;top:10px;width:min(300px,calc(100% - 20px));max-height:calc(100% - 60px);overflow:auto;background:rgba(18,22,34,.94);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;color:#E8E8EE;font:13px/1.45 var(--font-sans,'IBM Plex Sans',sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.c-card h3{margin:0 0 2px;font-size:15px;color:#fff}.c-card .k{color:#9A9AA6;font-size:12px}.c-card a{color:#B9A6FF}
.c-card .row{display:flex;justify-content:space-between;gap:8px;margin-top:4px}.c-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#9A9AA6;font-size:16px;cursor:pointer}
.c-card .sp{display:flex;align-items:flex-end;gap:2px;height:28px;margin:8px 0 2px}.c-card .sp i{flex:1;background:#8B6CF6;border-radius:2px 2px 0 0;min-height:2px}
.c-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 18px;font-size:var(--text-sm);color:var(--text-muted)}
.c-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.c-table-wrap{overflow-x:auto}.c-table{width:100%;border-collapse:collapse;font-size:var(--text-sm);font-variant-numeric:tabular-nums}
.c-table th,.c-table td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line)}.c-table th{color:var(--text-muted);font-weight:500}
.c-foot{font-size:var(--text-xs,12px);color:var(--text-muted);margin-top:12px}
.c-live{position:absolute;right:10px;bottom:10px;width:min(260px,calc(100% - 20px));max-height:46%;overflow:hidden;background:rgba(2,6,12,.86);border:1px solid rgba(61,242,255,.4);border-radius:10px;padding:8px 10px;color:#CFEFFF;font:12px/1.4 var(--font-mono,'IBM Plex Mono',monospace);box-shadow:0 0 18px rgba(61,242,255,.12)}
.c-live .h{display:flex;align-items:center;gap:6px;color:#fff;font-weight:600;letter-spacing:.06em;margin-bottom:4px}.c-live .dot{width:7px;height:7px;border-radius:50%;background:#FF3B5C;box-shadow:0 0 8px #FF3B5C;animation:clive 1.6s infinite}
.c-live .r{display:flex;justify-content:space-between;gap:8px;padding:2px 0;border-top:1px solid rgba(61,242,255,.12)}.c-live .r span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c-live .r b{color:#fff;font-weight:600;white-space:nowrap}
.c-live .m{color:#7FA6B8}.c-live .s{font-size:11px;padding-bottom:2px}.c-live .bar{display:inline-block;height:6px;border-radius:3px;background:#3DF2FF;box-shadow:0 0 6px #3DF2FF;vertical-align:1px}.c-live .lg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 4px 0 8px;vertical-align:0}.c-live .lg i:first-child{margin-left:0}
@keyframes clive{50%{opacity:.35}}
.c-live .h{cursor:pointer}.c-live.c-min>:not(.h){display:none}.c-live.c-min .h{margin:0}
.c-live .q{font-size:11px;padding-top:3px;border-top:1px solid rgba(61,242,255,.12)}
@media (max-width:600px){.c-live{max-height:none;font-size:11px}.c-hint{display:none}.c-tools .t-txt{display:none}}
@media (max-width:600px){.c-main{padding:20px 16px 48px}.c-title{font-size:1.7rem}.c-stage{height:62vh;min-height:360px}}
`;
var CITY_JS = String.raw`(function(){
var D=JSON.parse(document.getElementById('city-data').textContent);
var cv=document.getElementById('city'),st=document.getElementById('stage'),cx=cv.getContext('2d'),card=document.getElementById('card');
var TW=64,TH=32,LANG={TypeScript:'#3178C6',JavaScript:'#E8C547',Python:'#4FB89A',HTML:'#E07A4F',Swift:'#F05138',CSS:'#6E5BD0',Shell:'#7FB24A',Go:'#2FB5D6',Rust:'#C9744A'};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var hr=new Date().getHours(),night=hr<6||hr>=19,labels=true;
var MINI=/[#&]mini\b/.test(location.hash)||window.CALDERA_MINI===1;if(MINI){document.documentElement.classList.add('c-mini');labels=false}
function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
function hash(t){var h=0;for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;r=Math.round(Math.min(255,r*f));g=Math.round(Math.min(255,g*f));b=Math.round(Math.min(255,b*f));return 'rgb('+r+','+g+','+b+')'}
var now=Date.now(),DAY=864e5;
// ---- layout: districts are square blocks packed in rows with 1-tile roads between them
var blocks=[],tiles={},W=0,H=0,x=1,y=1,rowH=0;
var area=D.districts.reduce(function(s,d){var n=d.repos.length+Math.ceil(Math.min(d.notes,40)/4);var k=Math.max(2,Math.ceil(Math.sqrt(n)));return s+(k+1)*(k+1)},0);
var maxW=Math.max(8,Math.ceil(Math.sqrt(area)*1.25));
D.districts.forEach(function(d){
  var houses=Math.min(d.notes,40),need=d.repos.length+Math.ceil(houses/4),k=Math.max(2,Math.ceil(Math.sqrt(need)));
  if(x+k>maxW&&x>1){x=1;y+=rowH+1;rowH=0}
  var b={d:d,x:x,y:y,k:k};blocks.push(b);
  var cells=[];for(var j=0;j<k;j++)for(var i=0;i<k;i++)cells.push([x+i,y+j]);
  cells.sort(function(a,c){return (a[0]+a[1])-(c[0]+c[1])});   // biggest towers at the back
  d.repos.forEach(function(r,i){var c=cells[i];tiles[c[0]+','+c[1]]={t:'b',r:r,d:d}});
  var hi=d.repos.length,left=houses;
  while(left>0&&hi<cells.length){var c=cells[hi++];var n=Math.min(4,left);left-=n;tiles[c[0]+','+c[1]]={t:'h',n:n,d:d}}
  for(;hi<cells.length;hi++){var c2=cells[hi];tiles[c2[0]+','+c2[1]]={t:'p',d:d}}
  x+=k+1;rowH=Math.max(rowH,k);W=Math.max(W,x);H=Math.max(H,y+rowH+1);
});
W=Math.max(W,maxW)+1;H+=1;
function near(i,j){for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++){var n=tiles[(i+a)+','+(j+b)];if(n&&(n.t==='b'||n.t==='h'||n.t==='p'))return true}return false}
for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var key=i+','+j;if(!tiles[key])tiles[key]={t:(i===0||j===0||i===W||j===H)?'g':near(i,j)?'r':'g'}}
// ---- buildings
var maxC=1;D.districts.forEach(function(d){d.repos.forEach(function(r){maxC=Math.max(maxC,r.commits)})});
function bh(r){return 16+Math.min(230,Math.round(34*Math.log2(1+r.commits/8)))}
var maxH=0,ranked=[];D.districts.forEach(function(d){d.repos.forEach(function(r){maxH=Math.max(maxH,bh(r));ranked.push(r)})});
ranked.sort(function(a,b){return (b.week*20+b.commits)-(a.week*20+a.commits)});var topSet=ranked.slice(0,12);
function dormant(r){return r.pushed&&now-Date.parse(r.pushed)>60*DAY&&!r.week}
// ---- view
var dpr=1,vw=0,vh=0,cam={x:0,y:0,z:1};
function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}
function fit(){var r=st.getBoundingClientRect();dpr=window.devicePixelRatio||1;vw=r.width;vh=r.height;cv.width=vw*dpr;cv.height=vh*dpr;
  var spanX=(W+H)*TW/2+TW,spanY=(W+H)*TH/2+maxH+40;cam.z=Math.min(1.6,Math.max(.3,Math.min(vw/spanX,vh/spanY)*.98));
  var c=iso(W/2,H/2);cam.x=vw/2-c.x*cam.z;cam.y=vh/2-c.y*cam.z+(maxH/2)*cam.z;
  if(under){var y0=iso(0,0).y-maxH*.6,y1=iso(W,H).y+DROP+DSPAN+20;cam.z=Math.min(1.4,Math.max(.25,Math.min(vw/spanX,vh/(y1-y0))*.96));cam.x=vw/2-c.x*cam.z;cam.y=vh/2-((y0+y1)/2)*cam.z}
  dirty=true;UDIRTY=true}
// ---- cars wander the roads
var roads=[];for(var k in tiles)if(tiles[k].t==='r'){var p=k.split(',');roads.push([+p[0],+p[1]])}
var traffic=D.districts.reduce(function(s,d){return s+d.repos.reduce(function(a,r){return a+r.week},0)},0);
var cars=[];for(var c=0;c<Math.min(70,4+Math.round(traffic/6))&&roads.length;c++){var s=roads[Math.floor(rnd(c+1)*roads.length)];cars.push({i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][c%5]})}
// ---- live traffic on the owner's own sites (polled from the hub, or posted in by Obsidian): every visitor rides out of
// their district as a light (white), signups pulse pink, purchases fire a gold beam. Public pages get activity levels only.
var LV={d:{},seen:'',mode:''},vis=[],pulses=[],VCOL='#FFFFFF',SCOL='#FF4FD8',BCOL='#FFD23F';
var byName={};blocks.forEach(function(b){byName[b.d.name]=b});
function exits(b){if(b.ex)return b.ex;b.ex=[];for(var j=b.y-1;j<=b.y+b.k;j++)for(var i=b.x-1;i<=b.x+b.k;i++)if(isRoad(i,j))b.ex.push([i,j]);return b.ex}
function spawn(b,col,fast){var ex=exits(b);if(!ex.length||vis.length>160)return;var s=ex[Math.floor(Math.random()*ex.length)];
  var v={i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:col,b:b,born:performance.now(),life:14000+Math.random()*9000,sp:fast?.06:.045};step(v);vis.push(v)}
function pulse(b,col,big){var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5);pulses.push({x:p.x,y:p.y,col:col,born:performance.now(),big:big})}
function onLive(data){if(!data||typeof data!=='object'||!data.districts||typeof data.districts!=='object')return;LV.mode=data.private?'private':'public';LV.d=data.districts;
  if(!LV.on&&Object.keys(LV.d).length){LV.on=true;cars.length=0}   // live data replaces the ambient traffic: from now on every car is a real visitor
  if(LV.on)reconcile();
  if(Array.isArray(data.agents))agentsIn(data.agents);
  if(Array.isArray(data.events)){var first=!LV.seen,fresh=data.events.filter(function(ev){return ev&&ev.ts>LV.seen&&(ev.k!=='view'||ev.n)}).reverse();
    var nv=0,nc=0;if(!first)fresh.slice(-40).forEach(function(ev){if(ev.k==='kudos')return void setTimeout(function(){kudosBurst(ev)},(nc++)*900);var b=byName[ev.d]||byName.Private;if(!b)return;
      if(ev.k==='view')return void setTimeout(function(){arrive(b,'view')},(nv++)*350);
      setTimeout(function(){spawn(b,ev.k==='buy'?BCOL:SCOL,true);pulse(b,ev.k==='buy'?BCOL:SCOL,ev.k==='buy');celebrate(b,ev.k,ev.d);arrive(b,ev.k)},(nc++)*900)});
    data.events.forEach(function(ev){if(ev&&ev.ts>LV.seen)LV.seen=ev.ts});if(!LV.seen)LV.seen=String(data.at||'0')}
  if(data.arrivals&&typeof data.arrivals==='object'&&LV.at)Object.keys(data.arrivals).forEach(function(k){var a=data.arrivals[k]||{},b=byName[k]||byName.Private;if(!b)return;   // public: counts only
    for(var i=0;i<Math.min(+a.v||0,40);i++)(function(i){setTimeout(function(){arrive(b,'view')},i*350)})(i);
    for(var j=0;j<Math.min(+a.s||0,5);j++)(function(j){setTimeout(function(){pulse(b,SCOL,false);celebrate(b,'signup',k);arrive(b,'signup')},j*900)})(j);
    for(var m2=0;m2<Math.min(+a.b||0,5);m2++)(function(m2){setTimeout(function(){pulse(b,BCOL,true);celebrate(b,'buy',k)},m2*900+400)})(m2)});
  onDay(data);liveConnected();
  if(data.at)LV.at=String(data.at);
  hud();draw()}
// ---- arrivals: every new visitor drops in from the sky onto its district (parachute, landing ring, walks to a building);
// a signup is a beam of light, confetti and a toast; a sale is a gold coin burst. Capped and queued when it floods.
var FX={drops:[],queue:[],parts:[],beams:[],more:{}},MAXDROP=MINI?5:8,toasts=document.querySelector('.c-toasts'),sound=false,AC=null;
try{sound=localStorage.getItem('caldera-sound')==='1'}catch(err){}
function arrive(b,kind){if(!b)return;if(FX.drops.length>=MAXDROP){if(FX.queue.length<24)FX.queue.push(b);else{var mo=FX.more[b.d.name]||(FX.more[b.d.name]={n:0,b:b});mo.n++;mo.until=performance.now()+5000}return}
  var path=arrivalPath(b);if(!path)return;var p=path[0];
  FX.drops.push({x:p.x,y:p.y,path:path,col:kind==='signup'?SCOL:kind==='buy'?BCOL:null,born:performance.now(),sw:Math.random()*6.28});tone([880,1320],.05)}
function toast(kind,district){if(!toasts)return;var t=document.createElement('div');t.className='c-toast'+(kind==='buy'?' buy':'');
  var priv=LV.mode!=='private'&&district==='Private';   // public pages never name a private project
  t.textContent=kind==='buy'?(priv?'\u{1F4B0} A sale':'\u{1F4B0} New sale · '+district):(priv?'✨ Someone joined':'✨ New signup · '+district);
  toasts.insertBefore(t,toasts.firstChild);while(toasts.children.length>3)toasts.removeChild(toasts.lastChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},5200)}
// kudos: the emoji rises over the city from a random district, with a toast naming who sent it (private feed only)
var KEMO={heart:'\u2764\uFE0F',up:'\u{1F44D}',fire:'\u{1F525}',sparkle:'\u2728'};
function kudosBurst(ev){var ks=Object.keys(byName),b=byName[ks[Math.floor(Math.random()*ks.length)]];var em=KEMO[ev.e]||KEMO.heart;
  if(toasts){var t=document.createElement('div');t.className='c-toast';t.textContent=em+' '+(typeof ev.from==='string'&&/^[a-z0-9-]{1,40}$/.test(ev.from)?'@'+ev.from:'Someone')+' sent you kudos';toasts.insertBefore(t,toasts.firstChild);while(toasts.children.length>3)toasts.removeChild(toasts.lastChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},5200)}
  if(!b)return;var c0=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),tn=performance.now();
  for(var i=0;i<(MINI?10:18);i++){var a=-Math.PI/2+(Math.random()-.5)*1.4,v=50+Math.random()*60;FX.parts.push({x:c0.x,y:c0.y-60,vx:Math.cos(a)*v,vy:Math.sin(a)*v-140,emo:em,born:tn+i*70,life:2600+Math.random()*700,rot:0})}
  tone([659,880,1175],.07)}
function celebrate(b,kind,district){if(!b)return;toast(kind,district||b.d.name);var c0=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),tn=performance.now(),buy=kind==='buy';
  FX.beams.push({x:c0.x,y:c0.y,col:buy?BCOL:SCOL,born:tn});
  var CONF=['#FF4FD8','#3DF2FF','#FFD23F','#7CFF6B','#FF7A45','#B58CFF'];
  for(var i=0;i<(MINI?26:48);i++){var a=Math.random()*6.28,v=40+Math.random()*(buy?70:110);FX.parts.push({x:c0.x,y:c0.y-(buy?40:130)*Math.max(1,.9/cam.z),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-(buy?120:60),col:buy?(i%3?'#FFD23F':'#FFF1A8'):CONF[i%CONF.length],born:tn+Math.random()*120,life:1800+Math.random()*900,coin:buy,rot:Math.random()*6})}
  tone(buy?[784,988,1319,1568]:[523,659,784,1047],.09)}
function tone(fs,len){if(!sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t0=AC.currentTime;fs.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0,t0+i*len);g.gain.linearRampToValueAtTime(.06,t0+i*len+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+i*len+len*2.2);o.connect(g);g.connect(AC.destination);o.start(t0+i*len);o.stop(t0+i*len+len*2.4)})}catch(err){}}
function person(c,x,y,col,s){c.fillStyle=col;c.strokeStyle=sky==='day'||sky==='dusk'?'rgba(10,14,30,.75)':'rgba(0,0,0,.55)';c.lineWidth=.8;
  c.beginPath();c.arc(x,y-9*s,2.2*s,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x-1.6*s,y-6.5*s);c.lineTo(x+1.6*s,y-6.5*s);c.lineTo(x+1.2*s,y-2*s);c.lineTo(x-1.2*s,y-2*s);c.closePath();c.fill();c.stroke();
  c.strokeStyle=col;c.lineWidth=1.2*s;c.beginPath();c.moveTo(x-.8*s,y-2*s);c.lineTo(x-1.4*s,y);c.moveTo(x+.8*s,y-2*s);c.lineTo(x+1.4*s,y);c.stroke()}
function drawFx(){var tn=performance.now(),more=Object.keys(FX.more);if(!FX.drops.length&&!FX.parts.length&&!FX.beams.length&&!more.length)return;
  var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var day=sky==='day',col=day?'#1E6FD9':'#7FE7FF',K=Math.max(1.25,1.1/cam.z);   // effects keep a readable size when zoomed out
  FX.beams=FX.beams.filter(function(b){return tn-b.born<2400});FX.beams.forEach(function(b){var pr=(tn-b.born)/2400,a=pr<.15?pr/.15:1-(pr-.15)/.85;c.save();if(!day)c.globalCompositeOperation='lighter';
    var g=c.createLinearGradient(0,b.y-420*K,0,b.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,b.col);c.globalAlpha=a*.85;c.fillStyle=g;var w=(10+8*Math.sin(pr*9))*K;c.fillRect(b.x-w/2,b.y-420*K,w,420*K);
    c.globalAlpha=a*.6;c.fillRect(b.x-1.5*K,b.y-420*K,3*K,420*K);c.restore()});
  FX.drops=FX.drops.filter(function(d){var t=tn-d.born;if(t<1950)return true;if(FX.queue.length)setTimeout(function(){arrive(FX.queue.shift(),'view')},60);return false});
  FX.drops.forEach(function(d){var t=tn-d.born,x=d.x,y=d.y,FALL=1300,S=PS,R=Math.max(1,.9/cam.z);   // the person and parachute are street scale; only the trail and landing ring stay readable when zoomed out
    if(t<FALL){var f=t/FALL,e2=f*f*(3-2*f),sw=Math.sin(t/180+d.sw)*3*S*(1-f);x+=sw;y=d.y-200*(1-e2);
      c.save();var g=c.createLinearGradient(0,y-60*R,0,y-6*S);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,day?'rgba(30,111,217,.4)':'rgba(127,231,255,.55)');c.strokeStyle=g;c.lineWidth=1.2*R;c.beginPath();c.moveTo(x-sw*.6,y-60*R);c.lineTo(x,y-13*S);c.stroke();
      c.fillStyle=day?'#FF6B4A':'#FF4FD8';c.beginPath();c.arc(x,y-19*S,7.5*S,Math.PI,0);c.closePath();c.fill();c.strokeStyle=day?'rgba(0,0,0,.45)':'rgba(255,255,255,.55)';c.lineWidth=.45;c.beginPath();c.moveTo(x-7.5*S,y-19*S);c.lineTo(x-1.4*S,y-8*S);c.moveTo(x+7.5*S,y-19*S);c.lineTo(x+1.4*S,y-8*S);c.stroke();c.restore();
      walkerFig(c,x,y,d.col||col,S,1,0,0)}
    else{if(!d.walk){d.walk=true;walker(d.path,false,d.col)}var t2=t-FALL;if(t2<650){var pr=t2/650;c.save();c.strokeStyle=d.col||col;c.globalAlpha=1-pr;c.lineWidth=1.1;c.beginPath();c.ellipse(d.x,d.y,(3+pr*12)*R,(3+pr*12)*.5*R,0,0,7);c.stroke();
      c.fillStyle=day?'rgba(120,100,80,.35)':'rgba(200,230,255,.25)';for(var k=0;k<5;k++){var a2=k*1.256+d.sw;c.beginPath();c.arc(d.x+Math.cos(a2)*(2+pr*7),d.y+Math.sin(a2)*(1+pr*3.5)-pr*2,.8*(1-pr),0,7);c.fill()}c.restore()}}});
  FX.parts=FX.parts.filter(function(p){return tn-p.born<p.life});FX.parts.forEach(function(p){var t=Math.max(0,tn-p.born)/1000,x=p.x+p.vx*K*t,y=p.y+(p.vy*t+140*t*t)*K,a=1-(tn-p.born)/p.life;if(t<=0)return;
    if(p.emo){c.save();c.globalAlpha=Math.max(0,a);c.font=Math.round(15*K)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.textAlign='center';c.fillText(p.emo,p.x+p.vx*K*t,p.y+(p.vy*t+40*t*t)*K);c.restore();return}
    c.save();c.globalAlpha=Math.max(0,a);c.fillStyle=p.col;if(p.coin){c.beginPath();c.ellipse(x,y,(3.2*Math.abs(Math.cos(t*8+p.rot))+.6)*K,3.2*K,0,0,7);c.fill();c.strokeStyle='#B8860B';c.lineWidth=.6;c.stroke()}
    else{c.translate(x,y);c.rotate(t*6+p.rot);c.fillRect(-2*K,-1*K,4*K,2*K)}c.restore()});
  more.forEach(function(k){var m=FX.more[k];if(tn>m.until){delete FX.more[k];return}var p2=iso(m.b.x+m.b.k/2-.5,m.b.y-.5);tronPill(c,p2.x,p2.y-40,'+'+m.n+' arriving',day?'#1E6FD9':'#7FE7FF','600 10.5px ui-monospace,monospace')})}
var HND=(location.pathname.match(/\/@([a-z0-9-]+)\//)||[])[1]||'';
// ---- people on foot: arrivals land at street scale (the size of the cars) and walk to a building's door; people who
// left walk back out as faint ghosts; worn paths show where the day's visitors went. All drawn under the buildings
// layer so a building in front hides whoever is behind it.
var WID=0,PS=.55,WALKS=[],WMAX=MINI?16:40,WQ=[],GHOSTCOL='#A9C2D8',DEPSEEN={},DEPFIRST=true,TRACES=[],TODAY=null,lastWT=0;
function roadPath(a,b,max){if(a[0]===b[0]&&a[1]===b[1])return [a];var key=function(t){return t[0]+','+t[1]},prev={},q=[a],seen={};seen[key(a)]=1;
  while(q.length){var t=q.shift();if(t[0]===b[0]&&t[1]===b[1]){var out=[t],k=key(t);while(prev[k]){out.unshift(prev[k]);k=key(prev[k])}return out}
    if(max&&q.length>4000)break;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var n=[t[0]+d[0],t[1]+d[1]],kn=key(n);if(!seen[kn]&&isRoad(n[0],n[1])){seen[kn]=1;prev[kn]=t;q.push(n)}})}return null}
function adjRoads(i,j){return [[i+1,j],[i-1,j],[i,j+1],[i,j-1]].filter(function(n){return isRoad(n[0],n[1])})}
// a building with a street outside its door (falls back to any building in the district)
// how much a tile is hidden from the viewer by tall buildings standing in front of it
function hiddenBy(i,j){var h=0;for(var d=0;d<=9;d++)[[d+1,d],[d,d+1],[d+1,d+1]].forEach(function(o){var t=tiles[(i+o[0])+','+(j+o[1])];if(t&&t.t==='b'&&bh(t.r)>(o[0]+o[1]-1)*TH/2)h+=1});return h}   // a tower in front (same screen column, nearer) covers the street behind it
function doorFor(b){var bl=BDIST[b.d.name]||[],ex=exits(b);if(!bl.length||!ex.length)return null;var cands=[];
  bl.forEach(function(o){ex.forEach(function(E){var d=Math.abs(E[0]-o.i)+Math.abs(E[1]-o.j);if(d<1||d>2)return;
    var mid=d===2?[Math.round((E[0]+o.i)/2),Math.round((E[1]+o.j)/2)]:null;if(mid){var mt=tiles[mid[0]+','+mid[1]];if(!mt||(mt.t!=='p'&&mt.t!=='r'))return}   // across an open plaza only, never through a building or the houses
    cands.push({o:o,E:E,d:d,h:hiddenBy(E[0],E[1])+(mid?hiddenBy(mid[0],mid[1]):0)+(d-1)*.5+(E[0]+E[1]<o.i+o.j?.25:0)})})});
  if(!cands.length)return null;cands.sort(function(p,q){return p.h-q.h});var best=cands.filter(function(x){return x.h<=cands[0].h+.01});return best[Math.floor(Math.random()*best.length)]}   // doors the viewer can see: walking in should be visible
function wpts(tl){var pts=[];for(var k=0;k<tl.length;k++){var a=tl[k],b=tl[k+1]||tl[k-1]||a,p=iso(a[0],a[1]),q=iso(b[0],b[1]),dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy)||1,s=k+1<tl.length?1:-1;
    pts.push({x:p.x-(-dy/l)*7*s,y:p.y-(dx/l*.5)*7*s})}return pts}
function lerpPt(a,b,f){return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}}
function walker(pts,ghost,col,delay){var len=0,seg=[];for(var k=1;k<pts.length;k++){var l=Math.hypot(pts[k].x-pts[k-1].x,pts[k].y-pts[k-1].y);seg.push(l);len+=l}
  var w={pts:pts,seg:seg,len:Math.max(1,len),d:0,sp:ghost?14:18,ghost:ghost,col:col,id:++WID,born:performance.now()+(delay||0)};
  if(WALKS.length>=WMAX){if(WQ.length<40)WQ.push(w);return}WALKS.push(w)}
function walkAt(w){var d=w.d;for(var k=0;k<w.seg.length;k++){if(d<=w.seg[k]){var f=d/(w.seg[k]||1),a=w.pts[k],b=w.pts[k+1];return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,ux:(b.x-a.x)/(w.seg[k]||1),uy:(b.y-a.y)/(w.seg[k]||1)}}d-=w.seg[k]}
  var z=w.pts[w.pts.length-1];return {x:z.x,y:z.y,ux:0,uy:0}}
// arrival: the street path from where the parachute lands to the door (the last stretch goes in through it)
function arrivalPath(b){var df=doorFor(b);if(!df)return null;var ex=exits(b).filter(function(t){var d=Math.abs(t[0]-df.E[0])+Math.abs(t[1]-df.E[1]);return d>=2&&d<=4}).sort(function(p,q){return hiddenBy(p[0],p[1])-hiddenBy(q[0],q[1])}),L=ex.length?ex[Math.floor(Math.random()*Math.ceil(ex.length/2))]:df.E;
  var tl=roadPath(L,df.E,1)||[df.E],pts=wpts(tl),door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]);pts.push(lerpPt(Ec,door,1-.58/df.d),lerpPt(Ec,door,1-.42/df.d));return pts}
function departurePath(b){var df=doorFor(b);if(!df)return null;var ex=exits(b),best=df.E,bd=-1;ex.forEach(function(t){var d=Math.abs(t[0]-df.E[0])+Math.abs(t[1]-df.E[1]);if(d<=6&&d>bd&&Math.random()<.7){bd=d;best=t}});
  var door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]),tl=roadPath(df.E,best,1)||[df.E];return [lerpPt(Ec,door,1-.45/df.d),lerpPt(Ec,door,1-.6/df.d)].concat(wpts(tl))}
function ghostOut(b,delay){if(!b)return;var p=departurePath(b);if(p)walker(p,true,GHOSTCOL,delay)}
function stepWalks(tn){var dt=lastWT?Math.min(100,tn-lastWT):0;lastWT=tn;
  WALKS=WALKS.filter(function(w){if(tn<w.born)return true;w.d+=w.sp*dt/1000;return w.d<w.len});
  while(WALKS.length<WMAX&&WQ.length){var w=WQ.shift();w.born=Math.max(w.born,tn);WALKS.push(w)}}
// a person at street scale: head, body and two legs that stride (3 frames) along the direction of travel
function walkerFig(c,x,y,col,s,wf,ux,uy){var st=[-1,0,1,0][wf]*1.5*s;c.fillStyle=col;c.beginPath();c.arc(x,y-9*s,2.2*s,0,7);c.fill();
  c.beginPath();c.moveTo(x-1.6*s,y-6.5*s);c.lineTo(x+1.6*s,y-6.5*s);c.lineTo(x+1.2*s,y-2*s);c.lineTo(x-1.2*s,y-2*s);c.closePath();c.fill();
  c.strokeStyle=col;c.lineWidth=1.25*s;c.lineCap='round';c.beginPath();c.moveTo(x-.6*s,y-2*s);c.lineTo(x-.9*s+ux*st,y+uy*st*.5);c.moveTo(x+.6*s,y-2*s);c.lineTo(x+.9*s-ux*st,y-uy*st*.5);c.stroke();
  c.beginPath();c.moveTo(x-1.5*s,y-6*s);c.lineTo(x-1.9*s-ux*st*.6,y-3.4*s);c.moveTo(x+1.5*s,y-6*s);c.lineTo(x+1.9*s+ux*st*.6,y-3.4*s);c.stroke()}
function drawWalks(){if(!WALKS.length)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var day=sky==='day',live=day?'#1E5FBF':'#BFF3FF',shade=day?'rgba(0,0,0,.22)':'rgba(0,0,0,.35)';
  WALKS.slice().sort(function(a,b){return walkAt(a).y-walkAt(b).y}).forEach(function(w){if(tn<w.born)return;var p=walkAt(w),f=w.d/w.len,a;
    if(w.ghost)a=.42*Math.min(1,w.d/8)*(f>.7?Math.max(0,1-(f-.7)/.3):1);else a=f>.86?Math.max(0,1-(f-.86)/.14):1;   // arrivals fade into the doorway, ghosts fade at the district edge
    if(a<=0)return;var wf=Math.floor(w.d/2.4)%4;c.save();c.globalAlpha=a;
    c.fillStyle=shade;c.beginPath();c.ellipse(p.x+1,p.y+.6,2.4*PS,1*PS,0,0,7);c.fill();
    walkerFig(c,p.x,p.y,w.ghost?GHOSTCOL:(w.col||live),PS,wf,p.ux,p.uy);c.restore()})}
// worn paths: footprints between the street and each busy building's door, brighter with more visitors today (log
// scale), newer visits counting more; they reset at the viewer's local midnight
function buildTraces(){TRACES=[];if(!TODAY)return;var mid=new Date();mid.setHours(0,0,0,0);var m0=mid.getTime(),Q15=9e5,wmax=0,W={};
  Object.keys(TODAY).forEach(function(k){var x=TODAY[k],t0=Date.parse(x.t0)||0,w=0;(x.q||[]).forEach(function(n,i){var ts=t0+i*Q15;if(ts<m0||!n)return;w+=n*(.35+.65*Math.max(0,Math.min(1,(ts-m0)/(Date.now()-m0||1))))});W[k]=w;wmax=Math.max(wmax,w)});
  if(!wmax)return;Object.keys(W).forEach(function(k){var b=byName[k];if(!b||!W[k])return;var br=Math.log(1+W[k])/Math.log(1+wmax);
    var bl=(BDIST[b.d.name]||[]).filter(function(o){return adjRoads(o.i,o.j).length}).sort(function(p,q){return ((q.r.week||0)*20+(q.r.commits||0))-((p.r.week||0)*20+(p.r.commits||0))}).slice(0,3);
    bl.forEach(function(o,ix){var E=adjRoads(o.i,o.j).sort(function(p,q){return (q[0]+q[1])-(p[0]+p[1])})[0],Ec=iso(E[0],E[1]),door=iso(o.i,o.j),pts=[];
      var nb=adjRoads(E[0],E[1]).filter(function(n){return !(n[0]===o.i&&n[1]===o.j)})[0];if(nb){var q=iso(nb[0],nb[1]);pts.push(lerpPt(q,Ec,.35))}pts.push(Ec,lerpPt(Ec,door,.42));
      TRACES.push({pts:pts,a:br*(1-ix*.25),seed:o.i*31+o.j*7})})})}
function drawTraces(){if(!TRACES.length||sky==='grid')return;var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var k=wxKind(),day=sky==='day'||sky==='dusk';
  var wet=k==='rain'||k==='storm'||k==='drizzle',col=k==='snow'?(day?'60,85,125':'170,190,220'):!day?(wet?'170,200,240':'200,214,236'):wet?'12,20,34':'70,52,36';   // wet prints at night catch the street light
  TRACES.forEach(function(t){for(var s=0;s<t.pts.length-1;s++){var a=t.pts[s],b=t.pts[s+1],l=Math.hypot(b.x-a.x,b.y-a.y),n=Math.floor(l/3.2),ux=(b.x-a.x)/(l||1),uy=(b.y-a.y)/(l||1);
    for(var i=0;i<n;i++){var f=(i+.5)/n,side=i%2?1:-1,x=a.x+(b.x-a.x)*f-uy*side*1.3,y=a.y+(b.y-a.y)*f+ux*side*.65,al=(.1+.5*t.a)*(day?1:.85)*(.75+.25*rnd(t.seed+i*3.1+s));
      c.fillStyle='rgba('+col+','+al.toFixed(3)+')';c.beginPath();c.ellipse(x,y,1.15,.6,Math.atan2(uy,ux),0,7);c.fill();
      if(k==='rain'||k==='storm'){c.fillStyle='rgba(200,225,255,'+(al*.5).toFixed(3)+')';c.fillRect(x-.3,y-.4,.6,.3)}}}})}
// ---- weather: the viewer's real local weather (hub lookup, or Obsidian passing it in), or what they pick
var WX=null,WXMODES=['auto','clear','rain','snow','fog'],WXMODE='auto',WXN={auto:'Auto',clear:'Clear',partly:'Partly cloudy',overcast:'Overcast',drizzle:'Drizzle',rain:'Rain',storm:'Storm',snow:'Snow',fog:'Fog'};
try{var wv=localStorage.getItem('caldera-weather');if(wv&&WXMODES.indexOf(wv)>=0)WXMODE=wv}catch(err){}
var hw0=location.hash.match(/[#&]wx=([a-z]+)/);if(hw0)WXMODE=hw0[1];   // #wx=storm etc. for checking
function wxKind(){if(WXMODE!=='auto')return WXMODE;return WX&&WX.c?WX.c:'clear'}
function wxCloud(){var k=wxKind();if(WXMODE==='auto'&&WX&&WX.c)return Math.max(+WX.cloud||0,{rain:80,storm:95,drizzle:70,snow:80,fog:60,overcast:90}[k]||0);return {clear:8,partly:40,overcast:92,fog:65,drizzle:75,rain:88,storm:98,snow:85}[k]||10}
function wxWind(){var w=WXMODE==='auto'&&WX?+WX.wind||0:12,d=WXMODE==='auto'&&WX?(+WX.dir||270):250;return {vx:-Math.sin(d*Math.PI/180)*w,w:w}}   // meteorological: the direction it blows FROM
var CLOUDS=[],CLW=0,CLH=0,lastCT=0;
function cloudColor(){var k=wxKind(),dark=k==='storm'?.55:k==='rain'||k==='overcast'||k==='snow'?.3:k==='drizzle'||k==='fog'?.2:0;
  if(sky==='night')return 'rgba('+Math.round(52-dark*20)+','+Math.round(60-dark*20)+','+Math.round(82-dark*20)+',.62)';
  if(sky==='dusk')return 'rgba('+Math.round(255-dark*120)+','+Math.round(200-dark*90)+','+Math.round(190-dark*70)+',.6)';
  var g=Math.round(255-dark*110);return 'rgba('+g+','+(g+2>255?255:g+2)+','+(g+6>255?255:g+6)+','+(.82+dark*.15).toFixed(2)+')'}
function newCloud(edge){var s=.6+Math.random()*.9,ww=60*s+40;return {x:edge==null?Math.random()*(vw+2*ww)-ww:edge<0?-ww-Math.random()*40:vw+ww+Math.random()*40,y:(.04+Math.random()*.3)*vh,s:s,v:.7+Math.random()*.6,w:ww,p:Math.floor(Math.random()*3),gone:false}}
// clouds keep their own positions frame to frame: they drift with the wind, wrap only once fully off screen, and are
// never re-randomized by a resize, a phase change or a live update
function stepClouds(tn){if(!vw)return;var dt=lastCT?Math.min(200,tn-lastCT)/1000:0;lastCT=tn;
  if(CLW&&(CLW!==vw||CLH!==vh)){var fx=vw/CLW,fy=vh/CLH;CLOUDS.forEach(function(c){c.x*=fx;c.y*=fy})}CLW=vw;CLH=vh;
  var want=Math.round(1+wxCloud()/100*(MINI?6:10)),wd=wxWind(),dir=wd.vx<0?-1:1,sp=6+Math.min(40,Math.abs(wd.vx))*.9;
  if(!CLOUDS.length)for(var i=0;i<want;i++)CLOUDS.push(newCloud(null));
  var live=CLOUDS.filter(function(c){return !c.gone}).length;
  if(live>want){for(var j=0;j<CLOUDS.length&&live>want;j++)if(!CLOUDS[j].gone){CLOUDS[j].gone=true;live--}}   // retire extras: they drift off, never vanish
  while(live<want){CLOUDS.push(newCloud(-dir));live++}
  CLOUDS.forEach(function(c){c.x+=dir*sp*c.v*dt});
  CLOUDS=CLOUDS.filter(function(c){var off=dir>0?c.x-c.w>vw:c.x+c.w<0;if(!off)return true;if(c.gone)return false;var n=newCloud(-dir);c.x=n.x;c.y=n.y;c.s=n.s;c.w=n.w;return true})}
function drawClouds(c){var col=cloudColor();c.fillStyle=col;CLOUDS.forEach(function(k){var s=k.s;[[0,0,22],[18,4,16],[-18,5,15],[8,-8,15],[-6,-6,13],[30,6,11]].slice(0,5+k.p%2).forEach(function(b){c.beginPath();c.arc(k.x+b[0]*s,k.y+b[1]*s,b[2]*s,0,7);c.fill()})})}
var PRECIP=[],flash=0,nextBolt=0;
function stepPrecip(dt){var k=wxKind(),n=k==='storm'?(MINI?110:220):k==='rain'?(MINI?80:160):k==='drizzle'?(MINI?40:80):k==='snow'?(MINI?60:130):0;
  if(WXMODE==='auto'&&WX&&(k==='rain'||k==='storm'))n=Math.round(n*Math.min(1.4,.6+(+WX.precip||0)/4));
  while(PRECIP.length<n)PRECIP.push({x:Math.random()*vw,y:Math.random()*vh,z:.6+Math.random()*.6,snow:k==='snow'});
  if(PRECIP.length>n)PRECIP.length=n;var wd=wxWind(),slant=Math.max(-.6,Math.min(.6,wd.vx/45));
  PRECIP.forEach(function(p){p.snow=k==='snow';var vy=p.snow?28*p.z:(k==='drizzle'?260:520)*p.z;p.y+=vy*dt;p.x+=(p.snow?(slant*30+Math.sin((p.y+p.z*99)/30)*12):slant*vy)*dt;
    if(p.y>vh){p.y=-10;p.x=Math.random()*(vw+80)-40}if(p.x<-40)p.x+=vw+80;if(p.x>vw+40)p.x-=vw+80})}
function drawWeather(){var k=wxKind();if(sky==='grid')return;var c=cx;c.setTransform(dpr,0,0,dpr,0,0);var night=sky==='night',tn=performance.now();
  var gloom=k==='storm'?.24:k==='rain'?.14:k==='drizzle'?.08:k==='overcast'?.06:k==='snow'?.04:0;if(gloom){c.fillStyle='rgba(12,18,30,'+gloom+')';c.fillRect(0,0,vw,vh)}
  if(k==='snow'){c.fillStyle='rgba(235,242,250,'+(night?.08:.16)+')';c.fillRect(0,0,vw,vh)}
  if(k==='fog'){var g=c.createLinearGradient(0,vh*.15,0,vh);g.addColorStop(0,night?'rgba(70,78,96,.18)':'rgba(214,220,226,.28)');g.addColorStop(1,night?'rgba(70,78,96,.5)':'rgba(214,220,226,.6)');c.fillStyle=g;c.fillRect(0,0,vw,vh);
    c.fillStyle=night?'rgba(90,100,120,.12)':'rgba(240,244,248,.18)';for(var b=0;b<3;b++){var y=vh*(.45+b*.17)+Math.sin(tn/4000+b)*8,x=((tn/90+b*300)%(vw+400))-200;c.beginPath();c.ellipse(x,y,260,30,0,0,7);c.fill()}}
  if(PRECIP.length){var wd=wxWind(),slant=Math.max(-.6,Math.min(.6,wd.vx/45));
    if(k==='snow'){c.fillStyle=night?'rgba(220,230,245,.8)':'rgba(255,255,255,.95)';PRECIP.forEach(function(p){c.beginPath();c.arc(p.x,p.y,1.1+p.z*.9,0,7);c.fill()})}
    else{c.strokeStyle=night?'rgba(170,195,230,.45)':'rgba(70,95,130,.42)';c.lineWidth=1;c.beginPath();PRECIP.forEach(function(p){var l=(k==='drizzle'?5:11)*p.z;c.moveTo(p.x,p.y);c.lineTo(p.x-slant*l,p.y-l)});c.stroke()}}
  if(k==='storm'){if(tn>nextBolt){flash=tn;nextBolt=tn+6000+Math.random()*9000}var fa2=tn-flash;if(fa2<520){var a=fa2<90?.5:fa2<160?.08:fa2<240?.35:Math.max(0,.35*(1-(fa2-240)/280));c.fillStyle='rgba(230,236,255,'+a.toFixed(3)+')';c.fillRect(0,0,vw,vh)}}}
// sunrise and sunset from the viewer's real location drive Auto's day (falls back to fixed hours)
function sunKeys(){if(!WX||!WX.sunrise||!WX.sunset)return null;var r=new Date(WX.sunrise),s=new Date(WX.sunset),sr=r.getHours()*60+r.getMinutes(),ss=s.getHours()*60+s.getMinutes();
  if(!(sr>120&&ss>sr+240&&ss<1430))return null;var k=[[0,'night'],[sr-75,'night'],[sr+15,'dawn'],[sr+120,'day'],[ss-110,'day'],[ss-10,'dusk'],[ss+60,'evening'],[Math.min(1439,ss+150),'night'],[1440,'night']];
  for(var i=1;i<k.length;i++)if(k[i][0]<=k[i-1][0])k[i][0]=k[i-1][0]+1;return k}
function applyWeather(){var k=sunKeys();if(k)DAYKEYS=k;applySky();if(typeof skyLabel==='function')skyLabel();if(typeof wxLabel==='function')wxLabel();dirty=true}
// ---- today: "142 visited today · 9 here now", from the live feed
var todayEl=null;function todayLine(){if(!TODAY||MINI)return;var v=0;Object.keys(TODAY).forEach(function(k){v+=+TODAY[k].v||0});
  var here=LV.mode==='private'?Object.keys(LV.d).reduce(function(s,k){return s+(+LV.d[k].now||0)},0):null,any=Object.keys(LV.d).some(function(k){return LV.d[k].level>0});
  if(!todayEl){todayEl=document.createElement('div');todayEl.className='c-today';st.appendChild(todayEl)}
  todayEl.textContent=v.toLocaleString('en-US')+' visited today'+(here!=null?' · '+here+' here now':any?' · people here now':'')}
function onDay(data){if(data.today&&typeof data.today==='object'){TODAY=data.today;buildTraces();todayLine()}
  var plan=[];
  if(Array.isArray(data.departures))data.departures.forEach(function(x){var id=x.v+'|'+x.ts;if(DEPSEEN[id]||!x.d)return;DEPSEEN[id]=1;plan.push(byName[x.d]||byName.Private)});
  if(data.left&&typeof data.left==='object')Object.keys(data.left).forEach(function(k){for(var i=0;i<Math.min(+data.left[k]||0,30);i++)plan.push(byName[k]||byName.Private)});
  plan=plan.filter(Boolean);
  if(DEPFIRST){DEPFIRST=false;plan=plan.slice(-20);plan.forEach(function(b,i){ghostOut(b,600+i*(19000/Math.max(1,plan.length)))});return}   // replay the last half hour in the first ~20 s
  plan.slice(-12).forEach(function(b,i){ghostOut(b,i*450)})}
// ---- owner only: turn on live visitors / agent drones (never shown to visitors: the hub sends it only to the owner)
var setupEl=null,SETUP=null;
function copyText(t,btn){var done=function(){var o=btn.textContent;btn.textContent='Copied';setTimeout(function(){btn.textContent=o},1600)};
  try{navigator.clipboard.writeText(t).then(done,function(){fallbackCopy(t)&&done()})}catch(err){fallbackCopy(t)&&done()}}
function fallbackCopy(t){try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);return ok}catch(err){return false}}
function setupDismissed(){try{return localStorage.getItem('caldera-setup-dismissed')==='1'}catch(err){return false}}
function ownerSetup(o){SETUP=o;if(MINI||!o||setupDismissed()||o.dismissed)return;var needLive=o.liveOff&&o.sites&&o.sites.length,needAg=o.agentsOff&&o.agentPrompt;if(!needLive&&!needAg){if(setupEl)setupEl.remove();return}
  if(!setupEl){setupEl=document.createElement('div');setupEl.className='c-setup';st.parentNode.insertBefore(setupEl,st.nextSibling)}
  var snip=function(s){return '<script async src="'+o.hub+'/t.js" data-site="'+s.key+'"></'+'script>'};
  var aiLive='Add Caldera live traffic to my websites, so visits show up as people arriving in my Caldera city.\n\nFor each site below, find the repo that builds that site, add the tag to the shared layout so it loads on every page (in <head>), deploy it, then open the live site and confirm a visit appears in my city at '+o.hub+(HND?'/@'+HND+'/city.html':'')+' (it shows within about 10 seconds).\n\nOn the signup success step call window.caldera && caldera(\'signup\'), and after a purchase caldera(\'buy\').\n\n'+(o.sites||[]).map(function(s){return '- '+s.project+':\n  '+snip(s)}).join('\n');
  setupEl.innerHTML=(needLive?'<div class="c-su-row"><span>Live visitors are off. See people arrive in your city as they visit your sites.</span><button type="button" class="c-su-go" data-p="live">Set up &rarr;</button></div>':'')
    +(needAg?'<div class="c-su-row"><span>Watch your AI agents work in your city.</span><button type="button" class="c-su-go" data-p="agents">Set up &rarr;</button></div>':'')
    +'<button type="button" class="c-su-x" aria-label="Dismiss" title="Hide this">&times;</button>'
    +(needLive?'<div class="c-su-panel" data-panel="live" hidden><p>Paste each district\'s line into that site\'s pages (in the shared layout\'s &lt;head&gt;). Every visit then drops into that district live. Mark conversions with <code>caldera(\'signup\')</code> and <code>caldera(\'buy\')</code>.</p>'
      +(o.sites||[]).map(function(s,i){return '<div class="c-su-site"><b>'+e(s.project)+'</b><code id="su-s'+i+'">'+e(snip(s))+'</code><button type="button" data-copy="su-s'+i+'">Copy</button></div>'}).join('')
      +'<button type="button" class="c-su-ai" data-ai="live">Copy prompt for my AI</button></div>':'')
    +(needAg?'<div class="c-su-panel" data-panel="agents" hidden><p>Paste this into Claude Code on each computer you use. Each agent then flies as a drone over the repo it is working in.</p><button type="button" class="c-su-ai" data-ai="agents">Copy prompt for my AI</button></div>':'');
  setupEl.querySelectorAll('.c-su-go').forEach(function(bt){bt.onclick=function(){var p=setupEl.querySelector('[data-panel="'+bt.getAttribute('data-p')+'"]');if(p)p.hidden=!p.hidden}});
  setupEl.querySelectorAll('[data-copy]').forEach(function(bt){bt.onclick=function(){copyText(document.getElementById(bt.getAttribute('data-copy')).textContent,bt)}});
  setupEl.querySelectorAll('.c-su-ai').forEach(function(bt){bt.onclick=function(){copyText(bt.getAttribute('data-ai')==='live'?aiLive:o.agentPrompt,bt)}});
  setupEl.querySelector('.c-su-x').onclick=function(){try{localStorage.setItem('caldera-setup-dismissed','1')}catch(err){}if(window.parent!==window)parent.postMessage({caldera:'setup-dismiss'},'*');setupEl.remove();setupEl=null}}
function liveConnected(){if(!setupEl||!SETUP||!SETUP.liveOff)return;var any=Object.keys(LV.d).some(function(k){return (+LV.d[k].views||0)>0||(+LV.d[k].level||0)>0});if(!any)return;
  SETUP.liveOff=false;ownerSetup(SETUP);var seen=false;try{seen=localStorage.getItem('caldera-live-connected')==='1';localStorage.setItem('caldera-live-connected','1')}catch(err){}
  if(!seen&&toasts){var t=document.createElement('div');t.className='c-toast';t.textContent='✅ Live visitors connected';toasts.insertBefore(t,toasts.firstChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},6000)}}
// extras from the hub (weather endpoint, owner setup) or from Obsidian (postMessage)
var EX=window.CALDERA_EXTRAS||null;
function fetchWx(){if(!EX||!EX.weather||document.hidden)return;fetch(EX.weather,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(w){if(w&&w.c){WX=w;applyWeather()}}).catch(function(){})}
if(EX){if(EX.weather){setTimeout(fetchWx,300);setInterval(fetchWx,15*60000)}if(EX.owner)setTimeout(function(){ownerSetup(EX.owner)},50)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source!==parent||!m||m.caldera!=='extras'||!m.data)return;if(m.data.weather&&m.data.weather.c){WX=m.data.weather;applyWeather()}if(m.data.owner)ownerSetup(m.data.owner)});

// ---- agents: a drone over the building each AI agent is working in. Working = beam into the roof, thinking = circling,
// waiting for you = parked at the HQ pad, blinking amber. Public pages only get district + state, never what it's doing.
var AG={},AGC={working:'#3DF2FF',thinking:'#B58CFF',waiting:'#FFB020',idle:'#6F7C8F',done:'#6F7C8F'},BREPO={},BDIST={};
for(var bk in tiles){var tb=tiles[bk];if(tb.t!=='b')continue;var bij=bk.split(','),bo={i:+bij[0],j:+bij[1],r:tb.r};if(tb.r.name)BREPO[tb.r.name.toLowerCase()]=bo;(BDIST[tb.d.name]=BDIST[tb.d.name]||[]).push(bo)}
var HQI=1.3,HQJ=H-1.3,HQP=iso(HQI,HQJ),HQS=.36;   // Agent HQ: a parking grid on the island's west corner, laid out along the streets
function hqDims(n){var cols=Math.max(1,Math.ceil(Math.sqrt(n)));return {cols:cols,rows:Math.max(1,Math.ceil(n/cols))}}
function agentsIn(list){var tn=performance.now(),seen={};list.slice(0,80).forEach(function(a){if(!a||!a.id)return;seen[a.id]=1;var g=AG[a.id];
    if(!g){var h0=HQP;g=AG[a.id]={x:h0.x,y:h0.y-40,born:tn,seed:hash(String(a.id))}}g.a=a;g.gone=0});
  for(var id in AG)if(!seen[id]&&!AG[id].gone)AG[id].gone=tn}
function agentSpot(g,tn,slot,nslot){var a=g.a,b=null;
  if(a.state==='working'||a.state==='thinking'){b=(a.repo&&BREPO[String(a.repo).toLowerCase()])||null;if(!b&&a.d&&BDIST[a.d]){var l=BDIST[a.d];b=l[g.seed%l.length]}}
  if(!b){var hd=hqDims(nslot),gi=slot%hd.cols,gj=Math.floor(slot/hd.cols),q=iso(HQI+(gi-(hd.cols-1)/2)*HQS,HQJ+(gj-(hd.rows-1)/2)*HQS);return {x:q.x,y:q.y-9+Math.sin(tn/700+g.seed)*1,roof:null,hq:true}}
  var p=iso(b.i,b.j),h=bh(b.r),y=p.y-h-24;
  if(a.state==='thinking')return {x:p.x+Math.cos(tn/900+g.seed)*14,y:y+Math.sin(tn/900+g.seed)*7,roof:null};
  return {x:p.x+Math.sin(tn/1300+g.seed)*3,y:y+Math.sin(tn/500+g.seed)*2,roof:p.y-h}}
function drawAgents(c,tn){var ids=Object.keys(AG);if(!ids.length)return;var parked=ids.filter(function(id){var s=AG[id].a.state;return !(s==='working'||s==='thinking')}),k=0;
  // HQ pad
  c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,176,32,.55)';c.lineWidth=1.5;c.shadowColor='#FFB020';c.shadowBlur=8;var hd=hqDims(parked.length),ri=(hd.cols-1)/2*HQS+.3,rj=(hd.rows-1)/2*HQS+.3,k1=iso(HQI-ri,HQJ-rj),k2=iso(HQI+ri,HQJ-rj),k3=iso(HQI+ri,HQJ+rj),k4=iso(HQI-ri,HQJ+rj);c.fillStyle='rgba(255,176,32,.07)';c.beginPath();c.moveTo(k1.x,k1.y);c.lineTo(k2.x,k2.y);c.lineTo(k3.x,k3.y);c.lineTo(k4.x,k4.y);c.closePath();c.fill();c.stroke();c.restore();
  var nw=parked.filter(function(id){return AG[id].a.state==='waiting'}).length;var ni=parked.length-nw;var hb=iso(HQI+(hd.cols-1)/2*HQS+.3,HQJ+(hd.rows-1)/2*HQS+.3);if(labels)tronPill(c,hb.x,hb.y+18,'AGENT HQ'+(ni?' \u00b7 '+ni+' parked':'')+(nw?' \u00b7 '+nw+' waiting on you':''),'#FFB020','600 9px ui-monospace,monospace');
  ids.forEach(function(id){var g=AG[id],a=g.a,sp=agentSpot(g,tn,parked.indexOf(id)<0?0:parked.indexOf(id),parked.length);
    g.x+=(sp.x-g.x)*.05;g.y+=(sp.y-g.y)*.05;var f=g.gone?Math.max(0,1-(tn-g.gone)/1500):Math.min(1,(tn-g.born)/600);if(f<=0){delete AG[id];return}
    var col=AGC[a.state]||AGC.working,blink=a.state==='waiting'?(.55+.45*Math.abs(Math.sin(tn/380))):(a.state==='idle'||a.state==='done')?.45:1;
    c.save();c.globalAlpha=f;c.globalCompositeOperation='lighter';
    if(sp.roof!=null&&Math.abs(g.x-sp.x)<6){var gb=c.createLinearGradient(0,g.y,0,sp.roof);gb.addColorStop(0,col);gb.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=gb;c.globalAlpha=f*(.55+.25*Math.sin(tn/160));c.beginPath();c.moveTo(g.x-2,g.y);c.lineTo(g.x+2,g.y);c.lineTo(g.x+9,sp.roof);c.lineTo(g.x-9,sp.roof);c.closePath();c.fill();c.globalAlpha=f}
    var sc=sp.hq?.6:1,gl=c.createRadialGradient(g.x,g.y,0,g.x,g.y,22*sc);gl.addColorStop(0,col);gl.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=f*.6*blink;c.fillStyle=gl;c.beginPath();c.arc(g.x,g.y,22*sc,0,7);c.fill();c.globalAlpha=f*blink;
    c.strokeStyle=col;c.lineWidth=1.4;c.shadowColor=col;c.shadowBlur=8;c.setLineDash([4,3]);c.lineDashOffset=-tn/40;c.beginPath();c.ellipse(g.x,g.y,11*sc,5.5*sc,0,0,7);c.stroke();c.setLineDash([]);
    c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-6*sc);c.lineTo(g.x+5*sc,g.y);c.lineTo(g.x,g.y+3.5*sc);c.lineTo(g.x-5*sc,g.y);c.closePath();c.fill();c.restore();
    g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;
    if(labels&&a.label&&!sp.hq&&(cam.z>.55||ids.length<=8))tronPill(c,g.x,g.y-15,a.label,col,'600 9px ui-monospace,monospace')})}
// ---- the Underground: the vault under the city. Notes = nodes (size = notes linking in), links = tunnels,
// depth = age, notes about a project sit under its district with roots up into it. Toggle with the Underground button.
var U=D.under||null,under=false,UL=document.createElement('canvas'),uc=UL.getContext('2d'),UP=[],upulse=[],UDIRTY=true;
var UK={concept:'#3DF2FF',entity:'#B58CFF',source:'#4F7BFF',day:'#FF9E3D',garden:'#4FF2A0',note:'#9FB4FF'},UKN={concept:'Concepts',entity:'People & companies',source:'Sources',day:'Daily notes',garden:'Garden (public)',note:'Notes'};
var DROP=0,DSPAN=0;
if(U){DROP=Math.max(140,maxH*.7+70);DSPAN=Math.max(160,(W+H)*TH/2*.45);
  var KA={concept:[.5,.5],entity:[.25,.75],source:[.8,.8],note:[.75,.25],garden:[.5,.18]};
  U.nodes.forEach(function(n,ix){var h1=rnd(hash((n.p||'')+ix)+1),h2=rnd(hash((n.p||'')+ix)+7),b=n.d&&byName[n.d],i,j;
    if(b){i=b.x-.3+h1*(b.k+.6);j=b.y-.3+h2*(b.k+.6)}
    else if(n.k==='day'){var t=1-Math.min(1,n.a/365);i=1+t*(W-2)+(h1-.5)*1.5;j=1+t*(H-2)+(h2-.5)*1.5}
    else{var ka=KA[n.k]||KA.note,ang=h1*6.283,rad=Math.sqrt(h2)*Math.min(W,H)*.2;i=ka[0]*W+Math.cos(ang)*rad;j=ka[1]*H+Math.sin(ang)*rad}
    var age=Math.min(1,Math.log(1+n.a)/Math.log(731)),q=iso(i,j);UP[ix]={x:q.x,y:q.y+DROP+age*DSPAN,r:Math.min(12,1.6+Math.sqrt(n.n)*.9),c:UK[n.k]||UK.note}});
  U.adj=U.nodes.map(function(){return []});U.edges.forEach(function(e){if(U.adj[e[0]]&&U.adj[e[1]]){U.adj[e[0]].push(e[1]);U.adj[e[1]].push(e[0])}});
  U.byPath={};U.nodes.forEach(function(n,ix){if(n.p)U.byPath[n.p]=ix})}
function ustrata(c){var lv=[[7,'this week'],[30,'this month'],[365,'this year'],[2000,'older']];
  lv.forEach(function(l){var age=Math.min(1,Math.log(1+l[0])/Math.log(731)),dy=DROP+age*DSPAN,a=iso(0,0),b=iso(W,0),d=iso(W,H),e2=iso(0,H);
    c.strokeStyle='rgba(181,140,255,.13)';c.lineWidth=1;c.setLineDash([3,6]);c.beginPath();c.moveTo(a.x,a.y+dy);c.lineTo(b.x,b.y+dy);c.lineTo(d.x,d.y+dy);c.lineTo(e2.x,e2.y+dy);c.closePath();c.stroke();c.setLineDash([]);
    c.font='600 9px ui-monospace,monospace';c.fillStyle='rgba(181,140,255,.55)';c.textAlign='right';c.fillText(l[1].toUpperCase(),e2.x-8,e2.y+dy+3);c.textAlign='left'})}
function drawUnder(){var c=uc;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,UL.width,UL.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  ustrata(c);
  // sediment: the notes not drawn one by one
  var sed=0;for(var sk in U.sediment)sed+=U.sediment[sk];var ns=Math.min(500,Math.round(sed/3)),kinds=Object.keys(U.sediment),acc=0,cum=kinds.map(function(k){acc+=U.sediment[k];return acc});
  for(var z=0;z<ns;z++){var r1=rnd(z*3+1),r2=rnd(z*7+2),r3=rnd(z*11+3),q=iso(r1*W,r2*H),kk=kinds[cum.findIndex(function(v){return v>=r3*acc})]||'note';c.fillStyle=UK[kk]||UK.note;c.globalAlpha=.16;c.fillRect(q.x,q.y+DROP+DSPAN*(.55+r3*.45),1.4,1.4)}
  c.globalAlpha=1;c.globalCompositeOperation='lighter';
  // roots: each district's notes hang from the middle of its block
  blocks.forEach(function(b){var top=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),kids=[];U.nodes.forEach(function(n,ix){if(n.d===b.d.name)kids.push(ix)});if(!kids.length)return;
    kids.sort(function(a,b2){return U.nodes[b2].n-U.nodes[a].n}).slice(0,14).forEach(function(ix){var p=UP[ix],g=c.createLinearGradient(0,top.y,0,p.y);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(181,140,255,.05)');
      c.strokeStyle=g;c.lineWidth=1.1;c.beginPath();c.moveTo(top.x,top.y);c.bezierCurveTo(top.x,top.y+(p.y-top.y)*.5,p.x,p.y-(p.y-top.y)*.4,p.x,p.y);c.stroke()});
    c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.ellipse(top.x,top.y,6,3,0,0,7);c.fill()});
  // tunnels
  c.lineWidth=.8;U.edges.forEach(function(e){var a=UP[e[0]],b=UP[e[1]];if(!a||!b)return;var hi=usel!=null&&(e[0]===usel||e[1]===usel);
    c.strokeStyle=hi?'#FFFFFF':a.c;c.globalAlpha=hi?.85:.14;c.lineWidth=hi?1.4:.8;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+14,b.x,b.y);c.stroke()});
  c.globalAlpha=1;
  U.nodes.forEach(function(n,ix){var p=UP[ix];if(p.r>3.5){var g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.6);g.addColorStop(0,p.c);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.55;c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r*2.6,0,7);c.fill()}
    c.globalAlpha=1;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r*.55,0,7);c.fill();if(ix===usel){c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,p.r+3,0,7);c.stroke()}});
  c.globalCompositeOperation='source-over';
  if(labels){var top=U.nodes.map(function(n,ix){return ix}).filter(function(ix){return U.nodes[ix].t}).sort(function(a,b){return U.nodes[b].n-U.nodes[a].n}).slice(0,cam.z>1.1?40:16);
    var placed=[];c.font='600 9px ui-monospace,monospace';
    top.forEach(function(ix){var n=U.nodes[ix],p=UP[ix],tx=n.t.length>22?n.t.slice(0,21)+'\u2026':n.t,w=c.measureText(tx).width+16,y=p.y-p.r-6,bx=[p.x-w/2,y-18,p.x+w/2,y+2];
      if(placed.some(function(q){return bx[0]<q[2]&&bx[2]>q[0]&&bx[1]<q[3]&&bx[3]>q[1]}))return;placed.push(bx);tronPill(c,p.x,y,tx,UK[n.k]||UK.note,'600 9px ui-monospace,monospace')})}}
var usel=null;
function upulseFrom(ix){if(ix==null||!UP[ix])return;var tn=performance.now();upulse.push({ring:ix,born:tn});(U.adj[ix]||[]).slice(0,10).forEach(function(j,k){upulse.push({a:ix,b:j,born:tn+k*90})})}
function drawUnderLive(c,tn){c.save();c.globalCompositeOperation='lighter';
  U.nodes.forEach(function(n,ix){if(n.m>1)return;var p=UP[ix],pr=((tn/1600)+ix*.13)%1;c.strokeStyle=p.c;c.globalAlpha=(1-pr)*.7;c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y,p.r+2+pr*10,0,7);c.stroke()});
  upulse=upulse.filter(function(u){return tn-u.born<1800});upulse.forEach(function(u){var t=(tn-u.born)/1400;if(t<0)return;
    if(u.ring!=null){var p=UP[u.ring];c.strokeStyle='#FFFFFF';c.globalAlpha=Math.max(0,1-t);c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,p.r+4+t*26,0,7);c.stroke();return}
    var a=UP[u.a],b=UP[u.b];if(t>1)return;var mx=(a.x+b.x)/2,my=(a.y+b.y)/2+14,x=(1-t)*(1-t)*a.x+2*(1-t)*t*mx+t*t*b.x,y=(1-t)*(1-t)*a.y+2*(1-t)*t*my+t*t*b.y;
    c.globalAlpha=1;c.fillStyle='#FFFFFF';c.beginPath();c.arc(x,y,2,0,7);c.fill()});c.restore()}
var underEl=null;function underPanel(){if(!underEl){underEl=document.createElement('div');underEl.className='c-under'+(st.clientWidth<600?' c-min':'');underEl.setAttribute('role','button');underEl.title='Tap to fold or unfold';st.appendChild(underEl);
    underEl.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('a'))return;underEl.classList.toggle('c-min');var c=underEl.querySelector('.chev');if(c)c.textContent=underEl.classList.contains('c-min')?'\u25B4':'\u25BE'})}underEl.hidden=!under;if(!under)return;
  var ks=['concept','entity','source','day','garden','note'].filter(function(k){return U.nodes.some(function(n){return n.k===k})});
  underEl.innerHTML='<div class="uh"><b>THE UNDERGROUND</b><span class="chev">'+(underEl.classList.contains('c-min')?'\u25B4':'\u25BE')+'</span></div><div>'+U.total.toLocaleString('en-US')+' notes &middot; '+U.links.toLocaleString('en-US')+' links &middot; '+U.orphans+' unconnected'+(U.editedToday?' &middot; '+U.editedToday+' edited today':'')+'</div>'
    +'<div class="lg">'+ks.map(function(k){return '<span><i style="background:'+UK[k]+'"></i>'+UKN[k]+'</span>'}).join('')+'</div><div style="margin-top:4px;color:#A99BD0">Bigger = more notes link to it. Deeper = older. Roots go up to the project the notes are about.</div>'}
function noteCard(ix){var n=U.nodes[ix];usel=ix;UDIRTY=true;var open='';
  if(n.p)open=D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(n.p))+'" target="_blank" rel="noopener">Open in Obsidian &#8599;</a>':'<a href="#" data-open="'+e(n.p)+'">Open note</a>';
  else if(n.g)open='<a href="n/'+e(n.g)+'.html">Read it in the garden &#8599;</a>';
  var ago=function(d){return d<=0?'today':d===1?'yesterday':d<60?d+' days ago':Math.round(d/30)+' months ago'};
  card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+(n.t?e(n.t):'A note')+'</h3><div class="k" style="color:'+(UK[n.k]||UK.note)+'">'+e(UKN[n.k]||'Note')+(n.d?' &middot; under '+e(n.d):'')+'</div>'
    +'<div class="row"><span>Notes linking here</span><b>'+n.n+'</b></div><div class="row"><span>Links out</span><b>'+n.o+'</b></div>'
    +'<div class="row"><span>Created</span><b>'+ago(n.a)+'</b></div><div class="row"><span>Last edited</span><b>'+ago(n.m)+'</b></div>'
    +(n.t?'':'<p style="margin:6px 0 0">What this note says is private.</p>')+(open?'<p style="margin:8px 0 0">'+open+'</p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){usel=null;UDIRTY=true;card.hidden=true};upulseFrom(ix)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source===parent&&m&&m.caldera==='note'&&U&&typeof m.p==='string'){var ix=U.byPath[m.p];if(ix!=null){U.nodes[ix].m=0;upulseFrom(ix)}}});
// one car per person on the site right now (private: exact count from the last 5 minutes; public: a coarse level)
function reconcile(){var tn=performance.now(),total=0;blocks.forEach(function(b){var x=LV.d[b.d.name],want=!x?0:LV.mode==='private'?Math.min(30,+x.now||0):([0,2,4,7,11][+x.level||0]||0);
  if(total+want>120)want=Math.max(0,120-total);total+=want;
  var mine=cars.filter(function(c){return c.b===b&&!c.gone});
  for(var n=mine.length;n<want;n++){var ex=exits(b);if(!ex.length)break;var s0=ex[Math.floor(Math.random()*ex.length)],c={i:s0[0],j:s0[1],ti:s0[0],tj:s0[1],t:1,b:b,born:tn,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][Math.floor(Math.random()*5)]};step(c);cars.push(c)}
  mine.slice(want).forEach(function(c){c.gone=tn})})}
function fa(c,tn){return c.gone?Math.max(0,1-(tn-c.gone)/1500):c.born?Math.min(1,(tn-c.born)/800):1}
function agentLine(){var n={},ids=Object.keys(AG).filter(function(id){return !AG[id].gone});if(!ids.length)return '';ids.forEach(function(id){var s=AG[id].a.state;n[s]=(n[s]||0)+1});
  return '<div class="q"><span style="color:#fff">AI agents</span> '+['working','thinking','waiting','idle'].filter(function(s){return n[s]}).map(function(s){return '<span style="color:'+AGC[s]+'">'+n[s]+' '+(s==='waiting'?'waiting on you':s)+'</span>'}).join(' &middot; ')+'</div>'}
var liveEl=null;function hud(){if(!liveEl){liveEl=document.createElement('div');liveEl.className='c-live'+(st.clientWidth<600?' c-min':'');liveEl.setAttribute('aria-live','polite');st.appendChild(liveEl);
    liveEl.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('.h'))liveEl.classList.toggle('c-min')})}
  var ks=Object.keys(LV.d).filter(function(k){return byName[k]});
  if(LV.mode==='private'){ks.sort(function(a,b){return (LV.d[b].now-LV.d[a].now)||(LV.d[b].views-LV.d[a].views)});var tot=ks.reduce(function(s,k){return s+(+LV.d[k].now||0)},0);
    // busy districts get a row (at most 5); the rest share one quiet line so the panel never needs to scroll
    var busy=ks.filter(function(k){return LV.d[k].now>0||LV.d[k].signups>0||LV.d[k].buys>0}).slice(0,5),quiet=ks.filter(function(k){return busy.indexOf(k)<0});
    liveEl.innerHTML='<div class="h"><i class="dot"></i>LIVE &middot; '+tot+' on your sites now</div>'
     +(ks.length?'':'<div class="s m">No visits yet. Paste a district\'s snippet from Caldera settings &gt; Live traffic on your city into that site.</div>')
     +busy.map(function(k){var x=LV.d[k];return '<div class="r"><span>'+e(k)+'</span><b>'+(+x.now||0)+' now</b></div><div class="s m">'+(+x.views||0).toLocaleString('en-US')+' views'+(x.signups?' &middot; '+x.signups+' signups':'')+(x.buys?' &middot; '+x.buys+' sales':'')+' in 24h</div>'}).join('')
     +agentLine()+(quiet.length?'<div class="q m">Quiet now: '+quiet.map(function(k){return e(k)+' '+(+LV.d[k].views||0)}).join(' &middot; ')+' views in 24h</div>':'')
     +'<div class="lg m" style="margin-top:4px">Each car is someone on that site now.<br><i style="background:'+SCOL+'"></i>signup<i style="background:'+BCOL+'"></i>sale</div>'}
  else{var any=ks.some(function(k){return LV.d[k].level>0});ks.sort(function(a,b){return LV.d[b].level-LV.d[a].level});
    liveEl.innerHTML='<div class="h"><i class="dot"></i>LIVE &middot; '+(any?'people on these sites right now':'quiet right now')+'</div>'+agentLine()
     +ks.filter(function(k){return LV.d[k].level>0}).map(function(k){return '<div class="r"><span>'+e(k)+'</span><b><i class="bar" style="width:'+(LV.d[k].level*14)+'px"></i></b></div>'}).join('')}}
var CL=window.CALDERA_LIVE;function poll(){if(document.hidden)return;fetch(CL.url+(LV.at?(CL.url.indexOf('?')<0?'?':'&')+'since='+encodeURIComponent(LV.at):''),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(onLive).catch(function(){})}
if(CL&&typeof CL.url==='string'){setTimeout(poll,600);setInterval(poll,10000)}
window.addEventListener('message',function(ev){var m=ev.data;if((ev.source===parent||window.CALDERA_MINI===1)&&m&&m.caldera==='live')onLive(m.data)});
function step(car){var o=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [car.ti+d[0],car.tj+d[1]]}).filter(function(n){var t=tiles[n[0]+','+n[1]];return t&&t.t==='r'&&!(n[0]===car.i&&n[1]===car.j)});
  if(!o.length)o=[[car.i,car.j]];var n=o[Math.floor(Math.random()*o.length)];car.i=car.ti;car.j=car.tj;car.ti=n[0];car.tj=n[1];car.t=0}
// ---- palettes: the lighting follows the viewer's clock (Auto: night, dawn, day, dusk, evening, blended), or a phase they pick
var sky='night';night=true;
var PAL={
 day:{sky:['#7FB8EA','#CFE6F7','#EAF4FB'],grass:'#7DBB6E',grass2:'#8CC77C',park:'#6FB262',walk:'#D9D6CE',walkSide:'#B7B2A6',plaza:'#E6E2D8',road:'#5A606B',road2:'#626873',line:'rgba(255,255,255,.75)',water:['#4C9BD6','#3A82BD'],earth:['#8A6A4A','#6E5238'],light:1,win:'rgba(196,224,248,.85)',winOff:'rgba(60,82,110,.55)',lamp:0,shadow:'rgba(30,40,60,.22)',lit:.45},
 dusk:{sky:['#3E3A6E','#C8607A','#F4B26B'],grass:'#5E8F5A',grass2:'#6A9A62',park:'#55854F',walk:'#B9AFA6',walkSide:'#968A80',plaza:'#C7BCB0',road:'#454752',road2:'#4C4E59',line:'rgba(255,226,170,.6)',water:['#5A6FA8','#46568C'],earth:['#6E5040','#55402F'],light:.82,win:'rgba(255,214,140,.92)',winOff:'rgba(48,52,78,.6)',lamp:.6,shadow:'rgba(40,20,50,.28)',lit:.9},
 night:{sky:['#04060E','#0B1020','#18203A'],grass:'#1D3326',grass2:'#21392A',park:'#1A2F22',walk:'#3A3D47',walkSide:'#2A2D35',plaza:'#41444E',road:'#1E222B',road2:'#23272F',line:'rgba(242,200,90,.45)',water:['#13233F','#0D1A30'],earth:['#2B2219','#201912'],light:.5,win:'rgba(255,208,120,.95)',winOff:'rgba(16,20,34,.75)',lamp:1,shadow:'rgba(0,0,0,.35)',lit:1},
  dawn:{sky:['#3A4A7E','#E0899A','#FFCB8E'],grass:'#5F8F62',grass2:'#6B9A6A',park:'#578A58',walk:'#C2B8B0',walkSide:'#9C9088',plaza:'#CFC4B8',road:'#4A4D58',road2:'#51545F',line:'rgba(255,236,200,.6)',water:['#6A80B8','#56689C'],earth:['#73554A','#5A4236'],light:.88,win:'rgba(255,222,165,.85)',winOff:'rgba(70,80,110,.55)',lamp:.3,shadow:'rgba(60,40,80,.32)',lit:.5},
  evening:{sky:['#0B0E2A','#23285A','#4A3F7A'],grass:'#2A4532',grass2:'#304C37',park:'#27412D',walk:'#555463',walkSide:'#3E3E4B',plaza:'#5C5B69',road:'#2A2C38',road2:'#30323E',line:'rgba(250,210,120,.5)',water:['#24335E','#1B284C'],earth:['#3E3028','#2E241D'],light:.62,win:'rgba(255,210,130,.95)',winOff:'rgba(22,26,44,.7)',lamp:.9,shadow:'rgba(0,0,0,.32)',lit:1}};
PAL.grid=PAL.night;var P=PAL.night,phase='night',palKey='';
// Auto: keyframes over the day (minutes after midnight), smoothly blended; the drawing details follow the nearest phase
var DAYKEYS=[[0,'night'],[300,'night'],[390,'dawn'],[510,'day'],[990,'day'],[1095,'dusk'],[1185,'evening'],[1290,'night'],[1440,'night']];
var BASE={night:'night',evening:'night',dawn:'dusk',dusk:'dusk',day:'day'};
var MODES=['auto','grid','dawn','day','dusk','evening','night'],SKYMODE='auto';
try{var sv=localStorage.getItem('caldera-sky');if(sv&&MODES.indexOf(sv)>=0)SKYMODE=sv}catch(err){}
var hm0=location.hash.match(/[#&]sky=([a-z]+)/);if(hm0&&MODES.indexOf(hm0[1])>=0)SKYMODE=hm0[1];
var at0=location.hash.match(/[#&]at=(\d{1,2}):(\d{2})/);   // #at=18:40 shows Auto at that time (for checking the phases)
function rgba(c){if(c.charAt(0)==='#'){var n=parseInt(c.slice(1),16);return [n>>16,n>>8&255,n&255,1]}var m=c.match(/[\d.]+/g)||[0,0,0,1];return [+m[0],+m[1],+m[2],m[3]==null?1:+m[3]]}
function hex2(v){var x=Math.max(0,Math.min(255,Math.round(v))).toString(16);return x.length<2?'0'+x:x}
function lerpCol(a,b,f){var A=rgba(a),B=rgba(b),o=[0,1,2,3].map(function(k){return A[k]+(B[k]-A[k])*f});return o[3]>=.999?'#'+hex2(o[0])+hex2(o[1])+hex2(o[2]):'rgba('+Math.round(o[0])+','+Math.round(o[1])+','+Math.round(o[2])+','+o[3].toFixed(3)+')'}
function blendPal(a,b,f){var o={};for(var k in a){var x=a[k],y=b[k];o[k]=typeof x==='number'?x+(y-x)*f:Array.isArray(x)?x.map(function(v,i){return lerpCol(v,y[i],f)}):lerpCol(x,y,f)}return o}
function phaseNow(){var d=new Date(),m=at0?(+at0[1])*60+(+at0[2]):d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  for(var i=0;i<DAYKEYS.length-1;i++){var a=DAYKEYS[i],b=DAYKEYS[i+1];if(m>=a[0]&&m<=b[0]){var f=(m-a[0])/((b[0]-a[0])||1);return {a:a[1],b:b[1],f:f*f*(3-2*f)}}}return {a:'night',b:'night',f:0}}
function applySky(){var was=sky,k0=palKey;
  if(SKYMODE==='auto'){var ph=phaseNow();P=ph.a===ph.b?PAL[ph.a]:blendPal(PAL[ph.a],PAL[ph.b],ph.f);phase=ph.f<.5?ph.a:ph.b;sky=BASE[phase];palKey=ph.a+ph.b+Math.round(ph.f*40)}
  else if(SKYMODE==='grid'){sky='grid';P=PAL.night;phase='grid';palKey='grid'}
  else{sky=BASE[SKYMODE];P=PAL[SKYMODE];phase=SKYMODE;palKey=SKYMODE}
  night=sky==='night'||sky==='grid';if(sky!==was&&cars)cars.forEach(function(c){c.trail=[]});if(palKey!==k0){dirty=true;UDIRTY=true}}
applySky();
// ---- Tron mode: black glass, neon edges, a glowing grid floor and light cycles
var NEON={TypeScript:'#3AA8FF',JavaScript:'#FFD23A',Python:'#2BFFC0',HTML:'#FF8A2B',Swift:'#FF3D7F',CSS:'#B07CFF',Shell:'#9BFF4A',Go:'#3DF2FF',Rust:'#FF9F5A',Private:'#CFEFFF'};
var CYAN='#3DF2FF',ORANGE='#FF8A2B',DNEON=['#3DF2FF','#FF8A2B','#C77DFF','#FFD23A','#2BFFC0','#FF3D7F'];
function neon(r){return NEON[r.language]||'#9FB4FF'}
function glowLine(c,pts,col,w,blur,close){c.save();c.strokeStyle=col;c.lineWidth=w;c.shadowColor=col;c.shadowBlur=blur;c.lineJoin='round';c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]);if(close)c.closePath();c.stroke();c.restore()}
function tronGround(){var c=c1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L1.width,L1.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var A=corner(-.5,-.5),B=corner(W+.5,-.5),C=corner(W+.5,H+.5),Dd=corner(-.5,H+.5),th=22;
  poly(c,[Dd,C,[C[0],C[1]+th],[Dd[0],Dd[1]+th]],'#03060B');poly(c,[C,B,[B[0],B[1]+th],[C[0],C[1]+th]],'#020409');poly(c,[A,B,C,Dd],'#05080F');
  // floor grid: one line per tile edge, every fourth brighter
  c.save();c.lineWidth=.6;for(var pass=0;pass<2;pass++){c.beginPath();for(var i=0;i<=W+1;i++){if((i%4===0)!==(pass===1))continue;var a=corner(i-.5,-.5),b=corner(i-.5,H+.5);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}
    for(var j=0;j<=H+1;j++){if((j%4===0)!==(pass===1))continue;var a2=corner(-.5,j-.5),b2=corner(W+.5,j-.5);c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1])}
    c.strokeStyle=pass?'rgba(61,242,255,.45)':'rgba(61,242,255,.14)';c.shadowColor=CYAN;c.shadowBlur=pass?6:0;c.stroke()}c.restore();
  for(var j3=0;j3<=H;j3++)for(var i3=0;i3<=W;i3++){var tt=tiles[i3+','+j3];
    if(water(i3,j3)){poly(c,dia(i3,j3,1.02),'#020D16');var q=iso(i3,j3);c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(61,242,255,.35)';c.lineWidth=1;for(var w=0;w<2;w++){var ox=(rnd(i3*13+j3*7+w)-.5)*TW*.5,oy=(rnd(i3*5+j3*11+w)-.5)*TH*.4;c.beginPath();c.moveTo(q.x+ox-7,q.y+oy);c.lineTo(q.x+ox+7,q.y+oy);c.stroke()}c.restore();continue}
    if(tt.t==='r'){poly(c,dia(i3,j3,1.02),'#070A12');var ri=isRoad(i3-1,j3)||isRoad(i3+1,j3),rj=isRoad(i3,j3-1)||isRoad(i3,j3+1),q2=iso(i3,j3);
      if(ri&&!rj)glowLine(c,[[q2.x-TW*.5,q2.y-TH*.5],[q2.x+TW*.5,q2.y+TH*.5]],'rgba(61,242,255,.75)',1,5);
      else if(rj&&!ri)glowLine(c,[[q2.x+TW*.5,q2.y-TH*.5],[q2.x-TW*.5,q2.y+TH*.5]],'rgba(61,242,255,.75)',1,5);
      else if(ri&&rj){c.fillStyle='rgba(61,242,255,.08)';poly(c,dia(i3,j3,.7));c.fill()}}}
  // the island rim
  glowLine(c,[A,B,C,Dd],'rgba(61,242,255,.9)',1.4,10,true);glowLine(c,[[Dd[0],Dd[1]+th],[C[0],C[1]+th],[B[0],B[1]+th]],'rgba(61,242,255,.35)',1,6);
  // district pads with neon rims in the district's color
  blocks.forEach(function(b,bi){var col=b.d.name==='Private'?'#CFEFFF':DNEON[bi%DNEON.length],x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1);
    poly(c,[a,bb,cc,dd],'#0A1120');glowLine(c,[a,bb,cc,dd],col,1.2,9,true);b.neon=col});
  for(var key in tiles){var t2=tiles[key];if(t2.t!=='h'&&t2.t!=='p')continue;var ij=key.split(','),q3=iso(+ij[0],+ij[1]);c.fillStyle=t2.t==='h'?'#0B1626':'#061510';poly(c,dia(+ij[0],+ij[1],.86));c.fill()}
  // glossy floor: each tower's glow reflected under it
  c.save();c.globalCompositeOperation='lighter';for(var k2 in tiles){var t3=tiles[k2];if(t3.t!=='b')continue;var ij2=k2.split(','),pp=iso(+ij2[0],+ij2[1]),col=t3.r.locked?'#CFEFFF':neon(t3.r);
    var g=c.createRadialGradient(pp.x,pp.y+6,1,pp.x,pp.y+6,TW*.7);g.addColorStop(0,col+'40');g.addColorStop(1,col+'00');c.fillStyle=g;c.beginPath();c.ellipse(pp.x,pp.y+6,TW*.7,TH*.6,0,0,7);c.fill()}c.restore();
}
function tronPrism(c,px,py,w,h,col,litp,seed,locked){var hw=TW/2*w,hh=TH/2*w,L=[[px-hw,py],[px,py+hh],[px,py+hh-h],[px-hw,py-h]],R=[[px,py+hh],[px+hw,py],[px+hw,py-h],[px,py+hh-h]],Tp=[[px,py-hh-h],[px+hw,py-h],[px,py+hh-h],[px-hw,py-h]];
  var g=c.createLinearGradient(0,py-h,0,py+hh);g.addColorStop(0,'#101A2C');g.addColorStop(1,'#060A12');poly(c,L,g);var g2=c.createLinearGradient(0,py-h,0,py+hh);g2.addColorStop(0,'#0A1220');g2.addColorStop(1,'#04070D');poly(c,R,g2);poly(c,Tp,'#0E1A2E');
  // window light strips, floor by floor
  var rows=Math.max(0,Math.floor((h-8)/7));for(var side=0;side<2;side++){var ax=side?px:px-hw,ay=side?py+hh:py,bx=side?px+hw:px,by=side?py:py+hh;
    for(var r=0;r<rows;r++){var on=rnd(seed+r*7.3+side*31.7)<litp,v=6+r*7,u0=.14+rnd(seed+r)*.1,u1=.86-rnd(seed+r*3)*.1;
      c.strokeStyle=on?col:'rgba(160,200,255,.07)';c.globalAlpha=on?(side?.75:.95):1;c.lineWidth=1.3;c.beginPath();c.moveTo(ax+(bx-ax)*u0,ay+(by-ay)*u0-v);c.lineTo(ax+(bx-ax)*u1,ay+(by-ay)*u1-v);c.stroke();c.globalAlpha=1}}
  // neon edges
  glowLine(c,[[px-hw,py],[px,py+hh],[px+hw,py]],col,1,6);glowLine(c,[[px,py+hh],[px,py+hh-h]],col,1.4,10);glowLine(c,[[px-hw,py],[px-hw,py-h]],col,.8,5);glowLine(c,[[px+hw,py],[px+hw,py-h]],col,.8,5);
  glowLine(c,Tp,col,1.2,10,true)}
function tronObjects(){var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];tagHits=[];lamps=[];cranes=[];beacons=[];var tags=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if((t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<.22)||t.t==='p'){// data crystals
      var n=t.t==='p'?3:1;for(var q=0;q<n;q++){var cx0=p.x+(rnd(i*3+q)-.5)*24,cy0=p.y+(rnd(j*5+q)-.5)*10,s=.6+rnd(i+j+q)*.5,col=rnd(i*7+j+q)<.5?'#2BFFC0':CYAN;
        c.fillStyle='rgba(10,30,40,.9)';poly(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]]);c.fill();glowLine(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]],col,.8,6,true)}}
    if(t.t==='h'){var spots=[[-11,-3],[11,-3],[0,-9],[0,4]],blk=null;blocks.forEach(function(b){if(b.d===t.d)blk=b});var hc=blk&&blk.neon||CYAN;
      for(var q2=0;q2<t.n;q2++){var hx=p.x+spots[q2][0],hy=p.y+spots[q2][1],hw=TW/2*.24,hh=TH/2*.24;c.fillStyle='#0A1220';poly(c,[[hx-hw,hy],[hx,hy+hh],[hx+hw,hy],[hx+hw,hy-6],[hx,hy-14],[hx-hw,hy-6]]);c.fill();
        glowLine(c,[[hx-hw,hy-6],[hx,hy-14],[hx+hw,hy-6]],hc,1,6);c.fillStyle=hc;c.globalAlpha=.8;c.fillRect(hx-1,hy-4,2,2);c.globalAlpha=1}}
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),seed=hash(r.name||(i+'_'+j)),col=r.locked?'#CFEFFF':dm?'#5A6A80':neon(r);
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=dm?.03:r.locked?(r.week?.45:.12):Math.min(.95,.25+(r.week/Math.max(wk,1))*.7);
      var tiers=h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]],base=p.y+4,top=base;
      for(var k=0;k<tiers.length;k++){tronPrism(c,p.x,top,tiers[k][0],tiers[k][1],col,litp,seed+k*101,r.locked);top-=tiers[k][1]}
      if(r.locked){glowLine(c,[[p.x-3,top-6],[p.x-3,top-8],[p.x,top-11],[p.x+3,top-8],[p.x+3,top-6]],col,1.2,6);c.fillStyle=col;c.fillRect(p.x-4,top-6,8,6)}
      if(r===tallest){c.save();c.globalCompositeOperation='lighter';var g=c.createLinearGradient(0,top-260,0,top);g.addColorStop(0,col+'00');g.addColorStop(1,col+'90');c.fillStyle=g;c.fillRect(p.x-2.5,top-260,5,260);c.restore();beacons.push({x:p.x,y:top-4})}
      if(r.week>0&&!dm)cranes.push({x:p.x+4,y:top,seed:seed,col:col});
      if(sel===r){var hw2=TW/2*.78,hh2=TH/2*.78;glowLine(c,[[p.x-hw2,base],[p.x,base+hh2],[p.x+hw2,base],[p.x+hw2,top],[p.x,top-TH/2*.46],[p.x-hw2,top]],'#FFFFFF',2/cam.z+.6,16,true)}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&!r.locked&&(cam.z>1.05||sel===r||topSet.indexOf(r)>=0))tags.push({x:p.x,y:top-(r===tallest?12:8),text:r.name.length>18?r.name.slice(0,17)+'\u2026':r.name,col:col,url:repoUrl(r)})}}
  if(labels){tags.forEach(function(g){tronPill(c,g.x,g.y,g.text,g.col,'600 10.5px IBM Plex Mono,monospace');tagHit(c,g,'600 10.5px IBM Plex Mono,monospace')});blocks.forEach(function(b){var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05);tronPill(c,p2[0],p2[1]+22,b.d.name.toUpperCase(),b.neon||CYAN,'700 10.5px IBM Plex Mono,monospace')})}}
function tronPill(c,x,y,text,col,font){c.font=font;var tw=c.measureText(text).width,w=tw+14,h=17;c.fillStyle='rgba(2,6,12,.88)';poly(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]]);c.fill();
  glowLine(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]],col,1,6,true);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
function rgb(hex){var n=parseInt(hex.slice(1),16);return [n>>16,n>>8&255,n&255]}
function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
function mix(h,f,toward){var c=rgb(h);if(toward){var t=rgb(toward);return hex(c.map(function(v,i){return v+(t[i]-v)*f}))}
  if(f>=1)return hex(c.map(function(v){return v+(255-v)*(f-1)}));return hex(c.map(function(v){return v*f}))}
function lit(hex,f){return mix(hex,f*P.light+(f>=1?0:0))}
var tallest=null,second=null;(function(){var all=[];D.districts.forEach(function(d){d.repos.forEach(function(r){all.push(r)})});all.sort(function(a,b){return bh(b)-bh(a)});tallest=all[0];second=all[1]})();
// ---- layers: ground (L1) and objects (L2) are cached; cars, cranes and lights animate on top
var L1=document.createElement('canvas'),L2=document.createElement('canvas'),c1=L1.getContext('2d'),c2=L2.getContext('2d'),dirty=true,hits=[],sel=null,T=0;
function isRoad(i,j){var t=tiles[i+','+j];return t&&t.t==='r'}
function poly(ctx,pts,fill){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++)ctx.lineTo(pts[k][0],pts[k][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}}
function dia(i,j,s){var p=iso(i,j),hw=TW/2*s,hh=TH/2*s;return [[p.x,p.y-hh],[p.x+hw,p.y],[p.x,p.y+hh],[p.x-hw,p.y]]}
function corner(i,j){var p=iso(i,j);return [p.x,p.y]}
function water(i,j){return i===W||j===H}
function drawGround(){var c=c1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L1.width,L1.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  // the island: a diorama slab with earth sides
  var A=corner(-.5,-.5),B=corner(W+.5,-.5),C=corner(W+.5,H+.5),Dd=corner(-.5,H+.5),th=22;
  poly(c,[Dd,C,[C[0],C[1]+th],[Dd[0],Dd[1]+th]],P.earth[0]);poly(c,[C,B,[B[0],B[1]+th],[C[0],C[1]+th]],P.earth[1]);
  poly(c,[A,B,C,Dd],P.grass);
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var t=tiles[i+','+j];
    if(water(i,j)){var g=c.createLinearGradient(0,iso(i,j).y-TH/2,0,iso(i,j).y+TH/2);g.addColorStop(0,P.water[0]);g.addColorStop(1,P.water[1]);poly(c,dia(i,j,1.02),g);
      var q=iso(i,j);c.strokeStyle=sky==='night'?'rgba(140,170,230,.25)':'rgba(255,255,255,.35)';c.lineWidth=1;for(var w=0;w<2;w++){var ox=(rnd(i*13+j*7+w)-.5)*TW*.5,oy=(rnd(i*5+j*11+w)-.5)*TH*.4;c.beginPath();c.moveTo(q.x+ox-6,q.y+oy);c.quadraticCurveTo(q.x+ox,q.y+oy-2,q.x+ox+6,q.y+oy);c.stroke()}continue}
    if(t.t==='g'){if((i*7+j*3)%5===0)poly(c,dia(i,j,.9),P.grass2);continue}
    if(t.t==='r'){poly(c,dia(i,j,1.02),(i+j)%2?P.road:P.road2);
      var ri=isRoad(i-1,j)||isRoad(i+1,j),rj=isRoad(i,j-1)||isRoad(i,j+1),q2=iso(i,j);c.strokeStyle=P.line;c.lineWidth=1.2;c.setLineDash([5,5]);
      if(ri&&!rj){c.beginPath();c.moveTo(q2.x-TW*.25,q2.y-TH*.25);c.lineTo(q2.x+TW*.25,q2.y+TH*.25);c.stroke()}
      else if(rj&&!ri){c.beginPath();c.moveTo(q2.x+TW*.25,q2.y-TH*.25);c.lineTo(q2.x-TW*.25,q2.y+TH*.25);c.stroke()}
      c.setLineDash([]);
      if(ri&&rj){c.fillStyle=sky==='night'?'rgba(255,255,255,.12)':'rgba(255,255,255,.5)';for(var z=-2;z<=2;z++){c.save();c.translate(q2.x,q2.y);c.transform(1,.5,-1,.5,0,0);c.fillRect(-10+z*4,-12,2,5);c.fillRect(-10+z*4,7,2,5);c.restore()}}}
  }
  // blocks: raised sidewalk slabs, then lots
  blocks.forEach(function(b){var x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1),h=3;
    poly(c,[dd,cc,[cc[0],cc[1]+h],[dd[0],dd[1]+h]],P.walkSide);poly(c,[cc,bb,[bb[0],bb[1]+h],[cc[0],cc[1]+h]],mix(P.walkSide.charAt(0)==='#'?P.walkSide:'#999999',.85));poly(c,[a,bb,cc,dd],P.walk)});
  for(var key in tiles){var t2=tiles[key];if(t2.t!=='b'&&t2.t!=='h'&&t2.t!=='p')continue;var ij=key.split(','),ii=+ij[0],jj=+ij[1];
    if(t2.t==='b')poly(c,dia(ii,jj,.9),P.plaza);
    else if(t2.t==='h'){poly(c,dia(ii,jj,.9),P.grass2);}
    else{poly(c,dia(ii,jj,.9),P.park);var q3=iso(ii,jj);c.strokeStyle=sky==='night'?'rgba(200,190,170,.18)':'rgba(240,232,210,.8)';c.lineWidth=2;c.beginPath();c.moveTo(q3.x-TW*.3,q3.y);c.quadraticCurveTo(q3.x,q3.y-4,q3.x+TW*.3,q3.y);c.stroke()}}
  // soft building shadows, unioned into one path so overlaps don't double-darken (sun from the upper left)
  c.beginPath();for(var k2 in tiles){var t3=tiles[k2];if(t3.t!=='b')continue;var ij2=k2.split(','),pp=iso(+ij2[0],+ij2[1]),hgt=bh(t3.r),hw=TW/2*.78,hh=TH/2*.78,vx=hgt*.62,vy=hgt*.3;
    var pts=[[pp.x-hw,pp.y+4],[pp.x,pp.y+4-hh],[pp.x+vx,pp.y+4-hh+vy],[pp.x+hw+vx,pp.y+4+vy],[pp.x+vx,pp.y+4+hh+vy],[pp.x,pp.y+4+hh]];c.moveTo(pts[0][0],pts[0][1]);for(var m=1;m<pts.length;m++)c.lineTo(pts[m][0],pts[m][1]);c.closePath()}
  c.fillStyle=P.shadow;c.fill('nonzero');
}
// ---- objects
var GLASS={TypeScript:1,Swift:1,Go:1,Rust:1,Private:1};
function face(c,pts,col,f,y0,y1){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,mix(col,f*P.light*1.04));g.addColorStop(1,mix(col,f*P.light*.78));poly(c,pts,g)}
function prism(c,px,py,w,h,col){var hw=TW/2*w,hh=TH/2*w;
  face(c,[[px-hw,py],[px,py+hh],[px,py+hh-h],[px-hw,py-h]],col,.98,py-h,py+hh);
  face(c,[[px,py+hh],[px+hw,py],[px+hw,py-h],[px,py+hh-h]],col,.72,py-h,py+hh);
  poly(c,[[px,py-hh-h],[px+hw,py-h],[px,py+hh-h],[px-hw,py-h]],mix(col,1.12*P.light+(P.light<1?.1:0)));
  c.strokeStyle='rgba(255,255,255,'+(sky==='night'?.06:.16)+')';c.lineWidth=.8;c.beginPath();c.moveTo(px,py+hh);c.lineTo(px,py+hh-h);c.stroke();
  c.strokeStyle='rgba(0,0,0,.22)';c.beginPath();c.moveTo(px-hw,py-h);c.lineTo(px,py+hh-h);c.lineTo(px+hw,py-h);c.stroke();return {hw:hw,hh:hh}}
// windows: parallelograms that follow each face; u runs along the face, v up from the base
function facadeWindows(c,px,py,w,h,glass,litp,seed,base){var hw=TW/2*w,hh=TH/2*w,cols=w>.6?4:3,rows=Math.max(0,Math.floor((h-9)/(glass?7:8)));
  for(var side=0;side<2;side++){var ax=side?px:px-hw,ay=side?py+hh:py,bx=side?px+hw:px,by=side?py:py+hh;
    if(glass){c.strokeStyle='rgba(255,255,255,'+(sky==='night'?.05:.18)+')';c.lineWidth=.7;for(var m=1;m<cols+1;m++){var u=m/(cols+1);c.beginPath();c.moveTo(ax+(bx-ax)*u,ay+(by-ay)*u-3);c.lineTo(ax+(bx-ax)*u,ay+(by-ay)*u-h+2);c.stroke()}
      if(!side&&sky!=='night'){c.save();poly(c,[[ax,ay],[bx,by],[bx,by-h],[ax,ay-h]]);c.clip();var gx=c.createLinearGradient(ax,ay-h,bx,by);gx.addColorStop(.3,'rgba(255,255,255,0)');gx.addColorStop(.45,'rgba(255,255,255,.22)');gx.addColorStop(.55,'rgba(255,255,255,0)');c.fillStyle=gx;c.fillRect(ax-2,ay-h-hh-2,hw+4,h+hh*2+4);c.restore()}}
    for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){var on=rnd(seed+r*7.3+k*13.1+side*31.7)<litp;if(glass&&!on&&sky!=='night')continue;
      var u0=(k+.22)/cols,u1=(k+.78)/cols,v0=6+r*(glass?7:8),v1=v0+(glass?4:5);
      c.fillStyle=on?P.win:P.winOff;poly(c,[[ax+(bx-ax)*u0,ay+(by-ay)*u0-v0],[ax+(bx-ax)*u1,ay+(by-ay)*u1-v0],[ax+(bx-ax)*u1,ay+(by-ay)*u1-v1],[ax+(bx-ax)*u0,ay+(by-ay)*u0-v1]]);c.fill()}
    // ground floor: storefront band
    c.fillStyle=sky==='night'?'rgba(255,200,120,.35)':'rgba(30,36,48,.35)';poly(c,[[ax,ay-1],[bx,by-1],[bx,by-5],[ax,ay-5]]);c.fill()}}
function roofProps(c,px,ty,w,r,seed){var hw=TW/2*w,hh=TH/2*w,s=rnd(seed);
  if(r.locked){c.fillStyle=sky==='night'?'#AFC0E0':'#E8EDF6';c.strokeStyle=c.fillStyle;c.lineWidth=1.6;c.beginPath();c.arc(px,ty-6,3,Math.PI,0);c.stroke();c.fillRect(px-4,ty-6,8,6);c.fillStyle='#5C6B86';c.fillRect(px-.7,ty-4.5,1.4,2.5);return}
  if(r===tallest){c.strokeStyle='#B8BCC6';c.lineWidth=1.2;c.beginPath();c.moveTo(px,ty);c.lineTo(px,ty-26);c.stroke();return}
  if(r===second&&w>.5){c.fillStyle='rgba(40,44,56,.85)';c.beginPath();c.ellipse(px,ty,hw*.55,hh*.55,0,0,7);c.fill();c.fillStyle='#F2D24A';c.font='bold 7px sans-serif';c.textAlign='center';c.fillText('H',px,ty+2.5);return}
  if(s<.3&&!GLASS[r.language]){// water tower
    c.fillStyle='#6B5137';c.fillRect(px-5,ty-8,1.2,8);c.fillRect(px+4,ty-8,1.2,8);c.fillStyle='#8B6A48';c.fillRect(px-6,ty-17,12,9);c.beginPath();c.moveTo(px-7,ty-17);c.lineTo(px,ty-22);c.lineTo(px+7,ty-17);c.closePath();c.fillStyle='#5E4630';c.fill();return}
  if(s<.55){// AC units
    for(var q=0;q<3;q++){var ox=(rnd(seed+q)-.5)*hw*.9,oy=(rnd(seed+q*3)-.5)*hh*.7;prism(c,px+ox,ty+oy,.12,4,'#9AA1AD')}return}
  if(s<.72&&GLASS[r.language]){// solar panels
    c.fillStyle=sky==='night'?'#18233E':'#2B4C86';for(var q2=-1;q2<=1;q2++){poly(c,[[px-8+q2*5,ty-1+q2*2.5],[px-2+q2*5,ty-4+q2*2.5],[px+2+q2*5,ty-2+q2*2.5],[px-4+q2*5,ty+1+q2*2.5]]);c.fill()}return}
  if(s<.85){// roof garden
    poly(c,[[px,ty-hh*.8],[px+hw*.8,ty],[px,ty+hh*.8],[px-hw*.8,ty]],sky==='night'?'#1F3A28':'#5DA14E');tree2(c,px-4,ty+1,.55);tree2(c,px+5,ty-1,.45)}}
function tree2(c,px,py,s){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+4*s,py+1,7*s,3*s,0,0,7);c.fill();c.fillStyle='#6B4B2E';c.fillRect(px-.8*s,py-6*s,1.6*s,6*s);
  var g=c.createRadialGradient(px-2*s,py-13*s,1,px,py-10*s,9*s);g.addColorStop(0,sky==='night'?'#2E5A3C':'#8CCF6E');g.addColorStop(1,sky==='night'?'#15301F':'#3F8A47');c.fillStyle=g;c.beginPath();c.arc(px,py-10*s,7.5*s,0,7);c.fill()}
function pine(c,px,py,s){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+3*s,py+1,6*s,2.5*s,0,0,7);c.fill();c.fillStyle=sky==='night'?'#173126':'#2F7A4A';for(var k=0;k<3;k++){c.beginPath();c.moveTo(px,py-18*s+k*4*s);c.lineTo(px+6*s-k*.5,py-6*s+k*2*s);c.lineTo(px-6*s+k*.5,py-6*s+k*2*s);c.closePath();c.fill()}}
function houseAt(c,px,py,col,seed){var w=.26,hw=TW/2*w,hh=TH/2*w,h=8;prism(c,px,py,w,h,col);
  var rt=py-h,rc=sky==='night'?'#4A2A2A':['#B4554F','#8E5A3C','#5B6B8A','#A0503A'][seed%4];
  poly(c,[[px-hw,rt],[px-hw*.15,rt-9],[px+hw*.85,rt-9+hh*.9],[px,rt+hh]],mix(rc,1));poly(c,[[px,rt+hh],[px+hw*.85,rt-9+hh*.9],[px+hw,rt],],mix(rc,.7));
  poly(c,[[px-hw*.15,rt-9],[px+hw,rt],[px+hw*.85,rt-9+hh*.9]],mix(rc,.85));
  c.fillStyle=mix('#8A7A6A',.9);c.fillRect(px+hw*.3,rt-10,2.2,5);
  c.fillStyle=sky==='night'?'rgba(255,208,120,.95)':'rgba(70,90,120,.7)';poly(c,[[px-hw*.6,py-3+hh*.4-3],[px-hw*.3,py-3+hh*.7-3],[px-hw*.3,py-3+hh*.7-6],[px-hw*.6,py-3+hh*.4-6]]);c.fill()}
function lamp(c,px,py){c.strokeStyle=sky==='night'?'#555B66':'#4A4F58';c.lineWidth=1;c.beginPath();c.moveTo(px,py);c.lineTo(px,py-14);c.lineTo(px+3,py-15);c.stroke();c.fillStyle=sky==='night'?'#FFE3A0':'#C9CDD4';c.fillRect(px+2,py-16,3,2)}
// a public repo's name label is a link to it (private and locked buildings never link)
var tagHits=[];function repoUrl(r){return !r.locked&&r.public!==false&&/^https:\/\/[^\s"<>]+$/.test(r.url||'')?r.url:''}
function tagHit(c,g,font){if(!g.url)return;c.font=font;var w=c.measureText(g.text).width+12;tagHits.push({x0:g.x-w/2,x1:g.x+w/2,y0:g.y-17,y1:g.y+2,url:g.url})}
function openRepo(u){if(u)window.open(u,'_blank','noopener')}
function pill(c,x,y,text,bg,fg,font){c.font=font;var tw=c.measureText(text).width,w=tw+12,h=17,r=8.5;c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=6;c.shadowOffsetY=2;c.fillStyle=bg;c.beginPath();
  c.moveTo(x-w/2+r,y-h);c.arcTo(x+w/2,y-h,x+w/2,y,r);c.arcTo(x+w/2,y,x-w/2,y,r);c.lineTo(x+3,y);c.lineTo(x,y+4);c.lineTo(x-3,y);c.arcTo(x-w/2,y,x-w/2,y-h,r);c.arcTo(x-w/2,y-h,x+w/2,y-h,r);c.closePath();c.fill();c.restore();
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
var lamps=[],cranes=[],beacons=[];
function drawObjects(){var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];tagHits=[];lamps=[];cranes=[];beacons=[];var tags=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if(t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<(i===0||j===0?.55:.8)){var s=.7+rnd(i+j*3)*.5;if(rnd(i*3+j)<.5)tree2(c,p.x+(rnd(i)-.5)*20,p.y+(rnd(j)-.5)*8,s);else pine(c,p.x+(rnd(j)-.5)*20,p.y+(rnd(i)-.5)*8,s)}
    if(t.t==='r'&&(isRoad(i-1,j)||isRoad(i+1,j))&&(isRoad(i,j-1)||isRoad(i,j+1))&&(i+j)%2===0){var lp={x:p.x-TW*.32,y:p.y};lamp(c,lp.x,lp.y);lamps.push(lp)}
    if(t.t==='p'){tree2(c,p.x-10,p.y+1,.9);pine(c,p.x+11,p.y-2,.8);tree2(c,p.x+2,p.y+7,.6)}
    if(t.t==='h'){var spots=[[-11,-3],[11,-3],[0,-9],[0,4]],sd=hash(t.d.name);for(var q=0;q<t.n;q++)houseAt(c,p.x+spots[q][0],p.y+spots[q][1],['#E8DCC8','#CFD8E6','#EAD2B8','#D2E0CC'][(sd+q)%4],sd+q)}
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),seed=hash(r.name||(i+'_'+j)),glass=!!GLASS[r.language]||r.locked;
      var col=r.locked?'#5F6F8E':dm?mix(LANG[r.language]||'#8A8A93',.55,'#8A8E96'):(LANG[r.language]||'#8A8A93');
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=dm?0:r.locked?(r.week?.4:.08):Math.min(.95,.15+(r.week/Math.max(wk,1))*.8);
      litp=Math.min(litp,P.lit==null?1:P.lit);   // fewer lit windows by day, more as evening comes
      var tiers=h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]],base=p.y+4,top=base;
      for(var k=0;k<tiers.length;k++){var tw=tiers[k][0],th=tiers[k][1];var sh=prism(c,p.x,top,tw,th,col);facadeWindows(c,p.x,top,tw,th,glass,litp,seed+k*101,base);top-=th}
      roofProps(c,p.x,top,tiers[tiers.length-1][0],r,seed);
      if(r===tallest)beacons.push({x:p.x,y:top-26});
      if(r.week>0&&!dm)cranes.push({x:p.x+4,y:top,seed:seed});
      if(sel===r){c.save();c.strokeStyle='#C4B5FF';c.lineWidth=2.4/cam.z;c.shadowColor='#8B6CF6';c.shadowBlur=12;var hw=TW/2*.78,hh=TH/2*.78;c.beginPath();c.moveTo(p.x-hw,base);c.lineTo(p.x,base+hh);c.lineTo(p.x+hw,base);c.lineTo(p.x+hw,top+ (base-top>0?0:0));c.lineTo(p.x,top-TH/2*.46);c.lineTo(p.x-hw,top);c.closePath();c.stroke();c.restore()}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&!r.locked&&(cam.z>1.05||sel===r||topSet.indexOf(r)>=0))tags.push({x:p.x,y:top-(r===tallest?32:8),text:r.name.length>18?r.name.slice(0,17)+'…':r.name,url:repoUrl(r)})}}
  if(labels){tags.forEach(function(g){pill(c,g.x,g.y,g.text,'rgba(17,20,32,.86)','#F2F2F5','600 10.5px IBM Plex Sans,Arial,sans-serif');tagHit(c,g,'600 10.5px IBM Plex Sans,Arial,sans-serif')});
    blocks.forEach(function(b){var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05);pill(c,p2[0],p2[1]+22,b.d.name,'rgba(139,108,246,.95)','#fff','700 11.5px IBM Plex Sans,Arial,sans-serif')})}
}
function drawSky(){var c=cx;c.setTransform(dpr,0,0,dpr,0,0);
  if(sky==='grid'){c.fillStyle='#010207';c.fillRect(0,0,vw,vh);var g0=c.createRadialGradient(vw/2,vh*.38,10,vw/2,vh*.38,Math.max(vw,vh)*.7);g0.addColorStop(0,'rgba(30,70,140,.45)');g0.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g0;c.fillRect(0,0,vw,vh);
    c.strokeStyle='rgba(61,242,255,.07)';c.lineWidth=1;for(var y=vh*.12;y<vh;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(vw,y);c.stroke()}return}var g=c.createLinearGradient(0,0,0,vh);g.addColorStop(0,P.sky[0]);g.addColorStop(.6,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,vw,vh);
  var cc=wxCloud(),wk=wxKind(),tint={partly:.06,overcast:.4,fog:.42,drizzle:.32,rain:.46,storm:.62,snow:.36}[wk]||0;
  if(tint){c.fillStyle=sky==='night'?'rgba(18,22,32,'+tint+')':sky==='dusk'?'rgba(110,100,120,'+tint+')':'rgba(140,148,160,'+tint+')';c.fillRect(0,0,vw,vh)}
  if(sky==='night'&&cc<60){c.globalAlpha=1-cc/60;for(var s=0;s<90;s++){c.fillStyle='rgba(255,255,255,'+(.25+rnd(s)*.6)+')';var sz=rnd(s*5)<.1?1.8:1.1;c.fillRect(rnd(s*3)*vw,rnd(s*7)*vh*.5,sz,sz)}
    c.fillStyle='#F4F1E4';c.beginPath();c.arc(vw*.86,vh*.13,13,0,7);c.fill();c.fillStyle=P.sky[0];c.beginPath();c.arc(vw*.86+5,vh*.13-3,12,0,7);c.fill();c.globalAlpha=1}
  drawClouds(c)}
function carPos(car){var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;return {x:a.x+dx*car.t+nx*4,y:a.y+dy*car.t+ny*4,ux:ux,uy:uy}}
function drawCycles(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  var tn=performance.now();cars.forEach(function(car,k){var f=fa(car,tn),col=k%2?ORANGE:CYAN,tr=car.trail||[];if(tr.length>1){c.strokeStyle=col;c.globalAlpha=.35*f;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();
      c.globalAlpha=.95*f;c.lineWidth=1.3;c.stroke();c.strokeStyle='#FFFFFF';c.globalAlpha=.6*f;c.lineWidth=.5;c.stroke()}
    c.globalAlpha=f;var p=carPos(car);c.fillStyle=col;c.beginPath();c.arc(p.x,p.y-1,2.2,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x+p.ux*1.5,p.y+p.uy*1.5-1,1,0,7);c.fill()});c.restore()}
function drawVis(){if(!vis.length)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  vis.forEach(function(v){var age=tn-v.born,a=Math.min(1,age/600,(v.life-age)/1500);if(a<=0)return;var tr=v.trail||[];
    if(tr.length>1){c.strokeStyle=v.col;c.globalAlpha=.3*a;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();c.globalAlpha=.9*a;c.lineWidth=1.2;c.stroke()}
    var p=carPos(v);c.globalAlpha=a;var g=c.createRadialGradient(p.x,p.y-1,0,p.x,p.y-1,7);g.addColorStop(0,v.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y-1,7,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x,p.y-1,1.6,0,7);c.fill()});
  c.restore()}
function drawCars(){if(sky==='grid')return drawCycles();var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now();cars.forEach(function(car){c.globalAlpha=fa(car,tn);var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;
    var px=a.x+dx*car.t+nx*4,py=a.y+dy*car.t+ny*4;
    if(sky!=='day'){var g=c.createRadialGradient(px+ux*10,py+uy*10,0,px+ux*10,py+uy*10,14);g.addColorStop(0,'rgba(255,240,190,.55)');g.addColorStop(1,'rgba(255,240,190,0)');c.fillStyle=g;c.beginPath();c.arc(px+ux*10,py+uy*10,14,0,7);c.fill()}
    c.fillStyle='rgba(0,0,0,.25)';poly(c,[[px-ux*5-nx*2.5+1,py-uy*5-ny*2.5+1.5],[px+ux*5-nx*2.5+1,py+uy*5-ny*2.5+1.5],[px+ux*5+nx*2.5+1,py+uy*5+ny*2.5+1.5],[px-ux*5+nx*2.5+1,py-uy*5+ny*2.5+1.5]]);c.fill();
    poly(c,[[px-ux*5-nx*2.5,py-uy*5-ny*2.5-2],[px+ux*5-nx*2.5,py+uy*5-ny*2.5-2],[px+ux*5+nx*2.5,py+uy*5+ny*2.5-2],[px-ux*5+nx*2.5,py-uy*5+ny*2.5-2]],mix(car.col,P.light<1?.75:1));
    poly(c,[[px-ux*2-nx*2,py-uy*2-ny*2-4],[px+ux*2.5-nx*2,py+uy*2.5-ny*2-4],[px+ux*2.5+nx*2,py+uy*2.5+ny*2-4],[px-ux*2+nx*2,py-uy*2+ny*2-4]],mix(car.col,1.15));
    if(sky!=='day'){c.fillStyle='#FF4A4A';c.fillRect(px-ux*5-1,py-uy*5-3,2,1.5)}});c.globalAlpha=1}
function drawLive(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now();pulses=pulses.filter(function(p){return tn-p.born<3200});
  if(pulses.length){c.save();c.globalCompositeOperation='lighter';pulses.forEach(function(p){var pr=(tn-p.born)/3200,r=12+pr*(p.big?90:60);c.strokeStyle=p.col;c.globalAlpha=1-pr;c.lineWidth=2.5;c.shadowColor=p.col;c.shadowBlur=12;c.beginPath();c.ellipse(p.x,p.y,r,r*.5,0,0,7);c.stroke();
    if(p.big){var g=c.createLinearGradient(0,p.y-260,0,p.y);g.addColorStop(0,'rgba(255,210,63,0)');g.addColorStop(1,'rgba(255,210,63,.85)');c.fillStyle=g;c.globalAlpha=(1-pr)*.9;c.fillRect(p.x-3,p.y-260,6,260)}});c.restore()}
  Object.keys(LV.d).forEach(function(k){var b=byName[k],x=LV.d[k];if(!b||!(x.level>0))return;var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),pr=(tn%2000)/2000;
    c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,255,255,'+(.35*(1-pr))+')';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,(b.k*TW/2)*(.6+pr*.5),(b.k*TH/2)*(.6+pr*.5),0,0,7);c.stroke();c.restore();
    if(LV.mode==='private'&&x.now>0){var f=iso(b.x+b.k,b.y+b.k);tronPill(c,f.x,f.y+18,'\u25CF '+x.now+' live','#FFFFFF','600 10px ui-monospace,monospace')}});
  // cranes slowly rotate their jibs
  cranes.forEach(function(k){var mx=k.x,my=k.y,mh=30,a=T/2400+k.seed%6;if(sky==='grid'){c.save();c.shadowColor=k.col;c.shadowBlur=6}c.strokeStyle=sky==='grid'?k.col:'#E9A92C';c.lineWidth=1.2;c.beginPath();c.moveTo(mx-1.5,my);c.lineTo(mx-1.5,my-mh);c.moveTo(mx+1.5,my);c.lineTo(mx+1.5,my-mh);for(var z=0;z<mh;z+=5){c.moveTo(mx-1.5,my-z);c.lineTo(mx+1.5,my-z-5)}c.stroke();
    var jx=Math.cos(a)*30,jy=Math.sin(a)*15;c.lineWidth=1.6;c.beginPath();c.moveTo(mx-jx*.35,my-mh-jy*.35);c.lineTo(mx+jx,my-mh+jy);c.stroke();c.fillStyle='#7A7F8A';c.fillRect(mx-jx*.35-2,my-mh-jy*.35-1,4,4);
    var hx=mx+jx*.7,hy=my-mh+jy*.7;c.strokeStyle='rgba(60,60,60,.8)';c.lineWidth=.6;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx,hy+12+Math.sin(T/700+k.seed)*3);c.stroke();c.fillStyle=sky==='grid'?k.col:'#E9A92C';c.fillRect(hx-2,hy+12+Math.sin(T/700+k.seed)*3,4,3);
    if((sky==='night'||sky==='grid')&&Math.floor(T/700+k.seed)%2){c.fillStyle='#FF5040';c.beginPath();c.arc(mx,my-mh-2,1.6,0,7);c.fill()}if(sky==='grid')c.restore()});
  if(P.lamp){c.globalCompositeOperation='lighter';lamps.forEach(function(l){var g=c.createRadialGradient(l.x+3,l.y-15,0,l.x+3,l.y-6,26);g.addColorStop(0,'rgba(255,214,140,'+(.35*P.lamp)+')');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.beginPath();c.arc(l.x+3,l.y-8,26,0,7);c.fill()});c.globalCompositeOperation='source-over'}
  if(sky==='grid'){c.globalCompositeOperation='lighter';beacons.forEach(function(b){var pr=(T%2400)/2400,g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,30*pr+4);g.addColorStop(0,'rgba(255,255,255,.0)');g.addColorStop(.8,'rgba(61,242,255,'+(.5*(1-pr))+')');g.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=g;c.beginPath();c.ellipse(b.x,b.y,30*pr+4,(30*pr+4)*.5,0,0,7);c.fill()});c.globalCompositeOperation='source-over';return}
  beacons.forEach(function(b){if(Math.floor(T/900)%2){c.fillStyle='#FF3B30';c.beginPath();c.arc(b.x,b.y,2,0,7);c.fill();if(sky!=='day'){c.globalCompositeOperation='lighter';var g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,10);g.addColorStop(0,'rgba(255,60,48,.6)');g.addColorStop(1,'rgba(255,60,48,0)');c.fillStyle=g;c.beginPath();c.arc(b.x,b.y,10,0,7);c.fill();c.globalCompositeOperation='source-over'}}})}
var lastPT=0;function frame(){T=performance.now();if(L1.width!==cv.width||L1.height!==cv.height){L1.width=L2.width=cv.width;L1.height=L2.height=cv.height;dirty=true}
  if(under){if(UL.width!==cv.width||UL.height!==cv.height){UL.width=cv.width;UL.height=cv.height;UDIRTY=true}
    if(dirty){if(sky==='grid'){tronGround();tronObjects()}else{drawGround();drawObjects()}dirty=false;UDIRTY=true}if(UDIRTY){drawUnder();UDIRTY=false}
    cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#03020A';cx.fillRect(0,0,cv.width,cv.height);
    cx.globalAlpha=.32;cx.drawImage(L1,0,0);cx.globalAlpha=.22;cx.drawImage(L2,0,0);cx.globalAlpha=1;cx.drawImage(UL,0,0);
    cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawUnderLive(cx,performance.now());return}
  if(dirty){if(sky==='grid'){tronGround();tronObjects()}else{drawGround();drawObjects()}dirty=false}
  var tn0=performance.now(),dts=lastPT?Math.min(200,tn0-lastPT)/1000:0;lastPT=tn0;if(sky!=='grid'){stepClouds(tn0);stepPrecip(dts)}stepWalks(tn0);
  drawSky();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L1,0,0);drawTraces();drawCars();drawWalks();drawVis();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L2,0,0);drawWeather();drawLive();drawFx();cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawAgents(cx,performance.now());
  cx.setTransform(dpr,0,0,dpr,0,0);var v=cx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.35,vw/2,vh/2,Math.max(vw,vh)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+(sky==='day'?.12:sky==='grid'?.5:.3)+')');cx.fillStyle=v;cx.fillRect(0,0,vw,vh)}
function draw(){dirty=true;UDIRTY=true;if(reduce)frame()}
var last=0,FPS_MS=MINI?50:30;function tick(ts){if(!document.hidden&&ts-last>FPS_MS){last=ts;cars.forEach(function(c){c.t+=sky==='grid'?0.035:0.02;if(c.t>=1)step(c);var p=carPos(c);(c.trail=c.trail||[]).push([p.x,p.y-1]);if(c.trail.length>34)c.trail.shift()});
  if(LV.on){var tg=performance.now();cars=cars.filter(function(c){return !c.gone||tg-c.gone<1500})}
  if(vis.length){var tn=performance.now();vis=vis.filter(function(v){return tn-v.born<v.life});vis.forEach(function(v){v.t+=v.sp;if(v.t>=1)step(v);var p=carPos(v);(v.trail=v.trail||[]).push([p.x,p.y-1]);if(v.trail.length>26)v.trail.shift()})}frame()}requestAnimationFrame(tick)}
// ---- interaction
function ago(iso){if(!iso)return '';var d=Math.round((now-Date.parse(iso))/DAY);return d<=0?'today':d===1?'yesterday':d+' days ago'}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function agentCard(id){var g=AG[id];if(!g)return show(null);var a=g.a,st={working:'working',thinking:'thinking',waiting:'waiting for you',idle:'idle',done:'done'}[a.state]||a.state;sel={agent:id};
  var where=a.d?e(a.d)+' district':'not in a district';
  card.innerHTML='<button class="x" aria-label="Close">&times;</button>'+(a.label||a.task!=null?'<h3>'+e(a.label||'Agent')+'</h3><div class="k">'+e(a.machine||'')+(a.machine?' &middot; ':'')+st+(a.ago!=null?' &middot; '+(a.ago<60?a.ago+'s':Math.round(a.ago/60)+' min')+' ago':'')+'</div>'
     +(a.task?'<p style="margin:6px 0 0">'+e(a.task)+'</p>':'')+(a.did?'<div class="row"><span>Last step</span><b style="text-align:right">'+e(a.did)+'</b></div>':'')
     +'<div class="row"><span>Where</span><b>'+(a.repo?e(a.repo)+' &middot; ':'')+where+'</b></div>'+(a.tokens?'<div class="row"><span>Tokens today</span><b>'+(+a.tokens).toLocaleString('en-US')+'</b></div>':'')
    :'<h3>AI agent</h3><p style="margin:6px 0 0">An agent is '+st+(a.d?' in the '+where:'')+'. What it is working on is private.</p>');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function show(h){if(h&&h.note!=null)return noteCard(h.note);if(under&&!h){usel=null;UDIRTY=true;card.hidden=true;return}if(h&&h.agent)return agentCard(h.agent);sel=h?h.r:null;if(!h){card.hidden=true;draw();return}var r=h.r,d=h.d,mx=Math.max.apply(null,(r.weeks||[0]).concat([1]));
  var notes=(d.notePaths||[]).map(function(p){var n=p.split('/').pop().replace(/\.md$/,'');return D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(p))+'" target="_blank" rel="noopener">'+e(n)+'</a>':'<a href="#" data-open="'+e(p)+'">'+e(n)+'</a>'}).join(', ');
  if(r.locked){card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>&#128274; Private '+(D.kind==='vault'?'folder':'repo')+'</h3><div class="k">'+e(d.name)+' district</div><p style="margin:8px 0 0">The details of this building are private. Its size and lights show roughly how much work goes on inside.</p>';card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw();return}
  card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+e(r.name)+'</h3><div class="k">'+e(d.name)+' district &middot; '+e(r.language)+(r.public?' &middot; public':'')+'</div>'
   +(r.description?'<p style="margin:6px 0 0">'+e(r.description)+'</p>':'')
   +'<div class="sp" title="Commits, last 12 weeks">'+(r.weeks||[]).map(function(w){return '<i style="height:'+Math.max(4,Math.round(w/mx*100))+'%"></i>'}).join('')+'</div><div class="k">Commits, last 12 weeks</div>'
   +'<div class="row"><span>Commits this year</span><b>'+r.commits.toLocaleString('en-US')+'</b></div><div class="row"><span>This week</span><b>'+r.week+'</b></div>'
   +(r.pushed?'<div class="row"><span>Last push</span><b>'+ago(r.pushed)+'</b></div>':'')
   +'<div class="row"><span>Notes about '+e(d.name)+'</span><b>'+d.notes+'</b></div>'+(notes?'<div class="k" style="margin-top:6px">'+notes+'</div>':'')
   +(r.url?'<p style="margin:8px 0 0"><a href="'+e(r.url)+'" target="_blank" rel="noopener">Open on GitHub &#8599;</a></p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function at(px,py){if(under){var wx0=(px-cam.x)/cam.z,wy0=(py-cam.y)/cam.z,best=null,bd=1e9;UP.forEach(function(p,ix){var d=Math.hypot(p.x-wx0,p.y-wy0);if(d<Math.max(p.r+3,7/cam.z)&&d<bd){bd=d;best=ix}});return best==null?null:{note:best}}
  if(labels){var tx=(px-cam.x)/cam.z,ty=(py-cam.y)/cam.z;for(var ti=tagHits.length-1;ti>=0;ti--){var th=tagHits[ti];if(tx>=th.x0&&tx<=th.x1&&ty>=th.y0&&ty<=th.y1)return {url:th.url}}}
  for(var aid in AG){var g=AG[aid];if(!g.gone&&g.sx!=null&&Math.hypot(px-g.sx,py-g.sy)<Math.max(12,14*cam.z))return {agent:aid}}var wx=(px-cam.x)/cam.z,wy=(py-cam.y)/cam.z;for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(wx>=h.x0&&wx<=h.x1&&wy>=h.y0&&wy<=h.y1)return h}return null}
var ptr={},moved=false,pinch=0;
cv.addEventListener('pointerdown',function(ev){cv.setPointerCapture(ev.pointerId);ptr[ev.pointerId]={x:ev.clientX,y:ev.clientY};moved=false;cv.classList.add('drag');var ks=Object.keys(ptr);if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
cv.addEventListener('pointermove',function(ev){var p=ptr[ev.pointerId];if(!p)return;var ks=Object.keys(ptr);
  if(ks.length===2){var o=ptr[ks[0]===String(ev.pointerId)?ks[1]:ks[0]];var dist=Math.hypot(ev.clientX-o.x,ev.clientY-o.y);if(pinch){var r=st.getBoundingClientRect();zoom(dist/pinch,(ev.clientX+o.x)/2-r.left,(ev.clientY+o.y)/2-r.top)}pinch=dist;moved=true}
  else{var dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;cam.x+=dx;cam.y+=dy}
  p.x=ev.clientX;p.y=ev.clientY;draw()});
function up(ev){var was=ptr[ev.pointerId];delete ptr[ev.pointerId];cv.classList.remove('drag');pinch=0;if(was&&!moved){var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);
  if(h&&h.url)return openRepo(h.url);
  if(MINI&&h&&h.r)return openRepo(repoUrl(h.r));   // the pop-out has no room for cards: a public building opens its repo
  show(h)}}
if(/[#&]test\b/.test(location.hash))window.calderaTest={   // #test: hit boxes in page coordinates, for automated checks
  buildings:function(){var b=st.getBoundingClientRect();return hits.filter(function(h){return h.r}).map(function(h){return {name:h.r.locked?'':h.r.name,locked:!!h.r.locked,url:repoUrl(h.r),x:b.left+cam.x+(h.x0+h.x1)/2*cam.z,y:b.top+cam.y+(h.y0*.35+h.y1*.65)*cam.z}})},
  labels:function(){var b=st.getBoundingClientRect();return tagHits.map(function(t){return {url:t.url,x:b.left+cam.x+(t.x0+t.x1)/2*cam.z,y:b.top+cam.y+(t.y0+t.y1)/2*cam.z}})},
  walks:function(){var b=st.getBoundingClientRect(),tn=performance.now();return WALKS.filter(function(w){return tn>=w.born}).map(function(w){var p=walkAt(w);return {id:w.id,ghost:w.ghost,f:w.d/w.len,x:b.left+cam.x+p.x*cam.z,y:b.top+cam.y+p.y*cam.z}})},
  traces:function(){var r=st.getBoundingClientRect();return TRACES.map(function(t){var m=t.pts[Math.floor(t.pts.length/2)];return {a:t.a,x:r.left+cam.x+m.x*cam.z,y:r.top+cam.y+m.y*cam.z}})},
  clouds:function(){return CLOUDS.map(function(c){return {x:c.x,y:c.y,gone:c.gone}})},
  weather:function(){return {kind:wxKind(),mode:WXMODE,wx:WX,phase:phase,keys:DAYKEYS}},
  fx:function(){return {drops:FX.drops.length,queue:FX.queue.length,parts:FX.parts.length,beams:FX.beams.length,more:Object.keys(FX.more).length,z:cam.z}},
  point:function(locked){var b=st.getBoundingClientRect();for(var i=0;i<hits.length;i++){var h=hits[i];if(!h.r||!!h.r.locked!==locked||(!locked&&!repoUrl(h.r)))continue;
    for(var fy=.2;fy<.95;fy+=.1)for(var fx=.2;fx<.85;fx+=.15){var wx=h.x0+(h.x1-h.x0)*fx,wy=h.y0+(h.y1-h.y0)*fy,sx=cam.x+wx*cam.z,sy=cam.y+wy*cam.z,g=at(sx,sy);
      if(g&&g.r===h.r)return {x:b.left+sx,y:b.top+sy,url:repoUrl(h.r)}}}return null}};
cv.addEventListener('dblclick',function(ev){var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);if(h&&h.r&&!MINI)openRepo(repoUrl(h.r))});
cv.addEventListener('pointermove',function(ev){if(Object.keys(ptr).length)return;var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);
  cv.classList.toggle('c-link',!!(h&&(h.url||(h.r&&repoUrl(h.r)))))});
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
function zoom(f,ox,oy){var z=Math.min(3,Math.max(.25,cam.z*f));f=z/cam.z;cam.x=ox-(ox-cam.x)*f;cam.y=oy-(oy-cam.y)*f;cam.z=z;draw()}
cv.addEventListener('wheel',function(ev){ev.preventDefault();var r=st.getBoundingClientRect();zoom(Math.exp(-ev.deltaY*0.0015),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
var bl=document.getElementById('t-labels'),bs=document.getElementById('t-sky');
bl.setAttribute('aria-pressed',String(labels));bl.onclick=function(){labels=!labels;bl.setAttribute('aria-pressed',String(labels));draw()};
var MN={auto:'Auto',grid:'Grid',dawn:'Dawn',day:'Day',dusk:'Dusk',evening:'Evening',night:'Night'};
function skyLabel(){bs.textContent=SKYMODE==='auto'?'Auto \u00b7 '+MN[phase]:MN[SKYMODE];bs.title='Lighting: '+(SKYMODE==='auto'?'follows your clock (now '+MN[phase].toLowerCase()+')':MN[SKYMODE].toLowerCase())+'. Click for the next one.'}
skyLabel();bs.onclick=function(){SKYMODE=MODES[(MODES.indexOf(SKYMODE)+1)%MODES.length];try{localStorage.setItem('caldera-sky',SKYMODE)}catch(err){}applySky();skyLabel();draw()};
setInterval(function(){if(SKYMODE!=='auto')return;var k=palKey;applySky();skyLabel();if(palKey!==k)draw()},60000);
setInterval(function(){if(TODAY){buildTraces();todayLine()}},5*60000);   // footprints fade through the day and reset at local midnight
var bw=document.getElementById('t-wx');function wxLabel(){if(!bw)return;var k=wxKind(),ic={clear:'\u2600\uFE0F',partly:'\u26C5',overcast:'\u2601\uFE0F',fog:'\uD83C\uDF2B\uFE0F',drizzle:'\uD83C\uDF26\uFE0F',rain:'\uD83C\uDF27\uFE0F',storm:'\u26C8\uFE0F',snow:'\uD83C\uDF28\uFE0F'}[k]||'';
  bw.innerHTML=ic+'<span class="t-txt"> '+(WXMODE==='auto'?'Auto':WXN[WXMODE]||k)+'</span>';bw.title='Weather: '+(WXMODE==='auto'?(WX&&WX.c?'your local weather'+(WX.place?' in '+WX.place:'')+' ('+k+')':'clear (no local weather yet)'):WXN[WXMODE]||k)+'. Click for the next one.'}
if(bw){wxLabel();bw.onclick=function(){WXMODE=WXMODES[(WXMODES.indexOf(WXMODE)+1)%WXMODES.length];try{localStorage.setItem('caldera-weather',WXMODE)}catch(err){}PRECIP.length=0;wxLabel();draw()}}   // an all-day window drifts through the day
document.getElementById('t-reset').onclick=function(){fit();show(null)};
var bsnd=document.getElementById('t-snd');function sndLabel(){bsnd.innerHTML=sound?'&#x1F50A;':'&#x1F507;';bsnd.setAttribute('aria-pressed',String(sound));bsnd.title='Sound for arrivals, signups and sales ('+(sound?'on':'off')+')'}
if(bsnd){sndLabel();bsnd.onclick=function(){sound=!sound;try{localStorage.setItem('caldera-sound',sound?'1':'0')}catch(err){}sndLabel();if(sound)tone([660,880],.06)}}
var bu=document.getElementById('t-under');if(bu)bu.onclick=function(){under=!under;bu.setAttribute('aria-pressed',String(under));bu.innerHTML=under?'&#x2B06;<span class="t-txt"> City</span>':'&#x2B07;<span class="t-txt"> Underground</span>';
  st.classList.toggle('c-dig',under);if(liveEl)liveEl.hidden=under;usel=null;card.hidden=true;underPanel();fit();draw()};
if(U&&/[#&]underground\b/.test(location.hash))setTimeout(function(){bu&&bu.onclick()},50);
// full screen: the real Fullscreen API where the page is allowed it, otherwise the stage fills the window (Esc exits)
var bf=document.getElementById('t-full');function fsLabel(){var on=!!document.fullscreenElement||st.classList.contains('c-full');bf.innerHTML=on?'&#x2715;<span class="t-txt"> Exit</span>':'&#x26F6;<span class="t-txt"> Full screen</span>';bf.setAttribute('aria-label',on?'Exit full screen':'Full screen')}
function cssFull(on){st.classList.toggle('c-full',on);document.body.style.overflow=on?'hidden':'';setTimeout(function(){fit();draw()},30);fsLabel()}
bf.onclick=function(){if(document.fullscreenElement){document.exitFullscreen();return}if(st.classList.contains('c-full'))return cssFull(false);
  var r=st.requestFullscreen&&document.fullscreenEnabled?st.requestFullscreen():null;if(r&&r.catch)r.catch(function(){cssFull(true)});else cssFull(true)};
// pop out: inside Obsidian the plugin opens an always-on-top window; on the web a small window opens the watch page
// (the hub's own page, which can float the city on top in Chrome/Edge); elsewhere this page in mini mode
var bp=document.getElementById('t-pop');if(bp){if(MINI)bp.hidden=true;bp.onclick=function(){
  if(window.parent!==window){parent.postMessage({caldera:'popout'},'*');return}
  var m=location.pathname.match(/^\/@([a-z0-9-]+)\//),u=m?'/watch/@'+m[1]+location.search:location.href.split('#')[0]+'#mini';
  var w=window.open(u,'caldera-city','popup,width=440,height=290');if(!w)location.href=u}}
document.addEventListener('fullscreenchange',function(){setTimeout(function(){fit();draw()},30);fsLabel()});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&st.classList.contains('c-full'))cssFull(false)});
window.addEventListener('resize',function(){fit();draw()});
fit();if(reduce)frame();else requestAnimationFrame(tick);
})();`;

// src/render.ts
function inviteHref(p) {
  const hub = (p.hub || "https://caldera.social").replace(/\/$/, "");
  const who = p.handle ? `@${p.handle}` : p.name;
  const join = `${hub}/${p.handle ? `?invite=${encodeURIComponent(p.handle)}` : ""}#install`;
  const subject = `Join me on Caldera`;
  const body = `Hey,

I'm using Caldera, the social layer for Obsidian. It turns your notes into a living profile that updates itself, and lets our vaults connect: share notes, ask for help, and compare our daily scores.

My page: ${hub}/@${p.handle || ""}/

Set up takes about 5 minutes - copy one prompt into your AI and it installs everything:
${join}

Then add me as a friend (${who}) from the Caldera panel in Obsidian.

${p.name}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
var INVITE_MSG = "I'm using Caldera, the social layer for Obsidian. It turns your notes into a living page that updates itself, and our vaults can connect and compare daily scores. Setup takes about 5 minutes: copy one prompt into your AI.";
function inviteUrl(p) {
  const hub = (p.hub || "https://caldera.social").replace(/\/$/, "");
  return `${hub}/${p.handle ? `?invite=${encodeURIComponent(p.handle)}` : ""}#install`;
}
function invitePop(p) {
  return `<div class="invite-pop" hidden role="dialog" aria-label="Invite a friend" data-url="${esc3(inviteUrl(p))}" data-msg="${esc3(INVITE_MSG)}" data-subject="Join me on Caldera"><div class="inv-head"><div><div class="inv-title">Invite a friend</div><div class="inv-sub">They get their own living page in about 5 minutes, and you compare daily scores here.</div></div><button class="inv-close" type="button" aria-label="Close">&times;</button></div><div class="inv-link"><input class="inv-url" readonly aria-label="Invite link" value="${esc3(inviteUrl(p))}"><button class="inv-copy" type="button">Copy link</button></div><div class="inv-ways"><a class="inv-email" href="#">Email</a><a class="inv-text" href="#">Text</a><button class="inv-share" type="button">Share</button></div><div class="inv-status" role="status" aria-live="polite"></div></div>`;
}
function slug(t) {
  return t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "s";
}
var big = (n) => n >= 1e9 ? (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);
function inline(t) {
  const parts = [];
  let last = 0;
  const rx = /\[\[([^|\]]+)\|(https?:\/\/[^\]\s]+)\]\]|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*/g;
  for (let m; m = rx.exec(t); ) {
    parts.push(esc3(t.slice(last, m.index)));
    if (m[5]) parts.push(`<b>${esc3(m[5])}</b>`);
    else parts.push(`<a href="${esc3(m[2] || m[4])}" rel="noopener">${esc3(m[1] || m[3])}</a>`);
    last = m.index + m[0].length;
  }
  return parts.join("") + esc3(t.slice(last));
}
function graphSvg(nodes, name) {
  if (!nodes.length) return "";
  const top = Math.max(1, ...nodes.map((x) => x.n)), order = [...nodes].sort((a, b) => b.n - a.n);
  const out = order.map((nd, i) => {
    const a = i / order.length * Math.PI * 2, r = i % 2 === 0 ? 64 : 96;
    const x = 130 + Math.cos(a) * r, y = 120 + Math.sin(a) * r * 0.85, size = 2.5 + 6.5 * Math.sqrt(nd.n / top);
    return { ...nd, x: x.toFixed(1), y: y.toFixed(1), ty: (y + size + 9).toFixed(1), r: size.toFixed(1), hot: nd.n >= top * 0.35, d: (-i * 0.3).toFixed(1) };
  });
  return `<svg viewBox="0 0 260 240" role="img" aria-label="Notes connected to ${esc3(name)}">${out.map((n) => `<line class="edge" x1="130" y1="120" x2="${n.x}" y2="${n.y}"></line>`).join("")}${out.map((n) => `<g class="float" style="animation-delay:${n.d}s"><circle class="node${n.hot ? " hot" : ""}" cx="${n.x}" cy="${n.y}" r="${n.r}"><title>${esc3(n.t)}: ${n.n}</title></circle><text x="${n.x}" y="${n.ty}" text-anchor="middle">${esc3(n.t)}</text></g>`).join("")}<circle class="center" cx="130" cy="120" r="9"></circle></svg>`;
}
var esc3 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var fmt = (n) => n.toLocaleString("en-US");
function scored(daily) {
  return daily.map((d, i) => {
    const score = activityScore(d.counts);
    const prev = i ? activityScore(daily[i - 1].counts) : null;
    return { ...d, score, delta: prev ? Math.round((score - prev) / prev * 100) : null };
  });
}
function renderProfile(p) {
  const s = p.sections;
  const days = scored(p.daily);
  const labels = { meetings: "Meetings", emails: "Emails sent", prompts: "AI sessions", commits: "Commits", notes: "Notes", docs: "Docs filed" };
  const present = Object.keys(labels).filter((k) => days.some((d) => d.counts[k]));
  const journal = days.map((d, i) => ({
    date: d.date,
    label: (/* @__PURE__ */ new Date(d.date + "T12:00:00")).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    score: d.score,
    delta: d.delta,
    headline: d.headline || "",
    focus: d.focus || [],
    wins: d.wins || [],
    themes: d.themes || [],
    chips: present.map((k) => ({ k: labels[k], v: d.counts[k] || 0, d: i ? (d.counts[k] || 0) - (days[i - 1].counts[k] || 0) : null }))
  }));
  const scores = days.map((d) => d.score);
  const yday = days.length > 1 ? days[days.length - 2] : days[days.length - 1];
  let streak = 0;
  const thresh = Math.max(20, (scores.slice().sort((a, b) => a - b)[Math.floor(scores.length / 2)] || 0) * 0.6);
  for (const sc of scores.slice(0, -1).reverse()) {
    if (sc >= thresh) streak++;
    else break;
  }
  const ranked = days.slice(0, -1).slice().sort((a, b) => b.score - a.score);
  const yrank = yday ? ranked.findIndex((d) => d.date === yday.date) + 1 : 0;
  const smax = Math.max(1, ...scores);
  const last7 = scores.slice(-8, -1), prev7 = scores.slice(-15, -8);
  const avg = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  const trend = avg(prev7) ? Math.round((avg(last7) - avg(prev7)) / avg(prev7) * 100) : 0;
  const tmax = Math.max(1, ...p.topics.map((t) => t[1]));
  const parts = [];
  parts.push(`<!doctype html><html lang="en"${p.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc3(p.name)}</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${p.icon ? `<link rel="icon" href="${esc3(p.icon)}" type="image/png"><link rel="apple-touch-icon" href="${esc3(p.icon)}">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`}
<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css">${s.garden !== false && p.garden?.length ? '<link rel="stylesheet" href="assets/garden.css">' : ""}</head><body>
<div class="tabs"><span class="tab is-active">${esc3(p.name)}.md</span>${(p.tabs || []).map((t) => `<span class="tab">${esc3(t)}</span>`).join("")}<span class="spacer"></span><span class="sync"><span class="dot"></span>synced from ${esc3(p.source || "vault")} <span id="ago" data-ts="${esc3(p.updated)}">just now</span></span></div>
<div class="shell">`);
  const sideOn = s.sidebar !== false && !!p.tree?.length, railOn = s.rail !== false && (!!p.graph?.length || !!p.backlinks?.length);
  const gardenOn = s.garden !== false && !!p.garden?.length;
  const nav = (depth, current, toc2 = "") => s.sidebar === false ? "" : navSidebar(p, sideOn, gardenOn, depth, current, toc2);
  parts.push(nav(0, "index.html", "%%TOC%%"));
  parts.push(`<main class="note">`);
  if (p.banner) parts.push(`<div class="banner"><img class="cover" src="${esc3(p.banner)}" alt="">${p.avatar ? `<img class="avatar" src="${esc3(p.avatar)}" alt="${esc3(p.name)}">` : ""}</div>`);
  parts.push(`<div class="page">${!p.banner && p.avatar ? `<img class="avatar solo" src="${esc3(p.avatar)}" alt="${esc3(p.name)}">` : ""}<div class="crumb">People / ${esc3(p.name)}.md${p.handle ? " / @" + esc3(p.handle) : ""}</div>
<h1 class="title">${esc3(p.name)}<span class="caret">|</span></h1>${p.headline ? `<p class="lede">${esc3(p.headline)}</p>` : ""}<!--caldera:owner-->`);
  if (s.city !== false && p.city?.districts.length) parts.push(citySnapshot(p.city, { name: p.name }));
  if (s.journal && journal.length) parts.push(`<section class="journal" id="journal" aria-label="Daily journal"><div class="j-head"><button class="j-nav" id="jprev" aria-label="Previous day">&#8249;</button>
<div class="j-title"><div class="label">Daily journal</div><div class="j-date" id="jdate"></div></div><button class="j-nav" id="jnext" aria-label="Next day">&#8250;</button></div>
<div class="j-body" id="jbody" aria-live="polite"></div></section><script id="journal-data" type="application/json">${JSON.stringify(journal).replace(/</g, "\\u003c")}<\/script>`);
  if (s.scoreboard && days.length > 2) parts.push(`<section class="scoreboard" id="scoreboard"><div class="sb-stats">
<div class="sb-stat"><div class="v">${streak}<small> days</small></div><div class="l">active streak</div></div>
<div class="sb-stat"><div class="v">#${yrank}</div><div class="l">yesterday's rank of ${days.length - 1} days</div></div>
<div class="sb-stat"><div class="v">${avg(last7)}</div><div class="l">7-day average, ${trend >= 0 ? `<span class="up">&#9650; ${trend}%</span>` : `<span class="down">&#9660; ${-trend}%</span>`} vs prior week</div></div></div>
<div class="sb-bars" role="img" aria-label="Daily activity score">${days.slice(-30).map((d, i, a) => `<span class="${i === a.length - 2 ? "yday" : i === a.length - 1 ? "today" : ""}" style="height:${Math.max(2, Math.round(d.score / smax * 100))}%" title="${d.date}: ${d.score}"></span>`).join("")}</div><div class="bars-legend"><span>${Math.min(30, days.length)} days ago</span><span>yesterday highlighted / today in progress</span></div>
${(() => {
    const best = days.slice(0, -2).map((d, i) => ({ d, i })).sort((a, b) => b.d.score - a.d.score).slice(0, 5);
    const lb = [`<div class="lb-row me"><span class="rank">1</span><span class="who">You</span><span class="num">${fmt(days.slice(-8, -1).reduce((x, d) => x + d.score, 0))}</span></div>`].concat([2, 3, 4].map((r) => `<div class="lb-row empty"><span class="rank">${r}</span><a class="who invite-btn" data-invite href="${esc3(inviteHref(p))}" target="_blank" rel="noopener">Invite a friend</a><span class="num">-</span></div>`));
    return `<div class="two-col sb-lower"><div class="lb-wrap"><div class="label">Leaderboard / points this week</div>${lb.join("")}${invitePop(p)}</div><div><div class="label">Your best other days</div>${best.map((b, k) => `<div class="lb-row"><span class="rank">${k + 1}</span><span class="who">${esc3((/* @__PURE__ */ new Date(b.d.date + "T12:00:00Z")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }))}</span><span class="num">${b.d.score}</span></div>`).join("")}</div></div>`;
  })()}
<details class="sb-how"><summary>How the score works</summary>Weighted daily counts: ${Object.entries(ACTIVITY_WEIGHTS).map(([k, w]) => `${labels[k] || k} x${w}`).join(", ")}. Bulk imports are capped. Counts only.</details></section>`);
  if (s.properties && p.properties.length) parts.push(`<dl class="props">${p.properties.map(([k, v]) => `<dt>${esc3(k)}</dt><dd>${esc3(v)}</dd>`).join("")}</dl>`);
  if (s.numbers) parts.push(`<div class="stat-strip">${[[fmt(p.stats.notes), "notes"], [(p.stats.words / 1e6).toFixed(2) + "M", "words"], [fmt(p.stats.links), "links between notes"], [String(p.stats.activeDays), "active days, 26 weeks"], ...p.extraNumbers || []].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.summary !== false && p.summary) parts.push(`<div class="callout"><div class="callout-title">Summary</div>${inline(p.summary)}</div>`);
  if (s.now !== false && p.now?.length) parts.push(`<h2>Now</h2><ul class="bullets">${p.now.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`);
  if (s.activity !== false && p.heat?.length) {
    const lvl = (n) => n === 0 ? 0 : n < 5 ? 1 : n < 30 ? 2 : n < 200 ? 3 : 4;
    const pad = ((/* @__PURE__ */ new Date(p.heat[0].date + "T12:00:00Z")).getUTCDay() + 6) % 7;
    parts.push(`<h2>Activity</h2><p class="small muted">Every day the vault learned something in the last 26 weeks: notes written and changed${p.extraNumbers?.length ? ", documents filed" : ""}.</p><div class="heat-box" data-unit="updates"><div class="heat-frame"><div class="heat-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div><div class="heat-wrap"><div class="heat-months" aria-hidden="true"></div><div class="heat" tabindex="0" aria-label="Activity, last 26 weeks. Use arrow keys to move between days." aria-describedby="heat-read">${'<i style="visibility:hidden"></i>'.repeat(pad)}${p.heat.map((c) => `<i class="l${lvl(c.n)}" data-d="${esc3(c.date)}" data-n="${c.n}"></i>`).join("")}</div></div></div><div class="heat-tip" hidden></div><div class="heat-foot"><div class="heat-read" id="heat-read" aria-live="polite"></div><div class="heat-legend">less <i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</div></div></div>`);
  }
  const growthOn = s.growth !== false && (p.growth?.length || 0) > 1, knowsOn = s.knows !== false && !!p.knows?.length;
  if (growthOn || knowsOn) {
    let g = "";
    if (growthOn) {
      const gp = p.growth, gmax = Math.max(1, gp[gp.length - 1].total), W2 = 600, H2 = 180;
      const gx = (i) => 30 + i * (W2 - 40) / Math.max(1, gp.length - 1), gy = (v) => 10 + (H2 - 30) * (1 - v / gmax);
      const line = gp.map((x, i) => `${gx(i).toFixed(1)},${gy(x.total).toFixed(1)}`).join(" ");
      const first = (/* @__PURE__ */ new Date(gp[0].week + "T12:00:00Z")).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      g = `<div><h2>Growth</h2><svg class="growth" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Notes over time, ${fmt(gmax)} now"><line class="axis" x1="30" y1="${H2 - 20}" x2="${W2 - 10}" y2="${H2 - 20}"></line><path class="area" d="M${gx(0).toFixed(1)},${H2 - 20} L${line.replace(/ /g, " L")} L${gx(gp.length - 1).toFixed(1)},${H2 - 20} Z"></path><polyline class="line" points="${line}"></polyline><circle class="now" cx="${gx(gp.length - 1).toFixed(1)}" cy="${gy(gmax).toFixed(1)}" r="5"></circle><text x="30" y="${H2 - 4}">${esc3(first)}</text><text x="${W2 - 10}" y="${H2 - 4}" text-anchor="end">${fmt(gmax)} notes</text></svg></div>`;
    }
    const kmax = Math.max(1, ...(p.knows || []).map((k2) => k2[1]));
    const k = knowsOn ? `<div><h2>What it knows</h2>${p.knows.map(([l, n]) => `<div class="hbar"><span>${esc3(l)}</span><span class="track"><span class="fill" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>` : "";
    parts.push(`<div class="two-col">${g}${k}</div>`);
  }
  if (s.inbox !== false && p.inbox?.kinds?.length) {
    const ib = p.inbox, kmax = Math.max(1, ...ib.kinds.map((k) => k[1])), total = ib.total ?? ib.kinds.reduce((a, k) => a + k[1], 0);
    const se = ib.series, smax2 = Math.max(1, ...(se?.weeks || []).map((w) => w[1]));
    parts.push(`<h2>Inbox to knowledge</h2><p class="small muted">${esc3(ib.note || `Every email attachment is read, summarized and linked into the vault overnight. ${fmt(total)} documents so far, by kind. Contents stay private.`)}</p><div class="two-col"><div>${ib.kinds.map(([l, n]) => `<div class="hbar"><span>${esc3(l)}</span><span class="track"><span class="fill alt" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>${se?.weeks?.length ? `<div><div class="label">${esc3(se.label)} / ${fmt(se.weeks.reduce((a, w) => a + w[1], 0))} in ${se.weeks.length} weeks</div><div class="cols">${se.weeks.map(([l, n]) => `<span title="${esc3(l)}: ${n}"><b style="height:${Math.max(3, n / smax2 * 100).toFixed(1)}%"></b><em>${n || ""}</em></span>`).join("")}</div><div class="bars-legend"><span>${esc3(se.weeks[0][0])}</span><span>this week</span></div></div>` : ""}</div>`);
  }
  if (s.topics && p.topics.length) parts.push(`<h2>Topics</h2><div class="cloud">${p.topics.map(([t, n]) => `<span style="font-size:${(13 + n / tmax * 15).toFixed(1)}px">${esc3(t)}<sup>${n}</sup></span>`).join("")}</div>`);
  if (s.projects !== false && p.projects?.length) {
    const hasC = p.projects.some((x) => x.commits);
    parts.push(`<h2>Projects</h2><div class="query">TABLE status, ${hasC ? "commits, " : ""}link FROM "Projects" SORT ${hasC ? "commits DESC" : "file.name"}</div><div class="table-wrap"><table class="data"><thead><tr><th>File</th><th>status</th>${hasC ? '<th class="num">commits</th>' : ""}<th>link</th></tr></thead><tbody>${p.projects.map((x) => `<tr><td>${/^https?:\/\//.test(x.url) ? `<a href="${esc3(x.url)}" rel="noopener">${esc3(x.name)}</a>` : esc3(x.name)}</td><td>${esc3(x.status)}</td>${hasC ? `<td class="num">${x.commits ? fmt(x.commits) : ""}</td>` : ""}<td>${/^https?:\/\//.test(x.url) ? `<a href="${esc3(x.url)}" rel="noopener">${esc3(x.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</td></tr>`).join("")}</tbody></table></div>`);
  }
  if (s.code !== false && p.code && p.code.commits > 0) {
    const c = p.code, wk = c.weekly || [], f = Math.max(0, Math.min(wk.findIndex((x) => x > 0), wk.length - 26)), w2 = [...Array(Math.max(0, 26 - wk.length)).fill(0), ...wk.slice(f)], peak = Math.max(1, ...w2);
    parts.push(`<h2>Code</h2><p class="small"><b>${fmt(c.commits)}</b> commits across <b>${fmt(c.repos)}</b> repositories in the last year.${c.languages?.length ? ` Mostly ${esc3(c.languages.slice(0, -1).join(", "))}${c.languages.length > 1 ? " and " : ""}${esc3(c.languages[c.languages.length - 1])}.` : ""}${c.url && /^https?:\/\//.test(c.url) ? ` <a href="${esc3(c.url)}" rel="noopener">${esc3(c.url.replace(/^https?:\/\//, ""))}</a>` : ""}</p>${w2.length ? `<div class="bars" role="img" aria-label="Commits per week">${w2.map((x) => `<span class="${x >= peak * 0.5 ? "" : "quiet"}" style="height:${Math.max(2, x / peak * 100).toFixed(1)}%" title="${x}"></span>`).join("")}</div><div class="bars-legend"><span>${esc3(c.start || "")}</span><span>peak week: ${fmt(peak)}</span><span>this week</span></div>` : ""}`);
  }
  if (s.ai !== false && p.ai && p.ai.total > 0) {
    const a = p.ai, td = days.map((d) => ({ date: d.date, n: d.tokens || 0 })), tpeak = Math.max(1, ...td.map((x) => x.n));
    const share = (n) => a.total ? Math.round(n / a.total * 1e3) / 10 : 0;
    const bars = (rows, alt = false) => {
      const m = Math.max(1, ...rows.map((r) => r[1]));
      return rows.map(([l, n]) => `<div class="hbar"><span>${esc3(l)}</span><span class="track"><span class="fill${alt ? " alt" : ""}" style="width:${(n / m * 100).toFixed(1)}%"></span></span><span class="num" title="${fmt(n)} tokens">${share(n) >= 0.1 ? share(n) + "%" : "&lt;0.1%"}</span></div>`).join("");
    };
    parts.push(`<h2>AI usage</h2><p class="small"><b>${big(a.total)}</b> tokens across <b>${a.models.length}</b> model${a.models.length === 1 ? "" : "s"} in the last ${a.window_days || td.length} days.${a.note ? ` <span class="muted">${esc3(a.note)}</span>` : ""}</p>${td.some((x) => x.n) ? `<div class="bars" role="img" aria-label="AI tokens per day">${td.map((x) => `<span class="${x.n >= tpeak * 0.5 ? "" : "quiet"}" style="height:${Math.max(2, x.n / tpeak * 100).toFixed(1)}%" title="${esc3(x.date)}: ${big(x.n)} tokens"></span>`).join("")}</div><div class="bars-legend"><span>${esc3(td[0]?.date || "")}</span><span>peak day: ${big(tpeak)}</span><span>today</span></div>` : ""}<div class="two-col" style="margin-top:var(--space-4)"><div><div class="label">Models / share of tokens</div>${bars(a.models)}</div>${a.providers?.length ? `<div><div class="label">Providers</div>${bars(a.providers, true)}</div>` : ""}</div>${a.sources && a.sources.length > 1 ? `<div style="margin-top:var(--space-4)"><div class="label">Where the tokens come from</div>${bars(a.sources, true)}</div>` : ""}`);
  }
  if (s.timeline !== false && p.timeline?.length) parts.push(`<h2>Timeline</h2><div class="timeline">${timelineRows(p.timeline)}</div>`);
  if (s.garden !== false && (p.garden?.length || p.gardenExternal)) parts.push(gardenSection(p.garden || [], p.gardenExternal));
  if (s.notes && p.publicNotes.length) parts.push(`<h2>Notes</h2>${p.publicNotes.map((n) => `<div class="pnote" id="${slug("note-" + n.title)}"><div class="pn-title">${esc3(n.title)}</div><div class="pn-ex">${esc3(n.excerpt)}</div><div class="pn-date">${esc3(n.updated.slice(0, 10))}</div></div>`).join("")}`);
  if (s.asks && (p.asks.length || p.offers.length)) parts.push(`<h2>Help exchange</h2><div class="hx-grid">
<div class="hx-card"><div class="label">I could use help with</div>${p.asks.map((a) => `<div class="hx-row"><span>${esc3(a.title)}</span><span class="bounty">+${a.bounty}</span></div>`).join("") || '<div class="muted">Nothing right now</div>'}</div>
<div class="hx-card"><div class="label">I can help with</div>${p.offers.map((o) => `<div class="hx-row"><span>${esc3(o.title)}</span></div>`).join("") || '<div class="muted">Ask me</div>'}</div></div>`);
  if (s.social && p.social) parts.push(`<div class="stat-strip">${[[fmt(p.social.friends), "friends"], [String(p.social.gravity), "gravity"], [fmt(p.social.credits), "help credits"]].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.links && p.links.length) parts.push(`<h2>Elsewhere</h2><ul class="bullets">${p.links.map(([l, u]) => `<li><a href="${esc3(u)}" rel="noopener">${esc3(l)}</a></li>`).join("")}</ul>`);
  parts.push(`<div class="foot">Grown from an Obsidian vault with Caldera. Updated ${esc3(p.updated.slice(0, 16).replace("T", " "))} UTC. <a href="${esc3((p.hub || "https://caldera.social").replace(/\/$/, ""))}/guide.html" target="_blank" rel="noopener">Your page? How to edit it</a></div></div></main>`);
  if (railOn) parts.push(`<aside class="rail">${p.graph?.length ? `<div class="graph"><div class="label">${esc3(p.graphLabel || "Graph")}</div>${graphSvg(p.graph, p.name)}</div>` : ""}${p.backlinks?.length ? `<div><div class="label">${esc3(p.backlinkLabel || "Backlinks")}</div>${p.backlinks.map(([t, c]) => `<div class="backlink"><span>${esc3(t)}</span><div class="ctx">${esc3(c)}</div></div>`).join("")}</div>` : ""}</aside>`);
  parts.push(`</div>`);
  parts.push(`<script>${CLIENT_JS}<\/script></body></html>`);
  const toc = [];
  if (s.journal && journal.length) toc.push(["journal", "Daily journal"]);
  if (s.scoreboard && days.length > 2) toc.push(["scoreboard", "Scoreboard"]);
  const seen = /* @__PURE__ */ new Set();
  let html = parts.join("\n").replace(/<h2>([^<]+)<\/h2>/g, (_m, t) => {
    let id = slug(t);
    while (seen.has(id)) id += "-2";
    seen.add(id);
    toc.push([id, t]);
    return `<h2 id="${id}">${t}</h2>`;
  });
  html = html.replace("%%TOC%%", toc.length > 2 ? `<span class="label">On this page</span><div class="toc">${toc.map(([id, t]) => `<a class="tree-row toc-row" href="#${id}">${t}</a>`).join("")}</div>` : "");
  const garden = s.garden !== false && p.garden?.length ? renderGarden({ name: p.name, handle: p.handle, hub: p.hub, icon: p.icon, theme: p.theme, id: p.id, external: p.gardenExternal, nav: (d, cur) => nav(d, cur) }, p.garden, p.gardenImages) : {};
  const city = s.city !== false && p.city?.districts.length ? { "city.html": renderCity({ name: p.name, handle: p.handle, theme: p.theme, icon: p.icon, github: githubOf(p), nav: (d, cur) => nav(d, cur) }, p.city) } : {};
  const out = { ...garden, ...city, "index.html": html, "assets/theme.css": theme_default, "assets/profile.css": PROFILE_CSS, "assets/favicon.svg": LOGO_SVG };
  let own = "caldera.social";
  try {
    own = new URL(p.hub || "https://caldera.social").host;
  } catch {
  }
  for (const k of Object.keys(out)) if (k.endsWith(".html")) out[k] = externalLinksNewWindow(out[k], [own]);
  return out;
}
function navSidebar(p, sideOn, gardenOn, depth, current, toc = "") {
  const up = "../".repeat(depth), onProfile = current === "index.html";
  const fix = (h) => /^https?:\/\//.test(h) ? h : h.startsWith("#") ? onProfile ? h : `${up}index.html${h}` : up + h;
  const pages = [["index.html", p.name || "Profile"]];
  if (gardenOn) pages.push(["garden.html", "Garden home"]);
  if (p.sections?.city !== false && p.city?.districts.length) pages.push(["city.html", "City"]);
  const pageRows = pages.map(([h, l]) => `<a class="tree-row toc-row page-row${h === current ? " is-active" : ""}" href="${onProfile && h === "index.html" ? "#top" : up + h}"${h === current ? ' aria-current="page"' : ""}>${esc3(l)}</a>`).join("");
  const hubBase = (p.hub || "https://caldera.social").replace(/\/$/, "");
  const friend = p.handle ? `<a class="tree-row toc-row page-row friend-row" href="${esc3(hubBase)}/kudos/${encodeURIComponent(p.handle)}" data-caldera-friend="${esc3(p.handle)}" target="_blank" rel="noopener" title="Send @${esc3(p.handle)} a friend request">+ Add @${esc3(p.handle)} as friend</a>` : "";
  const tree = sideOn && p.tree?.length ? `<span class="label">Vault</span>${sidebarTree(p.tree.map((r) => ({ ...r, current: r.href === "#top" && onProfile || !!r.href && r.href === current })), fix)}` : "";
  return `<nav class="sidebar tree" aria-label="Navigation"><div class="side-inner"><span class="label">Pages</span><div class="toc pages">${pageRows}${friend}</div>${toc}${tree}</div></nav>`;
}
function sidebarTree(rows, fix = (h) => h) {
  const out = [];
  let open3 = false;
  const ok = (h) => !!h && /^(https?:\/\/|#[\w-]+$|garden\.html$|n\/[a-z0-9-]+\.html$)/.test(h);
  const item = (r) => {
    const cls = `tree-row child${r.current ? " is-current" : ""}${r.href ? " is-link" : ""}`;
    if (!ok(r.href)) return `<div class="tree-row child${r.current ? " is-current" : ""}"><span>${esc3(r.name)}</span></div>`;
    const ext = /^https?:\/\//.test(r.href);
    return `<a class="${cls}" href="${esc3(fix(r.href))}"${ext ? ' target="_blank" rel="noopener"' : ""}${r.current ? ' aria-current="page"' : ""}><span>${esc3(r.name)}</span>${ext ? '<span class="ext" aria-hidden="true">&#8599;</span>' : ""}</a>`;
  };
  const gname = (r) => ok(r.href) && !/^https?:/.test(r.href) ? `<a class="g-name g-link" href="${esc3(fix(r.href))}">${esc3(r.name)}</a>` : `<span class="g-name">${esc3(r.name)}</span>`;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.child) {
      out.push(item(r));
      continue;
    }
    if (open3) {
      out.push(`</details>`);
      open3 = false;
    }
    const kids = rows.slice(i + 1).findIndex((x) => !x.child), n = kids < 0 ? rows.length - i - 1 : kids;
    const count = r.count != null ? `<span class="count" title="${r.count} notes">${fmt(r.count)}</span>` : n ? `<span class="count">${n}</span>` : "";
    if (!n) {
      out.push(`<div class="tree-row group leaf"><span class="caret" aria-hidden="true"></span>${gname(r)}${count}</div>`);
      open3 = false;
      continue;
    }
    out.push(`<details class="tree-group" open><summary class="tree-row group"><span class="caret" aria-hidden="true"></span>${gname(r)}${count}</summary>`);
    open3 = true;
  }
  if (open3) out.push(`</details>`);
  return out.join("");
}
function splitDetail(t) {
  const masked = t.replace(/\[\[[^\]]*\]\]/g, (m) => "x".repeat(m.length)), i = masked.lastIndexOf(" | ");
  return i < 0 ? [t, ""] : [t.slice(0, i).trim(), t.slice(i + 3).trim()];
}
function timelineRows(rows) {
  let prev = "";
  return rows.map(([y, t]) => {
    const [main, detail] = splitDetail(t);
    if (y.trim().toLowerCase() === "era") {
      prev = "";
      return `<div class="era"><span class="era-name">${inline(main)}</span>${detail ? `<span class="era-range">${esc3(detail)}</span>` : ""}</div>`;
    }
    const same = y === prev;
    prev = y;
    return `<div class="row${same ? " same" : ""}"><span class="year">${same ? "" : esc3(y)}</span><span class="dot" aria-hidden="true"></span><div class="what"><div>${inline(main)}</div>${detail ? `<div class="detail">${inline(detail)}</div>` : ""}</div></div>`;
  }).join("");
}
var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1C1C1F"/><path d="M4 25 L12 10 L15 15 L18 8 L28 25 Z" fill="#8B6CF6"/><circle cx="16" cy="21" r="2.4" fill="#4FB89A"/></svg>';
var HEAT_JS = "(function(){var g=document.querySelector('.heat');if(!g)return;var box=g.closest('.heat-box');if(!box)return;\nvar tip=box.querySelector('.heat-tip'),rd=box.querySelector('.heat-read'),mo=box.querySelector('.heat-months');\nvar cells=[].slice.call(g.querySelectorAll('i[data-d]'));if(!cells.length)return;var unit=box.getAttribute('data-unit')||'updates';\nvar D=function(s){return new Date(s+'T12:00:00')};\nvar fd=function(s){return D(s).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})};\nvar amt=function(c){var n=+c.getAttribute('data-n');return n?n.toLocaleString('en-US')+' '+(n===1?unit.replace(/s$/,''):unit):'No activity'};\nvar today=cells[cells.length-1],cur=null,pin=null;today.classList.add('is-today');\nfunction months(){if(!mo)return;mo.innerHTML='';var last=-1,lm=-1;cells.forEach(function(c){var x=c.offsetLeft-g.offsetLeft;if(x===last)return;last=x;var m=D(c.getAttribute('data-d')).getMonth();if(m!==lm){if(x<=g.offsetWidth-26&&(lm>=0||D(c.getAttribute('data-d')).getDate()<=7)){var s=document.createElement('span');s.textContent=D(c.getAttribute('data-d')).toLocaleDateString('en-US',{month:'short'});s.style.left=x+'px';mo.appendChild(s)}lm=m}})}months();\nfunction sel(c,show){if(cur)cur.classList.remove('is-sel');cur=c;c.classList.add('is-sel');\nrd.textContent='';var b=document.createElement('b');b.textContent=(c===today?'Today, ':'')+fd(c.getAttribute('data-d'));rd.appendChild(b);rd.appendChild(document.createTextNode(' \xB7 '+amt(c)));\nif(!show){tip.hidden=true;return}tip.textContent=fd(c.getAttribute('data-d'))+' \xB7 '+amt(c);tip.hidden=false;\nvar r=c.getBoundingClientRect(),br=box.getBoundingClientRect(),w=tip.offsetWidth,x=r.left-br.left+r.width/2;var cx=x;x=Math.max(w/2,Math.min(br.width-w/2,x));tip.style.left=x+'px';tip.style.setProperty('--ax',(cx-x)+'px');tip.style.top=(r.top-br.top)+'px'}\nvar wr=g.parentNode;if(wr.scrollWidth>wr.clientWidth)wr.scrollLeft=wr.scrollWidth;\nsel(today,false);\nvar at=function(e){return e.target.closest?e.target.closest('i[data-d]'):null};\ng.addEventListener('mouseover',function(e){var c=at(e);if(c)sel(c,true)});\ng.addEventListener('mouseleave',function(){sel(pin||today,false)});\ng.addEventListener('click',function(e){var c=at(e);if(!c)return;pin=pin===c?null:c;g.querySelectorAll('.is-pin').forEach(function(x){x.classList.remove('is-pin')});if(pin)pin.classList.add('is-pin');sel(c,true)});\ng.addEventListener('keydown',function(e){var k={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1,Home:-1e6,End:1e6}[e.key];if(k==null){if(e.key==='Escape'){e.stopPropagation();pin=null;sel(today,false)}return}e.preventDefault();e.stopPropagation();var i=cells.indexOf(cur);sel(cells[Math.max(0,Math.min(cells.length-1,i+k))],true)});\ng.addEventListener('focus',function(){sel(cur||today,true)});g.addEventListener('blur',function(){tip.hidden=true});\nwindow.addEventListener('resize',function(){tip.hidden=true;months()})})();";
var INVITE_JS = "(function(){var pop=document.querySelector('.invite-pop');if(!pop)return;var btns=[].slice.call(document.querySelectorAll('[data-invite]'));if(!btns.length)return;\nvar url=pop.getAttribute('data-url'),msg=pop.getAttribute('data-msg'),subj=pop.getAttribute('data-subject')||'Join me on Caldera';\nvar inp=pop.querySelector('.inv-url'),cp=pop.querySelector('.inv-copy'),em=pop.querySelector('.inv-email'),tx=pop.querySelector('.inv-text'),sh=pop.querySelector('.inv-share'),st=pop.querySelector('.inv-status'),x=pop.querySelector('.inv-close');\ninp.value=url;var body=msg+'\\n\\n'+url;em.href='mailto:?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);tx.href='sms:?&body='+encodeURIComponent(msg+' '+url);\nvar canShare=!!(navigator.share&&(!navigator.canShare||navigator.canShare({url:url})));if(!canShare)sh.hidden=true;\nvar host=pop.parentNode,from=null;\nfunction say(t){st.textContent=t;clearTimeout(say.t);say.t=setTimeout(function(){st.textContent=''},2600)}\nfunction open(b){from=b;pop.hidden=false;var hr=host.getBoundingClientRect(),r=b.getBoundingClientRect();pop.style.top=(r.bottom-hr.top+8)+'px';var l=r.left-hr.left;pop.style.left=Math.max(0,Math.min(hr.width-pop.offsetWidth,l))+'px';btns.forEach(function(x){x.setAttribute('aria-expanded',x===b?'true':'false')});cp.focus()}\nfunction close(back){if(pop.hidden)return;pop.hidden=true;btns.forEach(function(x){x.setAttribute('aria-expanded','false')});if(back&&from)from.focus()}\nbtns.forEach(function(b){b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.addEventListener('click',function(e){e.preventDefault();if(!pop.hidden&&from===b)close(true);else open(b)})});\nfunction fallback(){inp.focus();inp.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}say(ok?'Link copied':'Press Ctrl/Cmd+C to copy')}\ncp.addEventListener('click',function(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){say('Link copied')},fallback)}else fallback()});\ninp.addEventListener('focus',function(){inp.select()});\nsh.addEventListener('click',function(){navigator.share({title:subj,text:msg,url:url}).catch(function(e){if(e&&e.name!=='AbortError'){sh.hidden=true;say('Sharing is not available here. Copy the link instead.')}})});\nx.addEventListener('click',function(){close(true)});\ndocument.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pop.hidden){e.stopPropagation();close(true)}},true);\ndocument.addEventListener('click',function(e){if(!pop.hidden&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-invite]')))close(false)});\nwindow.addEventListener('resize',function(){close(false)})})();";
var CLIENT_JS = INVITE_JS + "\n" + HEAT_JS + `
(function(){var L=[].slice.call(document.querySelectorAll('.toc:not(.pages) a'));if(!L.length||!window.IntersectionObserver)return;var by={};L.forEach(function(a){by[a.getAttribute('href').slice(1)]=a});var cur;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(cur)cur.classList.remove('is-active');cur=by[e.target.id];if(cur){cur.classList.add('is-active');var t=cur.parentNode;if(t.scrollWidth>t.clientWidth)t.scrollLeft=cur.offsetLeft-t.clientWidth/2+cur.offsetWidth/2}}})},{rootMargin:'0px 0px -70% 0px'});Object.keys(by).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)})})();
(function(){var a=document.getElementById('ago');if(a){var t=Date.parse(a.dataset.ts);var f=function(){var m=Math.max(0,Math.round((Date.now()-t)/60000));a.textContent=m<60?m+'m ago':Math.floor(m/60)+'h '+(m%60)+'m ago'};f();setInterval(f,30000)}
var el=document.getElementById('journal-data');if(!el)return;var days=JSON.parse(el.textContent);if(!days.length)return;var i=Math.max(0,days.length-2);
var body=document.getElementById('jbody'),dt=document.getElementById('jdate'),pv=document.getElementById('jprev'),nx=document.getElementById('jnext');
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var dl=function(d){return d==null?'':d>0?'<span class="up">&#9650; '+d+'</span>':d<0?'<span class="down">&#9660; '+(-d)+'</span>':'<span class="flat">=</span>'};
var mx=Math.max.apply(null,days.map(function(x){return x.score}).concat([1]));
function r(dir){var d=days[i],L=days.length;dt.textContent=(i===L-1?'Today so far / ':i===L-2?'Yesterday / ':'')+d.label;var C=2*Math.PI*42,p=Math.min(1,d.score/mx);
var sd=d.delta==null?'':(d.delta>=0?'<span class="up">&#9650; '+d.delta+'%</span>':'<span class="down">&#9660; '+(-d.delta)+'%</span>')+' vs day before';
var h='<div class="j-top"><div class="ring-wrap"><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="42"></circle><circle class="val" cx="50" cy="50" r="42" style="stroke-dasharray:'+C+';stroke-dashoffset:'+(C*(1-p))+'"></circle></svg><div class="j-score"><div class="v">'+d.score+'</div><div class="l">score</div></div></div>'+
'<div class="j-headline">'+(sd?'<div class="j-delta">'+sd+'</div>':'')+(d.headline?esc(d.headline):'<span class="muted">No journal for this day. Activity only.</span>')+(d.themes.length?'<div class="j-themes">'+d.themes.map(function(t){return'<span>'+esc(t)+'</span>'}).join('')+'</div>':'')+'</div></div>';
if(d.chips.length)h+='<div class="j-chips">'+d.chips.map(function(c){return'<div class="chip"><div class="v">'+c.v+'</div><div class="l">'+esc(c.k)+'</div><div class="dd">'+dl(c.d)+'</div></div>'}).join('')+'</div>';
if(d.focus.length||d.wins.length){h+='<div class="two-col j-lists">';if(d.focus.length)h+='<div><div class="label">Focus</div><ul class="bullets">'+d.focus.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul></div>';if(d.wins.length)h+='<div><div class="label">Wins</div><ul class="bullets">'+d.wins.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul></div>';h+='</div>'}
body.innerHTML=h;body.classList.remove('flip-l','flip-r');void body.offsetWidth;if(dir)body.classList.add(dir<0?'flip-l':'flip-r');pv.disabled=i===0;nx.disabled=i===L-1}
pv.onclick=function(){if(i>0){i--;r(-1)}};nx.onclick=function(){if(i<days.length-1){i++;r(1)}};document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')pv.onclick();if(e.key==='ArrowRight')nx.onclick()});r(0)})();`;
function githubOf(p) {
  const ok = (u) => !!u && /^https:\/\/github\.com\/[\w.-]+\/?$/.test(u);
  const l = (p.links || []).find((x) => /github/i.test(x[0]) && ok(x[1]));
  return l ? l[1] : ok(p.code?.url) ? p.code.url : void 0;
}
function renderPrivateCity(p, city, openBase = "") {
  const q2 = { ...p, city: p.city?.districts.length ? p.city : city };
  const sideOn = p.sections.sidebar !== false && !!p.tree?.length, gardenOn = p.sections.garden !== false && !!p.garden?.length;
  return renderCity({ name: p.name, handle: p.handle, theme: p.theme, icon: p.icon, openBase, github: githubOf(p), nav: (d, cur) => p.sections.sidebar === false ? "" : navSidebar(q2, sideOn, gardenOn, d, cur) }, city);
}

// src/collect.ts
var DAY = 864e5;
var fmtN = (n) => n.toLocaleString("en-US");
var iso = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
async function collectProfile(app, s, social) {
  const md = app.vault.getMarkdownFiles();
  let words = 0, links = 0;
  const created = /* @__PURE__ */ new Map(), changed = /* @__PURE__ */ new Map();
  const tagCounts = /* @__PURE__ */ new Map();
  const allow = new Map(s.publicTopics.map(([tag, label]) => [tag.toLowerCase().replace(/^#/, ""), label]));
  const publicNotes = [];
  const journal = /* @__PURE__ */ new Map();
  for (const f of md) {
    created.set(iso(f.stat.ctime), (created.get(iso(f.stat.ctime)) || 0) + 1);
    changed.set(iso(f.stat.mtime), (changed.get(iso(f.stat.mtime)) || 0) + 1);
    const cache = app.metadataCache.getFileCache(f);
    links += (cache?.links?.length || 0) + (cache?.embeds?.length || 0) + (cache?.frontmatterLinks?.length || 0);
    words += Math.round(f.stat.size / 6);
    for (const t of cache ? (0, import_obsidian3.getAllTags)(cache) || [] : []) {
      const k = t.replace(/^#/, "").toLowerCase();
      if (allow.has(k)) tagCounts.set(allow.get(k), (tagCounts.get(allow.get(k)) || 0) + 1);
    }
    const fm = cache?.frontmatter || {};
    if (String(fm.caldera || "").toLowerCase() === "public") {
      const text = await app.vault.cachedRead(f);
      const body = text.replace(/^---[\s\S]*?---\s*/, "");
      const para = body.split(/\n\s*\n/).map((x) => x.replace(/^#+\s.*$/gm, "").trim()).find((x) => x.length > 20) || "";
      publicNotes.push({ title: f.basename, excerpt: para.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1").slice(0, 280), updated: new Date(f.stat.mtime).toISOString() });
    }
    const dm = f.basename.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dm && (fm.caldera_headline || fm.caldera_focus || fm.caldera_wins)) {
      journal.set(dm[1], { headline: fm.caldera_headline, focus: asList(fm.caldera_focus), wins: asList(fm.caldera_wins), themes: asList(fm.caldera_themes) });
    }
  }
  const { garden, gardenImages, gardenFiles, gardenReport } = await collectGarden(app, s, md);
  const external = /* @__PURE__ */ new Map();
  let extra = {};
  const actFile = app.vault.getAbstractFileByPath(s.activityFile);
  if (actFile instanceof import_obsidian3.TFile) {
    try {
      extra = JSON.parse(await app.vault.cachedRead(actFile)) || {};
      for (const d of extra.days || []) external.set(d.date, d);
    } catch {
    }
  }
  if (s.sections.ai !== false && !(extra.ai && typeof extra.ai.total === "number")) {
    const base = app.vault.adapter.getBasePath?.();
    const ai = base ? await aiUsage(`${base}/${app.vault.configDir}/plugins/caldera/ai-cache.json`).catch(() => void 0) : void 0;
    if (ai) {
      extra.ai = ai;
      for (const [d, n] of Object.entries(ai.days)) {
        const e = external.get(d) || { date: d };
        if (!e.tokens) e.tokens = n;
        external.set(d, e);
      }
    }
  }
  if (s.sections.code !== false && !(extra.code && typeof extra.code.commits === "number")) {
    const fg = forgeOf(s.links || []);
    const code = await (fg?.kind === "forgejo" ? forgejoCode(fg) : githubCode(s.links || [])).catch(() => void 0);
    if (code) extra.code = code;
  }
  const today = Date.now();
  const daily = [];
  const ownerPublic = [
    s.name,
    s.headline,
    ...(s.links || []).map((l) => l[0]),
    ...(s.properties || []).map((p) => p[1]),
    ...(s.publicTopics || []).map((t) => t[1]),
    ...(s.projects || []).map((p) => p[0]),
    ...(s.tree || []).flatMap((t) => [t[0], ...t[1].split(",")]),
    ...s.graph || [],
    ...(s.backlinks || []).map((b) => b[0]),
    ...s.tabs || []
  ].filter(Boolean).map((x) => String(x).trim());
  const safe = publicTextFilter(ownerPublic);
  const clean = (xs) => xs.filter((x) => safe(x));
  for (let i = s.historyDays - 1; i >= 0; i--) {
    const date = iso(today - i * DAY);
    const ext = external.get(date) || {};
    const j = journal.get(date) || {};
    daily.push({
      date,
      counts: { notes: Math.max(created.get(date) || 0, changed.get(date) || 0), meetings: ext.meetings, emails: ext.emails, prompts: ext.prompts, commits: ext.commits, docs: ext.docs },
      tokens: Number(ext.tokens) || void 0,
      headline: [j.headline || ext.headline].filter((h) => h && safe(String(h)))[0],
      focus: clean(j.focus?.length ? j.focus : asList(ext.focus)),
      wins: clean(j.wins?.length ? j.wins : asList(ext.wins)),
      themes: clean(j.themes?.length ? j.themes : asList(ext.themes))
    });
  }
  if (s.gardenJournal !== false && s.sections.garden !== false) await growGardenFromJournal(app, s, daily, garden, gardenReport);
  let activeDays = 0;
  for (let i = 0; i < 182; i++) {
    const d = iso(today - i * DAY);
    if ((created.get(d) || 0) + (changed.get(d) || 0) > 0) activeDays++;
  }
  const files = {};
  const img = async (vaultPath, name) => {
    const f = vaultPath && app.vault.getAbstractFileByPath(vaultPath);
    if (f instanceof import_obsidian3.TFile) {
      const out = `img/${name}.${f.extension}`;
      files[out] = await app.vault.readBinary(f);
      return out;
    }
    return void 0;
  };
  const inbound = /* @__PURE__ */ new Map();
  const bump = (k) => inbound.set(k, (inbound.get(k) || 0) + 1);
  for (const targets of Object.values(app.metadataCache.resolvedLinks)) for (const t of Object.keys(targets)) bump(t.split("/").pop().replace(/\.md$/i, "").toLowerCase());
  for (const targets of Object.values(app.metadataCache.unresolvedLinks)) for (const t of Object.keys(targets)) bump(t.split("|")[0].split("/").pop().replace(/\.md$/i, "").toLowerCase());
  const linkCount = (name) => inbound.get(name.toLowerCase()) || 0;
  const topTopics = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const kinds = vaultKinds(app, md);
  const notesSorted = publicNotes.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 12);
  const tree = [{ name: "People", child: false }, { name: s.name || "Me", child: true, current: true, href: "#top" }];
  const projUrl = new Map((s.projects || []).map(([n, rest]) => [n.toLowerCase(), (rest.split("|")[1] || "").trim()]));
  const noteIds = new Set(notesSorted.map((n) => n.title.toLowerCase()));
  const hrefFor = (it) => {
    const k = it.toLowerCase(), u = projUrl.get(k);
    if (u !== void 0) return /^https?:\/\//.test(u) ? u : "#projects";
    const g = garden.find((n) => n.title.toLowerCase() === k);
    if (g) return `n/${g.slug}.html`;
    if (noteIds.has(k)) return "#" + slug("note-" + it);
    if (topTopics.some((t) => t[0].toLowerCase() === k)) return "#topics";
    return void 0;
  };
  const folderCount = (folder) => {
    if (!folder) return void 0;
    const pre = folder.replace(/^\/+|\/+$/g, "") + "/";
    const n = md.filter((f) => f.path.startsWith(pre)).length;
    return n || void 0;
  };
  const groups = s.tree?.length ? s.tree.map(([g, items, folder]) => [g, items.split(",").map((x) => x.trim()).filter(Boolean), folder]) : [["Topics", topTopics.slice(0, 5).map((t) => t[0])], ["Notes", notesSorted.slice(0, 5).map((n) => n.title)]];
  if (!s.tree?.length && !topTopics.length && !notesSorted.length)
    for (const [label, n] of kinds) tree.push({ name: label, child: false, count: n });
  for (const [g, items, folder] of groups) {
    const count = folderCount(folder);
    if (!items.length && !count) continue;
    tree.push({ name: g, child: false, count });
    for (const it of items) tree.push({ name: it, child: true, href: hrefFor(it) });
  }
  if (garden.length && s.sections.garden !== false && !tree.some((t) => !t.child && t.name.toLowerCase() === "garden")) {
    tree.push({ name: "Garden", child: false, count: garden.length, href: "garden.html" });
    for (const n of [...garden].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6)) tree.push({ name: n.title, child: true, href: `n/${n.slug}.html` });
  }
  const graph = (s.graph?.length ? s.graph.map((n) => ({ t: n, n: linkCount(n) })) : (topTopics.length ? topTopics : kinds).slice(0, 12).map(([t, n]) => ({ t, n }))).slice(0, 16);
  const backlinks = s.backlinks?.length ? s.backlinks : notesSorted.slice(0, 6).map((n) => [n.title, n.excerpt.slice(0, 70)]);
  const DAYMS = 864e5, todayD = /* @__PURE__ */ new Date();
  todayD.setHours(12, 0, 0, 0);
  const startD = new Date(todayD.getTime() - ((todayD.getDay() + 6) % 7 + 7 * 25) * DAYMS);
  const heat = [];
  for (let t = startD.getTime(); t <= todayD.getTime(); t += DAYMS) {
    const d = iso(t), e = external.get(d) || {};
    heat.push({ date: d, n: (created.get(d) || 0) + (changed.get(d) || 0) + (Number(e.docs) || 0) });
  }
  const createdDays = [...created.keys()].sort();
  const growth = [];
  if (createdDays.length) {
    const first = /* @__PURE__ */ new Date(createdDays[0] + "T12:00:00");
    first.setDate(first.getDate() - (first.getDay() + 6) % 7);
    let total = 0;
    for (let w = first.getTime(); w <= todayD.getTime(); w += 7 * DAYMS) {
      for (let k = 0; k < 7; k++) total += created.get(iso(w + k * DAYMS)) || 0;
      growth.push({ week: iso(w), total });
    }
  }
  const knows = s.knows?.length ? s.knows.map(([label, folder]) => {
    const pre = folder.replace(/^\/+|\/+$/g, "") + "/";
    return [label, md.filter((f) => f.path.startsWith(pre)).length];
  }) : Array.isArray(extra.knows) ? extra.knows.filter((k) => Array.isArray(k) && typeof k[1] === "number").map((k) => [String(k[0]), k[1]]) : kinds;
  const pc = extra.projects && typeof extra.projects === "object" ? extra.projects : {};
  const projects = (s.projects || []).map(([name, rest]) => {
    const [status = "", url = ""] = rest.split("|").map((x) => x.trim());
    return { name, status, url, commits: Number(pc[name]) || void 0 };
  });
  const avatarPath = await img(s.avatarPath, "avatar");
  let icon;
  if (avatarPath) try {
    const bmp = await createImageBitmap(new Blob([files[avatarPath]]));
    const N = 128, side = Math.min(bmp.width, bmp.height) * 0.75, sx = (bmp.width - side) / 2, sy = (bmp.height - side) * 0.12;
    const cv = new OffscreenCanvas(N, N), cx = cv.getContext("2d");
    cx.beginPath();
    cx.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2);
    cx.clip();
    cx.drawImage(bmp, sx, sy, side, side, 0, 0, N, N);
    files["img/icon.png"] = await (await cv.convertToBlob({ type: "image/png" })).arrayBuffer();
    icon = "img/icon.png";
  } catch {
  }
  const data = {
    name: s.name || "Untitled",
    handle: s.handle || void 0,
    headline: s.headline,
    theme: s.theme,
    avatar: avatarPath,
    icon,
    banner: await img(s.bannerPath, "banner"),
    links: s.links.filter((l) => l[0] && l[1]),
    properties: s.properties.filter((p) => p[0] && p[1]),
    sections: s.sections,
    stats: { notes: md.length, words, links, activeDays },
    topics: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18),
    daily,
    publicNotes: notesSorted,
    tabs: s.tabs?.length ? s.tabs : void 0,
    summary: s.summary || void 0,
    now: s.now,
    timeline: s.timeline,
    projects,
    heat,
    growth,
    knows,
    inbox: extra.inbox && Array.isArray(extra.inbox.kinds) ? extra.inbox : void 0,
    code: extra.code && typeof extra.code.commits === "number" ? extra.code : void 0,
    ai: extra.ai && typeof extra.ai.total === "number" && Array.isArray(extra.ai.models) ? extra.ai : void 0,
    extraNumbers: Array.isArray(extra.numbers) ? extra.numbers.filter((x) => Array.isArray(x)).map((x) => [String(x[0]), String(x[1])]) : void 0,
    tree,
    graph,
    graphLabel: s.graph?.length ? "Local graph / sized by linked notes" : topTopics.length ? "Topics / sized by notes" : "The vault / sized by notes",
    backlinks,
    backlinkLabel: s.backlinks?.length ? `Backlinks / ${fmtN(linkCount(s.name || ""))} notes link here` : "Public notes",
    asks: s.asks,
    offers: s.offers,
    social,
    updated: (/* @__PURE__ */ new Date()).toISOString(),
    garden: garden.length ? garden : void 0,
    gardenExternal: s.gardenUrl || void 0,
    gardenImages
  };
  Object.assign(files, gardenFiles);
  let cityPrivate;
  if (s.sections.city !== false) {
    try {
      const path = "Caldera/city.json";
      const fg = forgeOf(s.links || []), src = fg && forgeSource(fg);
      let cur;
      try {
        if (await app.vault.adapter.exists(path)) cur = JSON.parse(await app.vault.adapter.read(path));
      } catch {
      }
      const ours = !cur || /^caldera (github|forgejo) /.test(String(cur.source || ""));
      if (fg && ours && (cur?.source !== src || Date.now() - Date.parse(cur?.generated || 0) > 6 * 36e5)) {
        const prev = cur?.source === src ? cur : void 0;
        const fresh = await (fg.kind === "github" ? githubCity(fg.user, prev) : forgejoCity(fg, prev)).catch(() => void 0);
        if (fresh) {
          if (!await app.vault.adapter.exists("Caldera")) await app.vault.createFolder("Caldera");
          await app.vault.adapter.write(path, JSON.stringify(fresh, null, 1));
        }
      }
      const priv = new Set(md.filter((f) => app.metadataCache.getFileCache(f)?.frontmatter?.caldera === "private").map((f) => f.path));
      const inVault = (f) => !f.path.startsWith("Caldera/") && !/(^|\/)(templates?|\.trash)\//i.test(f.path) && !priv.has(f.path);
      const raw = await app.vault.adapter.exists(path) ? JSON.parse(await app.vault.adapter.read(path)) : void 0;
      const fromVault = !raw && !fg;
      if (raw || fromVault) {
        const fromGithub = !!raw && /^caldera (github|forgejo) /.test(String(raw.source || ""));
        const repos = raw ? parseCityRepos(raw) : vaultRepos(md.filter(inVault).map((f) => ({ path: f.path, mtime: f.stat.mtime })));
        if (repos.length) {
          const byName = new Map(md.map((f) => [f.basename.toLowerCase(), f.path]));
          const resolved = app.metadataCache.resolvedLinks;
          const notes = (project) => {
            const target = byName.get(project.toLowerCase());
            if (!target) return { n: 0, paths: [] };
            const src2 = md.filter((f) => resolved[f.path]?.[target]).sort((a, b) => b.stat.mtime - a.stat.mtime);
            return { n: src2.length, paths: [target, ...src2.slice(0, 5).map((f) => f.path)] };
          };
          cityPrivate = cityData(repos, notes, typeof raw?.generated === "string" ? raw.generated : (/* @__PURE__ */ new Date()).toISOString());
          if (fromVault) cityPrivate.kind = "vault";
          const bornAt = (f) => {
            const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
            const ts = [fm.created, fm.date, fm.notion_created, fm.notion_edited, fm.ingested, f.basename.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1]].map((v) => typeof v === "string" || typeof v === "number" ? Date.parse(String(v)) : NaN).filter((t) => t > 9466848e5 && t < Date.now() + 864e5);
            return Math.min(f.stat.ctime, f.stat.mtime, ...ts);
          };
          const hubs = {};
          for (const d of cityPrivate.districts) {
            const h = byName.get(d.name.toLowerCase());
            if (h) hubs[d.name] = h;
          }
          const gslug = new Map(garden.map((g) => [g.title.toLowerCase(), g.slug]));
          const vault = md.filter(inVault).map((f) => ({ path: f.path, title: f.basename, ctime: bornAt(f), mtime: f.stat.mtime, out: Object.keys(resolved[f.path] || {}) }));
          cityPrivate.under = underground(vault, hubs, (t) => gslug.get(t.toLowerCase()));
          const pub = publicCity(cityPrivate, fromGithub ? cityPrivate.districts.map((d) => d.name) : fromVault ? [] : (s.projects || []).map((p) => p[0]));
          if (pub.districts.length) data.city = pub;
        }
      }
    } catch (e) {
      console.warn("Caldera city.json unreadable:", e);
    }
  }
  return { data, files, gardenReport, cityPrivate };
}
function asList(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, 3);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}
var IMG_EXT = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "webp"]);
var IMG_MAX = 2e6;
var IMG_TOTAL = 6e6;
function inGarden(path, fm, folder) {
  const flag = String(fm?.caldera ?? "").toLowerCase().trim();
  if (flag === "private" || flag === "friends") return false;
  if (path.startsWith("Caldera/")) return false;
  if (flag === "garden") return true;
  const pre = (folder || "").replace(/^\/+|\/+$/g, "");
  return !!pre && path.startsWith(pre + "/");
}
async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function collectGarden(app, s, md) {
  const picked = md.filter((f) => inGarden(f.path, app.metadataCache.getFileCache(f)?.frontmatter || {}, s.gardenFolder ?? "Garden"));
  const garden = [], gardenReport = [];
  const gardenFiles = {}, gardenImages = {};
  if (!picked.length) return { garden, gardenImages, gardenFiles, gardenReport };
  const titles = new Map(picked.map((f) => [f.basename.toLowerCase(), f]));
  const used = /* @__PURE__ */ new Set(), slugOf = /* @__PURE__ */ new Map();
  for (const f of picked) {
    let sl = slug(f.basename), k = 2;
    while (used.has(sl)) sl = `${slug(f.basename)}-${k++}`;
    used.add(sl);
    slugOf.set(f, sl);
  }
  const ownerPublic = [s.name, ...(s.links || []).map((l) => l[0]), ...(s.publicTopics || []).map((t) => t[1]), ...(s.projects || []).map((p) => p[0]), ...picked.map((f) => f.basename)].filter(Boolean).map(String);
  const check = publicTextFilter(ownerPublic);
  let imgTotal = 0;
  for (const f of picked) {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    const raw = (await app.vault.cachedRead(f)).replace(/^---[\s\S]*?\n---\s*/, "").replace(/%%[\s\S]*?%%/g, "").trim();
    const { text, removed } = redact(raw);
    const out = /* @__PURE__ */ new Set();
    const xlinks = /* @__PURE__ */ new Map();
    for (const m of text.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) {
      const t = m[1].trim(), x = parseXLink(t);
      if (x) {
        xlinks.set(`${x.handle}/${x.slug}`, x);
        continue;
      }
      const hit = titles.get(t.split("/").pop().replace(/\.md$/i, "").toLowerCase());
      if (hit && hit !== f) out.add(slugOf.get(hit));
    }
    for (const m of text.matchAll(/!\[\[([^\]|#]+)/g)) {
      const t = m[1].trim();
      if (gardenImages[t]) continue;
      const dest = app.metadataCache.getFirstLinkpathDest?.(t, f.path) ?? app.vault.getAbstractFileByPath(t);
      if (!(dest instanceof import_obsidian3.TFile) || !IMG_EXT.has(dest.extension.toLowerCase()) || dest.stat.size > IMG_MAX || imgTotal + dest.stat.size > IMG_TOTAL) continue;
      const outPath = `n/img/${slug(dest.basename)}-${slug(String(dest.stat.size))}.${dest.extension.toLowerCase()}`;
      gardenFiles[outPath] = await app.vault.readBinary(dest);
      imgTotal += dest.stat.size;
      gardenImages[t] = outPath;
    }
    const created = Date.parse(String(fm.created || fm.date || "")) || f.stat.ctime;
    const note = {
      slug: slugOf.get(f),
      title: f.basename,
      stage: normStage(fm.stage ?? fm.status),
      license: normLicense(fm.license),
      created: new Date(Math.min(created, f.stat.mtime)).toISOString(),
      updated: new Date(f.stat.mtime).toISOString(),
      markdown: text,
      sha256: await sha256hex(text),
      words: (text.match(/\S+/g) || []).length,
      excerpt: excerptOf(text),
      out: [...out],
      xlinks: [...xlinks.values()],
      tags: asList(fm.tags).map((t) => t.replace(/^#/, ""))
    };
    garden.push(note);
    const flags = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("```")).map((line) => ({ line: line.slice(0, 160), why: check.why(line) || "" })).filter((x) => x.why && x.why !== "name").slice(0, 12);
    gardenReport.push({ path: f.path, title: f.basename, slug: note.slug, stage: note.stage, license: note.license, words: note.words, removed, flags });
  }
  return { garden, gardenImages, gardenFiles, gardenReport };
}
async function growGardenFromJournal(app, s, daily, garden, report) {
  const fresh = daily.filter((d) => d.headline || d.focus?.length || d.wins?.length).map((d) => ({ date: d.date, headline: d.headline, focus: d.focus, wins: d.wins, themes: d.themes }));
  const path = `${app.vault.configDir}/plugins/caldera/journal-garden.json`;
  let kept = {};
  try {
    if (await app.vault.adapter.exists(path)) kept = JSON.parse(await app.vault.adapter.read(path)).days || {};
  } catch {
    kept = {};
  }
  for (const d of fresh) kept[d.date] = d;
  const dates = Object.keys(kept).sort().slice(-3650);
  kept = Object.fromEntries(dates.map((k) => [k, kept[k]]));
  try {
    await app.vault.adapter.write(path, JSON.stringify({ days: kept }));
  } catch {
  }
  const pages = journalGarden(Object.values(kept), (s.projects || []).map((p) => p[0]));
  const used = new Set(garden.map((n) => n.slug));
  for (const pg of pages) {
    const planted = garden.find((n) => n.title.toLowerCase() === pg.title.toLowerCase());
    if (planted) {
      planted.markdown += `

## From my journal

${pg.markdown.replace(/^\*[^\n]*\*\n\n/, "").replace(/^## /gm, "### ")}`;
      planted.sha256 = await sha256hex(planted.markdown);
      planted.words = (planted.markdown.match(/\S+/g) || []).length;
      if (pg.updated > planted.updated) planted.updated = pg.updated;
      continue;
    }
    let sl = slug(pg.title), k = 2;
    while (used.has(sl)) sl = `${slug(pg.title)}-${k++}`;
    used.add(sl);
    const note = {
      slug: sl,
      title: pg.title,
      stage: pg.stage,
      license: "all-rights",
      created: pg.created,
      updated: pg.updated,
      markdown: pg.markdown,
      sha256: await sha256hex(pg.markdown),
      words: (pg.markdown.match(/\S+/g) || []).length,
      excerpt: excerptOf(pg.markdown.replace(/^\*[^\n]*\*\n\n/, "").replace(/^## .*$/gm, "")),
      out: [],
      xlinks: [],
      tags: ["journal"]
    };
    garden.push(note);
    report.push({ path: "(grown from your journal)", title: note.title, slug: note.slug, stage: note.stage, license: note.license, words: note.words, removed: 0, flags: [] });
  }
  const byTitle = new Map(garden.map((n) => [n.title.toLowerCase(), n.slug]));
  for (const n of garden) {
    const out = new Set(n.out);
    for (const m of n.markdown.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) {
      const t = m[1].trim();
      if (parseXLink(t)) continue;
      const sl = byTitle.get(t.split("/").pop().replace(/\.md$/i, "").toLowerCase());
      if (sl && sl !== n.slug) out.add(sl);
    }
    n.out = [...out];
  }
}

// src/profile-file.ts
var import_obsidian4 = require("obsidian");
var PROFILE_FILE = "Caldera/profile.md";
var pair = (v) => {
  const [a, ...b] = String(v ?? "").split("|");
  const k = a.trim(), val = b.join("|").trim();
  return k && val ? [k, val] : null;
};
var pairs = (v) => Array.isArray(v) ? v.map(pair).filter(Boolean) : null;
function effectiveSettings(app, s) {
  const f = app.vault.getAbstractFileByPath(PROFILE_FILE);
  const fm = f instanceof import_obsidian4.TFile ? app.metadataCache.getFileCache(f)?.frontmatter : null;
  if (!fm) return s;
  const e = { ...s, sections: { ...s.sections } };
  if (typeof fm.name === "string" && fm.name.trim()) e.name = fm.name.trim();
  if (typeof fm.headline === "string") e.headline = fm.headline.trim();
  if (typeof fm.photo === "string") e.avatarPath = fm.photo.trim();
  if (typeof fm.banner === "string") e.bannerPath = fm.banner.trim();
  e.links = pairs(fm.links) ?? e.links;
  e.properties = pairs(fm.properties) ?? e.properties;
  const topics = pairs(fm.topics);
  if (topics) e.publicTopics = topics.map(([tag, label]) => [tag.replace(/^#/, ""), label]);
  if (fm.sections && typeof fm.sections === "object") for (const [k, v] of Object.entries(fm.sections)) e.sections[k] = v !== false;
  if (typeof fm.listed === "boolean") e.listed = fm.listed;
  if (Array.isArray(fm.sidebar)) e.tree = fm.sidebar.map((x) => {
    const [g = "", items = "", folder = ""] = String(x ?? "").split("|").map((v) => v.trim());
    return [g, items, folder || void 0];
  }).filter(([g]) => g);
  if (Array.isArray(fm.graph)) e.graph = fm.graph.map((x) => String(x).trim()).filter(Boolean).slice(0, 20);
  e.backlinks = pairs(fm.backlinks) ?? e.backlinks;
  if (typeof fm.summary === "string") e.summary = fm.summary.trim();
  if (Array.isArray(fm.now)) e.now = fm.now.map((x) => String(x).trim()).filter(Boolean).slice(0, 8);
  e.timeline = pairs(fm.timeline) ?? e.timeline;
  e.projects = pairs(fm.projects) ?? e.projects;
  e.knows = pairs(fm.knows) ?? e.knows;
  if (typeof fm.garden === "string") e.gardenFolder = fm.garden.trim().replace(/^\/+|\/+$/g, "");
  if (typeof fm.garden_journal === "boolean") e.gardenJournal = fm.garden_journal;
  if (typeof fm.garden_url === "string") e.gardenUrl = /^https:\/\//.test(fm.garden_url.trim()) ? fm.garden_url.trim() : "";
  if (Array.isArray(fm.tabs)) e.tabs = fm.tabs.map((x) => String(x).trim()).filter(Boolean).slice(0, 5);
  return e;
}
var q = (v) => JSON.stringify(v);
function profileFileText(s, hubUrl) {
  const list = (rows) => rows.length ? rows.map((r) => `  - ${q(r)}`).join("\n") : "  []";
  return `---
name: ${q(s.name)}
headline: ${q(s.headline)}
photo: ${q(s.avatarPath)}
banner: ${q(s.bannerPath)}
links:
${list(s.links.map(([a, b]) => `${a} | ${b}`))}
properties:
${list(s.properties.map(([a, b]) => `${a} | ${b}`))}
topics:
${list(s.publicTopics.map(([a, b]) => `${a} | ${b}`))}
sections:
${Object.entries(s.sections).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
listed: ${s.listed !== false}
summary: ${q(s.summary || "")}
now:
${list(s.now || [])}
timeline:
${list((s.timeline || []).map(([a, b]) => `${a} | ${b}`))}
projects:
${list((s.projects || []).map(([a, b]) => `${a} | ${b}`))}
knows:
${list((s.knows || []).map(([a, b]) => `${a} | ${b}`))}
tabs:
${list(s.tabs || [])}
garden: ${q(s.gardenFolder ?? "Garden")}
garden_url: ${q(s.gardenUrl || "")}
garden_journal: ${s.gardenJournal !== false}
sidebar:
${list((s.tree || []).map(([a, b, c]) => `${a} | ${b}${c ? ` | ${c}` : ""}`))}
graph:
${list(s.graph || [])}
backlinks:
${list((s.backlinks || []).map(([a, b]) => `${a} | ${b}`))}
---
# My Caldera profile

This note controls your public page at ${hubUrl.replace(/\/$/, "")}/@${s.handle}/ . Edit the properties above, or ask your AI agent to, and the page republishes itself about a minute after you save. **Everything above is public.**

- **name, headline** - shown at the top of your page.
- **photo, banner** - paths to images in this vault, e.g. \`Attachments/me.jpg\`.
- **links** - \`Label | https://...\`, one per line.
- **properties** - short facts, \`Label | value\` (e.g. \`Based in | Lisbon\`).
- **topics** - which of your tags may be counted publicly, \`tag | Label\`. Tags not listed are never shown.
- **sections** - switch parts of the page on or off: ${Object.keys(s.sections).join(", ")}.
- **listed** - \`true\` shows your card on the People page; \`false\` keeps the page link-only.
- **summary** - a short intro box. Links: \`[[Label|https://...]]\`, bold: \`**text**\`.
- **now** - what you're doing now, one line each.
- **timeline** - \`Year | what happened | optional one-line detail\`. Start a chapter with \`era | Name | 1995-2006\`.
- **projects** - \`Name | status | https://link\`.
- **knows** - \`Label | vault folder\`; shows how many notes are in each folder (counts only).
- **tabs** - extra tab labels in the top bar, like \`Now.md\`.
- **garden** - a folder whose notes are published as full pages (your digital garden). Default \`Garden\`. Any note can also opt in with \`caldera: garden\`; \`caldera: private\` keeps a note out. In a garden note, \`stage: seedling | budding | evergreen\` and \`license: all-rights | cc-by | cc-by-nc | cc0 | ai-licensable\`. Email addresses and phone numbers are removed automatically. Link a friend's note with \`[[@handle/Their note]]\`.
- **garden_journal** - \`true\` (default) grows garden pages from your daily journal: one per public project it keeps mentioning and one per recurring theme. Only journal text that is already public is used. \`false\` turns it off.
- **garden_url** - an existing garden elsewhere (Quartz, Obsidian Publish...), linked from your page.
- **sidebar** - the left column, \`Group | item, item | folder\` (e.g. \`Projects | Garden app, Newsletter | Projects\`). Items that match a project, public note or section on your page become links. The optional folder shows how many notes it holds (a count only). Empty: your topics and public notes.
- **graph** - note names for the graph on the right, sized by how many of your notes link to each (only the count is published). Empty: your topics.
- **backlinks** - the list under the graph, \`Title | short context\`. Empty: your public notes.

Your handle and identity key live in Settings -> Caldera, never here. Guide: ${hubUrl.replace(/\/$/, "")}/guide.html
`;
}
async function ensureProfileFile(app, s, hubUrl) {
  const existing = app.vault.getAbstractFileByPath(PROFILE_FILE);
  if (existing instanceof import_obsidian4.TFile) return existing;
  if (!app.vault.getAbstractFileByPath("Caldera")) await app.vault.createFolder("Caldera").catch(() => {
  });
  return app.vault.create(PROFILE_FILE, profileFileText(s, hubUrl));
}

// src/view.ts
var import_obsidian5 = require("obsidian");

// src/owner.ts
var esc4 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var ago = (iso2, now) => {
  const m = Math.max(0, Math.round((Date.parse(now) - Date.parse(iso2)) / 6e4));
  return m < 60 ? `${m}m ago` : m < 48 * 60 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)} days ago`;
};
var open2 = (r) => `<a class="ow-link" href="#" data-open="${esc4(r.path)}">${esc4(r.title)}</a>`;
var pageName = (p) => p === "index.html" ? "your profile" : p === "garden.html" ? "garden home" : p.replace(/^n\//, "").replace(/\.html$/, "").replace(/-/g, " ");
function renderOwner(o) {
  const out = [];
  const card = (id, title, body, extra = "") => out.push(`<section class="ow-card" id="${id}"><div class="ow-h"><h3>${title}</h3>${extra}</div>${body}</section>`);
  {
    const a = o.activity;
    const when = o.lastLooked ? `since you last looked, ${ago(o.lastLooked, o.now)}` : "in the last 24 hours";
    let body = "";
    if (!a) body = `<p class="ow-muted">Publish your profile to start seeing visits, gravity and links here.</p>`;
    else if ("error" in a) body = `<p class="ow-muted">Couldn't reach the hub (${esc4(a.error)}). Your vault sections below still work offline.</p>`;
    else {
      const tiles = [[a.views, a.views === 1 ? "page view" : "page views"], [a.visitors, a.visitors === 1 ? "visitor" : "visitors"], [a.gravity.length, "gravity"], [a.friends.length, a.friends.length === 1 ? "new friend" : "new friends"], ...a.kudos?.length ? [[a.kudos.length, "kudos"]] : []].concat(o.pending ? [[o.pending, o.pending === 1 ? "friend request" : "friend requests"]] : []);
      body += `<div class="ow-tiles">${tiles.map(([n, l]) => `<div class="ow-tile${Number(n) ? " is-up" : ""}"><b>${n}</b><span>${l}</span></div>`).join("")}</div>`;
      const byDay = new Map(a.days.map((d) => [d[0], d])), t0 = Date.parse(o.now);
      const days14 = Array.from({ length: 14 }, (_, i) => {
        const k = new Date(t0 - (13 - i) * 864e5).toISOString().slice(0, 10);
        return byDay.get(k) || [k, 0, 0];
      });
      const max = Math.max(1, ...days14.map((d) => d[1]));
      if (a.days.length) body += `<div class="ow-spark" title="Page views, last 14 days">${days14.map((d) => `<i style="height:${d[1] ? Math.max(6, Math.round(d[1] / max * 100)) : 2}%;${d[1] ? "" : "opacity:.25"}" title="${esc4(d[0])}: ${d[1]} views, ${d[2]} visitors"></i>`).join("")}</div><div class="ow-muted ow-small">Page views, last 14 days &middot; ${a.totalViews.toLocaleString("en-US")} all time</div>`;
      if (typeof a.viewsAll === "number") body += `<div class="ow-muted ow-small">Your page's view count: <b>${a.viewsAll.toLocaleString("en-US")}</b> all time &middot; <b>${(a.viewsWeek || 0).toLocaleString("en-US")}</b> this week (one per visitor per day)${a.showViews === false ? " &middot; hidden from visitors" : ""}</div>`;
      const lines = [];
      if (a.pages.length) lines.push(`<li>Most read: ${a.pages.slice(0, 4).map(([p, n]) => `${esc4(pageName(p))} (${n})`).join(", ")}</li>`);
      for (const g of a.gravity.slice(0, 5)) lines.push(`<li><b>${g.from ? "@" + esc4(g.from) : "Someone"}</b> gave you gravity${g.reason ? `: &ldquo;${esc4(g.reason)}&rdquo;` : ""} <span class="ow-muted">${ago(g.ts, o.now)}</span></li>`);
      for (const k of (a.kudos || []).slice(0, 6)) lines.push(`<li>${esc4(k.emoji)} <b>${k.from ? "@" + esc4(k.from) : "Someone"}</b> sent you kudos <span class="ow-muted">${ago(k.ts, o.now)}</span></li>`);
      for (const f of a.friends.slice(0, 5)) lines.push(`<li>You and <b>${f.handle ? "@" + esc4(f.handle) : "a new friend"}</b> are now friends <span class="ow-muted">${ago(f.ts, o.now)}</span></li>`);
      if (o.pending) lines.push(`<li><a href="#" data-action="panel" class="ow-link">${o.pending} friend request${o.pending === 1 ? "" : "s"} waiting</a></li>`);
      if (a.links.length) lines.push(`<li>Other gardens link to you ${a.links.length} time${a.links.length === 1 ? "" : "s"}: ${a.links.slice(0, 3).map((l) => `@${esc4(l.src_handle)}'s &ldquo;${esc4(l.src_title)}&rdquo;`).join(", ")}</li>`);
      body += lines.length ? `<ul class="ow-list">${lines.join("")}</ul>` : `<p class="ow-muted">Quiet so far. Share your invite link from the Caldera panel to bring friends in.</p>`;
    }
    card("ow-since", "Since you last looked", body, `<span class="ow-muted ow-small">${esc4(when)}</span>`);
  }
  if (o.checklist?.some((i) => !i.done)) {
    const items = o.checklist, left = items.filter((i) => !i.done), done = items.length - left.length;
    const act = (a, label) => `<a href="#" class="ow-link ow-act" data-action="${a}">${label}</a>`;
    const how = {
      photo: `${act("pick-photo", "Choose an image")} ${act("prompt-photo", "Copy prompt for my AI")}`,
      banner: `${act("pick-banner", "Choose an image")} ${act("prompt-banner", "Copy prompt for my AI")} <span class="ow-muted ow-small">wide, about 3:1</span>`,
      headline: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      summary: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      links: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      garden: `${act("garden-help", "How to plant a note")}`,
      friend: `${act("panel", "Open the Caldera panel")}`,
      group: `${act("settings", "Join one in settings")} <span class="ow-muted ow-small">try producthunt</span>`,
      email: `${act("settings", "Turn it on in settings")}`
    };
    out.unshift(`<section class="ow-card ow-finish" id="ow-finish"><div class="ow-h"><h3>Finish your page</h3><span class="ow-muted ow-small">${done} of ${items.length} done</span></div>
<div class="ow-bar"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>
<p class="ow-small">${act("finish-form", "Fill it in with a quick form")} <span class="ow-muted">name, photo, masthead, links and a first garden note in one go</span></p>
<ul class="ow-list ow-todo">${left.map((i) => `<li><b>${esc4(i.label)}</b> <span class="ow-muted">${esc4(i.why)}</span><div class="ow-acts">${how[i.id] || ""}</div></li>`).join("")}</ul></section>`);
  }
  if (o.sources?.length) {
    const on = o.sources.filter((x) => x.ok).length, all = o.sources.length;
    const nudge = o.promptOutdated ? `<p class="ow-lead">Caldera can track more than your routine was set up for. Copy the setup prompt again and paste it into your AI agent: it upgrades what's there and fills in the rest.</p>` : on < all ? `<p class="ow-muted">Your page shows what your vault is fed. Copy the setup prompt into Claude Code, Codex or Cursor: it connects what it can find on this computer, schedules one routine to keep it fresh, and asks before anything goes public. Paste it again any time.</p>` : "";
    card("ow-sources", "What feeds your page", `${nudge}<ul class="ow-list ow-src">${o.sources.map((x) => `<li>${x.ok ? "&#10003;" : "&#9675;"} <b>${esc4(x.label)}</b>${x.ok ? "" : ` <span class="ow-muted">${esc4(x.hint)}</span>`}</li>`).join("")}</ul>
<p><a href="#" class="ow-link" data-action="prompt"><b>Copy the setup prompt</b></a>${o.promptOutdated ? "" : ` <span class="ow-muted ow-small">safe to paste again</span>`}</p>`, `<span class="ow-muted ow-small">${on} of ${all} connected</span>`);
  }
  {
    const t = o.today;
    const parts = [];
    if (t.headline) parts.push(`<p class="ow-lead">${esc4(t.headline)}</p>`);
    const chips = Object.entries(t.counts || {}).filter(([, n]) => n > 0).map(([k, n]) => `<span class="ow-chip">${n} ${esc4(k)}</span>`);
    if (chips.length) parts.push(`<div class="ow-chips">${chips.join("")}</div>`);
    for (const [lab, xs] of [["Focus", t.focus], ["Wins", t.wins]]) if (xs?.length) parts.push(`<div class="ow-small"><b>${lab}:</b> ${xs.map(esc4).join(" &middot; ")}</div>`);
    if (t.timeline.length) parts.push(`<ol class="ow-time">${t.timeline.map((r) => `<li><span class="ow-t">${esc4(r.time || "")}</span>${r.kind === "new" ? '<span class="ow-new">new</span>' : ""}${open2(r)}</li>`).join("")}</ol>`);
    else parts.push(`<p class="ow-muted">Nothing written yet today.</p>`);
    card("ow-today", "Today", parts.join(""), `<span class="ow-muted ow-small">${esc4(t.date)}</span>`);
  }
  if (o.onThisDay.some((d) => d.items.length)) card("ow-otd", "On this day", o.onThisDay.filter((d) => d.items.length).map((d) => `<div class="ow-otd"><div class="ow-small ow-muted">${esc4(d.label)} &middot; ${esc4(d.date)}</div>${d.items.slice(0, 2).map((r) => `<div>${open2(r)}${r.excerpt ? `<p class="ow-x">${esc4(r.excerpt)}</p>` : ""}</div>`).join("")}</div>`).join(""));
  if (o.rediscovered) {
    const r = o.rediscovered;
    card("ow-back", "Brought back", `<div class="ow-big">${open2(r)}</div>${r.excerpt ? `<p class="ow-x">${esc4(r.excerpt)}</p>` : ""}<div class="ow-small ow-muted">${esc4(r.why)}</div>`, `<span class="ow-muted ow-small">changes every 3 hours</span>`);
  }
  if (o.patterns.length) card("ow-pat", "Patterns", `<ul class="ow-list">${o.patterns.map((p) => `<li>${p}</li>`).join("")}</ul>`);
  if (o.goals === null) card("ow-goals", "Goals", `<p class="ow-muted">Track goals here with checkboxes in a note. <a href="#" class="ow-link" data-action="goals">Create Caldera/Goals.md</a></p>`);
  else if (o.goals?.length) card(
    "ow-goals",
    "Goals",
    o.goals.map((g) => {
      const pct = g.total ? Math.round(g.done / g.total * 100) : 0;
      return `<div class="ow-goal"><div class="ow-goal-h"><b>${esc4(g.heading)}</b><span class="ow-muted ow-small">${g.done}/${g.total}</span></div><div class="ow-bar"><i style="width:${pct}%"></i></div>${g.open.length ? `<div class="ow-small ow-muted">Next: ${g.open.slice(0, 2).map(esc4).join(" &middot; ")}</div>` : ""}</div>`;
    }).join(""),
    `<a href="#" class="ow-link ow-small" data-open="Caldera/Goals.md">edit</a>`
  );
  return `<style>${OWNER_CSS}</style><div class="ow" id="owner"><div class="ow-top"><span class="ow-lock">&#128274; Only you can see this</span><span class="ow-muted ow-small">Built from your vault inside Obsidian. None of it is published.</span></div><div class="ow-grid">${out.join("")}</div></div>`;
}
var OWNER_CSS = `
.ow{margin:18px 0 26px;padding:16px;border:1px dashed var(--accent);border-radius:var(--radius-md,10px);background:color-mix(in srgb,var(--accent) 5%,transparent)}
.ow-top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin-bottom:12px}
.ow-lock{font-family:var(--font-mono);font-size:var(--text-xs,12px);text-transform:uppercase;letter-spacing:.05em;color:var(--accent);font-weight:600}
.ow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}
.ow-card{background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:14px 16px;min-width:0}
.ow-card#ow-since,.ow-card#ow-today,.ow-card#ow-finish{grid-column:1/-1}
.ow-todo{list-style:none;padding:0;gap:10px}.ow-acts{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:3px;align-items:baseline}.ow-act{font-weight:600}
.ow-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}
.ow-h h3{margin:0;font-size:1rem;font-family:var(--font-sans);font-weight:600;color:var(--text-strong)}
.ow-muted{color:var(--text-muted)}.ow-small{font-size:var(--text-sm,13px)}
.ow-tiles{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.ow-tile{flex:1 1 90px;padding:8px 10px;border-radius:var(--radius-sm,6px);background:var(--bg-sunken);display:flex;flex-direction:column}
.ow-tile b{font-size:1.35rem;font-variant-numeric:tabular-nums;color:var(--text-muted)}.ow-tile.is-up b{color:var(--accent)}
.ow-tile span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.ow-spark{display:flex;align-items:flex-end;gap:3px;height:38px;margin:4px 0}
.ow-spark i{flex:1;background:var(--accent);opacity:.75;border-radius:2px 2px 0 0;min-height:2px}
.ow-list{margin:8px 0 0;padding-left:18px;display:grid;gap:4px}
.ow-link{color:var(--accent);text-decoration:none}.ow-link:hover{text-decoration:underline}
.ow-lead{margin:0 0 8px;font-weight:500}
.ow-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.ow-chip{font-size:var(--text-xs,12px);padding:2px 8px;border-radius:999px;background:var(--bg-sunken);color:var(--text-muted);font-variant-numeric:tabular-nums}
.ow-time{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:3px;max-height:260px;overflow:auto;columns:2}
.ow-time li{display:flex;gap:8px;align-items:baseline;min-width:0}
.ow-time .ow-link{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ow-t{font-family:var(--font-mono);font-size:var(--text-xs,12px);color:var(--text-muted);flex:0 0 40px;font-variant-numeric:tabular-nums}
.ow-new{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);flex:0 0 auto}
.ow-otd{display:grid;gap:4px;margin-bottom:10px}.ow-otd:last-child{margin-bottom:0}
.ow-x{margin:2px 0 0;font-size:var(--text-sm,13px);color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ow-big{font-size:1.1rem;font-weight:600}
.ow-goal{margin-bottom:10px}.ow-goal-h{display:flex;justify-content:space-between;gap:8px}
.ow-bar{height:6px;border-radius:3px;background:var(--bg-sunken);margin:4px 0;overflow:hidden}.ow-bar i{display:block;height:100%;background:var(--accent)}
@media (max-width:600px){.ow{padding:12px}.ow-time{columns:1}}
`;

// src/view.ts
var PROFILE_VIEW = "caldera-profile";
var DAY2 = 864e5;
var ymd = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
var hm = (t) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
var esc5 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var SKIP = /^(\.|Caldera\/|templates?\/|_templates\/)/i;
var BRIDGE = `(function(){var P=parent;document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a,[data-open],[data-action]');if(!a||a.hasAttribute('data-invite'))return;
var o=a.getAttribute('data-open'),ac=a.getAttribute('data-action');if(o){e.preventDefault();P.postMessage({caldera:'open',path:o},'*');return}if(ac){e.preventDefault();P.postMessage({caldera:'action',name:ac},'*');return}
var h=a.getAttribute('href');if(!h||h.charAt(0)==='#')return;e.preventDefault();P.postMessage({caldera:/^[a-z][a-z0-9+.-]*:/i.test(h)?'ext':'nav',href:h},'*')},true);
var t;addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){P.postMessage({caldera:'scroll',y:scrollY},'*')},250)});
addEventListener('load',function(){var H=%%HASH%%,Y=%%Y%%;var el=H&&document.getElementById(H);if(el)el.scrollIntoView();else if(Y)scrollTo(0,Y)})})();`;
var ProfileView = class extends import_obsidian5.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mode = "mine";
    this.current = "index.html";
    this.built = null;
    this.owner = "";
    this.scrollY = 0;
    this.timer = null;
    this.busy = false;
    /** Live traffic for the city in My view: polled from the hub (signed in) and posted into the sandboxed page. */
    this.liveTimer = null;
    /** The sky over My view's city follows the owner's real weather (the hub looks it up from this request, stores nothing),
     *  and an owner without live visitors or agent drones yet gets the one-row setup under the city. */
    this.lastLive = null;
    this.wx = null;
  }
  getViewType() {
    return PROFILE_VIEW;
  }
  getDisplayText() {
    return "My profile";
  }
  getIcon() {
    return "user-round";
  }
  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("caldera-profile-view");
    const bar = root.createDiv("caldera-pv-bar");
    const seg = bar.createDiv("caldera-pv-seg");
    const pub = seg.createEl("button", { text: "Public view", attr: { "aria-label": "Your live page on the hub, exactly as visitors see it" } });
    const mine = seg.createEl("button", { text: "Private view", attr: { "aria-label": "Your profile built from your vault, with private sections only you see" } });
    const setMode = (m) => {
      this.mode = m;
      mine.toggleClass("is-on", m === "mine");
      pub.toggleClass("is-on", m === "public");
      this.scrollY = 0;
      void this.show();
    };
    mine.onclick = () => setMode("mine");
    pub.onclick = () => setMode("public");
    mine.addClass("is-on");
    this.status = bar.createSpan({ cls: "caldera-pv-status" });
    const btn = (icon, label, fn) => {
      const b = bar.createEl("button", { cls: "clickable-icon", attr: { "aria-label": label } });
      (0, import_obsidian5.setIcon)(b, icon);
      b.onclick = () => fn();
    };
    btn("refresh-cw", "Refresh", () => this.refresh(true));
    btn("external-link", "Open in browser (signed in as you)", () => this.plugin.settings.handle ? void this.plugin.openProfile(this.current === "index.html" ? "" : this.current) : new import_obsidian5.Notice("Publish your profile first"));
    if (this.plugin.settings.privateUrl) btn("lock", "Open my private web view (Tailscale)", async () => {
      await this.plugin.pushPrivate(false);
      window.open(this.plugin.settings.privateUrl);
    });
    btn("picture-in-picture-2", "Pop out my city (a small window that stays on top)", () => void this.popOut());
    btn("key-round", "Sign in another device (phone, other browser)", () => this.plugin.pairDevice());
    btn("upload-cloud", "Publish now", async () => {
      const u = await this.plugin.publish();
      if (u && this.mode === "public") void this.show();
    });
    this.frame = root.createEl("iframe", { cls: "caldera-pv-frame" });
    this.frame.setAttr("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
    this.frame.setAttr("allow", "fullscreen");
    this.frame.setAttr("allowfullscreen", "true");
    this.registerDomEvent(window, "message", (e) => this.onMessage(e));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      if (leaf === this.leaf) this.markLooked(false);
    }));
    this.markLooked(true);
    await this.refresh(false);
    this.timer = window.setInterval(() => {
      if (this.mode === "mine" && this.contentEl.isShown()) {
        void this.refresh(false);
        void this.pushExtras();
      }
    }, 10 * 6e4);
    this.liveTimer = window.setInterval(() => void this.pushLive(), 1e4);
    this.frame.addEventListener("load", () => window.setTimeout(() => {
      void this.pushLive().then(() => this.pushExtras());
    }, 400));
    let lastPulse = 0;
    this.registerEvent(this.app.vault.on("modify", (f) => {
      if (this.mode !== "mine" || !this.current.startsWith("city.html") || Date.now() - lastPulse < 1500) return;
      lastPulse = Date.now();
      this.frame.contentWindow?.postMessage({ caldera: "note", p: f.path }, "*");
    }));
  }
  async onClose() {
    if (this.timer) window.clearInterval(this.timer);
    if (this.liveTimer) window.clearInterval(this.liveTimer);
  }
  /** Pop the city out into a small window that stays on top (float.ts). My view floats the private city with live traffic;
   *  Public view floats the hub's page. */
  isReady() {
    return !!this.built || this.mode === "public";
  }
  cityMini() {
    return this.built ? this.page("city.html", "").replace(/<head>/i, "<head><script>window.CALDERA_MINI=1<\/script>") : null;
  }
  async popOut() {
    const handle = this.plugin.settings.handle;
    if (this.mode === "mine" && this.built) return this.plugin.floatCity({ html: this.cityMini(), live: true });
    if (!handle) return void new import_obsidian5.Notice("Publish your profile first");
    return this.plugin.floatCity({ src: `${this.plugin.profileUrl()}city.html?caldera=owner#mini` });
  }
  async pushLive() {
    if (this.mode !== "mine" || !this.current.startsWith("city.html") || !this.plugin.settings.traffic?.length || !this.contentEl.isShown()) return;
    try {
      const data = await this.plugin.ownerLive();
      this.lastLive = data;
      this.frame.contentWindow?.postMessage({ caldera: "live", data }, "*");
    } catch {
    }
  }
  async pushExtras() {
    if (this.mode !== "mine" || !this.current.startsWith("city.html") || !this.contentEl.isShown()) return;
    const s = this.plugin.settings, hub = s.hubUrl.replace(/\/$/, "");
    if (!this.wx || Date.now() - this.wx.at > 15 * 6e4) {
      try {
        this.wx = { at: Date.now(), data: await this.plugin.weather() };
      } catch {
        this.wx = { at: Date.now(), data: null };
      }
    }
    const L = this.lastLive, liveOn = !!L && (Object.values(L.today || {}).some((x) => x?.v > 0) || Object.values(L.districts || {}).some((x) => x?.views > 0));
    const agentsOn = !!L && Array.isArray(L.agents) && L.agents.length > 0, sites = (s.traffic || []).map((t) => ({ key: t.key, project: t.project }));
    const owner = s.citySetupDismissed ? null : { liveOff: !liveOn, agentsOff: !agentsOn, hub, sites: liveOn ? [] : sites, agentPrompt: !agentsOn && s.agentKey ? agentSetupPrompt(hub, s.agentKey) : "" };
    this.frame.contentWindow?.postMessage({ caldera: "extras", data: { weather: this.wx?.data || null, owner } }, "*");
  }
  /** "Since you last looked" moves forward when you come back after 30+ minutes away, not on every refresh. */
  markLooked(first) {
    const s = this.plugin.settings, now = Date.now(), last = s.ownerLastLooked ? Date.parse(s.ownerLastLooked) : 0;
    if (first || now - last > 30 * 6e4) {
      this.shownLooked = s.ownerLastLooked;
      s.ownerLastLooked = new Date(now).toISOString();
      void this.plugin.saveSettings();
      if (!first) void this.refresh(false);
    }
  }
  async refresh(loud) {
    if (this.busy) return;
    this.busy = true;
    try {
      this.status.setText("Building from your vault...");
      const { data, text, binaries, cityPrivate } = await this.plugin.build();
      const uris = /* @__PURE__ */ new Map();
      for (const [p, buf] of Object.entries(binaries)) {
        const mime = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : p.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
        uris.set(p, `data:${mime};base64,${b64.enc(new Uint8Array(buf))}`);
      }
      this.built = { text, data, uris, city: cityPrivate?.districts.length ? renderPrivateCity(data, cityPrivate) : void 0 };
      this.owner = renderOwner(await collectOwner(this.app, this.plugin, data, this.shownLooked));
      if (this.plugin.floatSpec?.html) this.plugin.floatCity({ html: this.cityMini(), live: true }, false);
      await this.show();
      if (loud) new import_obsidian5.Notice("Profile refreshed");
    } catch (e) {
      this.status.setText("Couldn't build: " + e.message);
    } finally {
      this.busy = false;
    }
  }
  async show() {
    if (this.mode === "public") {
      if (!this.plugin.settings.handle) {
        this.frame.removeAttribute("src");
        this.frame.srcdoc = `<p style="font-family:sans-serif;padding:24px">Publish your profile to see the public view.</p>`;
        return;
      }
      this.frame.removeAttribute("srcdoc");
      this.frame.src = this.plugin.profileUrl() + this.current + (this.current.includes("?") ? "&" : "?") + "caldera=owner";
      this.status.setText("Live on the hub, as visitors see it");
      return;
    }
    if (!this.built) return;
    this.frame.removeAttribute("src");
    this.frame.srcdoc = this.page(this.current.split("#")[0], this.current.split("#")[1] || "");
    const t = /* @__PURE__ */ new Date();
    this.status.setText(`Private view, built ${hm(t.getTime())}. Private sections are only visible here.`);
  }
  page(path, hash) {
    const { text, uris } = this.built;
    let html = path === "city.html" && this.built.city ? this.built.city : text[path] ?? text["index.html"];
    html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)*(assets\/[\w-]+\.css)">/g, (m, a) => text[a] ? `<style>${text[a]}</style>` : m).replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g, "").replace(/(src|href)="(?:\.\.\/)*([^"#?]+\.(?:png|jpe?g|webp|svg))"/g, (m, k, p) => uris.has(p) ? `${k}="${uris.get(p)}"` : m);
    if (path === "index.html") html = html.replace("<!--caldera:owner-->", this.owner);
    const script = `<script>${BRIDGE.replace("%%HASH%%", JSON.stringify(hash)).replace("%%Y%%", String(hash ? 0 : this.scrollY))}<\/script>`;
    return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  onMessage(e) {
    if (e.source !== this.frame?.contentWindow || !e.data || typeof e.data !== "object") return;
    if (e.data.caldera === "popout") return void this.popOut();
    const d = e.data;
    if (d.caldera === "scroll") {
      this.scrollY = Number(d.y) || 0;
      return;
    }
    if (d.caldera === "setup-dismiss") {
      this.plugin.settings.citySetupDismissed = true;
      void this.plugin.saveSettings();
      return;
    }
    if (d.caldera === "open" && d.path) {
      void this.app.workspace.openLinkText(d.path, "", true);
      return;
    }
    if (d.caldera === "action") {
      if (d.name === "panel") void this.plugin.openPanel();
      if (d.name === "finish-form") this.plugin.openFinish();
      if (d.name === "goals") void this.createGoals();
      if (d.name === "prompt") void this.plugin.copyPrompt("setup");
      if (d.name === "prompt-edit") void this.plugin.copyPrompt("edit");
      if (d.name === "pick-banner" || d.name === "pick-photo") void this.plugin.pickImage(d.name === "pick-banner" ? "banner" : "photo").then((ok) => {
        if (ok) void this.refresh(false);
      });
      if (d.name === "prompt-banner" || d.name === "prompt-photo") void this.plugin.copyImagePrompt(d.name === "prompt-banner" ? "banner" : "photo");
      if (d.name === "settings") this.plugin.openSettings();
      if (d.name === "garden-help") new import_obsidian5.Notice(`Put any note in your "${this.plugin.settings.gardenFolder || "Garden"}" folder, or open a note and run "Caldera: Plant this note in my garden". It goes public on the next publish.`, 12e3);
      return;
    }
    if (d.caldera === "ext" && d.href) {
      const f = d.href.match(/^obsidian:\/\/caldera\?friend=([A-Za-z0-9_-]+)/);
      if (f) return void this.plugin.confirmFriend(f[1]);
      if (/^(https?:|mailto:|sms:)/i.test(d.href)) window.open(d.href);
      return;
    }
    if (d.caldera === "nav" && d.href && this.built) {
      const u = new URL(d.href, "https://profile.local/" + this.current.split("#")[0]);
      let p = decodeURIComponent(u.pathname.slice(1));
      if (!p || p.endsWith("/")) p += "index.html";
      if ((this.built.text[p] !== void 0 || p === "city.html" && this.built.city) && p.endsWith(".html")) {
        this.current = p + (u.hash ? u.hash : "");
        this.scrollY = 0;
        void this.show();
      } else if (this.plugin.settings.handle) window.open(this.plugin.profileUrl() + p);
    }
  }
  async createGoals() {
    const p = "Caldera/Goals.md";
    let f = this.app.vault.getAbstractFileByPath(p);
    if (!f) f = await this.app.vault.create(p, "# Goals\n\nOnly you see these, in the My profile tab. One heading per goal, checkboxes for the steps.\n\n## Example goal\n- [ ] First step\n- [ ] Second step\n");
    if (f instanceof import_obsidian5.TFile) await this.app.workspace.getLeaf(true).openFile(f);
  }
};
async function excerpt(app, f, n = 220) {
  try {
    const t = (await app.vault.cachedRead(f)).replace(/^---[\s\S]*?---\s*/, "");
    const para = t.split(/\n\s*\n/).map((x) => x.replace(/^#+\s.*$/gm, "").trim()).find((x) => x.replace(/[^A-Za-z]/g, "").length > 40 && (x.match(/\|/g) || []).length < 2 && !/^(navigation|nav|tags|source|sources|related|see also|aliases|links?)\s*:/i.test(x) && !/^[-*]?\s*\[\[/.test(x)) || "";
    const clean = para.replace(/!\[\[[^\]]*\]\]/g, "").replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, a, _b, l) => l || a).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^\s*[-*>]\s+/gm, "").replace(/[*_`=~#]/g, "").replace(/\s+/g, " ").trim();
    return clean.length <= n ? clean : clean.slice(0, n).replace(/\s+\S*$/, "") + "\u2026";
  } catch {
    return "";
  }
}
async function collectOwner(app, plugin, data, lastLooked) {
  const now = Date.now(), today = ymd(now), startToday = /* @__PURE__ */ new Date();
  startToday.setHours(0, 0, 0, 0);
  const files = app.vault.getMarkdownFiles().filter((f) => !SKIP.test(f.path));
  const ref = (f, extra = {}) => ({ title: f.basename, path: f.path, ...extra });
  let activity;
  if (plugin.settings.identity && plugin.settings.handle) {
    try {
      activity = await plugin.ownerActivity(lastLooked || new Date(now - DAY2).toISOString());
    } catch (e) {
      activity = { error: e.message };
    }
  }
  const touched = files.filter((f) => f.stat.mtime >= startToday.getTime()).sort((a, b) => b.stat.mtime - a.stat.mtime);
  const d = data.daily?.[data.daily.length - 1];
  const todayRow = d && d.date === today ? d : void 0;
  const counts = todayRow ? Object.fromEntries(Object.entries(todayRow.counts || {}).filter(([, n]) => typeof n === "number")) : void 0;
  const onThisDay = [];
  for (const [days, label] of [[7, "A week ago"], [30, "A month ago"], [91, "Three months ago"], [365, "A year ago"]]) {
    const date = ymd(now - days * DAY2);
    const named = files.filter((f) => f.basename.includes(date)).sort((a, b) => Number(/digest|daily|journal/i.test(b.path)) - Number(/digest|daily|journal/i.test(a.path)));
    const made = files.filter((f) => ymd(f.stat.ctime) === date && !named.includes(f)).sort((a, b) => b.stat.size - a.stat.size);
    const pick = [...named, ...made].slice(0, 2);
    onThisDay.push({ label, date, items: await Promise.all(pick.map(async (f) => ref(f, { excerpt: await excerpt(app, f) }))) });
  }
  const mc = app.metadataCache;
  const near = /* @__PURE__ */ new Set();
  for (const f of touched.slice(0, 40)) {
    for (const t of Object.keys(mc.resolvedLinks[f.path] || {})) near.add(t);
    for (const t of mc.getFileCache(f)?.tags || []) near.add(t.tag);
  }
  const old = files.filter((f) => f.stat.mtime < now - 60 * DAY2 && f.stat.size > 1500 && !/\d{4}-\d{2}-\d{2}/.test(f.basename));
  const scored2 = old.map((f) => {
    const links = Object.keys(mc.resolvedLinks[f.path] || {}), tags = (mc.getFileCache(f)?.tags || []).map((t) => t.tag);
    const shared = [...links.filter((l) => near.has(l)), ...tags.filter((t) => near.has(t))];
    return { f, shared, score: shared.length + (near.has(f.path) ? 3 : 0) };
  });
  const block = Math.floor(now / (3 * 36e5));
  const pool = scored2.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 24);
  const choice = pool.length ? pool[block % pool.length] : scored2.length ? scored2[block * 7919 % scored2.length] : void 0;
  let rediscovered;
  if (choice) {
    const s = choice.shared[0];
    const why = near.has(choice.f.path) ? "You linked to this today." : s ? `Connects to what you worked on today: ${s.startsWith("#") ? s : s.split("/").pop().replace(/\.md$/, "")}.` : `Last changed ${new Date(choice.f.stat.mtime).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.`;
    let ex = await excerpt(app, choice.f, 320), pick = choice;
    for (let k = 1; !ex && k < Math.min(6, pool.length || scored2.length); k++) {
      const alt = pool.length ? pool[(block + k) % pool.length] : scored2[(block * 7919 + k) % scored2.length];
      ex = await excerpt(app, alt.f, 320);
      if (ex) pick = alt;
    }
    const s2 = pick.shared[0];
    const why2 = pick === choice ? why : near.has(pick.f.path) ? "You linked to this today." : s2 ? `Connects to what you worked on today: ${s2.startsWith("#") ? s2 : s2.split("/").pop().replace(/\.md$/, "")}.` : `Last changed ${new Date(pick.f.stat.mtime).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.`;
    rediscovered = { ...ref(pick.f, { excerpt: ex }), why: why2 };
  }
  const patterns = [];
  const daily = data.daily || [];
  const sum = (xs) => xs.reduce((a, x) => a + (Number(x.counts?.notes) || 0), 0);
  const wk = sum(daily.slice(-7)), prev = sum(daily.slice(-14, -7));
  if (wk) patterns.push(`<b>${wk}</b> notes written or changed this week${prev ? `, ${wk >= prev ? "up" : "down"} ${Math.abs(Math.round((wk - prev) / prev * 100))}% on last week` : ""}.`);
  const hours = new Array(24).fill(0);
  for (const f of files) if (f.stat.mtime > now - 30 * DAY2) hours[new Date(f.stat.mtime).getHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  if (hours[peak] > 5) patterns.push(`Most of your writing lands around <b>${peak === 0 ? "midnight" : peak < 12 ? peak + "am" : peak === 12 ? "noon" : peak - 12 + "pm"}</b> (last 30 days).`);
  const tally = (lo, hi) => {
    const m = /* @__PURE__ */ new Map();
    for (const f of files) if (f.stat.mtime > now - hi * DAY2 && f.stat.mtime <= now - lo * DAY2) for (const t of Object.keys(mc.resolvedLinks[f.path] || {})) {
      const name = t.split("/").pop().replace(/\.md$/, "");
      if (/\d{4}-\d{2}-\d{2}/.test(name)) continue;
      m.set(name, (m.get(name) || 0) + 1);
    }
    return m;
  };
  const recent = tally(0, 7), before = tally(7, 35);
  const rising = [...recent].map(([k, n]) => [k, n - (before.get(k) || 0) / 4]).filter(([k, s]) => s >= 2 && (recent.get(k) || 0) >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (rising.length) patterns.push(`Rising this week: ${rising.map(([k]) => `<b>${esc5(k)}</b>`).join(", ")}.`);
  const heat = data.heat || [];
  if (heat.length) {
    let i = heat.length - 1;
    if (heat[i].n === 0) i--;
    let streak = 0;
    while (i >= 0 && heat[i].n > 0) {
      streak++;
      i--;
    }
    if (streak > 1) patterns.push(`<b>${streak}-day</b> streak of writing in your vault.`);
    const best = heat.reduce((a, b) => b.n > a.n ? b : a);
    const last = heat[heat.length - 1];
    if (last.n > 0 && last.n >= best.n) patterns.push(`Today is your <b>busiest day in 6 months</b> (${last.n} notes touched).`);
    else if (best.n) patterns.push(`Your busiest day in 6 months: ${esc5(best.date)} with ${best.n} notes touched. Today: ${last.n}.`);
  }
  let goals = null;
  const gf = app.vault.getAbstractFileByPath("Caldera/Goals.md");
  if (gf instanceof import_obsidian5.TFile) {
    goals = [];
    let cur = null;
    for (const line of (await app.vault.cachedRead(gf)).split("\n")) {
      const h = line.match(/^#{2,3}\s+(.+)/);
      if (h) {
        cur = { heading: h[1].trim(), done: 0, total: 0, open: [] };
        goals.push(cur);
        continue;
      }
      const c = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)/);
      if (!c) continue;
      if (!cur) {
        cur = { heading: "Goals", done: 0, total: 0, open: [] };
        goals.push(cur);
      }
      cur.total++;
      if (c[1] !== " ") cur.done++;
      else cur.open.push(c[2].trim());
    }
    goals = goals.filter((g) => g.total);
  }
  const last14 = (data.daily || []).slice(-14), has = (k) => last14.some((d2) => Number(d2.counts?.[k]) > 0);
  let act = null;
  try {
    const af = plugin.settings.activityFile || "Caldera/activity.json";
    if (await app.vault.adapter.exists(af)) act = JSON.parse(await app.vault.adapter.read(af));
  } catch {
  }
  const cityOn = !!data.city?.districts.length && data.city.kind !== "vault" || await app.vault.adapter.exists("Caldera/city.json");
  const sources = [
    { label: "Daily journal", ok: last14.some((d2) => d2.headline), hint: "a line a day, written by your AI agent from what you did" },
    { label: "Calendar", ok: has("meetings"), hint: "meetings attended (counts only)" },
    { label: "Email", ok: has("emails"), hint: "emails sent (counts only)" },
    { label: "AI usage", ok: has("prompts") || !!data.ai?.total, hint: "prompts and tokens from Claude Code, Codex" },
    { label: "Code", ok: has("commits") || !!data.code?.commits, hint: "commits, or add your GitHub username or Forgejo / Codeberg profile in settings" },
    { label: "Documents", ok: has("docs"), hint: "documents you produced or filed" },
    { label: "City", ok: cityOn, hint: data.city?.kind === "vault" ? "your city is built from your vault folders; add your GitHub username or Forgejo / Codeberg profile in settings to build it from your repos" : "your repos as a city: add your GitHub username or Forgejo / Codeberg profile in settings" },
    { label: "Page text", ok: !!data.summary, hint: "headline, summary, now, timeline" },
    { label: "Garden", ok: !!data.garden?.length, hint: "a few notes grown in public" }
  ];
  const promptOutdated = !!act?.days?.length && (Number(act.prompt_version) || 1) < PROMPT_VERSION;
  const checklist = plugin.settings.handle ? pageChecklist({
    photo: !!data.avatar,
    banner: !!data.banner,
    headline: !!data.headline?.trim(),
    summary: !!data.summary?.trim(),
    links: (data.links || []).length > 0,
    garden: !!data.garden?.length,
    friend: plugin.friends.length > 0 || plugin.social.friends > 0,
    group: (plugin.settings.groups || []).length > 0,
    email: activity && !("error" in activity) && typeof activity.emailConfirmed === "boolean" ? activity.emailConfirmed : !!plugin.settings.summaryEmail
  }) : void 0;
  return {
    sources,
    promptOutdated,
    checklist,
    now: new Date(now).toISOString(),
    lastLooked,
    activity,
    pending: plugin.pending.length,
    today: {
      date: today,
      headline: todayRow?.headline,
      focus: todayRow?.focus,
      wins: todayRow?.wins,
      counts,
      timeline: touched.slice(0, 30).map((f) => ref(f, { time: hm(f.stat.mtime), kind: f.stat.ctime >= startToday.getTime() ? "new" : "edit" }))
    },
    onThisDay,
    rediscovered,
    patterns,
    goals
  };
}

// src/float.ts
var import_obsidian6 = require("obsidian");
var CITY_FLOAT_VIEW = "caldera-city-float";
var W = 420;
var H = 280;
var TITLE = "Caldera city";
var CityFloatView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.frame = null;
    this.liveTimer = null;
  }
  getViewType() {
    return CITY_FLOAT_VIEW;
  }
  getDisplayText() {
    return TITLE;
  }
  getIcon() {
    return "building-2";
  }
  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("caldera-float");
    root.createDiv({ cls: "caldera-float-drag", attr: { "aria-hidden": "true" } });
    this.frame = root.createEl("iframe", { cls: "caldera-float-frame" });
    this.frame.setAttr("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
    this.frame.addEventListener("load", () => window.setTimeout(() => void this.pushLive(), 400));
    this.liveTimer = window.setInterval(() => void this.pushLive(), 1e4);
    this.showSpec(this.plugin.floatSpec);
    let tries = 0;
    const dress = () => {
      const doc = this.containerEl.doc;
      if (this.containerEl.win !== window) {
        doc.body.addClass("caldera-float-window");
        pinWindow();
        return;
      }
      if (++tries < 20) window.setTimeout(dress, 150);
    };
    window.setTimeout(dress, 100);
  }
  /** Show a new build of the city (the My profile tab rebuilds it every 10 minutes). */
  showSpec(spec) {
    if (!this.frame || !spec) return;
    if (spec.html) {
      this.frame.removeAttribute("src");
      this.frame.srcdoc = spec.html;
    } else if (spec.src) {
      this.frame.removeAttribute("srcdoc");
      this.frame.src = spec.src;
    }
  }
  async pushLive() {
    if (!this.frame || !this.plugin.floatSpec?.live || !this.plugin.settings.traffic?.length) return;
    try {
      const data = await this.plugin.ownerLive();
      this.frame.contentWindow?.postMessage({ caldera: "live", data }, "*");
    } catch {
    }
  }
  async onClose() {
    if (this.liveTimer) window.clearInterval(this.liveTimer);
  }
};
function pinWindow() {
  if (!import_obsidian6.Platform.isDesktopApp) return;
  try {
    const remote = window.require("@electron/remote");
    const bw = remote.BrowserWindow.getAllWindows().find((w) => w.getTitle().startsWith(TITLE));
    if (!bw) return;
    const wa = remote.screen.getDisplayMatching(bw.getBounds()).workArea;
    bw.setAlwaysOnTop(true, "floating");
    bw.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true });
    bw.setBounds({ x: wa.x + 12, y: wa.y + wa.height - H - 12, width: W, height: H });
  } catch {
  }
}
var FLOAT_SIZE = { width: W, height: H };

// src/links.ts
var QUICK_LINKS = [
  { label: "GitHub", ph: "your GitHub username", hosts: /(^|\.)github\.com$/i, url: (v) => `https://github.com/${v.replace(/^@/, "")}` },
  { label: "Website", ph: "yoursite.com", hosts: /^$/, url: (v) => `https://${v}` },
  { label: "X", ph: "@handle", hosts: /(^|\.)(x|twitter)\.com$/i, url: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { label: "LinkedIn", ph: "linkedin.com/in/you", hosts: /(^|\.)linkedin\.com$/i, url: (v) => `https://www.linkedin.com/in/${v.replace(/^@/, "").replace(/^in\//, "")}` }
];
function quickLinkUrl(i, raw) {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:\/\//i, "https://");
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && QUICK_LINKS[i].label !== "Website") return "https://" + v.replace(/^www\./, "www.");
  return QUICK_LINKS[i].url(v);
}
var hostOf = (u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};
function quickLinkIndex(label, url) {
  const l = label.trim().toLowerCase(), h = hostOf(url);
  return QUICK_LINKS.findIndex((q2) => q2.label.toLowerCase() === l || q2.label === "X" && l === "twitter" || !!h && q2.hosts.source !== "^$" && q2.hosts.test(h));
}

// src/main.ts
var VIEW = "caldera-panel";
var CalderaPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.pending = [];
    this.sent = [];
    // my requests nobody has answered yet
    this.friends = [];
    this.social = { friends: 0, gravity: 0, credits: 0 };
    this.suggestions = [];
    this.token = null;
    this.timers = [];
    this.unloaded = false;
    // republish shortly after the owner (or their agent) edits Caldera/profile.md or the activity file
    this.publishTimer = null;
    this.lastPublishError = "";
    /** What the floating city shows; open=false only refreshes a window that's already open. */
    this.floatSpec = null;
  }
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new CalderaSettingTab(this.app, this));
    this.registerView(VIEW, (leaf) => new CalderaView(leaf, this));
    this.registerView(PROFILE_VIEW, (leaf) => new ProfileView(leaf, this));
    this.registerView(CITY_FLOAT_VIEW, (leaf) => new CityFloatView(leaf, this));
    this.addRibbonIcon("flame", "Caldera", () => this.openPanel());
    this.addRibbonIcon("user-round", "My Caldera profile", () => this.openProfileTab());
    this.pending = [...this.settings.pendingRequests || []];
    this.registerObsidianProtocolHandler("caldera", (params) => {
      const friend = String(params.friend || "").replace(/^@/, "").toLowerCase();
      if (friend && /^[a-z0-9][a-z0-9-]{1,30}$/.test(friend) && !this.settings.handle && !this.settings.invitedBy) {
        this.settings.invitedBy = friend;
        void this.saveSettings();
      }
      if (params.group) void this.joinGroup(String(params.group));
      if (friend) void this.confirmFriend(friend);
      if (params.open === "private") void this.openPrivate();
      if (params.open === "finish") void this.openProfileTab();
    });
    this.addCommand({ id: "preview", name: "Preview my public profile", callback: () => this.preview() });
    this.addCommand({ id: "publish", name: "Publish my profile", callback: () => this.publish() });
    this.addCommand({ id: "open", name: "Open my public page (as owner)", callback: () => this.openProfile() });
    this.addCommand({ id: "open-private", name: "Open my private view", callback: () => this.openPrivate() });
    this.addCommand({ id: "profile-tab", name: "Open my profile in Obsidian (Public view + Private view)", callback: () => this.openProfileTab() });
    this.addCommand({ id: "pop-city", name: "Pop out my city (small window that stays on top)", callback: () => void this.popCity() });
    this.addCommand({ id: "pair-device", name: "Sign in another device", callback: () => this.pairDevice() });
    this.addCommand({ id: "masthead", name: "Set my masthead (cover image)", callback: () => this.pickImage("banner") });
    this.addCommand({ id: "masthead-prompt", name: "Copy AI prompt: make my masthead", callback: () => this.copyImagePrompt("banner") });
    this.addCommand({ id: "profile-file", name: "Edit my profile (open profile.md)", callback: () => this.openProfileFile() });
    this.addCommand({ id: "edit-prompt", name: "Copy AI prompt: change my profile", callback: () => this.copyPrompt("edit") });
    this.addCommand({ id: "whats-new", name: "What's new", callback: () => this.checkReleases(true) });
    this.addCommand({ id: "guide", name: "Open the guide", callback: () => window.open(this.settings.hubUrl.replace(/\/$/, "") + "/guide.html") });
    this.registerEvent(this.app.metadataCache.on("changed", (f, _d, cache) => {
      if (f.path === PROFILE_FILE) this.queuePublish("profile");
      else if (/^\d{4}-\d{2}-\d{2}$/.test(f.basename) && cache?.frontmatter && Object.keys(cache.frontmatter).some((k) => k.startsWith("caldera_"))) this.queuePublish("activity");
    }));
    this.registerEvent(this.app.vault.on("modify", (f) => {
      if (f.path === this.settings.activityFile) this.queuePublish("activity");
    }));
    this.addCommand({ id: "garden-preview", name: "Preview my garden (what goes public + privacy check)", callback: () => this.previewGarden() });
    this.addCommand({ id: "garden-plant", name: "Plant this note in my garden (make it public)", checkCallback: (check) => {
      const f = this.app.workspace.getActiveFile();
      if (!f || f.extension !== "md") return false;
      if (!check) void this.plantNote(f);
      return true;
    } });
    this.addCommand({ id: "welcome", name: "Set up my profile (welcome)", callback: () => new WelcomeModal(this.app, this).open() });
    this.addCommand({ id: "finish", name: "Finish my page (name, photo, masthead, links, first garden note)", callback: () => this.openFinish() });
    this.addCommand({ id: "export", name: "Export profile to a vault folder (self-host)", callback: () => this.exportToFolder() });
    this.addCommand({ id: "panel", name: "Open friends panel", callback: () => this.openPanel() });
    this.addCommand({ id: "sync", name: "Sync inbox now", callback: () => this.syncInbox(true) });
    this.addCommand({ id: "share", name: "Share this note with a friend", checkCallback: (check) => {
      const f = this.app.workspace.getActiveFile();
      if (!f) return false;
      if (!check) void this.shareNote(f);
      return true;
    } });
    this.addCommand({ id: "delete", name: "Delete my profile from the hub", callback: () => new ConfirmModal(this.app, "Delete your Caldera profile from the hub? Your page, friendships, asks, offers, gravity and credits on the hub are erased. Your vault is not touched.", async () => {
      try {
        await this.send("profile.delete", {});
        new import_obsidian7.Notice("Your Caldera profile was deleted from the hub.");
      } catch (e) {
        new import_obsidian7.Notice(e.message);
      }
    }).open() });
    this.addCommand({ id: "agent-prompt", name: "Copy the AI setup prompt (connects every source; safe to paste again)", callback: () => this.copyPrompt("setup") });
    this.addCommand({ id: "share-page", name: "Share my page (link preview, invite link)", callback: () => this.openShare() });
    this.addCommand({ id: "ask", name: "Post an ask (I could use help with...)", callback: () => new AskModal(this.app, this, "ask").open() });
    this.addCommand({ id: "offer", name: "Post an offer (I can help with...)", callback: () => new AskModal(this.app, this, "offer").open() });
    this.app.workspace.onLayoutReady(() => {
      if (this.settings.openProfileOnStartup) void this.openProfileTab();
      this.schedulePrivatePush();
      if (this.settings.privateWeb) window.setTimeout(() => {
        void this.pushPrivate(false);
      }, 3e4);
      if (this.settings.identity && this.settings.handle) void this.syncInbox(false);
      else if (!this.settings.welcomed) new WelcomeModal(this.app, this).open();
      window.setTimeout(() => {
        void this.checkReleases(false);
      }, 8e3);
      window.setTimeout(() => {
        void this.offerFinish();
      }, 12e3);
      window.setTimeout(() => {
        if (this.settings.identity && this.settings.handle && this.settings.autoPublishHours > 0 && Date.now() - (this.settings.lastPublished || 0) > 6 * 36e5) void this.publish(true);
      }, 2e4);
    });
    this.timers.push(window.setInterval(() => {
      if (this.settings.identity) void this.syncInbox(false);
    }, 10 * 6e4));
    this.scheduleAutoPublish();
  }
  // every repeating timer is cleared on unload: an update or reload must not leave the old code publishing in the background
  onunload() {
    this.timers.forEach((t) => window.clearInterval(t));
    for (const k of ["_auto", "_priv"]) if (this[k]) window.clearInterval(this[k]);
    this.unloaded = true;
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /** Take over a profile that was started with "Sign up with GitHub" on the hub (one-time code from caldera.social/me). */
  async importGithub(code) {
    if (!/^CAL-[\w-]{6,}$/.test(code)) {
      new import_obsidian7.Notice("Paste the code from your account page (it starts with CAL-).");
      return false;
    }
    const go = async () => {
      try {
        const r = await this.api("POST", "/v1/github/claim", { code });
        if (!r?.identity?.id || !r.handle) throw new Error("the hub didn't return the profile");
        if (this.settings.identity && this.settings.identity.id !== r.identity.id) this.settings.previousIdentity = this.settings.identity;
        this.settings.identity = r.identity;
        this.settings.handle = r.handle;
        if (!this.settings.name && r.name) this.settings.name = r.name;
        if (!this.settings.headline && r.headline) this.settings.headline = r.headline;
        await this.saveSettings();
        new import_obsidian7.Notice(`@${r.handle} now lives in this vault. Publishing it from your vault...`);
        const url = await this.publish(true);
        if (url) new import_obsidian7.Notice("Published: " + url);
        return true;
      } catch (e) {
        new import_obsidian7.Notice("Couldn't import: " + e.message);
        return false;
      }
    };
    if (this.settings.identity && this.settings.handle) {
      return new Promise((res) => new ConfirmModal(
        this.app,
        `This vault is already @${this.settings.handle}. Importing switches it to the GitHub profile (your current key is kept in settings as a backup, but @${this.settings.handle} stops updating). Continue?`,
        async () => res(await go()),
        "Import",
        "Switch profiles?"
      ).open());
    }
    return go();
  }
  async ensureIdentity(quiet = false) {
    if (!this.settings.identity) {
      this.settings.identity = newIdentity();
      await this.saveSettings();
      if (!quiet) new import_obsidian7.Notice("Caldera identity created. Export your recovery key from settings and keep it safe.");
    }
    return this.settings.identity;
  }
  scheduleAutoPublish() {
    if (this._auto) window.clearInterval(this._auto);
    const h = this.settings.autoPublishHours;
    if (h > 0) this._auto = window.setInterval(() => {
      void this.publish(true);
    }, h * 36e5);
  }
  // ---------------------------------------------------------------- hub client
  async api(method, path, body, auth = false) {
    const headers = { "content-type": "application/json" };
    if (auth) headers.authorization = "Bearer " + await this.authToken();
    const r = await (0, import_obsidian7.requestUrl)({ url: this.settings.hubUrl.replace(/\/$/, "") + path, method, headers, body: body ? JSON.stringify(body) : void 0, throw: false });
    if (r.status >= 400) throw new Error(r.json?.error || `hub error ${r.status}`);
    return r.json;
  }
  async send(type, body) {
    return this.api("POST", "/v1/envelopes", sign(await this.ensureIdentity(), type, body));
  }
  async authToken() {
    if (this.token && this.token.until > Date.now()) return this.token.value;
    const me = await this.ensureIdentity();
    const { nonce } = await this.api("POST", "/v1/auth/challenge", { id: me.id });
    const { token, expires_in } = await this.api("POST", "/v1/auth/verify", sign(me, "message", { nonce }));
    this.token = { value: token, until: Date.now() + (expires_in - 60) * 1e3 };
    return token;
  }
  // ---------------------------------------------------------------- profile
  /** Link counts are only right once Obsidian has resolved every link (it re-indexes after a restart). */
  /** Wait until Obsidian has indexed every note (so link counts are right), at most 10s. Obsidian has no public
   *  "resolved" flag and the "resolved" event may already have fired, so check the caches directly. */
  linksResolved() {
    const mc = this.app.metadataCache;
    const ready = () => this.app.vault.getMarkdownFiles().every((f) => mc.getFileCache(f));
    if (ready()) return Promise.resolve();
    return new Promise((r) => {
      const t0 = Date.now();
      const tick = window.setInterval(() => {
        if (ready() || Date.now() - t0 > 1e4) {
          window.clearInterval(tick);
          r();
        }
      }, 250);
    });
  }
  async build() {
    await this.linksResolved();
    const eff = effectiveSettings(this.app, this.settings);
    const { data, files, gardenReport, cityPrivate } = await collectProfile(this.app, eff, eff.sections.social ? this.social : void 0);
    data.hub = this.settings.hubUrl;
    data.id = this.settings.identity?.id;
    const text = renderProfile(data);
    return { data, text, binaries: files, eff, gardenReport, cityPrivate };
  }
  async openProfileFile() {
    const f = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
    await this.app.workspace.getLeaf(true).openFile(f);
  }
  queuePublish(reason) {
    if (!this.settings.identity || !this.settings.handle) return;
    if (this.publishTimer) window.clearTimeout(this.publishTimer);
    this.publishTimer = window.setTimeout(() => {
      this.publishTimer = null;
      void this.publish(true).then((url) => {
        if (url && reason === "profile") new import_obsidian7.Notice("Caldera: your public page was updated.");
      });
    }, 45e3);
  }
  // What's new: the hub's release feed, shown only to the owner, inside Obsidian
  async checkReleases(manual = false) {
    try {
      const r = await (0, import_obsidian7.requestUrl)({ url: this.settings.hubUrl.replace(/\/$/, "") + "/releases.json", throw: false });
      const list = r.status === 200 ? r.json?.releases || [] : [];
      if (!list.length) {
        if (manual) new import_obsidian7.Notice("Couldn't load release notes.");
        return;
      }
      const seen = list.findIndex((x) => x.version === this.settings.lastSeenRelease);
      if (!this.settings.lastSeenRelease && !manual) {
        this.settings.lastSeenRelease = list[0].version;
        await this.saveSettings();
        return;
      }
      const unseen = manual ? list.slice(0, 3) : list.slice(0, seen === -1 ? 1 : seen);
      if (!unseen.length) return;
      const open3 = () => {
        new WhatsNewModal(this.app, this, unseen).open();
        this.settings.lastSeenRelease = list[0].version;
        void this.saveSettings();
      };
      if (manual) return open3();
      const frag = createFragment((f) => {
        f.createEl("b", { text: `Caldera ${unseen[0].version}: ` });
        f.appendText(unseen[0].title + " ");
        f.createEl("u", { text: "See what's new" });
      });
      const n = new import_obsidian7.Notice(frag, 2e4);
      n.noticeEl.addEventListener("click", open3);
    } catch {
      if (manual) new import_obsidian7.Notice("Couldn't load release notes.");
    }
  }
  async preview() {
    const { text, binaries } = await this.build();
    let html = text["index.html"].replace('<link rel="stylesheet" href="assets/theme.css">', `<style>${text["assets/theme.css"]}</style>`).replace('<link rel="stylesheet" href="assets/profile.css">', `<style>${text["assets/profile.css"]}</style>`);
    for (const [p, buf] of Object.entries(binaries)) {
      const mime = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg";
      html = html.split(`src="${p}"`).join(`src="data:${mime};base64,${b64.enc(new Uint8Array(buf))}"`);
    }
    new PreviewModal(this.app, html).open();
  }
  async copyPrompt(kind) {
    const a = this.app.vault.adapter;
    const hub = this.settings.hubUrl.replace(/\/$/, "");
    const extras = this.settings.agentKey ? `
My agent hook (only if I say yes above), exactly as Caldera gave it to me:

${agentSetupPrompt(hub, this.settings.agentKey)}` : "";
    const text = (kind === "edit" ? editPrompt : agentPrompt)({
      extras,
      vaultPath: a instanceof import_obsidian7.FileSystemAdapter ? a.getBasePath() : void 0,
      hubUrl: this.settings.hubUrl,
      handle: this.settings.handle || void 0,
      activityFile: this.settings.activityFile,
      publicTopics: this.settings.publicTopics.map((t) => t[0]),
      installed: true
    });
    try {
      await navigator.clipboard.writeText(text);
      new import_obsidian7.Notice(kind === "edit" ? "Prompt copied. Paste it into your AI agent." : "Setup prompt copied. Paste it into Claude Code, Codex or Cursor: it connects every source it can find, keeps it fresh, and asks before anything goes public.", 8e3);
    } catch {
      new PromptModal(this.app, text).open();
    }
  }
  async publish(quiet = false) {
    if (this.unloaded) return null;
    this.lastPublishError = "";
    try {
      if (!this.settings.handle) throw new Error("Set a handle in Caldera settings first");
      const me = await this.ensureIdentity();
      const { data, text, binaries, eff, cityPrivate } = await this.build();
      const manifest = sign(me, "profile.manifest", {
        name: data.name,
        handle: this.settings.handle,
        boxKey: me.boxPublic,
        headline: data.headline || "",
        photos: { avatar: data.avatar, banner: data.banner },
        links: data.links,
        sections: Object.keys(data.sections).filter((k) => data.sections[k]),
        stats: data.stats,
        daily: data.daily.map((d) => ({ date: d.date, score: activityScore(d.counts), headline: d.headline || "", counts: d.counts })),
        topics: data.topics,
        asks: data.asks,
        offers: data.offers,
        listed: eff.listed !== false,
        showViews: this.settings.showViews !== false,
        page: "index.html",
        updated: data.updated,
        // the garden: every public note with its stage, license and a sha256 of the published text, signed with the profile
        garden: data.garden?.length && eff.sections.garden !== false ? gardenManifest(data.garden) : void 0,
        gardenUrl: data.gardenExternal,
        groups: groupsFrom((this.settings.groups || []).join(",")),
        languages: data.code?.languages?.slice(0, 6) || [],
        invitedBy: this.settings.invitedBy || void 0
        // the hub only uses it on a profile's first publish
      });
      const files = {};
      for (const [p, t] of Object.entries(text)) files[p] = b64.enc(new TextEncoder().encode(t));
      for (const [p, b] of Object.entries(binaries)) files[p] = b64.enc(new Uint8Array(b));
      await this.api("POST", `/v1/profiles/${encodeURIComponent(me.id)}/bundle`, { manifest, files, v: this.manifest.version });
      this.settings.lastPublished = Date.now();
      await this.saveSettings();
      if (this.settings.privateWeb) void this.pushPrivate(false);
      void this.syncSites(cityPrivate, data.city?.districts.map((d) => d.name) || []);
      const url = this.profileUrl();
      if (!quiet) new import_obsidian7.Notice(`Published: ${url}`);
      if (!this.settings.sharePrompted && this.settings.welcomed) {
        this.settings.sharePrompted = true;
        await this.saveSettings();
        window.setTimeout(() => this.openShare(), 1500);
      }
      return url;
    } catch (e) {
      this.lastPublishError = e.message;
      if (!quiet) new import_obsidian7.Notice("Caldera publish failed: " + e.message);
      else console.warn("Caldera publish failed:", e.message);
      return null;
    }
  }
  async previewGarden() {
    const { gardenReport, eff } = await this.build();
    new GardenPreviewModal(this.app, gardenReport, eff.gardenFolder ?? "Garden", this.settings.handle ? `${this.profileUrl()}garden.html` : "").open();
  }
  /** Opt a note into the garden: caldera: garden + stage + license (only fills what is missing). */
  async plantNote(f) {
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      fm.caldera = "garden";
      if (!fm.stage) fm.stage = "seedling";
      if (!fm.license) fm.license = "all-rights";
    });
    new import_obsidian7.Notice(`"${f.basename}" is now in your garden as a seedling. It goes public on the next publish; run "Preview my garden" to check it first.`);
  }
  profileUrl() {
    return `${this.settings.hubUrl.replace(/\/$/, "")}/@${this.settings.handle}/`;
  }
  /** Open the public page in the browser signed in as its owner (a one-time link sets an owner cookie on the hub), so the
   *  page shows a "Private view" button instead of the sign-up pitch, and the owner's own visits aren't counted. */
  async openProfile(sub = "") {
    if (!this.settings.handle || !this.settings.identity) return void new WelcomeModal(this.app, this).open();
    try {
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(this.settings.identity.id)}/link`, {}, true);
      if (r?.url) return void window.open(sub ? `${r.url}&to=${encodeURIComponent(sub)}` : r.url);
    } catch (e) {
      console.warn("Caldera owner link failed:", e.message);
    }
    window.open(this.profileUrl() + sub);
  }
  /** Approve a sign-in code shown on another device (caldera.social/signin): that browser becomes the owner's. */
  pairDevice() {
    if (!this.settings.identity || !this.settings.handle) return void new import_obsidian7.Notice("Publish your profile first.");
    new PairModal(this.app, async (code) => {
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(this.settings.identity.id)}/pair`, { code }, true);
      new import_obsidian7.Notice(`Signed in. That device now shows the Private view button on @${r.handle || this.settings.handle}.`, 8e3);
    }, this.profileUrl()).open();
  }
  /** Write the setup form into Caldera/profile.md: name, headline, listed, chosen images (saved as Caldera/photo|banner.ext),
   *  the four quick links (replacing only those, keeping every other link), and plant a first garden note. */
  async applyProfileForm(f) {
    const v = this.app.vault, paths = {};
    for (const kind of ["photo", "banner"]) {
      const im = f.images[kind];
      if (!im) continue;
      if (!v.getAbstractFileByPath("Caldera")) await v.createFolder("Caldera").catch(() => {
      });
      const path = (0, import_obsidian7.normalizePath)(`Caldera/${kind}.${im.ext}`), old = v.getAbstractFileByPath(path);
      if (old instanceof import_obsidian7.TFile) await v.modifyBinary(old, im.buf);
      else await v.createBinary(path, im.buf);
      paths[kind] = path;
    }
    const pf = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
    await this.app.fileManager.processFrontMatter(pf, (fm) => {
      fm.name = f.name;
      fm.headline = f.headline;
      fm.listed = f.listed;
      if (paths.photo) fm.photo = paths.photo;
      if (paths.banner) fm.banner = paths.banner;
      const old = Array.isArray(fm.links) ? fm.links.map(String) : [];
      const keep = old.filter((l) => {
        const [a = "", ...b] = l.split("|");
        return quickLinkIndex(a, b.join("|").trim()) < 0;
      });
      fm.links = [...f.links.filter(([, u]) => u).map(([l, u]) => `${l} | ${u}`), ...keep];
    });
    if (f.plant) await this.plantNote(f.plant);
  }
  openSettings() {
    const st = this.app.setting;
    if (!st) return;
    st.open();
    st.openTabById?.(this.manifest.id);
  }
  /** Copy a focused prompt that has the owner's AI agent set a masthead or profile photo. */
  async copyImagePrompt(kind) {
    const a = this.app.vault.adapter;
    const text = imagePrompt(kind, { vaultPath: a instanceof import_obsidian7.FileSystemAdapter ? a.getBasePath() : void 0, hubUrl: this.settings.hubUrl, handle: this.settings.handle || void 0 });
    try {
      await navigator.clipboard.writeText(text);
      new import_obsidian7.Notice(`Prompt copied. Paste it into your AI agent: it sets your ${kind === "banner" ? "masthead" : "photo"} and the page republishes itself.`, 8e3);
    } catch {
      new PromptModal(this.app, text).open();
    }
  }
  /** Choose an image from disk: copied into the vault as Caldera/<kind>.<ext>, set in Caldera/profile.md (which republishes). */
  pickImage(kind) {
    return new Promise((done) => new ImagePickModal(this.app, kind, async (buf, ext) => {
      const path = (0, import_obsidian7.normalizePath)(`Caldera/${kind}.${ext}`), v = this.app.vault;
      if (!v.getAbstractFileByPath("Caldera")) await v.createFolder("Caldera").catch(() => {
      });
      const old = v.getAbstractFileByPath(path);
      if (old instanceof import_obsidian7.TFile) await v.modifyBinary(old, buf);
      else await v.createBinary(path, buf);
      const pf = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
      await this.app.fileManager.processFrontMatter(pf, (fm) => {
        fm[kind === "banner" ? "banner" : "photo"] = path;
      });
      new import_obsidian7.Notice(`${kind === "banner" ? "Masthead" : "Photo"} set. Your page republishes in about a minute.`);
      done(true);
    }, () => done(false)).open());
  }
  /** The private view: the Tailscale web address when this hub gives you one, otherwise My view inside Obsidian. */
  async openPrivate() {
    if (this.settings.privateUrl) {
      void this.pushPrivate(false);
      return void window.open(this.settings.privateUrl);
    }
    await this.openProfileTab();
  }
  async exportToFolder() {
    const { text, binaries } = await this.build();
    const root = "Caldera/site";
    for (const [p, t] of Object.entries(text)) await this.write(`${root}/${p}`, t);
    for (const [p, b] of Object.entries(binaries)) await this.writeBinary(`${root}/${p}`, b);
    new import_obsidian7.Notice(`Exported to ${root}. Upload that folder to any static host.`);
  }
  // ---------------------------------------------------------------- inbox
  /** Add friend / Accept tapped on caldera.social while signed in: the hub queues it (it never holds this vault's key);
   *  this signs and sends it, and the hub clears the queue entry when the request or acceptance lands. */
  async sendQueuedFriends(myId) {
    let list = [];
    try {
      list = (await this.api("GET", `/v1/owner/${encodeURIComponent(myId)}/intents`, void 0, true))?.intents || [];
    } catch {
      return;
    }
    const done = [];
    for (const x of list.slice(0, 20)) {
      try {
        if (x.kind === "accept" && x.request) await this.send("friend.accept", { request: x.request, to: x.id });
        else await this.send("friend.request", { to: x.id, note: "" });
        done.push((x.kind === "accept" ? "accepted @" : "sent a request to @") + (x.handle || "someone"));
      } catch (e) {
        console.warn("Caldera queued friend failed:", e?.message);
      }
    }
    if (done.length) new import_obsidian7.Notice(`Caldera: from your taps on the web, ${done.join(", ")}.`, 8e3);
  }
  async syncInbox(loud) {
    try {
      const me = await this.ensureIdentity();
      const [{ envelopes }, fr, gr, cr, rq] = await Promise.all([
        this.api("GET", `/v1/inbox/${encodeURIComponent(me.id)}?since=${encodeURIComponent(this.settings.lastInboxSync)}`, void 0, true),
        this.api("GET", `/v1/friends/${encodeURIComponent(me.id)}`),
        this.api("GET", `/v1/gravity/${encodeURIComponent(me.id)}`),
        this.api("GET", `/v1/credits/${encodeURIComponent(me.id)}`),
        this.api("GET", `/v1/requests/${encodeURIComponent(me.id)}`, void 0, true).catch(() => null)
      ]);
      this.friends = fr.friends;
      this.social = { friends: fr.friends.length, gravity: gr.gravity, credits: cr.balance };
      await this.sendQueuedFriends(me.id);
      let cards = 0;
      for (const e of envelopes) {
        if (!verify(e)) continue;
        if (!rq && e.type === "friend.request" && !this.friends.some((f) => f.id === e.from) && !this.pending.some((x) => x.from === e.from)) {
          let handle;
          try {
            handle = (await this.api("GET", `/v1/profiles/${encodeURIComponent(e.from)}`)).handle;
          } catch {
          }
          this.pending.push({ request: envelopeHash(e), from: e.from, handle, note: e.body.note, ts: e.ts });
          new import_obsidian7.Notice(`Caldera: friend request from ${handle ? "@" + handle : "someone new"}. Open the Caldera panel to accept.`);
        }
        if (e.type === "friend.accept") {
          const f = this.friends.find((x) => x.id === e.from);
          new import_obsidian7.Notice(`Caldera: ${f?.handle ? "@" + f.handle : "someone"} accepted your friend request`);
        }
        if (e.type === "gravity") new import_obsidian7.Notice(`Caldera: someone gave you gravity${e.body.reason ? ': "' + e.body.reason + '"' : ""}`);
        if (e.type === "card") {
          if (await this.receiveCard(e)) cards++;
        }
        if (e.ts > this.settings.lastInboxSync) this.settings.lastInboxSync = e.ts;
      }
      if (rq) {
        const ignored = new Set(this.settings.ignoredRequests || []), seen = new Set(this.settings.seenRequests || []);
        this.pending = rq.incoming.filter((r) => !ignored.has(r.request)).map((r) => ({ request: r.request, from: r.id, handle: r.handle || void 0, note: r.note || void 0, ts: r.ts }));
        this.sent = rq.outgoing.map((r) => ({ request: r.request, from: r.id, handle: r.handle || void 0, note: r.note || void 0, ts: r.ts }));
        const fresh = this.pending.filter((x) => !seen.has(x.request));
        if (fresh.length) new import_obsidian7.Notice(`Caldera: friend request from ${fresh.map((x) => x.handle ? "@" + x.handle : "someone new").join(", ")}. Open the Caldera panel to accept.`, 1e4);
        this.settings.seenRequests = this.pending.map((x) => x.request);
      }
      this.pending = this.pending.filter((x) => !this.friends.some((f) => f.id === x.from));
      this.settings.pendingRequests = this.pending;
      await this.saveSettings();
      if (this.settings.handle) {
        try {
          this.suggestions = (await this.api("GET", `/v1/suggest/${encodeURIComponent(me.id)}?n=4`)).suggestions || [];
        } catch {
        }
        void this.welcomeNewMembers();
        void this.attention();
        void this.kudosNews();
      }
      this.refreshPanel();
      if (loud || cards) new import_obsidian7.Notice(`Caldera: inbox synced${cards ? `, ${cards} shared note(s) received` : ""}`);
    } catch (e) {
      if (loud) new import_obsidian7.Notice("Caldera sync failed: " + e.message);
    }
  }
  async receiveCard(e) {
    const me = this.settings.identity;
    const sealed = e.body.payload?.[me.id];
    const sender = this.friends.find((f) => f.id === e.from);
    if (!sealed || !sender?.box_key) return false;
    const text = open(sealed, sender.box_key, me);
    if (text === null) return false;
    const who = sender.handle || e.from.slice(4, 12);
    const safe = String(e.body.title || "Shared note").replace(/[\\/:*?"<>|#^[\]]/g, " ").trim().slice(0, 80);
    const fm = `---
caldera_from: "${who}"
caldera_card: "${e.body.id}"
caldera_version: ${Number(e.body.version) || 1}
caldera_received: ${e.ts}
---
`;
    await this.write(`${this.settings.inboxFolder}/${who}/${safe}.md`, fm + text.replace(/^---[\s\S]*?---\s*/, ""));
    return true;
  }
  async acceptFriend(p) {
    try {
      await this.send("friend.accept", { request: p.request, to: p.from });
    } catch (e) {
      return void new import_obsidian7.Notice("Couldn't accept: " + e.message);
    }
    this.pending = this.pending.filter((x) => x !== p);
    this.settings.pendingRequests = this.pending;
    await this.syncInbox(false);
    new import_obsidian7.Notice(`You and ${p.handle ? "@" + p.handle : "your new friend"} are now friends`);
  }
  async ignoreFriend(p) {
    this.settings.ignoredRequests = [...this.settings.ignoredRequests || [], p.request].slice(-200);
    this.pending = this.pending.filter((x) => x !== p);
    this.settings.pendingRequests = this.pending;
    await this.saveSettings();
    this.refreshPanel();
  }
  /** Join a group (obsidian://caldera?group=): it goes into the next publish, and the group's town lists this profile. */
  async joinGroup(raw) {
    const g = groupsFrom(raw)[0];
    if (!g) return;
    if ((this.settings.groups || []).includes(g)) return void new import_obsidian7.Notice(`You're already in ${g}.`);
    this.settings.groups = [...this.settings.groups || [], g];
    await this.saveSettings();
    if (!this.settings.identity || !this.settings.handle) return void new import_obsidian7.Notice(`You'll join ${g} when you publish your profile.`);
    const url = await this.publish(true);
    new import_obsidian7.Notice(url ? `You joined ${g}. Your city is on ${this.settings.hubUrl.replace(/\/$/, "")}/g/${g}` : `Saved: you'll join ${g} on the next publish.`);
  }
  openFinish() {
    new WelcomeModal(this.app, this, this.settings.handle && this.settings.identity ? "finish" : "welcome").open();
  }
  /** Existing profiles with a bare page (no photo, headline or links): offer the setup form once. */
  async offerFinish() {
    const s = this.settings;
    if (!s.identity || !s.handle || !s.welcomed || s.finishOffered || this.unloaded) return;
    const e = effectiveSettings(this.app, s);
    if (e.avatarPath && e.headline?.trim() && (e.links || []).length) return;
    s.finishOffered = true;
    await this.saveSettings();
    new ConfirmModal(this.app, "Your page is live, but it's still bare. Add a photo, a masthead, a headline and a few links in about a minute - no AI needed.", () => this.openFinish(), "Finish my page", "Finish your page").open();
  }
  openShare() {
    if (!this.settings.handle) return void new WelcomeModal(this.app, this).open();
    new ShareModal(this.app, this).open();
  }
  /** Daily summary email: the hub sends a confirmation link first. Empty turns it off. */
  async setSummaryEmail(email) {
    try {
      const me = await this.ensureIdentity();
      if (!this.settings.handle) throw new Error("Publish your profile first");
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/email`, { email: email || null }, true);
      this.settings.summaryEmail = email;
      await this.saveSettings();
      new import_obsidian7.Notice(r.off ? "Daily summary emails are off." : r.message || "Check your inbox for a confirmation link.", 8e3);
    } catch (e) {
      new import_obsidian7.Notice("Couldn't save: " + e.message);
    }
  }
  /** At most once a day: if people looked at the page, linked to it or befriended you, say so (click: share it). */
  async attention() {
    const s = this.settings, today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (s.lastAttention?.slice(0, 10) === today) return;
    try {
      const since = s.lastAttention || new Date(Date.now() - 7 * 864e5).toISOString();
      const a = await this.ownerActivity(since);
      s.lastAttention = (/* @__PURE__ */ new Date()).toISOString();
      await this.saveSettings();
      const bits = [], n = (x, one, many = one + "s") => `${x} ${x === 1 ? one : many}`;
      if (a.visitors) bits.push(n(a.visitors, "visitor"));
      if (a.friends?.length) bits.push(n(a.friends.length, "new friend"));
      if (a.gravity?.length) bits.push(n(a.gravity.length, "gift of gravity", "gifts of gravity"));
      if (a.links?.length) bits.push(n(a.links.length, "link into your garden", "links into your garden"));
      if (!bits.length) return;
      const days = Math.max(1, Math.round((Date.now() - Date.parse(since)) / 864e5));
      const frag = createFragment((f) => {
        f.createEl("b", { text: `Caldera, ${days >= 6 ? "this week" : days === 1 ? "since yesterday" : `last ${days} days`}: ` });
        f.appendText(bits.join(", ") + ". ");
        f.createEl("u", { text: "Share your page" });
      });
      const note = new import_obsidian7.Notice(frag, 15e3);
      note.noticeEl.addEventListener("click", () => this.openShare());
    } catch {
    }
  }
  /** New kudos since the last sync: a Notice per batch (who sent what). */
  async kudosNews() {
    const s = this.settings, me = s.identity;
    if (!me || !s.handle) return;
    try {
      const since = s.lastKudos || new Date(Date.now() - 864e5).toISOString();
      const r = await this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/kudos?since=${encodeURIComponent(since)}`, void 0, true);
      const list = r.kudos || [];
      if (!list.length) return;
      s.lastKudos = list[0].ts;
      await this.saveSettings();
      const who = list.slice(0, 3).map((k) => `${k.emoji} ${k.from ? "@" + k.from : "someone"}`).join(", ");
      new import_obsidian7.Notice(`Caldera: kudos from ${who}${list.length > 3 ? ` and ${list.length - 3} more` : ""}`, 12e3);
    } catch {
    }
  }
  /** Send someone kudos from Obsidian (one per person per day). */
  async sendKudos(handle, kind) {
    const me = this.settings.identity;
    if (!me || !this.settings.handle) return void new import_obsidian7.Notice("Publish your page first.");
    try {
      await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/kudos`, { to: handle, kind }, true);
      new import_obsidian7.Notice(`Kudos sent to @${handle}`);
    } catch (e) {
      new import_obsidian7.Notice(e.message);
    }
  }
  /** Community hosts: a friend request (with a note) to each person who joins after the option was turned on. */
  async welcomeNewMembers() {
    const s = this.settings;
    if (!s.welcomeNew || !s.identity || !s.handle) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), day = s.welcomeDay?.[0] === today ? s.welcomeDay[1] : 0;
    if (day >= 10) return;
    try {
      const since = s.welcomeSince || (/* @__PURE__ */ new Date()).toISOString(), sent = new Set(s.welcomeSent || []);
      const skip = /* @__PURE__ */ new Set([s.identity.id, ...this.friends.map((f) => f.id), ...this.pending.map((p) => p.from), ...this.sent.map((p) => p.from)]);
      const dir = await this.api("GET", "/v1/directory?sort=new");
      let n = day;
      for (const p of dir.profiles || []) {
        if (n >= 10 || String(p.created) <= since) break;
        const pr = await this.api("GET", `/v1/profiles/${encodeURIComponent(p.handle)}`);
        if (skip.has(pr.id) || sent.has(pr.id)) continue;
        await this.send("friend.request", { to: pr.id, note: (s.welcomeNote || WELCOME_NOTE).slice(0, 200) });
        sent.add(pr.id);
        n++;
      }
      s.welcomeSent = [...sent].slice(-500);
      s.welcomeDay = [today, n];
      await this.saveSettings();
    } catch (e) {
      console.warn("Caldera welcome:", e.message);
    }
  }
  /** "Add as friend" from a profile page (obsidian://caldera?friend=) or the My profile tab: confirm, then request. */
  async confirmFriend(raw) {
    const h = raw.replace(/^@/, "").trim();
    if (!/^[a-z0-9_-]{1,40}$/i.test(h)) return;
    if (!this.settings.identity || !this.settings.handle) {
      new import_obsidian7.Notice(`Publish your Caldera profile first, then click "Add @${h} as a friend" again.`);
      return void new WelcomeModal(this.app, this).open();
    }
    if (h.toLowerCase() === this.settings.handle.toLowerCase()) return void new import_obsidian7.Notice("That's your own profile. Share your invite link from the Caldera panel instead.");
    new ConfirmModal(this.app, `Send @${h} a friend request? Once they accept, you can share notes end-to-end encrypted and give each other gravity.`, async () => {
      try {
        await this.requestFriend(h);
      } catch (e) {
        new import_obsidian7.Notice(e.message);
      }
    }, "Send request", "Add a friend").open();
  }
  /** Live traffic: one site key per city district, registered with the hub (which hands back each site's server key). */
  async syncSites(city, publicNames) {
    if (!city?.districts.length || !this.settings.identity) return;
    try {
      const have = new Map((this.settings.traffic || []).map((t) => [t.project, t.key]));
      const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("") + Date.now().toString(36).slice(-4);
      const sites = city.districts.filter((d) => d.name && d.name !== "Private").map((d) => ({ key: have.get(d.name) || rnd(), project: d.name, public: publicNames.includes(d.name) }));
      const me = await this.ensureIdentity();
      const repos = {};
      for (const d of city.districts) for (const rp of d.repos || []) if (rp.name) repos[await sha16(rp.name.toLowerCase())] = d.name;
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/sites`, { sites, repos }, true);
      if (Array.isArray(r.sites)) {
        this.settings.traffic = r.sites;
        if (r.agent?.key) this.settings.agentKey = r.agent;
        await this.saveSettings();
      }
    } catch (e) {
      console.warn("Caldera live-traffic sites:", e.message);
    }
  }
  /** The weather where this computer is (the hub looks it up from this request and keeps nothing), for the city's sky. */
  async weather() {
    return this.api("GET", "/v1/weather");
  }
  async ownerLive() {
    const me = await this.ensureIdentity();
    return this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/live`, void 0, true);
  }
  /** Private activity for the My view tab: visits, gravity, friends, links in. Signed in with the vault's key. */
  async ownerActivity(since) {
    const me = await this.ensureIdentity();
    return this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/activity?since=${encodeURIComponent(since)}`, void 0, true);
  }
  /** Private web address (Tailscale): push the owner layer, encrypted at rest on the hub, served only to the owner's tailnet login. */
  async pushPrivate(loud = false) {
    if (this.unloaded || !this.settings.privateWeb || !this.settings.identity || !this.settings.handle) return null;
    try {
      const { data, cityPrivate } = await this.build();
      const vault = encodeURIComponent(this.app.vault.getName());
      const pages = {};
      if (cityPrivate?.districts.length) pages["city.html"] = renderPrivateCity(data, cityPrivate, `obsidian://open?vault=${vault}&file=`);
      const html = renderOwner(await collectOwner(this.app, this, data, this.settings.ownerLastLooked)).replace(/href="#"((?: [\w-]+="[^"]*")*?) data-open="([^"]*)"/g, (_m, attrs, p) => `${attrs.trim()} href="obsidian://open?vault=${vault}&amp;file=${encodeURIComponent(p.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))}" target="_blank" rel="noopener"`).replace(/<a href="#"[^>]*data-action="[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1").replace("Built from your vault inside Obsidian. None of it is published.", "Pushed from your vault. Only your Tailscale account can see this page.");
      const me = await this.ensureIdentity();
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/private`, { html, pages, built: (/* @__PURE__ */ new Date()).toISOString(), v: this.manifest.version }, true);
      if (r.url && r.url !== this.settings.privateUrl) {
        this.settings.privateUrl = r.url;
        await this.saveSettings();
      }
      if (loud) new import_obsidian7.Notice("Private view pushed. Open it on any of your Tailscale devices: " + r.url);
      return r.url;
    } catch (e) {
      if (loud) new import_obsidian7.Notice("Couldn't push the private view: " + e.message);
      else console.warn("Caldera private push failed:", e.message);
      return null;
    }
  }
  schedulePrivatePush() {
    if (this._priv) window.clearInterval(this._priv);
    if (this.settings.privateWeb) this._priv = window.setInterval(() => {
      void this.pushPrivate(false);
    }, 10 * 6e4);
  }
  /** The city in a small always-on-top window: needs the My profile tab (it builds the city), so open it first if needed. */
  async popCity() {
    await this.openProfileTab();
    const v = this.app.workspace.getLeavesOfType(PROFILE_VIEW)[0]?.view;
    if (!v?.popOut) return;
    for (let i = 0; i < 40 && !v.isReady?.(); i++) await new Promise((r) => window.setTimeout(r, 100));
    await v.popOut();
  }
  async floatCity(spec, open3 = true) {
    this.floatSpec = spec;
    const leaf = this.app.workspace.getLeavesOfType(CITY_FLOAT_VIEW)[0];
    if (leaf) {
      leaf.view.showSpec(spec);
      if (open3) leaf.view.containerEl.win.focus();
      return;
    }
    if (!open3) return;
    const pop = this.app.workspace.openPopoutLeaf({ size: FLOAT_SIZE });
    await pop.setViewState({ type: CITY_FLOAT_VIEW, active: true });
  }
  async openProfileTab() {
    const ws = this.app.workspace;
    const existing = ws.getLeavesOfType(PROFILE_VIEW)[0];
    if (existing) return void ws.revealLeaf(existing);
    const leaf = ws.getLeaf("tab");
    await leaf.setViewState({ type: PROFILE_VIEW, active: true });
    ws.revealLeaf(leaf);
  }
  async requestFriend(handleOrId, note = "") {
    const h = handleOrId.trim().replace(/^https?:\/\/[^/]+\/@?/, "").replace(/[/?#].*$/, "").replace(/^@/, "");
    if (!h) throw new Error("Enter a handle, like @orion, or their profile link");
    const pr = await this.api("GET", `/v1/profiles/${encodeURIComponent(h)}`);
    if (pr.id === this.settings.identity?.id) throw new Error("That's your own profile");
    if (this.friends.some((f) => f.id === pr.id)) throw new Error(`You're already friends with @${pr.handle}`);
    await this.send("friend.request", { to: pr.id, note });
    new import_obsidian7.Notice(`Friend request sent to @${pr.handle || pr.id}. You'll be friends once they accept.`);
    await this.syncInbox(false);
  }
  async giveGravity(f, reason) {
    const r = await this.send("gravity", { to: f.id, reason: reason.slice(0, 140) });
    new import_obsidian7.Notice(`Gravity sent. @${f.handle || "friend"} now has ${r.gravity}`);
  }
  async shareNote(file) {
    if (!this.friends.length) await this.syncInbox(false);
    if (!this.friends.length) return new import_obsidian7.Notice("Add a friend first (Caldera panel)");
    new FriendPicker(this.app, this.friends, async (f) => {
      if (!f.box_key) return new import_obsidian7.Notice("That friend has not published a profile yet");
      const me = await this.ensureIdentity();
      const text = await this.app.vault.read(file);
      const version = Date.now();
      await this.send("card", {
        id: "card_" + b58encode(new TextEncoder().encode(file.path)).slice(0, 20),
        title: file.basename,
        to: [f.id],
        payload: { [f.id]: seal(text, f.box_key, me) },
        version
      });
      new import_obsidian7.Notice(`Shared "${file.basename}" with @${f.handle || "friend"} (end-to-end encrypted)`);
    }).open();
  }
  // ---------------------------------------------------------------- utils
  async ensureFolder(path) {
    const parts = (0, import_obsidian7.normalizePath)(path).split("/").slice(0, -1);
    let cur = "";
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      if (!this.app.vault.getAbstractFileByPath(cur)) await this.app.vault.createFolder(cur).catch(() => {
      });
    }
  }
  async write(path, text) {
    path = (0, import_obsidian7.normalizePath)(path);
    await this.ensureFolder(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof import_obsidian7.TFile) await this.app.vault.modify(f, text);
    else await this.app.vault.create(path, text);
  }
  async writeBinary(path, data) {
    path = (0, import_obsidian7.normalizePath)(path);
    await this.ensureFolder(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof import_obsidian7.TFile) await this.app.vault.modifyBinary(f, data);
    else await this.app.vault.createBinary(path, data);
  }
  async openPanel() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW, active: true });
    }
    void this.app.workspace.revealLeaf(leaf);
  }
  refreshPanel() {
    for (const l of this.app.workspace.getLeavesOfType(VIEW)) l.view.render();
  }
};
var CalderaView = class extends import_obsidian7.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW;
  }
  getDisplayText() {
    return "Caldera";
  }
  getIcon() {
    return "flame";
  }
  async onOpen() {
    this.render();
    await this.plugin.syncInbox(false);
  }
  render() {
    const el = this.contentEl;
    el.empty();
    el.addClass("caldera-panel");
    const p = this.plugin, s = p.settings;
    el.createEl("h3", { text: "Caldera" });
    if (!s.identity || !s.handle) {
      el.createEl("p", { text: "Set your name and handle in settings, then publish your profile to join." });
      new import_obsidian7.Setting(el).addButton((b) => b.setButtonText("Open settings").setCta().onClick(() => {
        this.app.setting.open();
        this.app.setting.openTabById("caldera");
      }));
      return;
    }
    const stats = el.createDiv("caldera-stats");
    for (const [v, l] of [[p.social.friends, "friends"], [p.social.gravity, "gravity"], [p.social.credits, "credits"]]) {
      const st = stats.createDiv({ cls: "caldera-stat" });
      st.createEl("b", { text: String(v) });
      st.createSpan({ text: String(l) });
    }
    const actions = el.createDiv("caldera-actions");
    actions.createEl("button", { text: "My profile" }).onclick = () => p.openProfileTab();
    actions.createEl("button", { text: "Publish", cls: "mod-cta" }).onclick = () => p.publish();
    actions.createEl("button", { text: "Sync" }).onclick = () => p.syncInbox(true);
    actions.createEl("button", { text: "Share" }).onclick = () => p.openShare();
    if (p.pending.length) {
      el.createEl("h4", { text: "Friend requests" });
      for (const r of p.pending) {
        const row = el.createDiv("caldera-row");
        row.createSpan({ text: (r.handle ? "@" + r.handle : r.from.slice(0, 14)) + (r.note ? ` - "${r.note}"` : "") });
        row.createEl("button", { text: "Accept", cls: "mod-cta" }).onclick = () => p.acceptFriend(r);
        row.createEl("button", { text: "Ignore" }).onclick = () => p.ignoreFriend(r);
      }
    }
    if (p.sent.length) {
      el.createEl("h4", { text: "Waiting for them to accept" });
      for (const r of p.sent) el.createDiv({ cls: "caldera-row", text: (r.handle ? "@" + r.handle : r.from.slice(0, 14)) + ` - sent ${r.ts.slice(0, 10)}` });
    }
    el.createEl("h4", { text: "Add a friend" });
    el.createEl("p", { cls: "setting-item-description", text: 'Already on Caldera: enter their handle or paste their profile link. Or click "Add as friend" on their profile page.' });
    let handle = "";
    new import_obsidian7.Setting(el).addText((t) => t.setPlaceholder("@handle or profile link").onChange((v) => handle = v)).addButton((b) => b.setButtonText("Request").onClick(async () => {
      try {
        await p.requestFriend(handle.trim());
      } catch (e) {
        new import_obsidian7.Notice(e.message);
      }
    }));
    if (p.suggestions.length) {
      el.createEl("h4", { text: "People you might know" });
      for (const sg of p.suggestions) {
        const row = el.createDiv("caldera-row");
        const who = row.createSpan();
        who.createEl("b", { text: sg.name || "@" + sg.handle });
        who.appendText(` @${sg.handle}`);
        who.createDiv({ cls: "setting-item-description", text: sg.why });
        row.createEl("button", { text: "Add" }).onclick = async () => {
          try {
            await p.requestFriend(sg.handle);
            p.suggestions = p.suggestions.filter((x) => x !== sg);
            this.render();
          } catch (e) {
            new import_obsidian7.Notice(e.message);
          }
        };
        row.createEl("button", { text: "View" }).onclick = () => window.open(`${s.hubUrl.replace(/\/$/, "")}/@${sg.handle}/`);
        row.createEl("button", { text: "Kudos" }).onclick = (ev) => kudosMenu(ev, sg.handle, p);
      }
    }
    el.createEl("h4", { text: "Invite someone new" });
    el.createEl("p", { cls: "setting-item-description", text: "Not on Caldera yet: send them this link. It walks them through installing, then they add you with one click." });
    const inv = `${s.hubUrl.replace(/\/$/, "")}/?invite=${encodeURIComponent(s.handle)}#install`;
    new import_obsidian7.Setting(el).addText((t) => {
      t.setValue(inv);
      t.inputEl.readOnly = true;
      t.inputEl.onfocus = () => t.inputEl.select();
    }).addButton((b) => b.setButtonText("Copy").setCta().onClick(async () => {
      await navigator.clipboard.writeText(inv);
      new import_obsidian7.Notice("Invite link copied");
    }));
    el.createEl("h4", { text: `Friends (${p.friends.length})` });
    for (const f of p.friends) {
      const row = el.createDiv("caldera-row");
      row.createSpan({ text: "@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : "") });
      row.createEl("button", { text: "+ gravity" }).onclick = () => new GravityModal(this.app, f, (r) => p.giveGravity(f, r)).open();
      if (f.handle) row.createEl("button", { text: "Kudos" }).onclick = (ev) => kudosMenu(ev, f.handle, p);
    }
  }
};
function kudosMenu(ev, handle, plugin) {
  const m = new import_obsidian7.Menu();
  for (const [k, em] of [["heart", "\u2764\uFE0F"], ["up", "\u{1F44D}"], ["fire", "\u{1F525}"], ["sparkle", "\u2728"]])
    m.addItem((i) => i.setTitle(`${em}  Send @${handle} ${k === "up" ? "a thumbs up" : k}`).onClick(() => void plugin.sendKudos(handle, k)));
  m.showAtMouseEvent(ev);
}
var PreviewModal = class extends import_obsidian7.Modal {
  constructor(app, html) {
    super(app);
    this.html = html;
  }
  onOpen() {
    this.modalEl.addClass("caldera-preview-modal");
    this.titleEl.setText("Public profile preview (exactly what visitors will see)");
    const frame = this.contentEl.createEl("iframe", { cls: "caldera-preview" });
    frame.setAttr("sandbox", "allow-scripts");
    frame.srcdoc = this.html;
  }
};
var FriendPicker = class extends import_obsidian7.SuggestModal {
  constructor(app, list, pick) {
    super(app);
    this.list = list;
    this.pick = pick;
    this.setPlaceholder("Share with which friend?");
  }
  getSuggestions(q2) {
    return this.list.filter((f) => (f.handle || f.name || f.id).toLowerCase().includes(q2.toLowerCase()));
  }
  renderSuggestion(f, el) {
    el.setText("@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : ""));
  }
  onChooseSuggestion(f) {
    void this.pick(f);
  }
};
var GravityModal = class extends import_obsidian7.Modal {
  constructor(app, f, done) {
    super(app);
    this.f = f;
    this.done = done;
  }
  onOpen() {
    this.titleEl.setText(`Add gravity to @${this.f.handle || "friend"}`);
    this.contentEl.createEl("p", { text: "Gravity is positive only. Say what they helped with (optional)." });
    let reason = "";
    new import_obsidian7.Setting(this.contentEl).addText((t) => t.setPlaceholder("They found me an operator").onChange((v) => reason = v)).addButton((b) => b.setButtonText("Add gravity").setCta().onClick(() => {
      void this.done(reason);
      this.close();
    }));
  }
};
var ConfirmModal = class extends import_obsidian7.Modal {
  constructor(app, msg, yes, label = "Delete", title = "Are you sure?") {
    super(app);
    this.msg = msg;
    this.yes = yes;
    this.label = label;
    this.title = title;
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.createEl("p", { text: this.msg });
    new import_obsidian7.Setting(this.contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => {
      b.setButtonText(this.label).onClick(() => {
        void this.yes();
        this.close();
      });
      if (this.label === "Delete") b.setWarning();
      else b.setCta();
    });
  }
};
var AskModal = class extends import_obsidian7.Modal {
  constructor(app, plugin, kind) {
    super(app);
    this.plugin = plugin;
    this.kind = kind;
  }
  onOpen() {
    const ask = this.kind === "ask";
    this.titleEl.setText(ask ? "I could use help with..." : "I can help with...");
    let title = "", bounty = 20;
    new import_obsidian7.Setting(this.contentEl).setName("What").addText((t) => t.onChange((v) => title = v));
    if (ask) new import_obsidian7.Setting(this.contentEl).setName("Bounty (help credits)").setDesc("Held until you award it to whoever helps").addText((t) => t.setValue("20").onChange((v) => bounty = Math.max(0, Number(v) || 0)));
    new import_obsidian7.Setting(this.contentEl).addButton((b) => b.setButtonText(ask ? "Post ask" : "Post offer").setCta().onClick(async () => {
      if (!title.trim()) return;
      try {
        const id = newId(ask ? "ask" : "off");
        await this.plugin.send(ask ? "ask" : "offer", ask ? { id, title, bounty, tags: [], visibility: "public" } : { id, title, tags: [] });
        if (ask) this.plugin.settings.asks.push({ id, title, bounty });
        else this.plugin.settings.offers.push({ id, title });
        await this.plugin.saveSettings();
        new import_obsidian7.Notice(ask ? "Ask posted" : "Offer posted");
        this.close();
      } catch (e) {
        new import_obsidian7.Notice(e.message);
      }
    }));
  }
};
var PairModal = class extends import_obsidian7.Modal {
  constructor(app, approve, page2) {
    super(app);
    this.approve = approve;
    this.page = page2;
  }
  onOpen() {
    this.titleEl.setText("Sign in another device");
    this.contentEl.createEl("p", { text: `On your phone or the other browser, open ${this.page}, tap "Owner? Sign in" in the bar at the top, then "Show a code". Type that code here.` });
    this.contentEl.createEl("p", { cls: "setting-item-description", text: "Only approve a code on a screen you're holding yourself: approving signs that browser in as you." });
    let code = "";
    const go = async () => {
      if (code.replace(/[^A-Za-z0-9]/g, "").length !== 6) return void new import_obsidian7.Notice("The code has 6 characters.");
      try {
        await this.approve(code);
        this.close();
      } catch (e) {
        new import_obsidian7.Notice(e.message);
      }
    };
    new import_obsidian7.Setting(this.contentEl).setName("Code").addText((t) => {
      t.setPlaceholder("ABC 123").onChange((v) => code = v);
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void go();
      });
      window.setTimeout(() => t.inputEl.focus(), 50);
    }).addButton((b) => b.setButtonText("Sign it in").setCta().onClick(() => void go()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ImagePickModal = class extends import_obsidian7.Modal {
  constructor(app, kind, use, cancelled) {
    super(app);
    this.kind = kind;
    this.use = use;
    this.cancelled = cancelled;
    this.chosen = false;
  }
  onOpen() {
    const banner = this.kind === "banner";
    this.titleEl.setText(banner ? "Set your masthead" : "Set your profile photo");
    this.contentEl.createEl("p", { text: banner ? "The wide cover image across the top of your page. Best about 3:1 (for example 1800x600), JPG or WebP, up to 5 MB. It's public." : "Square, at least 400x400: your face or your logo. JPG, PNG or WebP, up to 5 MB. It's public." });
    const input = this.contentEl.createEl("input", { attr: { type: "file", accept: "image/jpeg,image/png,image/webp" } });
    input.setCssStyles({ display: "none" });
    const take = async (f) => {
      if (!f) return;
      const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : f.type === "image/jpeg" ? "jpg" : "";
      if (!ext) return void new import_obsidian7.Notice("Use a JPG, PNG or WebP image.");
      if (f.size > 5 * 1024 * 1024) return void new import_obsidian7.Notice("That image is over 5 MB. Try a smaller one.");
      try {
        this.chosen = true;
        await this.use(await f.arrayBuffer(), ext);
        this.close();
      } catch (e) {
        this.chosen = false;
        new import_obsidian7.Notice("Couldn't set it: " + e.message);
      }
    };
    input.addEventListener("change", () => void take(input.files?.[0]));
    this.contentEl.addEventListener("dragover", (e) => e.preventDefault());
    this.contentEl.addEventListener("drop", (e) => {
      e.preventDefault();
      void take(e.dataTransfer?.files?.[0]);
    });
    new import_obsidian7.Setting(this.contentEl).setDesc("Or drop an image on this window.").addButton((b) => b.setButtonText("Choose an image").setCta().onClick(() => input.click()));
  }
  onClose() {
    this.contentEl.empty();
    if (!this.chosen) this.cancelled();
  }
};
var PromptModal = class extends import_obsidian7.Modal {
  constructor(app, text) {
    super(app);
    this.text = text;
  }
  onOpen() {
    this.titleEl.setText("AI agent setup prompt");
    const ta = this.contentEl.createEl("textarea", { cls: "caldera-prompt" });
    ta.value = this.text;
    ta.rows = 18;
    ta.readOnly = true;
    ta.select();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var NotePickModal = class extends import_obsidian7.SuggestModal {
  constructor(app, pick) {
    super(app);
    this.pick = pick;
    this.setPlaceholder("Type to find a note to plant in your garden");
  }
  getSuggestions(q2) {
    const s = q2.toLowerCase();
    return this.app.vault.getMarkdownFiles().filter((f) => !f.path.startsWith("Caldera/") && f.path.toLowerCase().includes(s)).slice(0, 40);
  }
  renderSuggestion(f, el) {
    el.createEl("div", { text: f.basename });
    el.createEl("small", { text: f.parent?.path && f.parent.path !== "/" ? f.parent.path : "", cls: "caldera-muted" });
  }
  onChooseSuggestion(f) {
    this.pick(f);
  }
};
var WelcomeModal = class extends import_obsidian7.Modal {
  constructor(app, plugin, mode = "welcome") {
    super(app);
    this.plugin = plugin;
    this.mode = mode;
  }
  onOpen() {
    const s = this.plugin.settings, finish = this.mode === "finish" && !!s.handle && !!s.identity;
    const eff = effectiveSettings(this.app, s);
    this.modalEl.addClass("caldera-welcome");
    this.titleEl.setText(finish ? "Finish your page" : "Welcome to Caldera");
    const c = this.contentEl;
    c.createEl("p", { text: finish ? "A few details make your page worth visiting. Fill in what you like - everything is optional, and you can change it later in Caldera/profile.md." : "Set up your page in a minute. Caldera creates your identity on this device and publishes a page that keeps itself fresh from your vault. Nothing private leaves your vault." });
    let name = eff.name || "", handle = s.handle || "", headline = eff.headline || "", listed = eff.listed !== false;
    const clean = (v) => v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    const status = createDiv({ cls: "caldera-welcome-status" });
    const head = (t) => c.createEl("h4", { text: t, cls: "caldera-welcome-h" });
    head("You");
    new import_obsidian7.Setting(c).setName("Your name").addText((t) => t.setPlaceholder("Ada Lovelace").setValue(name).onChange((v) => name = v.trim()));
    if (finish) new import_obsidian7.Setting(c).setName("Handle").setDesc(this.plugin.profileUrl());
    else new import_obsidian7.Setting(c).setName("Handle").setDesc(`${s.hubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/@handle`).addText((t) => t.setPlaceholder("ada").setValue(handle).onChange((v) => {
      handle = clean(v);
      if (v !== handle) t.setValue(handle);
      status.setText("");
    }));
    const examples = ["Designer writing about tools for thought", "Founder building in public", "Researcher: notes on climate and cities"];
    new import_obsidian7.Setting(c).setName("Headline").setDesc("One line about what you do or think about").addText((t) => {
      t.setPlaceholder(examples[Math.floor(Math.random() * examples.length)]).setValue(headline).onChange((v) => headline = v.trim());
      t.inputEl.addClass("caldera-wide");
    });
    head("Pictures");
    const img = { photo: null, banner: null };
    const picRow = (kind, label, desc, current) => {
      const st = new import_obsidian7.Setting(c).setName(label).setDesc(current ? `${desc} Now: ${current}` : desc);
      st.addButton((b) => b.setButtonText(current ? "Change" : "Choose an image").onClick(() => new ImagePickModal(this.app, kind, async (buf, ext) => {
        img[kind] = { buf, ext };
        st.setDesc(`${desc} Chosen. It's saved when you publish.`);
        b.setButtonText("Change");
      }, () => {
      }).open()));
      if (!current) st.addExtraButton((x) => x.setIcon("x").setTooltip("Skip for now").onClick(() => {
        img[kind] = null;
        st.setDesc(`${desc} Skipped - you can add it later.`);
      }));
    };
    picRow("photo", "Profile photo", "Square: your face or your logo.", eff.avatarPath || "");
    picRow("banner", "Masthead", "The wide cover image across the top (about 3:1).", eff.bannerPath || "");
    head("Links");
    const have = (eff.links || []).map(([l, u]) => ({ l, u, i: quickLinkIndex(l, u) }));
    const quick = QUICK_LINKS.map((_, i) => have.find((h) => h.i === i)?.u || "");
    QUICK_LINKS.forEach((q2, i) => new import_obsidian7.Setting(c).setName(q2.label).addText((t) => t.setPlaceholder(q2.ph).setValue(quick[i]).onChange((v) => quick[i] = v.trim())));
    head("Your garden");
    let plant = null;
    const gs = new import_obsidian7.Setting(c).setName("Plant your first note").setDesc("Optional. Pick a note to publish as a page in your garden, marked seedling - rough is fine.");
    gs.addButton((b) => b.setButtonText("Pick a note").onClick(() => new NotePickModal(this.app, (f) => {
      plant = f;
      gs.setDesc(`"${f.basename}" goes public as a seedling when you publish.`);
      b.setButtonText("Change");
    }).open()));
    head("Staying in touch");
    new import_obsidian7.Setting(c).setName("List me in People").setDesc("Your card appears on the public directory. Change it anytime.").addToggle((t) => t.setValue(listed).onChange((v) => listed = v));
    let email = s.summaryEmail || "";
    new import_obsidian7.Setting(c).setName("Daily summary email").setDesc("Optional. Who visited, friend requests, links into your garden - only on days something happens.").addText((t) => t.setPlaceholder("you@example.com").setValue(email).onChange((v) => email = v.trim()));
    c.appendChild(status);
    const go = new import_obsidian7.Setting(c).addButton((b) => b.setButtonText("Use my AI agent instead").setTooltip("Copies a setup prompt for Claude Code, Codex or Cursor").onClick(() => this.plugin.copyPrompt("setup"))).addButton((b) => b.setButtonText(finish ? "Save and publish" : "Publish my page").setCta().onClick(async () => {
      if (!name) {
        status.setText("Add your name.");
        return;
      }
      if (!finish && handle.length < 3) {
        status.setText("Handles need at least 3 letters or numbers.");
        return;
      }
      b.setDisabled(true);
      b.setButtonText("Publishing...");
      const fail = (msg) => {
        status.setText(msg);
        b.setDisabled(false);
        b.setButtonText(finish ? "Save and publish" : "Publish my page");
      };
      try {
        const me = await this.plugin.ensureIdentity(true);
        if (!finish) {
          const r = await (0, import_obsidian7.requestUrl)({ url: `${s.hubUrl.replace(/\/$/, "")}/v1/profiles/${handle}`, throw: false });
          if (r.status === 200 && r.json?.id !== me.id) return fail(`@${handle} is taken. Try another.`);
          s.handle = handle;
          if (!s.autoPublishHours) s.autoPublishHours = 6;
        }
        Object.assign(s, { name, headline, listed });
        await this.plugin.saveSettings();
        await this.plugin.applyProfileForm({ name, headline, listed, images: img, links: quick.map((v, i) => [QUICK_LINKS[i].label, quickLinkUrl(i, v)]), plant });
        const firstRun = !s.welcomed;
        s.welcomed = true;
        s.sharePrompted = true;
        await this.plugin.saveSettings();
        const url = await this.plugin.publish(true);
        if (!url) {
          if (firstRun) {
            s.welcomed = false;
            await this.plugin.saveSettings();
          }
          const why = this.plugin.lastPublishError;
          return fail(why && !/network|fetch|ENOTFOUND|timed out/i.test(why) ? `Publishing failed: ${why}` : "Publishing failed. Check your connection and try again.");
        }
        this.plugin.scheduleAutoPublish();
        if (email && email !== s.summaryEmail) void this.plugin.setSummaryEmail(email);
        this.close();
        new ShareModal(this.app, this.plugin, firstRun).open();
      } catch (e) {
        fail(e.message);
      }
    }));
    go.settingEl.addClass("caldera-welcome-go");
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ShareModal = class extends import_obsidian7.Modal {
  constructor(app, plugin, firstRun = false) {
    super(app);
    this.plugin = plugin;
    this.firstRun = firstRun;
  }
  onOpen() {
    const s = this.plugin.settings, hub = s.hubUrl.replace(/\/$/, ""), url = this.plugin.profileUrl(), invite = `${hub}/?invite=${encodeURIComponent(s.handle)}`;
    this.modalEl.addClass("caldera-share");
    this.titleEl.setText("Your page is live");
    const c = this.contentEl;
    c.createEl("p", { text: "This is what people see when you post your link. Pages that get shared get visitors, friend requests and links into your garden." });
    const img = c.createEl("img", { cls: "caldera-share-card", attr: { src: `${url}card.png?t=${Date.now()}`, alt: "Your link preview" } });
    img.onerror = () => img.remove();
    const copy = async (t2, msg) => {
      try {
        await navigator.clipboard.writeText(t2);
        new import_obsidian7.Notice(msg);
      } catch {
        new import_obsidian7.Notice(t2, 1e4);
      }
    };
    new import_obsidian7.Setting(c).setName("Your link").setDesc(url).addButton((b) => b.setButtonText("Copy link").setCta().onClick(() => copy(url, "Link copied")));
    const text = `My page on Caldera: a living profile built from my Obsidian vault, with my work as a little city. ${url}`, t = encodeURIComponent(text);
    new import_obsidian7.Setting(c).setName("Post it").addButton((b) => b.setButtonText("X").onClick(() => window.open(`https://x.com/intent/post?text=${t}`))).addButton((b) => b.setButtonText("Bluesky").onClick(() => window.open(`https://bsky.app/intent/compose?text=${t}`))).addButton((b) => b.setButtonText("LinkedIn").onClick(() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`))).addButton((b) => b.setButtonText("Mastodon").onClick(() => window.open(`https://mastodonshare.com/?text=${t}`)));
    new import_obsidian7.Setting(c).setName("Invite a friend").setDesc(`${invite} - they're walked through setup and add you with one click. You get 25 help credits for each person who joins.`).addButton((b) => b.setButtonText("Copy invite link").onClick(() => copy(invite, "Invite link copied")));
    let email = s.summaryEmail || "";
    new import_obsidian7.Setting(c).setName("Daily summary email").setDesc("Who visited, friend requests, links into your garden. Only on days something happens.").addText((tx) => tx.setPlaceholder("you@example.com").setValue(email).onChange((v) => email = v.trim())).addButton((b) => b.setButtonText("Email me").onClick(() => {
      if (email) void this.plugin.setSummaryEmail(email);
    }));
    if (this.firstRun) new import_obsidian7.Setting(c).setName("Save your recovery key").setDesc("Your login is a key stored in this vault - no password. Keep a copy in your password manager to recover your page on another device. Anyone with it can act as you.").addButton((b) => b.setButtonText("Copy recovery key").onClick(() => copy(btoa(JSON.stringify(s.identity)), "Recovery key copied. Paste it into your password manager.")));
    new import_obsidian7.Setting(c).addButton((b) => b.setButtonText("Open my page").onClick(() => void this.plugin.openProfile())).addButton((b) => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var WhatsNewModal = class extends import_obsidian7.Modal {
  constructor(app, plugin, releases) {
    super(app);
    this.plugin = plugin;
    this.releases = releases;
  }
  onOpen() {
    this.titleEl.setText("What's new in Caldera");
    const have = this.plugin.manifest.version, newest = this.releases[0]?.version;
    const older = (a, b) => {
      const x = a.split(".").map(Number), y = b.split(".").map(Number);
      for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
      return false;
    };
    if (newest && older(have, newest)) {
      const up = this.contentEl.createDiv({ cls: "caldera-release-howto" });
      up.createEl("p", { text: `You have Caldera ${have}. Version ${newest} is out: open Community plugins, click "Check for updates", then update Caldera.` });
      new import_obsidian7.Setting(up).addButton((b) => b.setButtonText("Open Community plugins").setCta().onClick(() => {
        const st = this.app.setting;
        if (st) {
          st.open();
          st.openTabById("community-plugins");
        }
        this.close();
      }));
    }
    for (const r of this.releases) {
      const box = this.contentEl.createDiv({ cls: "caldera-release" });
      box.createDiv({ cls: "caldera-release-meta", text: `${r.version} \xB7 ${r.date}` });
      box.createEl("h3", { text: r.title });
      const ul = box.createEl("ul");
      for (const it of r.items) ul.createEl("li", { text: it });
      if (r.howto) box.createEl("p", { cls: "caldera-release-howto", text: r.howto });
    }
    const hub = this.plugin.settings.hubUrl.replace(/\/$/, "");
    new import_obsidian7.Setting(this.contentEl).addButton((b) => b.setButtonText("All release notes").onClick(() => window.open(hub + "/changelog.html"))).addButton((b) => b.setButtonText("Guide").onClick(() => window.open(hub + "/guide.html"))).addButton((b) => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var GardenPreviewModal = class extends import_obsidian7.Modal {
  constructor(app, report, folder, url) {
    super(app);
    this.report = report;
    this.folder = folder;
    this.url = url;
  }
  onOpen() {
    const c = this.contentEl;
    c.empty();
    c.createEl("h2", { text: "Your garden" });
    if (!this.report.length) {
      c.createEl("p", { text: `No garden notes yet. Put notes in the "${this.folder || "(no folder set)"}" folder, or run "Plant this note in my garden" on any note. Nothing is published until you do.` });
      return;
    }
    const words = this.report.reduce((a, r) => a + r.words, 0);
    c.createEl("p", { text: `${this.report.length} notes (${words.toLocaleString()} words) will be public as full pages${this.url ? ` at ${this.url}` : ""}. Email addresses and phone numbers are removed automatically. Lines below were flagged as possibly private: edit them, or add "caldera: private" to keep a note out.` });
    for (const r of this.report) {
      const box = c.createDiv({ cls: "caldera-garden-row" });
      box.createEl("h4", { text: `${r.title}  (${r.stage}, ${LICENSES[r.license]?.short || r.license}, ${r.words} words)` });
      box.createDiv({ text: r.path, cls: "setting-item-description" });
      if (r.removed) box.createDiv({ text: `${r.removed} email/phone value(s) will be removed.` });
      if (!r.flags.length) box.createDiv({ text: "No flagged lines.", cls: "setting-item-description" });
      for (const fl of r.flags) box.createDiv({ text: `[${fl.why}] ${fl.line}` });
    }
  }
};
async function sha16(t) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
