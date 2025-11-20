export const waitlistConfirmationEmail = (name: string, position: number) => {
  return {
    subject: "You're on the Yumlo waitlist! 🎉",
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
            <h1>Welcome to the Yumlo Waitlist!</h1>
            <p>Hi <span class="highlight">${name}</span>,</p>
            <p>
              Thanks for joining the Yumlo waitlist! We're excited to have you on board.
            </p>
            <div class="position">
              You're #${position} in line
            </div>
            <p>
              We're building an AI-powered meal planning app that creates personalized meal plans
              based on your dietary needs, preferences, and macro goals.
            </p>
            <p>
              We'll email you as soon as we launch. In the meantime, stay tuned for updates! 🚀
            </p>
            <div class="footer">
              <p>
                Best regards,<br>
                <strong>The Yumlo Team</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

Thanks for joining the Yumlo waitlist! We're excited to have you on board.

You're #${position} in line.

We're building an AI-powered meal planning app that creates personalized meal plans based on your dietary needs, preferences, and macro goals.

We'll email you as soon as we launch. In the meantime, stay tuned for updates! 🚀

Best regards,
The Yumlo Team
    `,
  };
};
