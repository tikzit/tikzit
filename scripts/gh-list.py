from gh import gh, pr
import os

tok = os.getenv('GITHUB_TOKEN')

draft = [r for r in gh('releases')
             if r['draft'] and r['name'] == 'AUTO'][0]

for a in draft['assets']:
	print(a['browser_download_url'] +
		  '?access_token=' + tok)
