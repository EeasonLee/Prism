/**
 * 组件单元测试教学示例 - Header
 *
 * 【测试是什么】
 * 单元测试是一段自动执行的代码，用于验证你的组件/函数是否按预期工作。
 * 每次修改代码后运行测试，可以快速发现「改坏了什么」，而不必手动点页面。
 *
 * 【测试干什么】
 * - 断言（expect）：检查渲染出的 DOM 是否符合预期（有没有某个链接、按钮可点击等）
 * - 模拟交互（userEvent）：模拟用户点击、输入，再断言结果
 *
 * 【怎么用】
 * 根目录执行: pnpm test  或  nx test prism
 * 仅本次运行: pnpm test
 * 监听模式（改代码自动跑）: nx test prism --watch
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../app/components/Header';

// mock next/image：测试环境没有 Next 的图片优化，用原生 img 替代
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 测试 mock 中故意用 img 替代 next/image
    <img
      src={src ?? ''}
      alt={alt ?? ''}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

describe('Header', () => {
  // --- 基础渲染断言：页面加载后应该有什么 ---
  // 桌面 nav 和移动菜单都有 Recipes/Blog，用 getAllByRole 取多个匹配
  it('renders main nav links: Recipes and Blog', () => {
    render(<Header />);

    const recipesLinks = screen.getAllByRole('link', { name: 'Recipes' });
    const blogLinks = screen.getAllByRole('link', { name: 'Blog' });
    expect(recipesLinks.length).toBeGreaterThanOrEqual(1);
    expect(blogLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders logo with Joydeem alt text', () => {
    render(<Header />);

    const logo = screen.getByRole('img', { name: 'Joydeem' });
    expect(logo).toBeInTheDocument();
  });

  // --- 交互测试：用户点击后行为 ---
  it('opens mobile menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: 'Menu' });
    await user.click(menuButton);

    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toHaveClass('visible');
  });

  it('closes mobile menu when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('button', { name: 'Close menu' }));

    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toHaveClass('invisible');
  });

  // --- 进阶：within 限定查找范围 ---
  it('renders Recipes link inside mobile menu when open', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));

    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).not.toBeNull();
    const withinMenu = within(mobileMenu as HTMLElement);
    expect(
      withinMenu.getByRole('link', { name: 'Recipes' })
    ).toBeInTheDocument();
  });
});
