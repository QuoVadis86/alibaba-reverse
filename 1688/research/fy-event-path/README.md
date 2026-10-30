# FY 事件投递路径研究

## 目标

让本地 runtime 里 FY 的事件处理路径与真实浏览器**完全一致**，从而让离线生成的
`n` 与浏览器同构，最终通过服务端校验。

这是完全离线（B 路径）的最后一个阻塞项。

## 已确认的事实

| 指标 | 浏览器 | 本地 runtime |
|---|---|---|
| `DG(zU,...)` 调用次数（同一次拖动） | **1**（zU=5） | **75**（多数 zU=13） |
| `v===56` 站点命中 | **2**（`53,25`） | **71**（`32,13,24,17,43,...`） |
| 同挑战、同 128 事件回放的 payload 相同率 | — | **3.7%** |

结论：两端不是"某些值不同"，而是**处理了完全不同的事件集合**。

## 已知的 VM 结构

- `DG(zU, dC, eM, Kt, wZ, Hj)`：FY 模块入口 VM（源码偏移 1465，跨度 44454）
- `mr(xF, QO, z, FL, eo)`：中间层 VM（源码偏移 45929）
- `Qz(OA, P, EL, Kt, M, v, Z)`：事件/序列化分发 VM（源码偏移 112376）
- `DG(5, M, Z)` 来自 `M[3] || (DG(5,M,Z), M[3]=1)`，`M` 是 `var M=[]`（偏移 166369）
- `DG(13, ...)` 来自 `mr` 内 `(P=56===v) && (d[a]=DG(S,z,s,AN,Z,B))`

## 方法

1. **监听器注册对比**：浏览器里 wrap `EventTarget.prototype.addEventListener`，
   记录 FY 注册了哪些 target/type/capture；本地 runtime 同样记录，逐条对比。
2. **事件对象形状对比**：对同一 type，比较浏览器真实事件与本地回放事件的
   属性集合、原型链、`isTrusted`、`target` 身份。
3. **投递时序对比**：记录每个事件到达监听器时的 `v` 值，找出第一处不同。

## 探针

- `probe_listeners.cjs` — 浏览器侧监听器注册采集
- 本地侧由 `1688/core/x5sec/runtime/js_runtime.cjs` 的 trace 分支输出

## 相关既有资料

- `1688/docs/x5sec.md` §23–§31：本课题的完整证据链
- `1688/tools/probe_fy_*.cjs`：VM 轨迹探针

## 进展记录

### 2026-10-30：监听器注册对比

浏览器里 FY 注册的监听器（`probe_listeners.cjs`）：

```
document|mousedown|bubble x5
document|mousemove|bubble x3
document|mouseup|bubble x3
document|touchstart|bubble x1
document|touchmove|bubble x2
document|touchend|bubble x2
window|deviceorientation|capture x1
document|focus|capture x1
document|blur|capture x1
element:SPAN#nc_1_n1z|touchstart|bubble x1
...
```

关键点：**鼠标事件全部注册在 `document` 上（bubble 阶段）**。

本地 runtime 里发现一个真实缺陷：

```js
Document.prototype.addEventListener = addEtListener;   // 存进 etListeners
Document.prototype.dispatchEvent  → 读 nonceEventListeners  // 不匹配
```

已补上 `Document.prototype.dispatchEvent` 走 `etListeners`。

修复后 DG 调用次数**没有变化**（仍 75，浏览器 1），说明 document 监听器不是
唯一来源——还需要继续对比事件对象的形状与投递顺序。

### 2026-10-30：事件对象形状对比

浏览器里 FY 监听器收到的真实事件（`probe_event_shape.cjs`）：

```
mousemove   MouseEvent   own=["isTrusted"]  offsetX=20 offsetY=14
pointerdown PointerEvent own=["isTrusted"]  pointerId/pressure/tiltX...
mousedown   MouseEvent   own=["isTrusted"]
focus       FocusEvent   own=["isTrusted"]
```

要点：

1. 浏览器**同时**派发 `pointerdown/pointermove` 与 `mousedown/mousemove`，
   FY 对两者都注册了监听器；
2. 真实事件的**自有属性只有 `isTrusted`**，其余全在原型链上；
3. 不同类型事件的构造器不同（MouseEvent / PointerEvent / FocusEvent）。

本地已按 type 选择对应原型（`MouseEvent`/`PointerEvent`/`FocusEvent`）。
DG 调用次数仍未变化（75 vs 1），payload 3.5%。

### 下一步（按优先级）

1. 记录 `DG(zU,...)` 的**调用点 pc**（而非只记 zU），确认 70 次 `zU=13` 来自
   哪个 opcode——`DG(S,...)` 只有一个静态调用点，说明其余来自 `DG(k,...)`
   这类变量传参；
2. 对比浏览器与本地在 `mr` 内的完整 `v` 序列（已有探针 `probe_fy_v56.cjs`），
   找出第一处不同的 `v`；
3. 用该 `v` 反查它由哪个事件属性推导（很可能是 `event.type` 的枚举值）。

### 2026-10-30：DG 调用栈

DG 里 `new Error().stack` 可用（前两帧）：

```
zU=0  ← eval:1:549042
zU=13 ← eval:1:531297
```

但 eval 后的列号受所有插桩位移影响，无法直接映射回原始源码偏移，
需要先导出插桩后的源码（`input.traceFyBranch` 会写
`.playwright-cli/fy_instrumented_local.js`），再在该文件里定位列号。

### 下一步（修正后）

1. 用 `.playwright-cli/fy_instrumented_local.js` 按列号定位真实调用点；
2. 在浏览器侧用同样的插桩导出，对比两边的调用点分布；
3. 差异点即为事件投递语义的分叉处。

### 2026-10-30：调用点已映射到插桩源码

用 `.playwright-cli/fy_instrumented_local.js` 按列号定位：

| 栈列号 | 调用点 | zU |
|---|---|---|
| 531297 | `(P=56===v)&&(d[a]=DG(S,z,s,AN,Z,B))` | 13 |
| 549042 | `(P=38===v)&&(d[a]=DG(0,Z,B))` | 0 |

即本地大量 `DG(13,...)` 来自 `v===56` 分支，`DG(0,...)` 来自 `v===38`。

浏览器只调用 DG 一次（zU=5，来自 `M[3]||(DG(5,M,Z),...)`）。

**结论**：浏览器根本不进入 `v===56` / `v===38` 这两条分支，而本地反复进入。
`v` 是 `mr` 内部的寄存器，它的取值序列由事件处理推进——这就是事件投递语义
差异的直接表现。
