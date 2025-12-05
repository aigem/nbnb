#!/bin/bash

#=============================================================================
# Claude Code 启动脚本
# 从 .env 文件读取配置
#=============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
print_info "Claude Code 启动脚本"
echo ""

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    print_error "未找到 .env 文件！"
    echo ""
    print_info "请按照以下步骤操作："
    echo ""
    echo "  1. 复制 .env.example 为 .env"
    echo -e "     ${YELLOW}cp .env.example .env${NC}"
    echo ""
    echo "  2. 编辑 .env 文件，填入你的配置："
    echo "     - ANTHROPIC_AUTH_TOKEN: 你的 API Key"
    echo "     - ANTHROPIC_BASE_URL: API 基础 URL"
    echo ""
    echo -e "  3. 获取 API Key: ${BLUE}https://api.kuai.host/register?aff=z2C8${NC}"
    echo ""
    exit 1
fi

# 加载 .env 文件
print_info "正在加载 .env 配置..."
set -a  # 自动导出所有变量
source .env
set +a

# 验证必需的环境变量
if [ -z "$ANTHROPIC_AUTH_TOKEN" ] || [ "$ANTHROPIC_AUTH_TOKEN" = "your_api_key_here" ]; then
    print_error "ANTHROPIC_AUTH_TOKEN 未设置或使用了默认值！"
    echo ""
    print_info "请编辑 .env 文件，设置你的真实 API Key"
    echo -e "  获取地址: ${BLUE}https://api.kuai.host/register?aff=z2C8${NC}"
    echo ""
    exit 1
fi

if [ -z "$ANTHROPIC_BASE_URL" ]; then
    print_warning "ANTHROPIC_BASE_URL 未设置，使用默认值"
    export ANTHROPIC_BASE_URL="https://api.kuai.host"
fi

print_success "配置加载成功"
echo ""

# 显示配置信息（隐藏敏感信息）
print_info "配置信息："
echo "  - API Key: ${ANTHROPIC_AUTH_TOKEN:0:10}...（已隐藏）"
echo "  - Base URL: $ANTHROPIC_BASE_URL"
echo ""

# 取消 CI 环境变量
unset CI

# 确保工作目录存在
# mkdir -p /workspace/project
cd /workspaces/nbnb/nb-app

# 检查 claude-code 是否已安装
if ! command -v claude &> /dev/null; then
    print_info "正在安装 @anthropic-ai/claude-code..."
    npm install -g @anthropic-ai/claude-code
    print_success "安装完成"
else
    print_success "claude-code 已安装"
fi

echo ""
print_success "正在启动 Claude Code..."
echo ""

# 启动 Claude Code
claude
