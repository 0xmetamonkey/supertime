// Pure TypeScript QR Code generator based on standard ISO/IEC 18004
// Zero dependencies, runs anywhere (browser or Node.js)

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3,
};

const QRErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7,
};

const QRMath = {
  glog(n: number) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp(n: number) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),
};

for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

class QRPolynomial {
  num: number[];
  constructor(num: number[], shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }
  get(index: number) {
    return this.num[index];
  }
  getLength() {
    return this.num.length;
  }
  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num);
  }
  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;
  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  static RS_BLOCK_TABLE = [
    // 1
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    // 2
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    // 3
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    // 4
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    // 5
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    // 6
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    // 7
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    // 8
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    // 9
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    // 10
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  ];
  static getRSBlocks(typeNumber: number, errorCorrectLevel: number) {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (!rsBlock) throw new Error("bad rs block @ typeNumber:" + typeNumber);
    const length = rsBlock.length / 3;
    const list: QRRSBlock[] = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
    }
    return list;
  }
  static getRsBlockTable(typeNumber: number, errorCorrectLevel: number) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default: return undefined;
    }
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length = 0;
  get(index: number) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

class QR8BitByte {
  mode = QRMode.MODE_8BIT_BYTE;
  data: string;
  bytes: number[];
  constructor(data: string) {
    this.data = data;
    this.bytes = [];
    for (let i = 0; i < data.length; i++) {
      const code = data.charCodeAt(i);
      if (code > 0xff) {
        // UTF-8 encode
        const encoded = encodeURI(data.charAt(i));
        if (encoded.startsWith('%')) {
          const hexes = encoded.split('%').filter(Boolean);
          for (const hex of hexes) this.bytes.push(parseInt(hex, 16));
        } else {
          this.bytes.push(code & 0xff);
        }
      } else {
        this.bytes.push(code);
      }
    }
  }
  getLength() {
    return this.bytes.length;
  }
  write(buffer: QRBitBuffer) {
    for (let i = 0; i < this.bytes.length; i++) {
      buffer.put(this.bytes[i], 8);
    }
  }
}

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 32, 58],
  ],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
  getBCHTypeInfo(data: number) {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHDigit(data: number) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  },
  getPatternPosition(typeNumber: number) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
  },
  getMask(maskPattern: number, i: number, j: number) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
      case QRMaskPattern.PATTERN001: return i % 2 === 0;
      case QRMaskPattern.PATTERN010: return j % 3 === 0;
      case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
      case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case QRMaskPattern.PATTERN101: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case QRMaskPattern.PATTERN110: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case QRMaskPattern.PATTERN111: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error("bad maskPattern:" + maskPattern);
    }
  },
  getErrorCorrectPolynomial(errorCorrectLength: number) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits(mode: number, type: number) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case QRMode.MODE_NUMBER: return 10;
        case QRMode.MODE_ALPHA_NUM: return 9;
        case QRMode.MODE_8BIT_BYTE: return 8;
        case QRMode.MODE_KANJI: return 8;
        default: throw new Error("mode:" + mode);
      }
    } else {
      switch (mode) {
        case QRMode.MODE_NUMBER: return 12;
        case QRMode.MODE_ALPHA_NUM: return 11;
        case QRMode.MODE_8BIT_BYTE: return 16;
        case QRMode.MODE_KANJI: return 10;
        default: throw new Error("mode:" + mode);
      }
    }
  },
  getLostPoint(qrCode: QRCode) {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;

    // LEVEL 1
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = qrCode.isDark(row, col);
        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) continue;
            if (r === 0 && c === 0) continue;
            if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += 3 + sameCount - 5;
      }
    }

    // LEVEL 2
    for (let row = 0; row < moduleCount - 1; row++) {
      for (let col = 0; col < moduleCount - 1; col++) {
        let count = 0;
        if (qrCode.isDark(row, col)) count++;
        if (qrCode.isDark(row + 1, col)) count++;
        if (qrCode.isDark(row, col + 1)) count++;
        if (qrCode.isDark(row + 1, col + 1)) count++;
        if (count === 0 || count === 4) lostPoint += 3;
      }
    }

    // LEVEL 3
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount - 6; col++) {
        if (
          qrCode.isDark(row, col) &&
          !qrCode.isDark(row, col + 1) &&
          qrCode.isDark(row, col + 2) &&
          qrCode.isDark(row, col + 3) &&
          qrCode.isDark(row, col + 4) &&
          !qrCode.isDark(row, col + 5) &&
          qrCode.isDark(row, col + 6)
        ) {
          lostPoint += 40;
        }
      }
    }
    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount - 6; row++) {
        if (
          qrCode.isDark(row, col) &&
          !qrCode.isDark(row + 1, col) &&
          qrCode.isDark(row + 2, col) &&
          qrCode.isDark(row + 3, col) &&
          qrCode.isDark(row + 4, col) &&
          !qrCode.isDark(row + 5, col) &&
          qrCode.isDark(row + 6, col)
        ) {
          lostPoint += 40;
        }
      }
    }

    // LEVEL 4
    let darkCount = 0;
    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount; row++) {
        if (qrCode.isDark(row, col)) darkCount++;
      }
    }
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;

    return lostPoint;
  },
};

