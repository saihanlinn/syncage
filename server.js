const http = require('http');
const url = require('url');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configure email transporter (using a free service or environment variables)
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// Alternative: Use a free service like Sendgrid or Mailgun
// For now, we'll log submissions to a file

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve static files
    if (req.method === 'GET') {
        let filePath = '.' + req.url;
        if (filePath === './') filePath = './index.html';
        
        const extname = path.extname(filePath);
        let contentType = 'text/html';
        
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - Not Found</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
        return;
    }
    
    // Handle form submission
    if (req.url === '/api/submit-interest' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Log to file
                const logEntry = {
                    ...data,
                    receivedAt: new Date().toISOString()
                };
                
                const logPath = path.join(__dirname, 'submissions.json');
                let submissions = [];
                
                if (fs.existsSync(logPath)) {
                    submissions = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                }
                
                submissions.push(logEntry);
                fs.writeFileSync(logPath, JSON.stringify(submissions, null, 2));
                
                // Send email notification
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'noreply@syncage.linn.services',
                    to: 'syncage@linn.services',
                    subject: `New Founding Interest: ${data.interest} - ${data.name}`,
                    html: `
                        <h2>New Founding Circle Registration</h2>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Organization:</strong> ${data.organization || 'Not provided'}</p>
                        <p><strong>Interest:</strong> ${data.interest}</p>
                        <p><strong>Message:</strong></p>
                        <p>${data.message.replace(/\n/g, '<br>')}</p>
                        <p><strong>Submitted:</strong> ${data.timestamp}</p>
                    `
                };
                
                // Try to send email (optional - won't fail if email service is not configured)
                if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.log('Email error:', err);
                        } else {
                            console.log('Email sent:', info.response);
                        }
                    });
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Interest registered successfully' }));
                
            } catch (err) {
                console.error('Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Server error' }));
            }
        });
        return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1>', 'utf-8');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`SyncAge server running on http://localhost:${PORT}`);
});
