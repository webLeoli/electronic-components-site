#!/bin/bash
# 自动部署与更新脚本 (适用于 1Panel / 宝塔等 Linux 面板)

echo "=========================================="
echo "🚀 开始更新 FPGACenter 网站..."
echo "=========================================="

echo "📦 1. 拉取最新代码..."
git fetch --all
git reset --hard origin/master

echo "🔧 2. 安装项目依赖..."
npm install

echo "🗄️ 3. 同步数据库结构并生成客户端..."
npx prisma db push --accept-data-loss
npx prisma generate

echo "🔧 4. 修复厂商数据..."
node scripts/fix-all-manufacturers.mjs
echo "验证数据完整性..."
node scripts/ultimate-verify.mjs 2>&1 | tail -5

echo "🏗️ 5. 重新编译 Next.js 项目..."
npm run build

echo "🔄 6. 重启运行容器/服务..."
# 尝试使用 PM2 重启（如果安装了PM2）
if command -v pm2 &> /dev/null
then
    pm2 restart all || echo "⚠️ PM2 重启失败，可能是因为服务名称不同，请在1Panel手动重启。"
else
    echo "⚠️ 未检测到全局 PM2，如果使用的是 1Panel Node.js 运行环境，请到面板网站列表手动点击【重启】。"
fi

echo "=========================================="
echo "✅ 更新完成！请打开前台和后台检查。"
echo "=========================================="