export class QRCode {
  typeNumber: number;
  errorCorrectLevel: number;
  modules: boolean[][] = [];
  moduleCount = 0;
  dataList: QR8BitByte[] = [];

  constructor(typeNumber: number, errorCorrectLevel: ErrorCorrectionLevel = 'H') {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];
  }

  addData(data: string) {
    this.dataList.push(new QR8BitByte(data));
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      return false;
    }
    return this.modules[row][col];
  }

  getModuleCount(): number {
    return this.moduleCount;
  }

  make() {
    if (this.typeNumber < 1) {
      let typeNumber = 1;
      for (; typeNumber <= 10; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
        const buffer = new QRBitBuffer();
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
        for (let i = 0; i < this.dataList.length; i++) {
          const data = this.dataList[i];
          buffer.put(data.mode, 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
          data.write(buffer);
        }
        if (buffer.length <= totalDataCount * 8) break;
      }
      this.typeNumber = typeNumber;
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(false);
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      // Version info for version 7+
    }

    const data = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    this.mapData(data, maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  private setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== false && this.modules[r][6] !== true) {
        this.modules[r][6] = r % 2 === 0;
      } else if (this.modules[r][6] === undefined) {
        this.modules[r][6] = r % 2 === 0;
      }
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== false && this.modules[6][c] !== true) {
        this.modules[6][c] = c % 2 === 0;
      } else if (this.modules[6][c] === undefined) {
        this.modules[6][c] = c % 2 === 0;
      }
    }
  }

  private setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== undefined && this.modules[row][col] !== false) {
          // already set by probe
          if (
            (row <= 8 && col <= 8) ||
            (row <= 8 && col >= this.moduleCount - 8) ||
            (row >= this.moduleCount - 8 && col <= 8)
          ) {
            continue;
          }
        }
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;

      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === undefined || this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private static createData(typeNumber: number, errorCorrectLevel: number, dataList: QR8BitByte[]): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
    if (buffer.length > totalDataCount * 8) {
      throw new Error("code length overflow. (" + buffer.length + ">" + totalDataCount * 8 + ")");
    }
    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCode.createBytes(buffer, rsBlocks);
  }

  private static createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): number[] {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata: number[][] = new Array(rsBlocks.length);
    const ecdata: number[][] = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    const data: number[] = [];
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data.push(dcdata[r][i]);
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data.push(ecdata[r][i]);
      }
    }
    return data;
  }
}

/**
 * Generate a 2D boolean array representing the QR code matrix
 */
export function generateQRMatrix(text: string, level: ErrorCorrectionLevel = 'H'): boolean[][] {
  const qr = new QRCode(0, level);
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.isDark(r, c));
    }
    matrix.push(row);
  }
  return matrix;
}
