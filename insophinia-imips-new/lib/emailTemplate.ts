export const generateEmailHtml = (subject: string, bodyContent: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          background-color: #f0f2f5;
          color: #333333;
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #dee2e6;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #0D47A1;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px;
          line-height: 1.7;
          font-size: 16px;
          color: #495057;
        }
        .content h2 {
          color: #212529;
          font-size: 22px;
          margin-top: 0;
        }
        .content p {
            margin-bottom: 1em;
        }
        .content strong {
            color: #0D47A1;
        }
        .footer {
          background-color: #f8f9fa;
          color: #6c757d;
          font-size: 12px;
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
        }
        @media screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            margin: 0;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Insophinia IMIPS</h1>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          ${bodyContent}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Insophinia Manufacturing. All rights reserved.</p>
          <p>This is a system-generated notification. Please do not reply to this email.</p>
          <p>Insophinia Manufacturing | 123 Industrial Way, Metropolis, 12345</p>
        </div>
      </div>
    </body>
    </html>
  `;
};