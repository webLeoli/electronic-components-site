# QA 交接：下一步做什么

2026-08-15。上一轮工作的完整记录在 [`data-quality-audit.md`](./data-quality-audit.md)（900+ 行），
这份是给接手者的一页纸：**先跑什么、待验证什么、还剩什么没测**。

工作区有未提交改动，且**最后一批改动没有经过构建验证**（见下）。

---

## 1. 第一件事：验证未构建的鉴权改动

上一轮最后修的是一个真实安全缺口：会话 token 只验签名不查库，所以**停用账号 / 删除账号 /
降级角色在 24 小时内全部不生效**，其中 `/api/admin/users` 最严重（被停用的管理员能用旧
cookie 把自己重新启用）。

修法是给三个守卫加数据库回查并改成 async，**47 处调用点加了 `await`**。改完之后环境限制导致
无法构建，所以：

```bash
npm run build
```

- **若报错**：几乎必然是漏掉的 `await`（`requireAuth` / `requireEditor` / `requireAdmin`），
  错误会直接指到文件和行号，补上即可。已用 grep 核对过 70 处出现，但没有编译器背书。
- **通过后**，行为验证（需要一个管理员账号）：
  1. 登录后台，另开一个浏览器把该账号 `isActive` 置为 false
  2. 原会话下一次请求应立刻 **401 "Session revoked"**（修复前是 24 小时内照常可用）
  3. 遗留主管理员（用 `ADMIN_PASSWORD` 登录、userId=0）不受影响，仍应正常

## 2. 第二件事：部署门禁

```bash
BASE_URL=http://127.0.0.1:3000 node scripts/smoke-check.mjs
```

全绿即可。它覆盖的是**只在代理/CDN 后面才会坏的东西**——最重要的一条是 `%2F`：
59,869 个料号含 `/`，URL 形如 `/product/microchip/PIC16F877A-I%2FP`，
nginx 若在 `location` 块里改写 URI 会把 `%2F` 解码导致这 8% 的目录全部 404，
CDN/WAF 也常对含 `%2F` 的路径直接返回 403。README「Reverse proxy requirements」有正确配置。

生产部署时设 `HEALTH_URL`，`update.sh` 会自动跑这个门禁，失败即中止。

## 3. 还没测的面（需要能跑构建和请求）

| 面 | 具体要测什么 |
|---|---|
| 后台登录正向流程 | 用真实凭据登录 → 会话 cookie 标志（HttpOnly/Secure/SameSite）→ 登出 |
| 缓存清除接口 | `POST /api/admin/revalidate {"dataCaches": true}`（上一轮新加的，只做过代码审查） |
| BOM 文件上传 | 正常上传 / 超 10MB / 扩展名不符 / magic byte 不符（静态审过，未实跑） |
| 并发写入 | 两个后台会话同时改同一条产品；脚本与后台同时写 |
| 限流并发 | 10 个并发提交是否恰好放行 3 条（`memCheck` 是同步的，理论上无竞态，未实测） |
| 博客后台 | 发布 / 编辑 / 分类，以及生成接口 |

## 4. 环境注意事项

- **测试实例可能还开着**：上一轮起过 3001–3009 多个 `npm start`，其中 3004/3005 是故意配错
  数据库的故障注入实例。接手前先 `taskkill /F /IM node.exe`（Windows）清干净。
- **数据脚本要串行跑**，并行会互相等行锁（上一轮把写阶段从几分钟拖到 54 分钟）。
  顺序：`merge-manufacturers` → `dedupe-part-numbers` → `fix-distributor-copy` →
  `set-indexing-policy` → `compute-quality-scores` → `audit-data-quality`。
- **批量迁移后跑一次** `node scripts/compact-product-table.mjs --apply`：普通 VACUUM 不还空间，
  上一轮 66.6% 的表体积是膨胀出来的，直接让搜索慢一倍。会锁表约 9 分钟。
- **改完数据要清缓存**：`POST /api/admin/revalidate {"all": true}`，否则分类页数字最多陈旧 1 小时。

## 5. 每次批量导入后的固定动作

```bash
npm run data:audit
```

只读，检查品牌重复 / 0 产品品牌页 / 重复料号 / 经销商错误文案 / `FALLBACK_BRANDS` 过期，
有问题非零退出。**`FALLBACK_BRANDS` 那一项是因为我在改名后连续踩了两次才加的。**

## 6. 已知但未处理（需要业务判断或补数据）

- 45 组料号重复：技术规格真的不一致，需人工确认是否同一颗料
- 6,994 个薄规格页仍被索引：门槛取舍，不是 bug
- datasheet 覆盖率 0.05%、11.6 万行无价格：补数据
- 14 万页面 lastmod 集中刷新：已发生，一次性，几周内消化；**今后改文案必须分批**
- `/category`、`/search`、产品页在数据库故障时返回 500（有意保留：500 让 Google 知道
  是临时故障，比返回 200 配降级内容更安全）
