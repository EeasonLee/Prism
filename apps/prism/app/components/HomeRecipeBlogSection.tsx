'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Clock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const recipes = [
  {
    id: 1,
    type: 'recipe',
    title: 'Homemade Soy Milk',
    description:
      'Learn to make creamy, fresh soy milk at home with just 2 ingredients.',
    image: '/images/recipe_1.jpg',
    time: '20 min',
    author: 'Joydeem Kitchen',
  },
  {
    id: 2,
    type: 'recipe',
    title: 'Artisan Bread Baking',
    description: 'Master the art of homemade bread with our stand mixer guide.',
    image: '/images/recipe_2.jpg',
    time: '45 min',
    author: 'Chef Maria',
  },
  {
    id: 3,
    type: 'recipe',
    title: 'Morning Smoothie Bowl',
    description:
      'Start your day with this nutrient-packed smoothie bowl recipe.',
    image: '/images/recipe_3.jpg',
    time: '10 min',
    author: 'Joydeem Kitchen',
  },
  {
    id: 4,
    type: 'recipe',
    title: 'Perfect Steamed Rice',
    description:
      'The secrets to fluffy, perfectly cooked rice every single time.',
    image: '/images/recipe_4.jpg',
    time: '30 min',
    author: 'Chef Lin',
  },
];

const blogs = [
  {
    id: 1,
    type: 'blog',
    title: '5 Essential Kitchen Appliances for Modern Living',
    excerpt:
      'Discover the must-have appliances that will transform your daily cooking routine.',
    image: '/images/blog_1.jpg',
    date: 'Jan 15, 2026',
    readTime: '5 min read',
  },
  {
    id: 2,
    type: 'blog',
    title: "The Art of Homemade Bread: A Beginner's Guide",
    excerpt:
      'Everything you need to know to start your bread-making journey at home.',
    image: '/images/blog_2.jpg',
    date: 'Jan 10, 2026',
    readTime: '8 min read',
  },
  {
    id: 3,
    type: 'blog',
    title: 'Healthy Eating: Meal Prep Tips for Busy Families',
    excerpt:
      'Simple strategies to prepare nutritious meals for the entire week.',
    image: '/images/blog_3.jpg',
    date: 'Jan 5, 2026',
    readTime: '6 min read',
  },
];

export function HomeRecipeBlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'recipes' | 'blog'>('recipes');

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const content = contentRef.current;

    if (!section || !header || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: '4vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        content,
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: content,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="recipes"
      className="relative w-full overflow-hidden bg-[#F6F6F2] py-20 lg:py-28"
    >
      <div className="w-full px-6 lg:px-[8vw]">
        <div ref={headerRef} className="mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="micro-text mb-3 block text-[#D94F25]">
                Inspiration
              </span>
              <h2
                className="text-3xl font-bold text-[#111] lg:text-4xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Recipes & Blog
              </h2>
            </div>

            <div className="flex gap-2 rounded-full bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab('recipes')}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'recipes'
                    ? 'bg-[#D94F25] text-white'
                    : 'text-[#6B6B6B] hover:text-[#111]'
                }`}
              >
                Recipes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blog')}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'blog'
                    ? 'bg-[#D94F25] text-white'
                    : 'text-[#6B6B6B] hover:text-[#111]'
                }`}
              >
                Blog
              </button>
            </div>
          </div>
        </div>

        <div ref={contentRef}>
          {activeTab === 'recipes' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recipes.map(recipe => (
                <Link
                  key={recipe.id}
                  href="/recipes"
                  className="group block overflow-hidden rounded-[24px] bg-white card-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-[#111] transition-colors group-hover:text-[#D94F25]">
                      {recipe.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-[#6B6B6B]">
                      {recipe.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#999]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {recipe.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {recipe.author}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {blogs.map(blog => (
                <Link
                  key={blog.id}
                  href="/blog"
                  className="group block overflow-hidden rounded-[24px] bg-white card-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      width={400}
                      height={250}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-3 text-xs text-[#999]">
                      <span>{blog.date}</span>
                      <span>•</span>
                      <span>{blog.readTime}</span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-[#111] transition-colors group-hover:text-[#D94F25]">
                      {blog.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-[#6B6B6B]">
                      {blog.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href={activeTab === 'recipes' ? '/recipes' : '/blog'}
              className="inline-flex items-center gap-2 font-medium text-[#D94F25] transition-all hover:gap-3"
            >
              View All {activeTab === 'recipes' ? 'Recipes' : 'Articles'}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
