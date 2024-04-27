import fs from 'node:fs';
import { join } from 'pathe';

function isRegex(src) {
  return Object.prototype.toString.call(src) === '[object RegExp]';
}

export function merge(source, target) {
  const deepClone = source => {
    if (typeof source !== 'object' || isRegex(source) || source === null) return source;
    const target = Array.isArray(source) ? [] : {};
    for (const key of Object.keys(source)) {
      const value = source[key];
      target[key] = deepClone(value);
    }
    return target;
  };

  const clone = deepClone(source);
  for (const key in target) {
    if (clone[key] === undefined) {
      clone[key] = target[key];
    }
  }
  return clone;
}

export function readAllFiles(root: string) {
  let resultArr: string[] = [];
  try {
    if (fs.existsSync(root)) {
      const stat = fs.lstatSync(root);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(root);
        for (const file of files) {
          const t = readAllFiles(join(root, '/', file));
          resultArr = [...resultArr, ...t];
        }
      } else {
        resultArr.push(root);
      }
    }
  } catch (error) {
    console.log(error);
  }

  return resultArr;
}
