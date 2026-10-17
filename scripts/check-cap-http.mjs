import * as core from '@capacitor/core';
console.log(Object.keys(core).filter((k) => /http/i.test(k)));
console.log('CapacitorHttp' in core);
