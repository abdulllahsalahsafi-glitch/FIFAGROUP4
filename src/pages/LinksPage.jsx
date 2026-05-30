import React from 'react'
import { stripIcon } from '../constants'

function LinkTileIcon({ name = '' }) {
  const value = String(name || '').replace(/\s+/g, '').toLowerCase()
  const common = { viewBox: '0 0 24 24', 'aria-hidden': 'true' }

  if (value.includes('فيس') || value.includes('facebook')) {
    return (
      <svg {...common}>
        <path d="M14 8h2V5h-2.4C10.8 5 9 6.8 9 9.5V12H7v3h2v5h3v-5h2.5l.5-3h-3V9.7c0-1 .5-1.7 2-1.7Z" />
      </svg>
    )
  }

  if (value.includes('سجل') || value.includes('بطولات') || value.includes('archive')) {
    return (
      <svg {...common}>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
        <path d="M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10" />
        <path d="M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10" />
        <path d="M12 12v4" />
        <path d="M8.5 20h7" />
        <path d="M10 16h4" />
      </svg>
    )
  }

  if (value.includes('موسم') || value.includes('نظام') || value.includes('system')) {
    return (
      <svg {...common}>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    )
  }

  if (value.includes('ثابت') || value.includes('قانون') || value.includes('rules')) {
    return (
      <svg {...common}>
        <path d="M12 4v16" />
        <path d="M5 8h14" />
        <path d="M6 8l2.5 6L11 8" />
        <path d="M13 8l2.5 6L18 8" />
      </svg>
    )
  }

  if (value.includes('جروب') || value.includes('مجموعة') || value.includes('group')) {
    return (
      <svg {...common}>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M17 12a2.5 2.5 0 1 0 0-5" />
        <path d="M14.5 19a3.8 3.8 0 0 1 6 0" />
      </svg>
    )
  }

  if (value.includes('درايف') || value.includes('drive') || value.includes('pdf')) {
    return (
      <svg {...common}>
        <path d="M4 7h6l2 2h8v10H4z" />
        <path d="M4 7V5h6l2 2" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.6 5" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.8-.8" />
    </svg>
  )
}

function LinksPage({ config, links }) {
  const linksCss = `
.linkTile > span{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;margin:0 auto 10px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#00E676;-webkit-text-fill-color:#00E676}
.linkTile > span svg{width:25px;height:25px;stroke:currentColor;stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
`;

  return (
    <main className="widePage glass">
      <style>{linksCss}</style>
      <header className="pageHead">
        <h2>{stripIcon(config.linksTitle)}</h2>
        <p>{config.linksSubtitle}</p>
      </header>
      <div className="linkGrid">
        {links.map((link, index) => (
          <a
            className="linkTile glassSoft"
            href={link.link}
            target="_blank"
            rel="noreferrer"
            key={String(index)}
          >
            <span><LinkTileIcon name={link.name} /></span>
            <b>{link.name}</b>
            <small>فتح الرابط</small>
          </a>
        ))}
      </div>
    </main>
  );
}

export default LinksPage
