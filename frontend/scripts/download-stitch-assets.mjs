import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targets = [
  {
    name: 'storyboard-03-screen.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1UNRQM_pJCTbmpMjv6YJKIgAUo2j_SR7Mw1Q3A4cTcuo_9L8ySeLKCfTWuYmsh8XkKLblTeU7pf5nEFYKjnZyWXF-AOx0k8PFs8UCL3xEucBr6vne0Nbd2LpknzETU4o7IFbVILYlaYJnq4Cjvuo64xrLwDUJNC-sczovmUiXcWKUkV-tTZiAlNVO6FeDWJBqT5BZwFUtA64lSPz-AeF9GG25Y5_LSM06lqJsrDvaNCpL3lKueu46EhoN4'
  },
  {
    name: 'storyboard-03-code.html',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1ZGYzMmMyYWE5NWQwODlhZjc5NDkxMmI0ODY3EgsSBxCAxOP3tBIYAZIBIwoKcHJvamVjdF9pZBIVQhMxOTMzODQ4NzU0MjU5OTg0NDA3&filename=&opi=89354086'
  },
  {
    name: 'state-01-closed.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1U0LY6yvec9f8kWd_58kLgUbr8ErF6T3mTL5k1Mt4mqlelwmvk-kaL4aJESJ2D3oy72k9d5wF_KWfR2CLkFToJFLwb4e7nC5j_MxwRP0LwZ_mIH8dAix96OQrag9r5LthQLTqMuCal0M3qzPjhj6TsypXPFIUe7pBdNJgmENl6Jpq2YYLAJsHv5bSYfiJbbCrFEgjaIB7_nYfnhn3NW6kKh95Owpwpzc-RonbsJeItTDxj7KdyTfGWgZQ'
  },
  {
    name: 'state-02-lid-lifting.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1VyaAqsVD9-erTbcD9dhEfRGJx9DH91zEPa2tCIYAGBmysjRpTyoF-BeGuZu-kuN5Wbor6_yVb707NkfZOulWTvavf5AAPv0Z4vQLm5JGMr4ZNQM3P5O57QFEB8ZSCJy30F3C_cIgLagHOaP_dxk5VaD1BxqubeGsupypaZ3QFLEK6x58Jj-5os3bbAC0IK0AkmrMh96lPZEzI9BWr0vfhM-NKRkP08Dxudc3NMbQe_bxWJjtTeRrXZaWw'
  },
  {
    name: 'state-03-separating.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1XbqgRHKqLtuWbD3kAbmZjdOiriSGuQG8GU5fenu-bP3MkrhwD2Y2Fbd6ujc_7GFVwfy_4uREVa4f_KSH3gzF5-3Hy9jUyyJ5hLmfPwW0wI_9189B277P50a-6hLzWMHMXWMGMn4AkXL8mzZkqKdbjiGEn6ZL_Y5L6BY-QPiaiTyFnwNx-_iWNo1dtgCvpQ9XYo2_-3UCx6UMbMfvGyf6SNBdWVIf19ITxXJJ_4aXbo5f3NM8iR1bEAwos'
  },
  {
    name: 'state-04-exploded.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1WrNX5iKBxMGp7QYBBwexpEO9mrxXv_fJdyQXOovhram0mNlh3HzQ5O1SJA2hlbf-Asmu3NBCWD5NGj3fWdLGQUX2ZdmvW6U6ol6yq7fh9NCRr70MRVJgi2XkRXxwDKNJHKj_ckIknsRugLNZCSXPV7KPJtUpvEDTAyRpnOGen4qOnCd113wlfO-IsjXLPgKHQvIZ-y8Tv3YmsNXqJ48c_alNfYQWC4qOP7m3aHIqFf5j9o_pzTe8FnxFk'
  },
  {
    name: 'state-dishes-bowl.png',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1UHkMjogdp3jiHlhEyHz-QPrFwAmBIfj0eUC6p_2zFccOmSI-DwN_q8vC8LateAhSplUQ1kUOTF6gfOWI2iIhvuEEPqj2lf9lgYDUEs_mkgm4Ni8Ofav7JkQ76Y4EPKjLgWZSpO4DmtDEAVfsjPn1WbqJSm5M6_adpI5svYOlGbhkpARNqbUVlUIElA2Qi67p2lXmf7RsIDD68HDlZ-26-rMZwzyWvvRzJA5S_ppXP9IvuyEUB0WzioH3Y'
  }
];

const publicDest = path.join(__dirname, '..', 'public', 'stitch');
const docsDest = path.join(__dirname, '..', '..', 'docs', 'design-reference', 'stitch');

fs.mkdirSync(publicDest, { recursive: true });
fs.mkdirSync(docsDest, { recursive: true });

async function downloadFile(item) {
  try {
    console.log(`Downloading ${item.name}...`);
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!res.ok) {
      console.error(`Failed ${item.name}: ${res.status} ${res.statusText}`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(publicDest, item.name), buffer);
    fs.writeFileSync(path.join(docsDest, item.name), buffer);
    console.log(`Saved ${item.name} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`Error downloading ${item.name}:`, err.message);
  }
}

async function main() {
  for (const item of targets) {
    await downloadFile(item);
  }
  console.log('Finished downloading Stitch assets.');
}

main();
