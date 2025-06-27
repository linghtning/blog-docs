#!/bin/bash

# 第3-4周功能验证脚本
# 用于自动化测试用户认证系统

echo "🚀 开始第3-4周功能验证..."
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 基础URL
BASE_URL="http://localhost:3000"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果记录
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 检查服务是否运行
echo "📋 1. 检查服务状态..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"
test_result $? "服务器运行状态检查"

# 测试静态页面访问
echo -e "\n📋 2. 测试页面访问..."

# 首页
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200"
test_result $? "首页访问"

# 登录页面
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" | grep -q "200"
test_result $? "登录页面访问"

# 注册页面
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/register" | grep -q "200"
test_result $? "注册页面访问"

# 测试用户注册API
echo -e "\n📋 3. 测试用户注册功能..."

# 生成随机测试用户
RANDOM_ID=$(date +%s)
TEST_USER="testuser$RANDOM_ID"
TEST_EMAIL="test$RANDOM_ID@example.com"

# 正常注册测试
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USER\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test123\"
  }" \
  -w "%{http_code}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -c 4)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -c -4)

if [ "$HTTP_CODE" = "201" ] && echo "$RESPONSE_BODY" | grep -q "success.*true"; then
    test_result 0 "用户注册成功"
else
    test_result 1 "用户注册失败 (HTTP: $HTTP_CODE)"
fi

# 重复邮箱注册测试
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${TEST_USER}2\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test123\"
  }" \
  -w "%{http_code}")

DUPLICATE_HTTP_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -c 4)
DUPLICATE_BODY=$(echo "$DUPLICATE_RESPONSE" | head -c -4)

if [ "$DUPLICATE_HTTP_CODE" = "400" ] && echo "$DUPLICATE_BODY" | grep -q "EMAIL_EXISTS"; then
    test_result 0 "重复邮箱验证"
else
    test_result 1 "重复邮箱验证失败"
fi

# 无效密码测试
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser$(date +%s)\",
    \"email\": \"test$(date +%s)@example.com\",
    \"password\": \"123\"
  }" \
  -w "%{http_code}")

INVALID_HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -c 4)
INVALID_BODY=$(echo "$INVALID_RESPONSE" | head -c -4)

if [ "$INVALID_HTTP_CODE" = "400" ] && echo "$INVALID_BODY" | grep -q "VALIDATION_ERROR"; then
    test_result 0 "密码验证"
else
    test_result 1 "密码验证失败"
fi

# 测试速率限制
echo -e "\n📋 4. 测试安全功能..."

# 发送多个快速请求测试速率限制
RATE_LIMIT_COUNT=0
for i in {1..6}; do
    RATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"ratetest$i$(date +%s)\",
        \"email\": \"ratetest$i$(date +%s)@example.com\",
        \"password\": \"test123\"
      }" \
      -w "%{http_code}")
    
    RATE_HTTP_CODE=$(echo "$RATE_RESPONSE" | tail -c 4)
    if [ "$RATE_HTTP_CODE" = "429" ]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
    fi
    sleep 0.1
done

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    test_result 0 "API速率限制"
else
    test_result 1 "API速率限制未生效"
fi

# 测试输入验证
echo -e "\n📋 5. 测试输入验证..."

# SQL注入测试
SQL_INJECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin\"; DROP TABLE users; --",
    "email": "test@example.com",
    "password": "test123"
  }' \
  -w "%{http_code}")

SQL_HTTP_CODE=$(echo "$SQL_INJECTION_RESPONSE" | tail -c 4)
if [ "$SQL_HTTP_CODE" = "400" ]; then
    test_result 0 "SQL注入防护"
else
    test_result 1 "SQL注入防护可能存在问题"
fi

# 无效邮箱格式测试
EMAIL_VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "test123"
  }' \
  -w "%{http_code}")

EMAIL_HTTP_CODE=$(echo "$EMAIL_VALIDATION_RESPONSE" | tail -c 4)
if [ "$EMAIL_HTTP_CODE" = "400" ]; then
    test_result 0 "邮箱格式验证"
else
    test_result 1 "邮箱格式验证失败"
fi

# 测试API响应时间
echo -e "\n📋 6. 测试性能指标..."

# 测试首页响应时间
START_TIME=$(date +%s%N)
curl -s "$BASE_URL/" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000))

if [ $RESPONSE_TIME -lt 2000 ]; then
    test_result 0 "首页响应时间 (${RESPONSE_TIME}ms)"
else
    test_result 1 "首页响应时间过慢 (${RESPONSE_TIME}ms)"
fi

# 测试API响应时间
START_TIME=$(date +%s%N)
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"perftest$(date +%s)\",
    \"email\": \"perftest$(date +%s)@example.com\",
    \"password\": \"test123\"
  }" > /dev/null
END_TIME=$(date +%s%N)
API_RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000))

if [ $API_RESPONSE_TIME -lt 1000 ]; then
    test_result 0 "API响应时间 (${API_RESPONSE_TIME}ms)"
else
    test_result 1 "API响应时间过慢 (${API_RESPONSE_TIME}ms)"
fi

# 显示测试结果统计
echo -e "\n📊 测试结果统计"
echo "================================"
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "通过率: ${PASS_RATE}%"
    
    if [ $PASS_RATE -ge 80 ]; then
        echo -e "\n${GREEN}🎉 验证通过！第3-4周功能基本就绪${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  验证部分通过，需要修复失败的测试项${NC}"
        exit 1
    fi
else
    echo -e "\n${RED}❌ 未能执行任何测试${NC}"
    exit 1
fi 