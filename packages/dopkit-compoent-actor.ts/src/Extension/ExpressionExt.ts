export class ExpressionExt {
  public static Eval(code, varMap, builtinMap) {
    let argNames = [];
    let argValues = [];
    for (let key in varMap) {
      let value = varMap[key];
      argNames.push(key);
      argValues.push(value);
    }
    for (let key in builtinMap) {
      let value = builtinMap[key];
      argNames.push(key);
      argValues.push(value);
    }
    // Function的最后一个参数是函数body
    let createFuncArgs = [...argNames, code];
    let f = new Function(...createFuncArgs);
    let r = f(...argValues);
    return r;
  }
}