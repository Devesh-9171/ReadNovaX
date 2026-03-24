<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  <xsl:output method="html" version="5.0" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ReadNovaX Sitemap</title>
        <style>
          :root {
            color-scheme: light;
            --page-bg: #f4f7fb;
            --card-bg: #ffffff;
            --text-primary: #122033;
            --text-secondary: #526173;
            --border: #d8e1ee;
            --accent: #2563eb;
            --accent-soft: rgba(37, 99, 235, 0.08);
            --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at top, rgba(37, 99, 235, 0.08), transparent 32%),
              var(--page-bg);
            color: var(--text-primary);
          }

          .page {
            max-width: 1120px;
            margin: 0 auto;
            padding: 32px 20px 48px;
          }

          .hero {
            margin-bottom: 24px;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            background: var(--accent-soft);
            color: var(--accent);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0 0 10px;
            font-size: clamp(2rem, 3vw, 2.75rem);
            line-height: 1.1;
          }

          .description {
            max-width: 72ch;
            margin: 0;
            color: var(--text-secondary);
            font-size: 1rem;
            line-height: 1.6;
          }

          .card {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: var(--card-bg);
            box-shadow: var(--shadow);
          }

          .table-wrap {
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 680px;
          }

          thead th {
            position: sticky;
            top: 0;
            z-index: 1;
            padding: 16px 20px;
            text-align: left;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--text-secondary);
            background: #eef4ff;
            border-bottom: 1px solid var(--border);
          }

          tbody td {
            padding: 18px 20px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          tbody tr:nth-child(even) {
            background: rgba(148, 163, 184, 0.06);
          }

          tbody tr:hover {
            background: rgba(37, 99, 235, 0.05);
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          a {
            color: var(--accent);
            text-decoration: none;
            word-break: break-word;
          }

          a:hover {
            text-decoration: underline;
          }

          .lastmod {
            color: var(--text-secondary);
            white-space: nowrap;
          }

          .footer {
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 0.9rem;
          }

          @media (max-width: 720px) {
            .page {
              padding: 24px 14px 36px;
            }

            .card {
              border-radius: 16px;
            }

            thead th,
            tbody td {
              padding: 14px 16px;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <div class="eyebrow">XML Sitemap</div>
            <h1>ReadNovaX Sitemap</h1>
            <p class="description">
              This human-friendly view lists the URLs exposed in the sitemap while preserving the original XML
              structure for crawlers and view-source.
            </p>
          </section>

          <section class="card">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">URL</th>
                    <th scope="col">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td>
                        <a href="{sitemap:loc}">
                          <xsl:value-of select="sitemap:loc" />
                        </a>
                      </td>
                      <td class="lastmod">
                        <xsl:value-of select="sitemap:lastmod" />
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </section>

          <p class="footer">
            Total URLs:
            <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /></strong>
          </p>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
