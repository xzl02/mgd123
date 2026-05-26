# 部署到 GitHub Pages

目标：把 `果冻的求职之路` 部署成公开网站，并用 GitHub Actions 每 6 小时监控一次招聘公告。

## 1. 创建仓库

在 GitHub 新建一个仓库，建议名字：

```text
mgd123
```

仓库建议设为 Public。GitHub Pages 对公开仓库最省事。

## 2. 上传这些文件

把当前项目根目录里的内容上传到仓库，至少需要：

```text
mgd123/
scripts/
monitor_config.json
.github/workflows/
DEPLOY.md
```

## 3. 开启 GitHub Pages

进入仓库：

```text
Settings
Pages
Build and deployment
Source: GitHub Actions
```

然后运行 `Deploy Pages` workflow。

如果仓库名是 `mgd123`，公开地址通常是：

```text
https://你的GitHub用户名.github.io/mgd123/
```

## 4. 配置 QQ 邮箱通知

进入仓库：

```text
Settings
Secrets and variables
Actions
New repository secret
```

添加三个 Secret：

```text
QQ_EMAIL       你的 QQ 邮箱地址
QQ_SMTP_CODE   QQ 邮箱 SMTP 授权码，不是 QQ 密码
NOTIFY_TO      接收提醒的邮箱，可以还是你的 QQ 邮箱
```

QQ 邮箱授权码一般在：

```text
QQ 邮箱网页版
设置
账户
开启 POP3/SMTP 服务
生成授权码
```

## 5. 启动监控

进入：

```text
Actions
Job Monitor
Run workflow
```

之后 GitHub Actions 会每 6 小时运行一次。

监控结果会写入：

```text
mgd123/data/announcements.json
```

网站会读取这个文件并显示云端监控公告。

## 注意

- 自动监控是 best-effort。招聘网站经常使用动态页面或反爬策略，脚本可能抓不到所有内容。
- 第三方搜索结果只能作为线索，报名时间和入口必须回到官方公告核验。
- 不要把 QQ 邮箱授权码写进代码或公开仓库，只能放 GitHub Secrets。
