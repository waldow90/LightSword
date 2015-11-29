//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

import * as os from 'os';
import * as net from 'net';
import * as util from 'util';
import { ATYP, REQUEST_CMD } from './socks5Constant';

// +----+-----+-------+------+----------+----------+
// |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
// +----+-----+-------+------+----------+----------+
// | 1  |  1  | X'00' |  1   | Variable |    2     |
// +----+-----+-------+------+----------+----------+
export function refineDestination(rawData: Buffer): { cmd: REQUEST_CMD, addr: string, port: number } {
  let cmd = rawData[1];
  let atyp = rawData[3];
  let port = rawData.readUInt16BE(rawData.length - 2);
  let addr = '';
  
  switch (atyp) {
    case ATYP.DN:
      let dnLength = rawData[4];
      addr = rawData.toString('utf8', 5, 5 + dnLength);
      break;
      
    case ATYP.IPV4:
      addr = rawData.skip(4).take(4).aggregate((c: string, n) => c.length > 1 ? c + util.format('.%d', n) : util.format('%d.%d', c, n));
      break;
      
    case ATYP.IPV6:
      let bytes = rawData.skip(4).take(16).toArray();
      let ipv6 = '';
      
      for (let b of bytes) {
        ipv6 += ('0' + b.toString(16)).substr(-2);
      }
      
      addr = ipv6.substr(0, 4);
      for (let i = 1; i < 8; i++) {
        addr = util.format('%s:%s', addr, ipv6.substr(4 * i, 4));
      }
      
      break;
  }
  
  return { cmd, addr, port };
}

// +----+-----+-------+------+----------+----------+
// |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
// +----+-----+-------+------+----------+----------+
// | 1  |  1  | X'00' |  1   | Variable |    2     |
// +----+-----+-------+------+----------+----------+
export function buildSocks5Reply(rep: number, atyp: number, fullAddr: string, port: number) {
  let type = net.isIP(fullAddr);
  let addr = [];
  switch (type) {
    case 4:
      addr = fullAddr.split('.').select(s => Number.parseInt(s)).toArray();
      break;
    case 6:
      addr = fullAddr.split(':').select(s => [Number.parseInt(s.substr(0, 2), 16), Number.parseInt(s.substr(2, 2), 16)]).aggregate((c: Array<number>, n) => c.concat(n));
      break;
    case 0:
      fullAddr.each((c, i) => addr.push(fullAddr.charCodeAt(i)));
      break;
  }
  
  let reply = [0x05, rep, 0x00, atyp, ];
  if (type === ATYP.DN) reply.push(addr.length);
  reply = reply.concat(addr).concat([0x00, 0x00]);
  
  let buf = new Buffer(reply);
  buf.writeUInt16BE(port, buf.length - 2);
  return buf;
}