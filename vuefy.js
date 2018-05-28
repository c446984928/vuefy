function watch(ctx, obj) {
  Object.keys(obj).forEach((key) => {
    defineReactive(ctx.data, key, ctx.data[key], (value) => {
      obj[key].call(ctx, value)
    })
    ctx.properties && defineReactive(ctx.properties, key, ctx.properties[key], (value) => {
      obj[key].call(ctx, value)
    })
  })
}

function computed(ctx, obj) {
  let keys = Object.keys(obj)
  let dataKeys = Object.keys(ctx.data)
  let propertyKeys = Object.keys(ctx.properties || {})
  dataKeys.forEach((dataKey) => {
    defineReactive(ctx.data, dataKey, ctx.data[dataKey])
  })
  propertyKeys.forEach((propertyKey) => {
    defineReactive(ctx.properties, propertyKey, ctx.properties[propertyKey])
  })
  let firstComputedObj = keys.reduce((prev, next) => {
    let target = genTarget(ctx, obj[next], next)
    ctx.data.$target = target
    ctx.properties && (ctx.properties.$target = target)
    prev[next] = obj[next].call(ctx)
    ctx.data.$target = null
    ctx.properties && (ctx.properties.$target = null)
    return prev
  }, {})
  ctx.setData(firstComputedObj)
}

function genTarget(ctx, fn, key) {
  let target = function () {
    ctx.data.$target = target
    ctx.properties && (ctx.properties.$target = target)
    let value = fn.call(ctx)
    ctx.setData({ [key]: value })
    ctx.data.$target = null
    ctx.properties && (ctx.properties.$target = null)
  }
  return target
}

function defineReactive(data, key, val, fn) {
  if (Object.keys(data).indexOf(key) < 0) return
  let subs = data['$' + key] || []
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (data.$target && subs.indexOf(data.$target) < 0) {
        subs.push(data.$target)
        data['$' + key] = subs
      }
      return val
    },
    set(newVal) {
      if (newVal === val) return
      fn && fn(newVal)
      if (subs.length) {
        // 用 setTimeout 因为此时 this.data 还没更新
        setTimeout(() => {
          subs.forEach(sub => sub())
        }, 0)
      }
      val = newVal
    },
  })
}

module.exports = { watch, computed }
