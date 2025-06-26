# 第二周任务验证指南

## 📋 验证清单

### 1. 环境配置验证

#### 1.1 Node.js 环境检查
```bash
# 检查 Node.js 版本 (需要 >= 18.0.0)
node --version

# 检查 pnpm 版本 (需要 >= 8.0.0)
pnpm --version
```
**预期结果**: 版本号符合要求

#### 1.2 项目依赖安装
```bash
# 安装项目依赖
pnpm install

# 检查是否有漏洞
pnpm audit
```
**预期结果**: 依赖安装成功，无严重漏洞

### 2. 开发环境验证

#### 2.1 Docker 环境验证
```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 检查容器状态
docker-compose -f docker-compose.dev.yml ps
```
**预期结果**: 所有服务状态为 "Up"
```
      Name                    Command               State           Ports
--------------------------------------------------------------------------------
blog-mysql-dev     docker-entrypoint.sh mysqld      Up      0.0.0.0:3306->3306/tcp
blog-redis-dev     docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
blog-adminer-dev   entrypoint.sh php -S 0.0. ...   Up      0.0.0.0:8080->8080/tcp
blog-redis-commander-dev                            Up      0.0.0.0:8081->8081/tcp
```

#### 2.2 数据库连接验证
```bash
# 设置环境变量
cp env.example .env.local

# 编辑 .env.local 文件，设置数据库连接
# DATABASE_URL="mysql://bloguser:blogpassword@localhost:3306/blog_platform"

# 生成 Prisma 客户端
pnpm run db:generate

# 推送数据库架构
pnpm run db:push
```
**预期结果**: 数据库连接成功，表结构创建完成

#### 2.3 数据库管理界面验证
访问以下地址验证管理界面：

- **Adminer**: http://localhost:8080
  - 服务器: `mysql`
  - 用户名: `bloguser`
  - 密码: `blogpassword`
  - 数据库: `blog_platform`

- **Redis Commander**: http://localhost:8081

**预期结果**: 能正常访问管理界面，看到数据库表结构

### 3. 项目启动验证

#### 3.1 开发服务器启动
```bash
# 启动开发服务器
pnpm run dev
```
**预期结果**: 
- 编译成功，无错误
- 服务器在 http://localhost:3000 启动
- 控制台显示 "Ready in X ms"

#### 3.2 首页访问验证
访问 http://localhost:3000

**预期结果**: 
- 页面正常加载
- 显示"欢迎来到博客平台"标题
- 看到平台特色卡片
- 样式正常显示

### 4. 代码质量工具验证

#### 4.1 ESLint 检查
```bash
# 运行代码检查
pnpm run lint
```
**预期结果**: 无 ESLint 错误

#### 4.2 TypeScript 类型检查
```bash
# 运行类型检查
pnpm run type-check
```
**预期结果**: 无 TypeScript 类型错误

#### 4.3 代码格式化验证
```bash
# 运行代码格式化
pnpm run lint:fix
```
**预期结果**: 代码格式符合 Prettier 规范

### 5. 构建验证

#### 5.1 生产构建
```bash
# 构建生产版本
pnpm run build
```
**预期结果**: 
- 构建成功
- 生成 `.next` 目录
- 无构建错误

#### 5.2 生产服务器启动
```bash
# 启动生产服务器
pnpm start
```
**预期结果**: 生产服务器正常启动，页面可访问

### 6. Git 和开发规范验证

#### 6.1 Git Hooks 验证
```bash
# 安装 Git hooks
pnpm run prepare

# 创建测试提交验证 hooks
echo "// test" >> test.js
git add test.js
git commit -m "test: 验证 git hooks"
```
**预期结果**: 
- Husky hooks 安装成功
- 提交前自动运行 lint-staged
- 代码格式化和检查正常

#### 6.2 提交规范验证
尝试不符合规范的提交：
```bash
git commit -m "bad commit message"
```
**预期结果**: 提交被拒绝或收到警告

