# YCHub

自托管的文件管理面板：在浏览器里浏览、上传、预览、编辑 NAS 上的文件。

YCHub 从 [File Browser](https://github.com/filebrowser/filebrowser) 的最后一个版本继续开发。上游已于 2026-09-01 归档，本仓库在此源码基础上继续演进：重做前端界面，并按需增加后端能力。

## 目录

```
app/
├─ cmd/          命令行入口与配置
├─ http/         HTTP 接口
├─ files/        文件信息与列表
├─ auth/         认证方式
├─ settings/     配置模型
├─ share/        分享链接
├─ storage/      Bolt 存储
├─ frontend/     Vue 3 + Vite 前端
└─ main.go
```

## 构建

后端（Go ≥ 1.25）：

```bash
go build ./...
go test ./...
```

前端（Node ≥ 22）：

```bash
cd frontend
npm install
npm run build
```

前端产物会嵌入后端二进制；开发时用 `npm run dev` 起 Vite，接口走 `/api` 代理。

## 运行

```bash
./ychub -d ychub.db -r /path/to/files -a 0.0.0.0 -p 8080
```

首次使用先初始化数据库并创建账号：

```bash
./ychub -d ychub.db config init
./ychub -d ychub.db users add admin <密码> --perm.admin
```

## 许可

沿用上游的 Apache-2.0 许可证，见 [LICENSE](LICENSE)。
