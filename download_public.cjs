const https = require('https');
const fs = require('fs');

const fileId = '11SFw2IGvkfjw7iQYr69oTm1Dvx_JiuMZ';
const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

function get(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...(options.headers || {})
    };
    
    https.get(url, { headers }, (res) => {
      resolve(res);
    }).on('error', reject);
  });
}

async function download() {
  console.log('Sending initial request to Google Drive uc...');
  let res = await get(initialUrl);
  
  console.log('Status code:', res.statusCode);
  
  // Handle redirect if any
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    console.log('Following redirect to:', res.headers.location);
    res = await get(res.headers.location);
    console.log('Redirect response status:', res.statusCode);
  }
  
  // Read body to check if it's the virus confirmation page
  let body = '';
  const chunks = [];
  
  res.on('data', (chunk) => {
    chunks.push(chunk);
  });
  
  await new Promise((resolve) => res.on('end', resolve));
  const fullBuffer = Buffer.concat(chunks);
  const contentType = res.headers['content-type'] || '';
  
  console.log('Content-Type:', contentType);
  
  if (contentType.includes('text/html')) {
    body = fullBuffer.toString('utf8');
    console.log('Response is HTML. Looking for confirmation token...');
    
    // Look for confirm token in the HTML
    // Usually formatted as confirm=XXXX or name="confirm" value="XXXX"
    const confirmMatch = body.match(/confirm=([a-zA-Z0-9_\\-]+)/) || body.match(/name="confirm"\s+value="([a-zA-Z0-9_\\-]+)"/);
    if (confirmMatch) {
      const token = confirmMatch[1];
      console.log('Found confirmation token:', token);
      
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${token}`;
      console.log('Downloading file with confirmation token...');
      
      const finalRes = await get(downloadUrl, {
        headers: {
          'Cookie': res.headers['set-cookie'] ? res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : ''
        }
      });
      
      console.log('Final download status:', finalRes.statusCode);
      console.log('Final Content-Type:', finalRes.headers['content-type']);
      
      // If it redirects again, follow it
      let finalStream = finalRes;
      if (finalRes.statusCode >= 300 && finalRes.statusCode < 400 && finalRes.headers.location) {
        console.log('Following final redirect to:', finalRes.headers.location);
        finalStream = await get(finalRes.headers.location);
      }
      
      const file = fs.createWriteStream('public/bible.pdf');
      finalStream.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('Download complete! Saved to public/bible.pdf');
        
        // Let's print out the file size to verify
        const stats = fs.statSync('public/bible.pdf');
        console.log('Saved file size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
      });
    } else {
      console.log('No confirmation token found in HTML. Snippet of HTML:');
      console.log(body.substring(0, 500));
    }
  } else {
    console.log('Direct download initiated. Saving file...');
    const file = fs.createWriteStream('public/bible.pdf');
    file.write(fullBuffer);
    file.end();
    console.log('Download complete! Saved to public/bible.pdf');
    const stats = fs.statSync('public/bible.pdf');
    console.log('Saved file size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  }
}

download().catch(err => {
  console.error('Download error:', err);
});
