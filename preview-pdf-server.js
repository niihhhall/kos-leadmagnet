import http from 'http';
import { buildReportHtml } from './workers/build-html.js';

const PORT = 3000;

const mockData = {
  firstName: "Nihal",
  lastName: "Mishra",
  email: "nihalmishra01122001@gmail.com",
  profession: "designer",
  score: 46,
  sectionScores: {
    foundation: 6,
    productivity: 10,
    content: 9,
    marketing: 9,
    client: 6,
    finance: 6.3
  },
  reportJson: {
    headline: "Near Operational Structure",
    executiveSummary: "You have built functional setups across multiple areas of your business. Despite this progress, they still don't talk to each other. Your business can grow, but your admin overhead grows with it, locking you in a capacity ceiling where you are the bottleneck.",
    riskLevel: "MEDIUM",
    recommendations: [
      {
        priority: "1",
        title: "Standardize Client Onboarding",
        why: "To free up cognitive load and capacity.",
        action: "Create a standard package in your project system.",
        timeToImplement: "2 hours"
      },
      {
        priority: "2",
        title: "Integrate Invoicing & Visibility",
        why: "To ensure you aren't leaking profit margins.",
        action: "Set up a centralized invoice tracker connected to projects.",
        timeToImplement: "3 hours"
      }
    ],
    quickWin: "Set up a centralized invoice tracker today.",
    forwardLook: "Your next step is to connect your marketing pipeline to client project delivery."
  },
  answers: {
    s1q2: 'B',
    s1q3: 'B',
    s2q1: 'C',
    s2q2: 'C',
    s2q3: 'C',
    s2q4: 'C',
    s2q5: 'C',
    s5q1: 'C',
    s5q2a: 4,
    s5q2b: 'C',
    s5q3_5: 'C',
    s5q4: 'B',
    s5q5: ['doc1', 'doc2'],
    s5q6: 'C',
    s6q2: 'C',
    s6q3: 'B',
    s6q5: ['doc3']
  }
};

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/preview') {
    try {
      const html = buildReportHtml(mockData);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Error rendering HTML: ${err.stack}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`PDF HTML Template Dev Server Running!`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Edit workers/build-html.js and refresh page to view changes.`);
  console.log(`==================================================\n`);
});
