export const waitlistConfirmationEmail = (name: string, position: number) => {
  return {
    subject: "Jste na čekací listině Yumlo! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 40px;
              text-align: center;
            }
            h1 {
              color: #000;
              font-size: 28px;
              margin-bottom: 16px;
            }
            .emoji {
              font-size: 48px;
              margin: 20px 0;
            }
            .position {
              background-color: #000;
              color: #fff;
              padding: 12px 24px;
              border-radius: 24px;
              display: inline-block;
              font-weight: bold;
              margin: 20px 0;
            }
            p {
              color: #666;
              font-size: 16px;
              margin: 16px 0;
            }
            .highlight {
              color: #000;
              font-weight: 600;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #999;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Vítejte na čekací listině Yumlo!</h1>
            <p>Ahoj <span class="highlight">${name}</span>,</p>
            <p>
              Děkujeme za přidání se na čekací listinu Yumlo! Jsme rádi, že jste s námi.
            </p>
            <p>
              Vytváříme aplikaci pro plánování jídel s umělou inteligencí, která vytváří personalizované jídelníčky
              přizpůsobené vašim stravovacím potřebám, preferencím a makro cílům.
            </p>
            <p>
              Pošleme vám email, jakmile spustíme. Mezitím sledujte novinky! 🚀
            </p>
            <div class="footer">
              <p>
                S pozdravem,<br>
                <strong>Tým Yumlo</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Ahoj ${name},

Děkujeme za přidání se na čekací listinu Yumlo! Jsme rádi, že jste s námi.

Vytváříme aplikaci pro plánování jídel s umělou inteligencí, která vytváří personalizované jídelníčky přizpůsobené vašim stravovacím potřebám, preferencím a makro cílům.

Pošleme vám email, jakmile spustíme. Mezitím sledujte novinky! 🚀

S pozdravem,
Tým Yumlo
    `,
  };
};
