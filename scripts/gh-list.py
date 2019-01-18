#!/usr/bin/env python

from gh import gh, pr
import os

tok = os.getenv('GITHUB_TOKEN')

draft = [r for r in gh('releases') if r['draft']][0]

for a in draft['assets']:
	print(a['browser_download_url'])
