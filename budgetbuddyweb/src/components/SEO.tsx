import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  children?: ReactNode;
}

/**
 * SEO Component for better search engine optimization
 * Lightweight alternative (React 19 compatible)
 * Uses vanilla DOM manipulation instead of react-helmet
 */
export const SEO = ({
  title = 'BudgetBuddy',
  description = 'AI-powered personal finance and budgeting application. Track expenses, set goals, and get smart financial recommendations.',
  keywords = 'budget, finance, expense tracker, financial goals, AI recommendations, money management',
  ogImage = '/og-image.png',
  canonical,
  children,
}: SEOProps) => {
  const fullTitle = title === 'BudgetBuddy' ? title : `${title} | BudgetBuddy`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Create or update meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'BudgetBuddy Team' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: fullTitle },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: ogImage },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });

    // Handle canonical URL
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute('href', canonical);
    }
  }, [fullTitle, description, keywords, ogImage, canonical]);

  return <>{children}</>;
};
