# Prism项目开发指南

> 版本：v1.0.0  
> 更新时间：2025-08-08  
> 适用对象：项目开发者

## 📋 目录

- [开发环境准备](#开发环境准备)
- [日常开发流程](#日常开发流程)
- [代码规范](#代码规范)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

---

## 🛠️ 开发环境准备

### 1. 环境要求

**必需软件：**
- **Node.js**: 18.0.0+ (推荐使用Volta管理)
- **pnpm**: 8.0.0+ (包管理器)
- **Git**: 2.30.0+ (版本控制)
- **VS Code**: 1.80.0+ (推荐编辑器)

**推荐插件：**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 2. 项目启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd Prism

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
npx nx serve prism

# 4. 访问应用
# http://localhost:4200
```

### 3. 开发工具配置

**VS Code设置 (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

---

## 🚀 日常开发流程

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/user-management

# 2. 开发功能
# - 编写组件
# - 添加样式
# - 编写测试

# 3. 代码检查
npx nx lint prism
npx nx typecheck prism

# 4. 提交代码
git add .
git commit -m "feat: 添加用户管理功能"

# 5. 推送分支
git push origin feature/user-management

# 6. 创建PR/MR
# 在GitHub/GitLab上创建Pull Request
```

### 2. 组件开发流程

**步骤1：创建组件**
```bash
# 生成新组件
npx nx generate @nx/react:component UserCard --project=prism --export
```

**步骤2：编写组件**
```tsx
// apps/prism/src/app/components/user-card/user-card.tsx
import { FC } from 'react';

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
}

export const UserCard: FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.name}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              编辑
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(user.id)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

**步骤3：导出组件**
```tsx
// apps/prism/src/app/components/user-card/index.ts
export { UserCard } from './user-card';
export type { UserCardProps } from './user-card';
```

**步骤4：使用组件**
```tsx
// apps/prism/src/app/app.tsx
import { UserCard } from './components/user-card';

const mockUser = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: '/avatars/zhangsan.jpg'
};

function App() {
  const handleEdit = (user: User) => {
    console.log('编辑用户:', user);
  };

  const handleDelete = (userId: number) => {
    console.log('删除用户:', userId);
  };

  return (
    <div className="p-6">
      <UserCard
        user={mockUser}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

### 3. 页面开发流程

**步骤1：创建页面组件**
```bash
# 生成页面组件
npx nx generate @nx/react:component UserList --project=prism --export
```

**步骤2：配置路由**
```tsx
// apps/prism/src/app/app.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserList } from './components/user-list';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          {/* 导航栏 */}
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:id" element={<UserDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

## 📏 代码规范

### 1. TypeScript规范

**类型定义：**
```typescript
// ✅ 好的做法
interface User {
  id: number;
  name: string;
  email: string;
  isActive?: boolean; // 可选属性
}

// ❌ 避免的做法
interface User {
  id: any;
  name: string;
  email: string;
}
```

**函数类型：**
```typescript
// ✅ 好的做法
const handleUserClick = (user: User): void => {
  console.log('用户点击:', user);
};

// ❌ 避免的做法
const handleUserClick = (user: any) => {
  console.log('用户点击:', user);
};
```

### 2. React规范

**组件命名：**
```tsx
// ✅ 好的做法 - PascalCase
export const UserCard: FC<UserCardProps> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ❌ 避免的做法 - camelCase
export const userCard: FC<UserCardProps> = ({ user }) => {
  return <div>{user.name}</div>;
};
```

**Hooks使用：**
```tsx
// ✅ 好的做法
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('获取用户失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      {loading ? (
        <div>加载中...</div>
      ) : (
        users.map(user => <UserCard key={user.id} user={user} />)
      )}
    </div>
  );
}
```

### 3. CSS规范

**Tailwind使用：**
```tsx
// ✅ 好的做法 - 语义化类名
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">用户列表</h2>
  <div className="space-y-4">
    {users.map(user => (
      <UserCard key={user.id} user={user} />
    ))}
  </div>
</div>

// ❌ 避免的做法 - 内联样式
<div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px' }}>
  <h2 style={{ fontSize: '20px', fontWeight: '600' }}>用户列表</h2>
</div>
```

**自定义样式：**
```css
/* apps/prism/src/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义组件样式 */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

---

## 🐛 调试技巧

### 1. React DevTools

**安装：**
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**使用技巧：**
- 查看组件树结构
- 检查组件props和state
- 性能分析
- 组件重渲染分析

### 2. 浏览器调试

**Console调试：**
```typescript
// 开发环境调试
if (process.env.NODE_ENV === 'development') {
  console.log('用户数据:', users);
  console.table(users); // 表格形式显示
}
```

**断点调试：**
```typescript
// 在代码中添加断点
function handleUserClick(user: User) {
  debugger; // 浏览器会在这里暂停
  console.log('用户点击:', user);
}
```

### 3. 网络调试

**API调试：**
```typescript
// 使用fetch调试
const response = await fetch('/api/users');
console.log('响应状态:', response.status);
console.log('响应头:', response.headers);
const data = await response.json();
console.log('响应数据:', data);
```

### 4. 性能调试

**React Profiler：**
```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`组件 ${id} 渲染时间: ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <UserList />
    </Profiler>
  );
}
```

---

## ⚡ 性能优化

### 1. React优化

**避免不必要的重渲染：**
```tsx
// ✅ 好的做法 - 使用React.memo
const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// ✅ 好的做法 - 使用useCallback
const handleEdit = useCallback((user: User) => {
  console.log('编辑用户:', user);
}, []);

