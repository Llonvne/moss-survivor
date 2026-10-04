# Moss Survivor · 苔原幸存者

一个可在电脑和手机浏览器游玩的像素生存 Rogue 小样。使用 **Phaser 3 + TypeScript + Vite**，纯前端运行。

## 玩法

- 电脑：WASD / 方向键移动，Esc 暂停。
- 手机：拖动左下角摇杆移动，顶部按钮暂停。
- 法杖自动瞄准最近的敌人；拾取蓝色晶石获得经验。
- 升级时从三种随机强化中选择一种，选择期间战斗暂停。
- 三种普通敌人；4:15 出现古木守卫。击败守卫并存活至 5:00 通关；到 5:00 时守卫仍存活则继续战斗。
- 倒下后可以立即重开。音效默认关闭，可手动开启。切换标签页或离开窗口会自动暂停。

## 开发

需要 Node.js 22.6+（推荐 Node.js 24）和 npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`dist/` 是可部署到 Sites 的静态输出，不依赖服务器端服务。`.openai/hosting.json` 保存 Sites 项目标识，不包含凭据。GitHub 保存源码；Sites 的源码镜像和部署由发布流程单独同步。

## 结构

- `src/model.ts`：独立于渲染的战斗、经验、升级、Boss 与胜负状态。
- `src/scene.ts`：Phaser 场景、键盘输入、镜头和渲染。
- `src/art.ts`：原创像素角色与地面纹理，在本地生成，无外部素材请求。
- `src/main.ts`：中文界面、触屏摇杆、可选音效、暂停和结果面板。
- `tests/model.test.ts`：游戏逻辑测试。
- `tests/browser-smoke.cjs`：使用 Playwright 的桌面和移动端冒烟检查。运行前启动开发服务器；提供 Playwright 模块位置 `PLAYWRIGHT_MODULE` 和 Chromium 路径 `CHROMIUM_PATH`，或在本地安装 Playwright。

可选的浏览器 WebMCP 接口支持读取本局状态、暂停和选择升级，不支持的浏览器不受影响。

## 原型范围

目前是一张地图、一个角色、8 种可叠加强化、三种普通怪物和一个 Boss。每局重新开始，不保存进度；不含联网、账号、原生安装包或主机平台版本。手机检查使用浏览器触屏模拟，实际设备性能仍取决于机型。
