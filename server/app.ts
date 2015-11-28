//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

require('async-node');
require('kinq').enable();
import { LsServer } from './server';
import { defaultCipherAlgorithm, defaultListenPort, defaultPassword } from '../lib/constant';

export class App {
  
  constructor(options?) {
    let defaultOptions = {
      cipherAlgorithm: defaultCipherAlgorithm,
      password: defaultPassword,
      port: defaultListenPort
    };
    
    options = options || defaultOptions;
    Object.getOwnPropertyNames(defaultOptions).forEach(n => options[n] = options[n] || defaultOptions[n]);
    
    let server = new LsServer(options);
    server.start();
  }
}

if (!module.parent) {
  process.title = 'LightSword Server Debug Mode';
  new App();
}