// ✅ 好的做法 - 使用useMemo
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

**懒加载组件：**
```tsx
// ✅ 好的做法 - 懒加载
const UserDetail = lazy(() => import('./components/user-detail'));

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Route path="/users/:id" element={<UserDetail />} />
    </Suspense>
  );
}
```

### 2. 构建优化

**代码分割：**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns'],
        },
      },
    },
  },
});
```

**图片优化：**
```tsx
// ✅ 好的做法 - 使用WebP格式
<img
  src="/images/user-avatar.webp"
  alt="用户头像"
  loading="lazy"
  className="w-12 h-12 rounded-full"
/>

// ✅ 好的做法 - 响应式图片
<img
  srcSet="/images/avatar-300.webp 300w, /images/avatar-600.webp 600w"
  sizes="(max-width: 600px) 300px, 600px"
  src="/images/avatar-600.webp"
  alt="用户头像"
/>
```

---

## ❓ 常见问题

### 1. 构建问题

**Q: 构建时出现TypeScript错误**
```bash
# 解决方案
npx nx typecheck prism
# 根据错误信息修复类型问题
```

**Q: 热更新不工作**
```bash
# 解决方案
# 1. 检查文件是否在正确的目录
# 2. 重启开发服务器
npx nx serve prism
# 3. 清除缓存
rm -rf .nx/cache
```

### 2. 依赖问题

**Q: 依赖安装失败**
```bash
# 解决方案
# 1. 清除缓存
pnpm store prune
# 2. 删除node_modules
rm -rf node_modules
# 3. 重新安装
pnpm install
```

**Q: 版本冲突**
```bash
# 解决方案
# 1. 查看依赖树
pnpm list
# 2. 更新依赖
pnpm update
# 3. 检查peer dependencies
pnpm install --fix-lockfile
```

### 3. 开发问题

**Q: ESLint错误太多**
```bash
# 解决方案
# 1. 自动修复
npx nx lint prism --fix
# 2. 忽略特定文件
# 在.eslintignore中添加文件路径
```

**Q: Tailwind样式不生效**
```bash
# 解决方案
# 1. 检查配置文件
cat apps/prism/tailwind.config.js
# 2. 重启开发服务器
npx nx serve prism
# 3. 清除缓存
rm -rf .nx/cache
```

---

## 🎯 最佳实践

### 1. 项目结构

**推荐的目录结构：**
```
apps/prism/src/
├── app/                    # 应用组件
│   ├── components/        # 共享组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义Hooks
│   ├── utils/            # 工具函数
│   ├── types/            # 类型定义
│   └── constants/        # 常量定义
├── assets/               # 静态资源
└── styles/              # 样式文件
```

### 2. 组件设计

**组件设计原则：**
- **单一职责** - 每个组件只做一件事
- **可复用性** - 组件应该可以在不同地方使用
- **可测试性** - 组件应该易于测试
- **可维护性** - 组件应该易于理解和修改

**组件分类：**
```tsx
// 1. 展示组件 (Presentational Components)
const UserAvatar = ({ user }: { user: User }) => (
  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
);

// 2. 容器组件 (Container Components)
const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    // 数据获取逻辑
  }, []);
  
  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
};

// 3. 高阶组件 (Higher-Order Components)
const withLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & { loading?: boolean }) => {
    if (props.loading) {
      return <div>加载中...</div>;
    }
    return <Component {...(props as P)} />;
  };
};
```

### 3. 状态管理

**本地状态：**
```tsx
// 使用useState管理简单状态
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
```

**复杂状态：**
```tsx
// 使用useReducer管理复杂状态
interface State {
  users: User[];
  loading: boolean;
  error: string | null;
}

type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; payload: string };

const userReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, users: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
```

### 4. 错误处理

**错误边界：**
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>出现错误，请刷新页面重试。</div>;
    }

    return this.props.children;
  }
}
```

---

## 📚 学习资源

### 官方文档
- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [Vite官方文档](https://vitejs.dev/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)

### 推荐书籍
- 《React学习手册》
- 《TypeScript编程》
- 《现代JavaScript教程》

### 在线课程
- React官方教程
- TypeScript入门课程
- 前端工程化实践

---

*本文档将随着项目发展持续更新*
