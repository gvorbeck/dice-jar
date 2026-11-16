import { useEffect } from 'react';

interface Props {
  title: string;
  description: string;
  image?: string;
  url?: string;
  // A game is unlisted, not secret: its pages tell search engines to leave it out.
  noindex?: boolean;
}

// React 19 hoists <title>, <meta> and <link> into <head>, so no head-management library is needed.
export const PageMeta = ({ title, description, image, url, noindex }: Props) => {
  // index.html keeps these tags for unfurlers that skip JS; once the page runs, ours replace them instead of duplicating.
  useEffect(() => {
    document.head.querySelectorAll('[data-static]').forEach((el) => el.remove());
  }, []);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
};
