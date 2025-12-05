#!/bin/bash

#=============================================================================
# cNB 一键启动脚本
# 功能：自动检测环境、安装 Bun、安装依赖、启动开发服务器
#=============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

#=============================================================================
# 1. 系统信息检测
#=============================================================================
print_header "系统环境检测"

# 检测操作系统
OS_TYPE=$(uname -s)
ARCH=$(uname -m)

print_info "操作系统: $OS_TYPE"
print_info "系统架构: $ARCH"

# 检查是否支持的系统
case "$OS_TYPE" in
    Linux*)
        print_success "检测到 Linux 系统"
        ;;
    Darwin*)
        print_success "检测到 macOS 系统"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        print_success "检测到 Windows 系统 (Git Bash/WSL)"
        ;;
    *)
        print_warning "未知系统类型: $OS_TYPE，尝试继续..."
        ;;
esac

# 检查架构支持
case "$ARCH" in
    x86_64|amd64)
        print_success "架构支持: x86_64"
        ;;
    aarch64|arm64)
        print_success "架构支持: ARM64"
        ;;
    *)
        print_warning "未知架构: $ARCH，可能不支持 Bun"
        ;;
esac

#=============================================================================
# 2. 检查并安装 Bun
#=============================================================================
print_header "Bun 环境检查"

if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    print_success "Bun 已安装，版本: $BUN_VERSION"

    # 检查版本是否满足要求 (>=1.2.1)
    REQUIRED_VERSION="1.2.1"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$BUN_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Bun 版本满足要求 (>= $REQUIRED_VERSION)"
    else
        print_warning "Bun 版本过低，建议升级到 >= $REQUIRED_VERSION"
        read -p "是否升级 Bun? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "正在升级 Bun..."
            bun upgrade
            print_success "Bun 升级完成"
        fi
    fi
else
    print_warning "未检测到 Bun，开始安装..."

    # 根据系统选择安装方式
    if [[ "$OS_TYPE" == "Linux" ]] || [[ "$OS_TYPE" == "Darwin" ]]; then
        print_info "使用官方安装脚本安装 Bun..."
        curl -fsSL https://bun.sh/install | bash

        # 添加到 PATH
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"

        # 更新当前 shell 配置
        if [ -f "$HOME/.bashrc" ]; then
            echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.bashrc"
            echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
        fi

        if [ -f "$HOME/.zshrc" ]; then
            echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.zshrc"
            echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.zshrc"
        fi

        print_success "Bun 安装完成"

        # 验证安装
        if command -v bun &> /dev/null; then
            BUN_VERSION=$(bun --version)
            print_success "Bun 版本: $BUN_VERSION"
        else
            print_error "Bun 安装失败，请手动安装: https://bun.sh"
            exit 1
        fi
    else
        print_error "Windows 系统请访问 https://bun.sh 手动安装 Bun"
        exit 1
    fi
fi

#=============================================================================
# 3. 检查项目目录
#=============================================================================
print_header "项目目录检查"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
print_info "项目目录: $SCRIPT_DIR"

# 切换到项目目录
cd "$SCRIPT_DIR"

# 检查 package.json
if [ ! -f "package.json" ]; then
    print_error "未找到 package.json，请确认当前目录是否为项目根目录"
    exit 1
fi

print_success "找到 package.json"

#=============================================================================
# 4. 安装依赖
#=============================================================================
print_header "依赖安装"

if [ -d "node_modules" ]; then
    print_info "检测到 node_modules 目录已存在"
    read -p "是否重新安装依赖? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "正在清理旧依赖..."
        rm -rf node_modules
        rm -f bun.lockb
        print_info "正在安装依赖..."
        bun install
        print_success "依赖安装完成"
    else
        print_info "跳过依赖安装"
    fi
else
    print_info "正在安装依赖..."
    bun install
    print_success "依赖安装完成"
fi

#=============================================================================
# 5. 环境变量检查
#=============================================================================
print_header "环境变量检查"

# # 检查是否有 .env 文件
# if [ -f ".env" ]; then
#     print_success "找到 .env 文件"
#     source .env
# else
#     print_info "未找到 .env 文件（可选）"
# fi

# 取消 CI 环境变量（避免某些工具的 CI 模式）
unset CI

#=============================================================================
# 6. 端口检查
#=============================================================================
print_header "端口检查"

PORT=3000
print_info "检查端口 $PORT 是否被占用..."

if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "端口 $PORT 已被占用"
        read -p "是否终止占用进程并继续? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "正在终止占用端口的进程..."
            lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
            print_success "端口已释放"
        else
            print_info "将尝试使用其他端口启动"
        fi
    else
        print_success "端口 $PORT 可用"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep ":$PORT " >/dev/null 2>&1; then
        print_warning "端口 $PORT 可能已被占用"
    else
        print_success "端口 $PORT 可用"
    fi
else
    print_info "无法检查端口状态（lsof/netstat 未安装）"
fi

#=============================================================================
# 7. 启动开发服务器
#=============================================================================
print_header "启动开发服务器"

print_info "项目名称: nbnb"
print_info "开发服务器地址: http://localhost:$PORT"
print_info "按 Ctrl+C 停止服务器"
echo ""

# 显示启动信息
print_success "正在启动..."
echo ""

# 启动开发服务器
bun dev

# 如果服务器被停止
print_info "开发服务器已停止"
