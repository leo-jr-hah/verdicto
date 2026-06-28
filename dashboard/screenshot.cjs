const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.setViewport({ width: 1200, height: 2000 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // scroll down slowly
  await page.evaluate(async () => {
    for (let i = 0; i <= 2200; i += 100) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 50));
    }
  });
  
  // wait for animations
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/Users/leo/.gemini/antigravity-ide/brain/0b1c7ecd-1ac0-4963-b81d-bfd40cbd50a7/screenshot.png', fullPage: false });
  await browser.close();
  console.log('Screenshot saved!');
})();
