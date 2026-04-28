// pages/admin.js
// Visit /admin?pw=DIT_PASSWORD for at se statistik
// Sæt ADMIN_PASSWORD i Vercel environment variables

import { useState, useEffect } from 'react';

export async function getServerSideProps({ query, req }) {
  const pw       = query.pw || '';
  const expected = process.env.ADMIN_PASSWORD || 'sommerhus2025';

  if (pw !== expected) {
    return { props: { authed: false, data: null } };
  }

  try {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    const r = async (cmd) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      });
      return (await res.json()).result;
    };

    // Last 30 days keys
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });

    const [total, log, ...dayCounts] = await Promise.all([
      r(['GET', 'sommerhus:hits:total']),
      r(['LRANGE', 'sommerhus:hits:log', 0, 49]),
      ...days.map(d => r(['GET', `sommerhus:hits:day:${d}`])),
    ]);

    const dailyData = days.map((d, i) => ({ date: d, count: parseInt(dayCounts[i]) || 0 })).reverse();
    const parsedLog = (log || []).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    return {
      props: {
        authed: true,
        data: { total: parseInt(total) || 0, daily: dailyData, log: parsedLog },
      },
    };
  } catch (e) {
    return { props: { authed: true, data: { error: e.message } } };
  }
}

export default function Admin({ authed, data }) {
  if (!authed) return (
    <div style={styles.page}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Admin</h1>
        <p style={styles.muted}>Tilføj ?pw=PASSWORD til URL'en</p>
      </div>
    </div>
  );

  if (data?.error) return (
    <div style={styles.page}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Fejl</h1>
        <p style={styles.muted}>{data.error}</p>
        <p style={styles.muted}>Tjek UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN i Vercel.</p>
      </div>
    </div>
  );

  const maxDay = Math.max(...data.daily.map(d => d.count), 1);

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <h1 style={styles.title}>Sommerhus · Besøgsstatistik</h1>
          <p style={styles.muted}>gaarsdal.net/sommerhus</p>
        </div>

        {/* TOTAL */}
        <div style={styles.statBox}>
          <div style={styles.bigNum}>{data.total.toLocaleString('da-DK')}</div>
          <div style={styles.statLabel}>Sidevisninger i alt</div>
        </div>

        {/* DAILY CHART */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Seneste 30 dage</h2>
          <div style={styles.chart}>
            {data.daily.map(d => (
              <div key={d.date} style={styles.barCol} title={`${d.date}: ${d.count}`}>
                <div style={{ ...styles.bar, height: `${Math.max(2, (d.count / maxDay) * 100)}%`, opacity: d.count ? 1 : 0.2 }} />
                {d.count > 0 && <div style={styles.barCount}>{d.count}</div>}
                <div style={styles.barDate}>{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LOG */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Seneste 50 besøg</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Tidspunkt', 'IP', 'Kilde', 'Browser'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.log.map((hit, i) => (
                <tr key={i} style={{ background: i % 2 ? '#f9f9f9' : '#fff' }}>
                  <td style={styles.td}>{new Date(hit.ts).toLocaleString('da-DK')}</td>
                  <td style={styles.td}>{hit.ip}</td>
                  <td style={styles.td}>{hit.ref ? new URL(hit.ref).hostname : '–'}</td>
                  <td style={styles.td}>{hit.ua.split(' ').slice(0,3).join(' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#f5f0e8', fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem' },
  inner:     { maxWidth: 900, margin: '0 auto' },
  loginBox:  { maxWidth: 400, margin: '20vh auto', textAlign: 'center' },
  header:    { marginBottom: '2rem' },
  title:     { fontSize: '1.8rem', color: '#2B5F3E', margin: '0 0 .25rem' },
  muted:     { color: '#888', fontSize: '.9rem' },
  statBox:   { background: '#2B5F3E', color: '#fff', borderRadius: 12, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' },
  bigNum:    { fontSize: '4rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { opacity: .75, marginTop: '.5rem', fontSize: '.9rem', letterSpacing: '.1em', textTransform: 'uppercase' },
  card:      { background: '#fff', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,.06)' },
  cardTitle: { fontSize: '1rem', color: '#2B5F3E', marginBottom: '1.25rem', fontWeight: 600 },
  chart:     { display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingBottom: 28 },
  barCol:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' },
  bar:       { width: '100%', background: '#2B5F3E', borderRadius: '3px 3px 0 0', transition: 'height .3s' },
  barCount:  { fontSize: 9, color: '#555', position: 'absolute', top: -14 },
  barDate:   { fontSize: 8, color: '#aaa', position: 'absolute', bottom: -18, whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top left' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' },
  th:        { textAlign: 'left', padding: '.5rem .75rem', background: '#f5f0e8', color: '#555', fontWeight: 600, fontSize: '.75rem', letterSpacing: '.06em' },
  td:        { padding: '.45rem .75rem', color: '#444', borderBottom: '1px solid #f0f0f0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
