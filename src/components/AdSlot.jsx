/**
 * AdSlot - 廣告版位元件
 * 用於在各頁面顯示贊助內容
 * placement: 'sidebar' | 'banner' | 'feed'
 */
export default function AdSlot({ ad, placement = 'feed', className }) {
  if (!ad?.enabled) return null;

  const isSidebar = placement === 'sidebar';
  const isBanner = placement === 'banner';

  const body = (
    <div style={{
      border: '1px solid #E2E8F0',
      background: '#FFFFFF',
      borderRadius: isSidebar ? 12 : 14,
      padding: isSidebar ? '14px 16px' : 16,
      display: 'flex',
      alignItems: 'center',
      gap: isSidebar ? 10 : 14,
      flexDirection: isSidebar ? 'column' : 'row',
    }}>
      {ad.imageUrl && (
        <img
          src={ad.imageUrl}
          alt=""
          style={{
            width: isSidebar ? '100%' : 120,
            height: isSidebar ? 80 : 64,
            objectFit: 'cover',
            borderRadius: 8,
          }}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#D97706', fontWeight: 900, letterSpacing: 1, marginBottom: 4 }}>
          贊助內容
        </div>
        <div style={{ fontSize: isSidebar ? 13 : 15, fontWeight: 900, color: '#111827' }}>
          {ad.title || ad.sponsorName || '合作品牌'}
        </div>
        {ad.description && (
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
            {ad.description}
          </div>
        )}
      </div>
    </div>
  );

  return ad.linkUrl
    ? <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{body}</a>
    : body;
}