### 7. 配置文件验证

#### 7.1 检查所有配置文件存在
```bash
ls -la | grep -E "\.(json|js|ts|yml|yaml)$"
```
**预期文件列表**:
- `package.json` ✅
- `next.config.js` ✅
- `tsconfig.json` ✅
- `tailwind.config.js` ✅
- `postcss.config.js` ✅
- `.eslintrc.json` ✅
- `.prettierrc` ✅
- `docker-compose.dev.yml` ✅
- `Dockerfile` ✅

#### 7.2 检查项目结构
```bash
tree src -I node_modules
```
**预期结构**:
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── redis.ts
│   └── utils.ts
└── types/
    └── index.ts
```

### 8. 功能组件验证

#### 8.1 UI 组件测试
创建测试页面验证组件：

```typescript
// 临时测试文件: src/app/test/page.tsx
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function TestPage() {
  return (
    <div className="container mx-auto p-8 space-y-4">
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Input label="测试输入框" placeholder="请输入内容" />
      <Card>
        <p>测试卡片内容</p>
      </Card>
    </div>
  )
}
```

访问 http://localhost:3000/test 验证组件显示正常。

### 9. 性能验证

#### 9.1 页面加载性能
```bash
# 使用 Lighthouse 或开发者工具检查
# 首页加载时间应该 < 2秒
# Core Web Vitals 指标良好
```

#### 9.2 构建产物分析
```bash
# 分析构建产物大小
pnpm run build
# 检查 .next/static 目录大小
du -sh .next/static
```

### 10. CI/CD 验证

#### 10.1 GitHub Actions 配置验证
检查 `.github/workflows/ci.yml` 文件：
- ✅ 工作流配置正确
- ✅ 包含所有必要步骤
- ✅ 环境变量配置合理

#### 10.2 推送代码触发 CI
```bash
# 推送代码到 GitHub
git push origin main
```
**预期结果**: GitHub Actions 自动运行，所有检查通过

## 🎯 验证成功标准

### 必须通过的验证项 (关键路径)
- [x] Node.js 和 pnpm 版本符合要求
- [x] Docker 环境正常运行
- [x] 数据库连接成功
- [x] 开发服务器正常启动
- [x] 首页正常访问
- [x] 代码质量检查通过
- [x] 生产构建成功

### 推荐通过的验证项 (质量保证)
- [x] Git hooks 正常工作
- [x] UI 组件正常显示
- [x] 管理界面可访问
- [x] 性能指标良好
- [x] CI/CD 流水线运行

## 🚨 常见问题排查

### 1. 数据库连接失败
```bash
# 检查 Docker 容器状态
docker-compose logs mysql

# 检查端口占用
lsof -i :3306

# 重启数据库容器
docker-compose restart mysql
```

### 2. Redis 连接失败
```bash
# 检查 Redis 容器状态
docker-compose logs redis

# 测试 Redis 连接
redis-cli ping
```

### 3. 端口冲突
```bash
# 检查端口占用情况
lsof -i :3000  # Next.js
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
lsof -i :8080  # Adminer
lsof -i :8081  # Redis Commander
```

### 4. 依赖安装问题
```bash
# 清理缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 检查 Node.js 版本兼容性
nvm use 18
```

### 5. TypeScript 类型错误
```bash
# 重新生成 Prisma 客户端
pnpm run db:generate

# 重启 TypeScript 服务
# VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

## ✅ 验证完成

完成所有验证后，你应该能够确认：

1. **开发环境** 已正确搭建并可正常使用
2. **项目架构** 完整且符合设计要求
3. **代码质量** 工具配置正确并正常工作
4. **CI/CD 流水线** 配置完整并能自动运行
5. **基础组件** 可正常使用和扩展
6. **数据库和缓存** 连接正常并可管理

**🎉 恭喜！第二周的基础架构搭建任务验证成功！**

现在可以安全地进入第三周的核心功能开发阶段。 